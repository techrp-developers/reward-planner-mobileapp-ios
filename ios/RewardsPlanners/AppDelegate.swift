import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import react_native_ota_hot_update

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "RewardsPlanners",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

// MARK: - ReactNativeDelegate

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    // The OTA library checks the marketing version. Also clear a downloaded
    // bundle when the native build number changes within that same version.
    let defaults = UserDefaults.standard
    let buildKey = "RewardsPlannersOtaNativeBuild"
    if let currentBuild = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String {
      if let previousBuild = defaults.string(forKey: buildKey), previousBuild != currentBuild {
        defaults.removeObject(forKey: "PATH")
        defaults.removeObject(forKey: "VERSION")
        defaults.removeObject(forKey: "VERSION_NAME")
      }
      defaults.set(currentBuild, forKey: buildKey)
    }
    return OtaHotUpdate.getBundle()
#endif
  }
}
