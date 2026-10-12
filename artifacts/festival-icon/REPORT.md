# iOS CMS festival icon report

Implemented Navratri mapping and registration in Debug and Release. Default and unknown keys (including toString, __proto__, and dasera) resolve to null. Dasera artwork was not supplied and no asset set was invented. Existing five festival keys retain exact backend spelling.

Native bridge exports setAppIcon, getCurrentIcon, isSupported. It uses the main queue, resolves false when unsupported, skips an already selected icon, and resolves/rejects completion. App.tsx already invokes the hook exactly once. Startup and foreground refreshes share an in-flight API request with a 2500 ms timeout; invalid responses, errors, timeouts, and disposed hooks do not change the icon.

Production API is https://rewardplanners.com/api/crm. iOS Release always uses production. For local Debug, set API_ENVIRONMENT to local in src/config/apiConfig.ts. Simulator uses IOS_LOCAL_SERVER_URL=http://localhost:5000; set that constant to http://<Mac-LAN-IP>:5000 for a physical iPhone. Debug uses Info.Debug.plist permitting HTTP; Release Info.plist disallows arbitrary HTTP. No icon keys were hand-edited in either plist. The Debug plist must be kept in sync with future shared privacy/configuration changes.

## Checks

11 Jest tests passed (jest.log). tsc --noEmit failed with five pre-existing auth errors (tsc.log), none in modified icon code. Swift syntax parsing and plist/project lint passed. Actual xcodebuild -showBuildSettings confirmed six alternate names and INCLUDE_ALL_APPICON_ASSETS=YES for both configurations; logs in build-settings.log. Native rebuild/install and system-alert switching have not been verified for this change.

Every current catalog set (AppIcon, DiwaliIcon, EidIcon, ChristmasIcon, HoliIcon, IndependenceDayIcon, NavratriIcon) has a referenced, readable 1024x1024 PNG. All except Diwali report hasAlpha=yes; artwork must be checked/re-exported opaque before App Store submission. Existing placeholder documentation describes five masters as default copies; this change does not replace artwork.

## Live device plan: results and remaining steps

Read-only production request returned HTTP 200 with this response:
```json
{"success":true,"message":"Resolved content zones fetched successfully","data":{"navbar_background":null,"promotional_banner":null,"offers_banner":null}}
```
This does not match the platform/icon_key contract. The app will preserve its current icon. No backend files were changed. Device discovery found Kunmun’s iPhone 12 connected. No admin-panel connector/session was available; a timed Navratri campaign was not created.

1. In the admin panel create an iOS navratri campaign starting in 2 minutes and ending in 5 minutes, using the server timezone. This step remains unrun.
2. During the active window (not immediately after creation), request https://rewardplanners.com/api/crm/content/resolved/app-icon?platform=ios and require data.platform=ios and data.icon_key=navratri. Current live response fails this check.
3. After rebuilding/installing, open the app during the window. Verify system alert, home-screen icon, and native current icon NavratriIcon. Reopening without a key change should not alert again. Unrun.
4. After the window ends, verify API returns default, then bring the app to the foreground. Verify the primary icon is restored. Unrun. A continuously foregrounded app does not poll; startup/foreground triggers implement the requested flow.

## Manual Xcode and reinstall steps

1. Validate/re-export opaque final festival artwork at 1024x1024 and regenerate matching catalog sizes. Supply Dasera artwork if desired, then add DaseraIcon to the map and both Alternate App Icon Sets settings.
2. Open ios/RewardsPlanners.xcworkspace, select RewardsPlanners and the connected iPhone. Confirm signing team W2JCTWQZLY and bundle com.mpstech.rewardsplanners. No manual bridge/alternate registration edits remain for Navratri.
3. Confirm AppIcon is primary, the six alternates are listed, Include All App Icon Assets is YES, Debug uses RewardsPlanners/Info.Debug.plist, and Release uses RewardsPlanners/Info.plist.
4. Choose Product > Clean Build Folder (Shift-Command-K). On the phone, long-press Reward Planners > Remove App > Delete App; deleting the app removes its local data.
5. Start Metro with npm start, select the device in Xcode, and Product > Run (Command-R) to build/reinstall. Ensure the phone can reach Metro and any configured local API via the Mac LAN IP.
6. Complete the timed campaign steps above, resolve existing TypeScript errors, then validate a Release archive in Organizer before submission.

App Store readiness: NOT READY — live API contract, timed device test, final opaque artwork, and existing TypeScript errors remain unresolved.
