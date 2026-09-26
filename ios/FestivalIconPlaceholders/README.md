# Temporary festival artwork

These five 1024×1024 masters are identical copies of the permanent default icon. They are placeholders, not final festival designs. The alternate icon name can distinguish them during runtime testing; their appearance is intentionally identical.

Each matching set under `../RewardsPlanners/Images.xcassets/` was produced with the supplied `generate_iconset.sh` and `Contents.json`, then supplemented with the master as `ItunesArtwork@2x.png` and an `ios-marketing` entry.

To replace artwork, replace each master here and regenerate all sizes in its matching `.appiconset`, including the 1024px marketing image. Merely replacing these master files does not update the catalog. Preserve asset names and rebuild/reinstall the native app; no further icon build-setting changes are required. Do not change `AppIcon.appiconset`.

Mapping: diwali → DiwaliIcon, eid → EidIcon, christmas → ChristmasIcon, holi → HoliIcon, independence-day → IndependenceDayIcon.

`native-registration.diff` records the additional project edits that include the existing AppIconSwitcher Swift and Objective-C files in the app target. Their source contents were not changed.

## Verification (2026-09-26)

All PNG dimensions and catalog entries validated. The default AppIcon files remain byte-identical to Git HEAD. Debug and Release both retain AppIcon as primary, all five alternate names, and Include All App Icon Assets = YES. The project passes plutil validation.

Standalone `xcrun actool` compilation succeeded. Its generated metadata is saved as `compiled-icon-info.plist`: CFBundleIcons and CFBundleIcons~ipad both contain primary AppIcon and all five alternate names. This is asset-compiler output, not the final app bundle Info.plist.

The full simulator xcodebuild failed with “database or disk is full” and “Macintosh HD is out of space.” Only approximately 140 MiB was available at failure. Temporary build output was removed, recovering approximately 750 MiB. Full built-app plist verification and the simulator bridge/switch test remain unverified until sufficient disk space is available. The simulator booted, but no new app was installed. No temporary smoke-test source remains in the repository.
