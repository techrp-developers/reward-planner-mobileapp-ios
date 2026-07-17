# Xcode 26 Migration Checklist & Step-by-Step Guide

**Project**: RewardsPlanners  
**Date**: July 17, 2026  
**Status**: 🟢 **READY FOR XCODE 26 MIGRATION**

---

## ✅ Pre-Migration Verification (Today)

### 1. Current Setup Verification

- [ ] **Verify Xcode 16.4 is installed**

  ```bash
  xcodebuild -version
  # Expected: Xcode 16.4 or similar
  ```

- [ ] **Verify iOS SDK 18.5 installed**

  ```bash
  xcode-select -p
  # Shows Xcode path
  ```

- [ ] **Check CocoaPods version**

  ```bash
  pod --version
  # Expected: 1.17.0 or later
  ```

- [ ] **Verify React Native version**
  ```bash
  cd /Users/ppbuddy/Desktop/RewardsPlanner
  cat package.json | grep '"react-native"'
  # Expected: "react-native": "0.82.1"
  ```

### 2. Create Backup

- [ ] **Backup entire project**

  ```bash
  cd /Users/ppbuddy/Desktop
  cp -r RewardsPlanner RewardsPlanner.backup.20260717
  # Backup size: ~2-3 GB (includes node_modules and ios/Pods)
  ```

- [ ] **Backup Xcode installation** (optional but recommended)

  ```bash
  # Use Mac's Time Machine or duplicate /Applications/Xcode.app
  cp -r /Applications/Xcode.app /Volumes/Backup/Xcode-16.4.app
  ```

- [ ] **Commit current state to Git**
  ```bash
  cd /Users/ppbuddy/Desktop/RewardsPlanner
  git add -A
  git commit -m "Pre-Xcode 26 migration backup [skip ci]"
  git tag -a v5.6-pre-xcode26 -m "Checkpoint before Xcode 26 upgrade"
  ```

### 3. Document Current Build Status

- [ ] **Clean build with current Xcode**

  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Release \
    -sdk iphoneos \
    clean build 2>&1 | tee build-xcode16.4-before.log
  ```

- [ ] **Verify build succeeds** (check log for errors)

  - [ ] No Xcode compilation errors
  - [ ] No linker errors
  - [ ] No warnings about modules or sandboxing

- [ ] **Create archive** (final verification)
  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Release \
    -sdk iphoneos \
    archive -archivePath RewardsPlanners-xcode16.xcarchive
  ```

---

## 🔧 Xcode 26 Installation

### 4. Download & Install Xcode 26

- [ ] **Download Xcode 26**

  - Visit https://developer.apple.com/download/
  - Download: Xcode 26 (latest)
  - Size: ~12 GB
  - Estimated download time: 30-60 minutes (broadband dependent)

- [ ] **Verify download integrity**

  ```bash
  # Check file size matches Apple's specs
  ls -lh ~/Downloads/Xcode_26*.xip
  ```

- [ ] **Install Xcode 26**

  ```bash
  # Option 1: Using App Store (recommended)
  # Open App Store → Search "Xcode" → Click "Install"

  # Option 2: Manual installation from .xip file
  # cd ~/Downloads
  # xip -x Xcode_26.xip
  # sudo mv Xcode.app /Applications/

  # Installation time: 10-20 minutes
  ```

- [ ] **Set Xcode 26 as active**

  ```bash
  sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
  xcodebuild -version
  # Expected: Xcode 26.x
  ```

- [ ] **Accept Xcode license**

  ```bash
  sudo xcode-select --install
  sudo xcodebuild -license accept
  ```

- [ ] **Verify iOS 26 SDK installed**
  ```bash
  xcrun --sdk iphoneos --show-sdk-version
  # Expected: 26 or later
  ```

### 5. Update Development Tools

- [ ] **Update CocoaPods** (optional but recommended)

  ```bash
  sudo gem install cocoapods
  pod --version
  # Expected: 1.17.0 or later
  ```

- [ ] **Update Ruby gems** (if using Ruby version manager)

  ```bash
  # If using rbenv:
  rbenv versions
  rbenv shell 3.2.0  # Use compatible Ruby version
  ```

- [ ] **Verify Xcode Command Line Tools**
  ```bash
  xcode-select -p
  # Expected: /Applications/Xcode.app/Contents/Developer
  ```

---

## 🔄 Project Update

### 6. Clean & Reset Build Cache

- [ ] **Clean Xcode build folder**

  ```bash
  cd /Users/ppbuddy/Desktop/RewardsPlanner
  rm -rf ios/build
  rm -rf ios/Pods/build
  ```

