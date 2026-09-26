# Festival Home Screen icons — one-time Xcode setup

This project uses React Native 0.82.1, TypeScript, a Swift AppDelegate, and an iOS 15.1 app deployment target. The Podfile uses React Native's `min_ios_version_supported`. The native module follows the existing Swift/Objective-C bridge pattern, using RN's legacy module interoperability. No new package is required.

Only `AppIcon.appiconset` currently exists. The festival names in `iconService.ts` are the contract for the assets you will add below; switching to them cannot succeed until they are compiled into a native build. No festival artwork is supplied by this change.

1. Open `ios/RewardsPlanners.xcworkspace`. Add the existing `ios/AppIconSwitcher.swift` and `ios/AppIconSwitcher.m` files using **File → Add Files to RewardsPlanners**. Leave copying disabled because these files already live in the repository. Select the **RewardsPlanners** target membership for both. Verify both appear exactly once in **Build Phases → Compile Sources**. The app already compiles Swift and imports React; no AppDelegate change or extra bridging header is required for this module.

2. Open `RewardsPlanners/Images.xcassets`. Use **New iOS App Icon** (under **App Icons & Launch Images**, depending on Xcode version), not **New Image Set**. Add proper App Icon sets with the following case-sensitive names:

   | Backend key | App Icon asset name |
   | --- | --- |
   | `default` | Existing `AppIcon` (native name `nil`, JS name `Default`) |
   | `diwali` | `DiwaliIcon` |
   | `eid` | `EidIcon` |
   | `christmas` | `ChristmasIcon` |
   | `holi` | `HoliIcon` |
   | `independence_day` | `IndependenceDayIcon` |

   Supply the actual artwork in every required slot for the target devices, or use Xcode's single-size 1024×1024 option where available. Resolve asset compiler warnings. Each set must be an `.appiconset`, not an `.imageset`. If you change these names, update the mapping in `src/services/iconService.ts` too.

3. Select the **RewardsPlanners app target → Build Settings → All**. Keep **Primary App Icon Set Name** (`ASSETCATALOG_COMPILER_APPICON_NAME`) as `AppIcon`. Set **Alternate App Icon Sets** (`ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES`) for both Debug and Release to `DiwaliIcon EidIcon ChristmasIcon HoliIcon IndependenceDayIcon`, adding each name as a separate list entry. Only list assets actually added to the catalog.

4. Set **Include All App Icon Assets** (`ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS`) to **Yes** for Debug and Release. Code refers to these icons dynamically, so it does not establish a static asset dependency. Check the resolved target values, including any configuration overrides.

5. Build and install the app. Under Xcode's **Products**, reveal `RewardsPlanners.app` in Finder and inspect its generated `Info.plist` (or the app inside an `.xcarchive/Products/Applications`). In Terminal, run `/usr/libexec/PlistBuddy -c 'Print :CFBundleIcons' '/actual/path/RewardsPlanners.app/Info.plist'`. Confirm `CFBundlePrimaryIcon` and `CFBundleAlternateIcons`; the latter must contain the exact five alternate names above with generated icon metadata. Inspect `CFBundleIcons~ipad` as well if the build supports iPad. Do not manually add these entries to the source `ios/RewardsPlanners/Info.plist`; Xcode generates them from the asset build settings. Inspect a Release/archive build before shipping too.

6. Test the native bridge before relying on the campaign API. Temporarily comment out `useFestivalIcon()` in `App.tsx` so a foreground fetch cannot override the manual test. Import `Button` from `react-native` and `IconService` from `./src/services/iconService`, then temporarily render these buttons inside the app's visible view:

   ```tsx
   <Button title="Test Diwali icon" onPress={() => { void IconService.setIcon('DiwaliIcon'); }} />
   <Button title="Restore primary icon" onPress={() => { void IconService.setIcon('Default'); }} />
   ```

   Test on an installed simulator build and a real device. Expect an iOS system alert when the icon changes, including the first change; it is OS behavior and may recur on subsequent changes. Return to the Home Screen to inspect the result, especially in the simulator. Repeating the same selection should be a no-op. `await IconService.getCurrentIcon()` should report `DiwaliIcon` or `Default`. A false result and warning indicate a missing bridge, unsupported environment, missing asset registration, or another native failure. Remove the temporary buttons and restore the hook afterward.

7. The hook is already called once at the start of `App()` in `App.tsx`. No change to `index.js` or `AppRegistry` is needed. It fetches on mount and when the app returns from inactive/background, validates the response, and only switches if the icon differs. Requests time out after 10 seconds, are serialized, and are cancelled on unmount. Failed responses leave the icon unchanged; unknown backend keys resolve to `Default`. Android safely does nothing and is reserved for a future activity-alias implementation.

8. The endpoint uses the existing API environment config plus the existing CMS mount prefix: `${API_BASE_URL}/content/resolved/app-icon?platform=ios`. With the current live config this is `https://rewardplanners.com/api/crm/content/resolved/app-icon?platform=ios`; locally it is `http://localhost:5000/content/resolved/app-icon?platform=ios`. This follows `cmsContentApi.ts` and the supplied README's shared content-router convention. If your app-icon router is instead mounted directly at the API root, remove `/content` from `APP_ICON_URL` in `src/hooks/useFestivalIcon.ts`. No backend routes, catalog entries, or campaigns are created by this change.

9. Test a successful campaign response on cold start and after backgrounding, repeat the same key to confirm no extra change, return `default` to restore the primary icon, and test offline/malformed responses to confirm normal startup. Repeat rapid foreground transitions to check that requests do not race. The hook only applies icons while active; it does not schedule background execution or switch precisely at campaign boundaries while the app is closed.

10. Asset setup and shipping a new native build are needed once per new icon or changed artwork, not every festival. Later campaigns select already bundled keys. Older installed builds cannot acquire newly added icons through this API or an OTA JavaScript update. Register/schedule backend keys only for builds that contain them; a native failure on an older build is caught and leaves its existing icon intact. Downloaded images and CMS preview thumbnails cannot become live Home Screen icons. Store listing icons are managed separately.

References: [Apple alternate icon setup](https://developer.apple.com/documentation/xcode/configuring-your-app-to-use-alternate-app-icons), [Apple asset catalog configuration](https://developer.apple.com/documentation/xcode/configuring-your-app-icon), and [React Native native interoperability](https://reactnative.dev/docs/next/native-platform).
