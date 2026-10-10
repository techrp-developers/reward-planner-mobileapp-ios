const { execFile } = require('child_process');
const { promisify } = require('util');
const { existsSync } = require('fs');
const os = require('os');
const path = require('path');

// Resolve adb even when Android Studio's platform-tools are not on PATH.
const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';
const sdkRoots = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
  path.join(os.homedir(), 'Library', 'Android', 'sdk'),
  path.join(os.homedir(), 'Android', 'Sdk'),
].filter(Boolean);
const adb = sdkRoots
  .map(root => path.join(root, 'platform-tools', executable))
  .find(candidate => existsSync(candidate)) || executable;

const run = promisify(execFile);
const runAdb = args => run(adb, args, { encoding: 'utf8', timeout: 5000, windowsHide: true });
let checking = false;
let watcher;

async function ensureReverse(quiet = false) {
  if (checking) return;
  checking = true;
  try {
    const devices = await runAdb(['devices']);
    const serials = devices.stdout.split(/\r?\n/)
      .map(line => line.match(/^(\S+)\s+device\s*$/)?.[1])
      .filter(Boolean);
    if (!serials.length && !quiet) {
      console.warn('[adb reverse] No authorized Android device connected.');
    }
    for (const serial of serials) {
      const mappings = await runAdb(['-s', serial, 'reverse', '--list']);
      for (const port of [5000, 8081]) {
        const target = `tcp:${port}`;
        const exists = mappings.stdout.split(/\r?\n/).some(line => {
          const fields = line.trim().split(/\s+/);
          return fields[1] === target && fields[2] === target;
        });
        if (!exists) {
          await runAdb(['-s', serial, 'reverse', target, target]);
          console.log(`[adb reverse] ${serial}: port ${port} forwarded`);
        }
      }
    }
  } catch (error) {
    if (!quiet) console.warn(`[adb reverse] Unable to configure forwarding: ${error.message}`);
  } finally {
    checking = false;
  }
}

function watchReverse() {
  if (watcher) return;
  void ensureReverse();
  // USB reconnection and adb restarts can discard existing reverse mappings.
  watcher = setInterval(() => { void ensureReverse(true); }, 5000);
  watcher.unref();
}

module.exports = { ensureReverse, watchReverse };
if (require.main === module) void ensureReverse();