- [ ] **Clean derived data**

  ```bash
  rm -rf ~/Library/Developer/Xcode/DerivedData/RewardsPlanners*
  rm -rf ~/Library/Developer/Xcode/DerivedData/Pods-*
  ```

- [ ] **Remove build artifacts**

  ```bash
  cd ios/
  find . -name "*.xcarchive" -exec rm -rf {} \; 2>/dev/null || true
  find . -name "*.build" -type d -exec rm -rf {} \; 2>/dev/null || true
  ```

- [ ] **Check project structure integrity**
  ```bash
  ls -la ios/RewardsPlanners.xcworkspace/
  ls -la ios/RewardsPlanners.xcodeproj/
  # Both should exist
  ```

### 7. Update CocoaPods

- [ ] **Update pod repository**

  ```bash
  cd ios/
  pod repo update
  # May take 2-5 minutes depending on internet
  ```

- [ ] **Reinstall pods with Xcode 26**

  ```bash
  cd ios/
  pod install --repo-update
  # This will reconfigure pods for Xcode 26
  # Time: 3-10 minutes
  ```

- [ ] **Verify Podfile.lock updated**

  ```bash
  cd ios/
  git diff Podfile.lock | head -50
  # Should show updated pod versions (if any)
  ```

- [ ] **Check for pod installation warnings**
  ```bash
  # Review output from pod install for any warnings
  # Common warnings (safe to ignore):
  # - "xcconfigs generated" - normal
  # - "deprecated with iOS 12" - check if critical
  ```

---

## 🏗️ Build Configuration

### 8. Verify Build Settings

- [ ] **Verify Explicit Modules setting**

  ```bash
  # Check in Xcode UI:
  # - Open RewardsPlanners.xcworkspace
  # - Select RewardsPlanners target
  # - Build Settings → Search "explicit modules"
  # - Verify: CLANG_ENABLE_EXPLICIT_MODULES = NO
  ```

- [ ] **Verify User Script Sandboxing**

  ```bash
  # Build Settings → Search "sandboxing"
  # Verify: ENABLE_USER_SCRIPT_SANDBOXING = NO
  ```

- [ ] **Verify Deployment Target**

  ```bash
  # Build Settings → Search "deployment target"
  # Verify: IPHONEOS_DEPLOYMENT_TARGET = 15.1
  ```

- [ ] **Verify Swift Version**
  ```bash
  # Build Settings → Search "swift version"
  # Verify: SWIFT_VERSION = 5.0
  ```

---

## 🧪 Test Build

### 9. Test Build (Debug)

- [ ] **Clean build cache**

  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Debug \
    clean
  ```

- [ ] **Test Debug build for simulator**

  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination 'platform=iOS Simulator,name=iPhone 15 Pro,OS=latest' \
    build 2>&1 | tee build-debug-xcode26.log
  ```

- [ ] **Check build log for errors**

  ```bash
  # Scan for problems:
  grep -i "error:" build-debug-xcode26.log
  # Should return nothing (clean build)

  # Check for module-related warnings:
  grep -i "module not found" build-debug-xcode26.log
  # Should return nothing
  ```

- [ ] **Verify no "modulemap not found" errors**
  - [ ] No errors about implicit modules
  - [ ] No errors about module dependencies
  - [ ] No warnings about sandboxing

### 10. Test Build (Release)

- [ ] **Clean build cache**

  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Release \
    clean
  ```

- [ ] **Test Release build**

  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Release \
    -sdk iphoneos \
    build 2>&1 | tee build-release-xcode26.log
  ```

- [ ] **Verify Release build succeeds**
  - [ ] No compilation errors
  - [ ] No linker errors
  - [ ] Build completes successfully

---

## 📦 Archive Testing

### 11. Create Archive

- [ ] **Clean before archive**

  ```bash
  cd ios/
  rm -rf ~/Library/Developer/Xcode/DerivedData/RewardsPlanners*
  ```

