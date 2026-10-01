# iOS archive symbol repair — 1 October 2026

## Result

Fresh archive: `ios/build/RewardsPlanners-6.1-2.xcarchive`.
Xcode reported `ARCHIVE SUCCEEDED`. The completed archive passed UUID and
nonempty DWARF checks for the app and every embedded framework. macOS
`codesign --verify --deep --strict` passed with access to certificate trust services.

Bundle ID `com.mpstech.rewardsplanners`, version `6.1`, build `2`, deployment
target `15.1`, React Native `0.82.1`, Hermes and New Architecture remain unchanged.
No upload was attempted. The contract error still blocks App Store Connect;
server-side distribution validation has not been performed.

## A. Razorpay root cause

Installed versions: `react-native-razorpay 2.3.1`, `razorpay-pod 1.5.0`,
`razorpay-core-pod 1.0.9`. The core pod supplies both `Razorpay.xcframework`
and `RazorpayCore.xcframework`, including genuine matching dSYMs.

CocoaPods' generated `razorpay-core-pod-xcframeworks.sh` copies both selected
slices into the same `XCFrameworkIntermediates/razorpay-core-pod` directory.
Its `copy_dir` uses `rsync --delete`; copying RazorpayCore's `dSYMs` directory
removes Razorpay's previously copied dSYM. The fresh build's intermediate
`dSYMs` directory consequently contains only RazorpayCore's dSYM.
The final app phase copies Razorpay's genuine dSYM directly from the installed
pod's `Pod/core/Razorpay.xcframework/ios-arm64/dSYMs` after verifying its UUID
against the embedded framework. No package upgrade is necessary.

