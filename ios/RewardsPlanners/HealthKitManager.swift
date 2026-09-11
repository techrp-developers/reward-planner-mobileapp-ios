import Foundation
import HealthKit
import UIKit

typealias HealthKitPromiseResolveBlock = @convention(block) (Any?) -> Void
typealias HealthKitPromiseRejectBlock = @convention(block) (String?, String?, Error?) -> Void

@objc(HealthKitManager)
final class HealthKitManager: NSObject {
  private let healthStore = HKHealthStore()

  @objc(isAvailable:rejecter:)
  func isAvailable(
    _ resolve: HealthKitPromiseResolveBlock,
    rejecter reject: HealthKitPromiseRejectBlock
  ) {
    resolve(HKHealthStore.isHealthDataAvailable())
  }

  @objc(requestAuthorization:rejecter:)
  func requestAuthorization(
    _ resolve: @escaping HealthKitPromiseResolveBlock,
    rejecter reject: @escaping HealthKitPromiseRejectBlock
  ) {
    guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
      reject("healthkit_steps_unavailable", "Step Count is not available on this device.", nil)
      return
    }

    healthStore.requestAuthorization(toShare: [], read: [stepType]) { success, error in
      if let error {
        reject("healthkit_authorization_failed", error.localizedDescription, error)
        return
      }
      resolve(success)
    }
  }

  @objc(hasHandledAuthorization:rejecter:)
  func hasHandledAuthorization(
    _ resolve: @escaping HealthKitPromiseResolveBlock,
    rejecter reject: @escaping HealthKitPromiseRejectBlock
  ) {
    guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
      reject("healthkit_steps_unavailable", "Step Count is not available on this device.", nil)
      return
    }

    healthStore.getRequestStatusForAuthorization(toShare: [], read: [stepType]) { status, error in
      if let error {
        reject("healthkit_status_failed", error.localizedDescription, error)
        return
      }
      // HealthKit intentionally does not disclose whether read access was
      // allowed or denied. It does tell us whether the permission sheet has
      // already been handled, which prevents repeatedly showing Grant Access.
      resolve(status != .shouldRequest)
    }
  }

  @objc(getStepCount:endDate:resolver:rejecter:)
  func getStepCount(
    _ startDate: Double,
    endDate: Double,
    resolver resolve: @escaping HealthKitPromiseResolveBlock,
    rejecter reject: @escaping HealthKitPromiseRejectBlock
  ) {
    guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
      reject("healthkit_steps_unavailable", "Step Count is not available on this device.", nil)
      return
    }

    let start = Date(timeIntervalSince1970: startDate / 1000)
    let end = Date(timeIntervalSince1970: endDate / 1000)
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
    let query = HKStatisticsQuery(
      quantityType: stepType,
      quantitySamplePredicate: predicate,
      options: .cumulativeSum
    ) { _, statistics, error in
      if let error {
        reject("healthkit_query_failed", error.localizedDescription, error)
        return
      }
      let steps = statistics?.sumQuantity()?.doubleValue(for: .count()) ?? 0
      resolve(Int(steps.rounded(.down)))
    }
    healthStore.execute(query)
  }

  @objc(openHealthApp:rejecter:)
  func openHealthApp(
    _ resolve: @escaping HealthKitPromiseResolveBlock,
    rejecter reject: @escaping HealthKitPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let url = URL(string: "x-apple-health://"),
            UIApplication.shared.canOpenURL(url) else {
        resolve(false)
        return
      }
      UIApplication.shared.open(url, options: [:]) { opened in resolve(opened) }
    }
  }
}
