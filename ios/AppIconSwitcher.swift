import Foundation
import UIKit
import React

@objc(AppIconSwitcher)
class AppIconSwitcher: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc(setIcon:resolver:rejecter:)
  func setIcon(_ iconName: String?, resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let application = UIApplication.shared
      guard application.supportsAlternateIcons else {
        reject("ICON_UNSUPPORTED", "Alternate app icons are not supported", nil)
        return
      }
      let targetName = (iconName == nil || iconName == "" || iconName == "Default") ? nil : iconName
      guard application.alternateIconName != targetName else {
        resolve(true)
        return
      }
      application.setAlternateIconName(targetName) { error in
        if let error = error {
          reject("ICON_CHANGE_FAILED", error.localizedDescription, error)
        } else {
          resolve(true)
        }
      }
    }
  }

  @objc(getCurrentIcon:rejecter:)
  func getCurrentIcon(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(UIApplication.shared.alternateIconName ?? "Default")
    }
  }

  @objc(isSupported:rejecter:)
  func isSupported(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(UIApplication.shared.supportsAlternateIcons)
    }
  }
}