The vendor source is the official
[core-1.0.9 release](https://github.com/razorpay/razorpay-customui-pod/tree/core-1.0.9/Pod/core).

## B. Hermes root cause

The actual framework is `hermesvm.framework`, with the reported UUID
`C5FDDA8D-39DF-30DC-9A24-EF9999BB4541`.
The RN 0.82.1 Release VM tarball does not include dSYMs. Meta publishes symbols
in a separate artifact, and the existing pod integration did not download or
copy that artifact:

[Official RN 0.82.1 Release Hermes symbols](https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.82.1/react-native-artifacts-0.82.1-hermes-framework-dSYM-release.tar.gz).

Pod installation now downloads that artifact into an ignored, version-specific
Pods cache and extracts its iPhoneOS dSYM. The app's Release iPhoneOS build phase
checks UUIDs and nonempty DWARF information before copying it into Xcode's dSYM
output folder. A mismatch fails the build. It never fabricates or renames symbols.

## C. Files changed

- `ios/Podfile`: prepare official Hermes symbols; set Release debug generation;
  install an idempotent final app phase to copy verified vendor symbols.
- `ios/Podfile.lock`: Podfile checksum only; dependency resolutions unchanged.
- `ios/RewardsPlanners.xcodeproj/project.pbxproj`: generated app build phase and
  explicit Release `DEBUG_INFORMATION_FORMAT=dwarf-with-dsym` and
  `GCC_GENERATE_DEBUGGING_SYMBOLS=YES`; CocoaPods integration regenerated.
  Existing user changes were preserved.
- `scripts/ios-symbols.py`: artifact preparation, verified symbol copying,
  and completed-archive verification.
- `scripts/archive-ios.sh`: fresh Release arm64 archive in isolated DerivedData,
  followed by automatic verification; refuses to overwrite an existing archive.
- `ios/ARCHIVE-SYMBOLS.md`: this report.

No app functionality or JavaScript dependencies changed. The app's resolved
`DWARF_DSYM_FILE_NAME` is `RewardsPlanners.app.dSYM`. Compiled Pods retain Release
dSYM generation; those settings cannot generate lost vendor debug information.

## D. Dependencies changed

None. Pods were reinstalled from the existing lockfile because the installation
was incomplete. No existing archive, unrelated DerivedData or simulator data was
deleted. The fresh build uses `ios/build/archive-derived-data.QnNvSb` to avoid
stale build products without disrupting the open Xcode workspace.

## E. Commands

From the project root, inspect framework and symbol identities with:

```sh
xcodebuild -version
xcodebuild -workspace ios/RewardsPlanners.xcworkspace -scheme RewardsPlanners -configuration Release -showBuildSettings
file '<framework>/<binary>'
otool -L '<framework>/<binary>'
dwarfdump --uuid '<framework>/<binary>'
dwarfdump --uuid '<matching>.framework.dSYM'
dwarfdump --debug-info ios/Pods/razorpay-core-pod/Pod/core/Razorpay.xcframework/ios-arm64/dSYMs/Razorpay.framework.dSYM
tar -tzf ios/Pods/hermes-engine-artifacts/hermes-ios-0.82.1-release.tar.gz
```

Reinstall and archive:

```sh
cd ios
pod install
cd ..
bash scripts/archive-ios.sh
```

The actual archive command was equivalent to:

```sh
xcodebuild -workspace "$PWD/ios/RewardsPlanners.xcworkspace" \
  -scheme RewardsPlanners -configuration Release -destination 'generic/platform=iOS' \
  -derivedDataPath "$PWD/ios/build/archive-derived-data.QnNvSb" \
  -archivePath "$PWD/ios/build/RewardsPlanners-6.1-2.xcarchive" \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=NO archive
python3 scripts/ios-symbols.py --verify ios/build/RewardsPlanners-6.1-2.xcarchive
codesign --verify --deep --strict ios/build/RewardsPlanners-6.1-2.xcarchive/Products/Applications/RewardsPlanners.app
```

The wrapper was edited during the running build, interrupting its final shell
command after Xcode succeeded. The standalone verifier above was then run
successfully on the completed archive. The final wrapper passes `bash -n`.

Additional checks: `ruby -c ios/Podfile`, `plutil -lint` on the project and
Info.plist, scoped `git diff --check`, successful repeat symbol copying,
rejection of the old archive's missing symbols, and rejection of a deliberately
mismatched RazorpayCore dSYM.

Build log: `/private/tmp/rewards-archive.log`.
Verification output: `ios/build/archive-symbol-verification.txt`.

## F. Completed archive verification

```text
Version 6.1 (2), com.mpstech.rewardsplanners, iOS 15.1
MATCH RewardsPlanners: F704C6DA-616F-3954-813B-1E0E48EF2781 (arm64)
MATCH Razorpay: EADA0557-2F58-3949-8E33-023E668C2CF9 (arm64)
MATCH RazorpayCore: 715DE12F-EFE0-3C08-A129-7F0D352039A9 (arm64)
MATCH RazorpayStandard: 24F333AC-4B8E-3486-BC9E-E3C2E6BC19AE (arm64)
MATCH hermesvm: C5FDDA8D-39DF-30DC-9A24-EF9999BB4541 (arm64)
PASS: app and all embedded framework dSYM UUIDs match.
```

The archive contains `RewardsPlanners.app.dSYM`, `Razorpay.framework.dSYM`,
`RazorpayCore.framework.dSYM`, `RazorpayStandard.framework.dSYM`, and
`hermesvm.framework.dSYM`.

## G–H. Upload readiness and Account Holder action

The archive passes the local build, symbol and code-signature checks. Upload
remains blocked by "You do not have required contracts to perform an operation."
Changing project code cannot resolve an account agreement problem.

The Account Holder must review outstanding agreements in the Apple Developer
account and App Store Connect's Business/Agreements area and accept the applicable
updated terms. Complete any required agreement information shown there. Only
the Account Holder can sign legal agreements. If everything is active but the
error persists, contact Apple Developer Support with the upload error and team ID.
See [Apple's agreement instructions](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements/)
and [role permissions](https://developer.apple.com/help/app-store-connect/reference/account-management/role-permissions/).
