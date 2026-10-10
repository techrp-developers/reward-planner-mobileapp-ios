# RewardsPlanners physical iPhone verification — 10 October 2026

1. **Confirmed causes and diagnosis**

   Disk exhaustion was confirmed: only approximately 956 MiB was available at inspection. Disposable build outputs and caches were removed before compilation. The historical `ImageTelemetry.h` and non-modular-header failures did not reproduce in either fresh native build; their original cause cannot be established without the original failing compiler log. No warning suppression or header workaround was added.

   `ImageTelemetry.h` exists in RN 0.82.1 and is exported by React-Fabric at `ios/Pods/Headers/Public/React-Fabric/react/renderer/imagemanager/ImageTelemetry.h`. It is not an exported root header of the platform-specific React-ImageManager pod. Its symlink resolves correctly. React-Mapbuffer, React-ImageManager, React-Fabric, React-FabricImage and RNScreens compiled successfully.

   Xcode initially could not access the workspace/device services inside the execution sandbox (exit 66). Running the same project through approved, unrestricted Xcode execution resolved that tooling restriction.

2. **Files and configuration**

   No source, Podfile, Xcode project settings, dependency versions, API endpoints or authentication code were changed for this native repair. Existing uncommitted games/chat integration edits were preserved. The branch is `feature/design`; no merge or rebase was in progress.

   The complete custom Podfile post-install hook was inspected, including React Native post-install, module-map symlinks, explicit-module overrides, RNScreens settings, script sandboxing, Hermes Node resolution and vendor dSYM handling. It was retained because the current configuration compiled successfully. This does not establish that every historical workaround is required; removing working customizations was outside the smallest verified repair.

   Pods are static-library products; `USE_FRAMEWORKS` was unset. Effective settings and complete search paths are recorded in `pod-build-settings.json`. All four inspected React targets use Clang modules YES and explicit modules NO. React-Fabric and React-ImageManager define modules YES; React-FabricImage and React-Mapbuffer define modules NO. Non-modular-framework include allowance was unset. No global modular headers/framework linkage was introduced.

   Artifacts added under this directory include this report, full build logs, both `.xcresult` bundles, effective build settings, device/install/process metadata and the JavaScript observation result.

3. **Disk cleanup**

   Approximately 12 GiB of disposable files were reclaimed across both cleanup passes. Free space rose from approximately 956 MiB to approximately 12 GiB before building; after both builds and removal of completed-build index/module caches, approximately **5.2 GiB** remains free.

   Removed: `ios/build/archive-derived-data.QnNvSb`, generated `android/app/build` and `android/app/.cxx`, unused per-entry Gradle transformation caches, unused Xcode module caches, temporary npx caches, and the completed device build's `Index.noindex` and `ModuleCache.noindex`. Gradle cache directories with open files were retained. The saved `RewardsPlanners-6.1-2.xcarchive`, compiled app, source, assets, signing data, SDKs and simulators were preserved.

   The 15–20 GiB target was not reached safely. Further reclamation would require manual review of retained areas such as `~/Library/Developer/CoreSimulator` (approximately 5.9 GiB), `~/Library/Developer/Xcode/iOS DeviceSupport` (approximately 5.6 GiB, including the connected device's support files), and `~/.gradle/wrapper/dists` (approximately 2.4 GiB with files in use). These are not recommendations to delete those directories wholesale. Both requested builds nevertheless completed with the recovered space.

4. **Toolchain and dependencies**

   Verified macOS 15.6.1; Xcode 26.3 (17C529); active developer directory `/Users/ppbuddy/Downloads/Xcode.app/Contents/Developer`. `xcode-select` already pointed there, so no system-wide switch was needed. Workspace and RewardsPlanners scheme were verified.

   Installed React Native is 0.82.1, Reanimated 4.3.0 and Worklets 0.8.1. Installed compatibility metadata supports RN 0.82 with Reanimated 4.3 and Worklets 0.8 under the New Architecture. Existing Pods installation is complete, including document picker 12.0.2. The session's preceding locked pod install completed with 107 Podfile dependencies and 116 pods. No `pod update` or dependency upgrade was performed for this repair.

5. **Actual native builds**

   Generic physical-device Debug build — **exit 0**, `BUILD SUCCEEDED`:

   ```sh
   DEVELOPER_DIR=/Users/ppbuddy/Downloads/Xcode.app/Contents/Developer xcodebuild \
     -workspace ios/RewardsPlanners.xcworkspace -scheme RewardsPlanners \
     -configuration Debug -destination 'generic/platform=iOS' \
     -derivedDataPath ios/build/device-derived-data \
     -resultBundlePath artifacts/ios-device/reproduction.xcresult -jobs 4 build
   ```

   Complete output: `reproduction-build.log`.

   Connected-iPhone Debug build — **exit 0**, `BUILD SUCCEEDED`:

   ```sh
   DEVELOPER_DIR=/Users/ppbuddy/Downloads/Xcode.app/Contents/Developer xcodebuild \
     -workspace ios/RewardsPlanners.xcworkspace -scheme RewardsPlanners \
     -configuration Debug -destination 'id=00008101-001658210A11001E' \
     -derivedDataPath ios/build/device-derived-data \
     -resultBundlePath artifacts/ios-device/iphone-build.xcresult -jobs 4 build
   ```

   Complete output: `iphone-build.log`. Signing remained enabled throughout. Existing result-bundle paths must be changed for subsequent runs because Xcode requires a new result-bundle directory.

6. **Signing**

   Valid Apple Development identity/private-key access was verified through keychain identities and successful code signing. The signed application has bundle ID `com.mpstech.rewardsplanners` and team `W2JCTWQZLY`. Its development provisioning profile includes `00008101-001658210A11001E`, allows debugging and expires on 10 October 2027. No account authentication, certificate creation, bundle-ID change or signing bypass was required. Existing credentials/provisioning were sufficient; interactive Xcode account sign-in was not needed.

7. **Installation and launch**

   The requested iPhone 12 is paired, connected by wire, running iOS 26.6, with Developer Mode enabled. Installation returned **exit 0**:

   ```sh
   xcrun devicectl device install app --device 00008101-001658210A11001E \
     'ios/build/device-derived-data/Build/Products/Debug-iphoneos/Reward Planners.app'
   ```

   Note the actual product name is `Reward Planners.app`, while the target/scheme is RewardsPlanners.

   Launch succeeded:

   ```sh
   xcrun devicectl device process launch --device 00008101-001658210A11001E \
     --terminate-existing --console com.mpstech.rewardsplanners
   ```

   The app remained running as process **1590**. `--console` intentionally remains attached while the app runs; its process has not been terminated to manufacture a successful exit status. Installation and running-process evidence are saved separately.

   Metro was already running from this project on port 8081 and was reused. `/status` reported `packager-status:running`; an iOS bundle request returned **HTTP 200**. The app's Hermes runtime connected to Metro. A 30-second read-only runtime observation recorded `dev=true`, `hermes=true`, **zero JavaScript exceptions and zero console errors**. Native console capture showed no immediate crash. See `javascript-runtime-check.json`, `running-processes.json` and `launch-console.log`.

8. **Remaining limits and next action**

   No blocker remains for building, signing, installation or observed startup. The app and existing Metro server were left running. No physical-device action or Apple authentication is currently required. No backend endpoint or environment was changed; a complete backend/feature regression test was not performed. Startup observation does not establish long-term or every-feature reliability.

   Storage remains limited at approximately 5.2 GiB free; larger future clean builds/archives should follow a separate, selective storage review. Existing unrelated authentication TypeScript errors from the preceding integration check were not changed as part of this native-only task.