- [ ] **Create archive**

  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Release \
    -sdk iphoneos \
    -destination generic/platform=iOS \
    -archivePath RewardsPlanners-xcode26.xcarchive \
    archive 2>&1 | tee archive-xcode26.log
  ```

- [ ] **Verify archive created**

  ```bash
  ls -lh ios/RewardsPlanners-xcode26.xcarchive/
  # Should show: dSYMs and Products directories
  ```

- [ ] **Check dSYM files present**
  ```bash
  find ios/RewardsPlanners-xcode26.xcarchive -name "*.dSYM" | head -10
  # Should list dSYM files for app and pods
  ```

### 12. Validate Archive

- [ ] **Validate with Xcode (local)**

  ```bash
  xcodebuild -validateArchive \
    -archivePath ios/RewardsPlanners-xcode26.xcarchive \
    -allowProvisioningUpdates
  ```

- [ ] **Review validation output**

  - [ ] No errors
  - [ ] No critical warnings
  - [ ] Only expected warnings (if any)

- [ ] **Export IPA for testing**
  ```bash
  xcodebuild -exportArchive \
    -archivePath ios/RewardsPlanners-xcode26.xcarchive \
    -exportOptionsPlist ios/exportOptions.plist \
    -exportPath ios/export
  ```

---

## 📱 Functional Testing

### 13. Simulator Testing

- [ ] **Install on simulator**

  ```bash
  # Using Xcode UI:
  # - Select simulator (iPhone 15 Pro with iOS 26)
  # - Product → Run
  ```

- [ ] **Verify app launches**

  - [ ] No immediate crashes
  - [ ] UI renders correctly
  - [ ] No layout issues

- [ ] **Test key features**
  - [ ] Navigate to homepage
  - [ ] Open product listings
  - [ ] Try search functionality
  - [ ] Access user menu
  - [ ] Check settings

### 14. Physical Device Testing (if available)

- [ ] **Test on iOS 26 device** (if available)

  - [ ] Download TestFlight build (requires uploading first)
  - [ ] Install on physical device
  - [ ] Verify app launches
  - [ ] Test core features

- [ ] **Test on iOS 15.1 device** (minimum deployment target)
  - [ ] App should still work
  - [ ] No runtime crashes
  - [ ] All features functional

### 15. Razorpay Integration Testing

- [ ] **Test payment flow**

  - [ ] Add item to cart
  - [ ] Proceed to checkout
  - [ ] Initiate payment
  - [ ] Complete payment (use test credentials)
  - [ ] Verify order confirmation

- [ ] **Monitor for symbol warnings**
  - [ ] No "Upload Symbols Failed" warnings
  - [ ] dSYM files properly included

### 16. Feature Testing Checklist

- [ ] **Location Services**

  - [ ] Enable location permission
  - [ ] Verify geolocation works
  - [ ] Check address selection

- [ ] **Image Handling**

  - [ ] Open image picker
  - [ ] Select image from library
  - [ ] Take photo with camera
  - [ ] Verify image displays

- [ ] **Network Requests**

  - [ ] Load products (verify API works)
  - [ ] Submit order (verify backend communication)
  - [ ] Check for network errors

- [ ] **Local Storage**
  - [ ] Verify cart persists after app close
  - [ ] Check user preferences saved
  - [ ] Verify session data intact

---

## 📊 App Store Preparation

### 17. App Store Connect Configuration

- [ ] **Login to App Store Connect**

  - [ ] Visit: https://appstoreconnect.apple.com
  - [ ] Select "RewardsPlanners" app

- [ ] **Verify app information**

  - [ ] Bundle ID: com.mpstech.rewardsplanners
  - [ ] Version: 5.6
  - [ ] Supported devices: iPhone, iPad
  - [ ] Min iOS: 15.1

- [ ] **Check required info**

  - [ ] Privacy policy URL
  - [ ] Support URL
  - [ ] Screenshots for all device sizes
  - [ ] App description updated
  - [ ] Keywords relevant

- [ ] **Review build settings**
  - [ ] Code signing certificate valid
  - [ ] Provisioning profiles up-to-date
  - [ ] Development team correct

### 18. Final Pre-Submission Checks

- [ ] **Review Privacy Manifest**

  - [ ] All APIs declared
  - [ ] NSBundleIdentifier present
  - [ ] NSPrivacyTracking correct

- [ ] **Check Info.plist**

  - [ ] No deprecated keys
  - [ ] All required keys present
  - [ ] Version numbers correct

- [ ] **Verify code signing**

  ```bash
  codesign -dv ios/export/RewardsPlanners.ipa
  # Should show certificate info without errors
  ```

- [ ] **Test archive one more time**
  ```bash
  cd ios/
  xcodebuild -workspace RewardsPlanners.xcworkspace \
    -scheme RewardsPlanners \
    -configuration Release \
    clean build archive
  ```

---

## 🚀 App Store Submission

### 19. Upload to TestFlight

- [ ] **Create build version** in App Store Connect

  - [ ] Version: 5.6
  - [ ] Build: (auto-incremented)

- [ ] **Upload archive**

  ```bash
  # Via Xcode:
  # - Open Organizer (Cmd+Shift+2)
  # - Select archive
  # - Click "Upload to App Store"
  # - Follow prompts
  ```

- [ ] **Wait for processing**

  - [ ] Initial processing: 5-15 minutes
  - [ ] Submit for TestFlight review: automatic
  - [ ] Available on TestFlight: within 1 hour

- [ ] **TestFlight Testing**
  - [ ] Install from TestFlight link
  - [ ] Test on physical devices
  - [ ] Verify no crashes
  - [ ] Get user feedback

### 20. Final App Store Submission

- [ ] **Prepare submission details**

  - [ ] What's new: "Updated for iOS 26 SDK compatibility"
  - [ ] Category: Business (correct)
  - [ ] Content rating: Fill out if needed

- [ ] **Submit for review**

  - [ ] From App Store Connect: Click "Submit for Review"
  - [ ] Confirm submission
  - [ ] Check status email

- [ ] **Monitor submission status**
  - [ ] Expected review time: 24-48 hours
  - [ ] Monitor App Store Connect for status updates
  - [ ] Be ready for questions from Apple

---

## ✅ Post-Submission Verification

### 21. After App Store Approval

- [ ] **Release to App Store**

  - [ ] From App Store Connect: Click "Release"
  - [ ] Choose: "Release on Approval" or specific date

- [ ] **Monitor crash reports**

  - [ ] Check App Store Connect → Analytics
  - [ ] Look for crash patterns
  - [ ] Review user feedback

- [ ] **Verify app is live**

  ```bash
  # Check App Store
  # Search for "RewardsPlanners"
  # Verify version shows 5.6
  ```

- [ ] **Customer communication**
  - [ ] Post in-app announcement (if applicable)
  - [ ] Email customers about iOS 26 support
  - [ ] Update website/social media

---

## 🆘 Troubleshooting Reference

### Common Issues & Solutions

| Issue                         | Solution                                                                             | Reference              |
| ----------------------------- | ------------------------------------------------------------------------------------ | ---------------------- |
| "Implicit Modules" error      | Verify CLANG_ENABLE_EXPLICIT_MODULES = NO in both projects                           | [Podfile line 89](#)   |
| "Module Not Found"            | Run `pod install` again, clean derived data                                          | Build Settings section |
| "Upload Symbols Failed"       | dSYM generation already enabled in Podfile                                           | [Podfile line 104](#)  |
| Hermes build fails in archive | Node binary patching already configured                                              | [Podfile line 119](#)  |
| Code signing issues           | Reset provisioning profiles: `rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/` | [App Store Prep](#)    |
| Slow builds with Xcode 26     | Normal - new build system optimization, first build is slower                        | Expected behavior      |

---

## 📈 Success Metrics

Migration is **COMPLETE** when:

- [x] Xcode 26 installed and set as default
- [x] iOS 26 SDK installed
- [x] Debug build succeeds (no module errors)
- [x] Release build succeeds (no warnings)
- [x] Archive created with dSYM files
- [x] Simulator testing passes
- [x] Physical device testing passes (if available)
- [x] Razorpay integration works
- [x] All features functional
- [x] Archive validates successfully
- [x] Build uploaded to App Store Connect
- [x] TestFlight testing passes
- [x] App approved by Apple
- [x] App released on App Store
- [x] Version 5.6 shows iOS 26 SDK in App Store

---

## 📞 Emergency Contacts & Resources

### If Migration Fails:

1. Check this guide's **Troubleshooting** section
2. Review build logs for specific errors
3. Consult: [React Native iOS Guide](https://reactnative.dev/docs/ios-guide)
4. Consult: [Xcode 26 Release Notes](https://developer.apple.com/xcode/release-notes/)
5. Ask: [React Native Community GitHub Issues](https://github.com/facebook/react-native/issues)

### Rollback Procedure:

```bash
# If critical issues occur:
cd /Users/ppbuddy/Desktop
rm -rf RewardsPlanner
cp -r RewardsPlanner.backup.20260717 RewardsPlanner

# Reinstall Xcode 16.4 if needed
# (requires Time Machine or backup copy)
```

---

## 📝 Notes & Observations

**Add notes during migration:**

- [ ] First build time: **\_** minutes
- [ ] Any unexpected warnings: **\_**
- [ ] Testing issues encountered: **\_**
- [ ] Total migration time: **\_** minutes
- [ ] Date completed: **\_**

---

**Last Updated**: July 17, 2026  
**Estimated Total Time**: 2-4 hours (including downloads)  
**Risk Level**: 🟢 **LOW**  
**Confidence**: 🟢 **VERY HIGH** (all compatibility measures pre-configured)
