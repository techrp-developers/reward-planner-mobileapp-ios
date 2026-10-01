#!/usr/bin/env python3
"""Download official Hermes symbols, copy UUID-matched vendor symbols, verify archives."""
import argparse
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PODS = ROOT / 'ios/Pods'


def uuids(path):
    output = subprocess.check_output(['xcrun', 'dwarfdump', '--uuid', str(path)], text=True)
    values = set(re.findall(r'UUID: ([A-F0-9-]+) \(([^)]+)\)', output))
    if not values:
        raise RuntimeError(f'No UUIDs found: {path}')
    return values


def hermes_symbols():
    version = json.loads((ROOT / 'node_modules/react-native/package.json').read_text())['version']
    return version, PODS / 'hermes-engine-artifacts' / f'dSYMs-{version}-release/iphoneos/hermesvm.framework.dSYM'


def prepare():
    version, dsym = hermes_symbols()
    if dsym.exists():
        uuids(dsym)
        return
    url = (f'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/{version}/'
           f'react-native-artifacts-{version}-hermes-framework-dSYM-release.tar.gz')
    dsym.parent.parent.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=dsym.parent.parent.parent) as temp:
        archive = Path(temp) / 'symbols.tar.gz'
        subprocess.run(['curl', '--fail', '--location', '--retry', '3', url, '-o', str(archive)], check=True)
        subprocess.run(['tar', '-xzf', str(archive), '-C', temp, './iphoneos'], check=True)
        source = Path(temp) / 'iphoneos/hermesvm.framework.dSYM'
        uuids(source)
        dsym.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source, dsym)
    print(f'Prepared official Release Hermes symbols: {url}')


def matched(binary, dsym):
    expected, actual = uuids(binary), uuids(dsym)
    if not expected.issubset(actual):
        raise RuntimeError(f'UUID mismatch: {binary}: {expected}; {dsym}: {actual}')
    # UUIDs alone are insufficient: empty dsymutil output must never pass.
    dwarf = dsym / 'Contents/Resources/DWARF' / binary.name
    load_commands = subprocess.check_output(['xcrun', 'otool', '-l', str(dwarf)], text=True)
    if not re.search(r'sectname __debug_info\s+segname __DWARF\s+addr \S+\s+size 0x0*[1-9a-fA-F][0-9a-fA-F]*', load_commands):
        raise RuntimeError(f'Missing DWARF debug information: {dwarf}')
    for uuid, arch in sorted(expected):
        print(f'MATCH {binary.name}: {uuid} ({arch})', flush=True)


def copy_symbols():
    if os.environ.get('CONFIGURATION') != 'Release' or os.environ.get('PLATFORM_NAME') != 'iphoneos':
        return
    frameworks = Path(os.environ['TARGET_BUILD_DIR']) / os.environ['FRAMEWORKS_FOLDER_PATH']
    destination = Path(os.environ['DWARF_DSYM_FOLDER_PATH'])
    _, hermes = hermes_symbols()
    sources = {
        'hermesvm': hermes,
        'Razorpay': PODS / 'razorpay-core-pod/Pod/core/Razorpay.xcframework/ios-arm64/dSYMs/Razorpay.framework.dSYM',
    }
    destination.mkdir(parents=True, exist_ok=True)
    for name, source in sources.items():
        binary = frameworks / f'{name}.framework' / name
        matched(binary, source)
        target = destination / source.name
        if target.exists():
            matched(binary, target)
        else:
            shutil.copytree(source, target)


def verify(archive):
    apps = list((archive / 'Products/Applications').glob('*.app'))
    if len(apps) != 1:
        raise RuntimeError(f'Expected one archived app: {archive}')
    app = apps[0]
    with (app / 'Info.plist').open('rb') as file:
        info = plistlib.load(file)
    for key, expected in [('CFBundleIdentifier', 'com.mpstech.rewardsplanners'),
                          ('CFBundleShortVersionString', '6.1'), ('CFBundleVersion', '2'),
                          ('MinimumOSVersion', '15.1')]:
        if info.get(key) != expected:
            raise RuntimeError(f'{key}: expected {expected}, got {info.get(key)}')
    print(f'Archive: {archive}\nVersion 6.1 (2), com.mpstech.rewardsplanners, iOS 15.1')
    matched(app / info['CFBundleExecutable'], archive / 'dSYMs' / f'{app.name}.dSYM')
    frameworks = list((app / 'Frameworks').glob('*.framework'))
    if not {'Razorpay.framework', 'hermesvm.framework'}.issubset({f.name for f in frameworks}):
        raise RuntimeError('Missing required Razorpay/Hermes framework')
    for framework in sorted(frameworks):
        binary = framework / framework.stem
        if {arch for _, arch in uuids(binary)} != {'arm64'}:
            raise RuntimeError(f'Expected arm64 only: {binary}')
        matched(binary, archive / 'dSYMs' / f'{framework.name}.dSYM')
    print('PASS: app and all embedded framework dSYM UUIDs match.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare', action='store_true')
    mode.add_argument('--copy', action='store_true')
    mode.add_argument('--verify', type=Path)
    args = parser.parse_args()
    try:
        if args.prepare:
            prepare()
        elif args.copy:
            copy_symbols()
        else:
            verify(args.verify.resolve())
    except (RuntimeError, OSError, subprocess.CalledProcessError) as error:
        print(f'error: {error}', file=sys.stderr)
        sys.exit(1)
