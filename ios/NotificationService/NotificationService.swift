import UserNotifications
import FirebaseMessaging
import os

// Adds the image from apns.fcmOptions.imageUrl to the alert. Runs in its own
// process with about 30 seconds. If the download fails or time runs out, the
// original title and message are delivered as plain text.
class NotificationService: UNNotificationServiceExtension {
  private static let log = Logger(subsystem: "com.mpstech.rewardsplanners.NotificationService", category: "push")

  private let lock = NSLock()
  private var contentHandler: ((UNNotificationContent) -> Void)?
  private var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else {
      contentHandler(request.content)
      return
    }
    self.contentHandler = contentHandler
    bestAttemptContent = content
    Messaging.serviceExtension().populateNotificationContent(content) { [weak self] result in
      self?.deliver(result, reason: "helper")
    }
  }

  override func serviceExtensionTimeWillExpire() {
    if let bestAttemptContent {
      deliver(bestAttemptContent, reason: "timeout")
    }
  }

  // The helper and the timeout can race; iOS must get the content only once.
  private func deliver(_ content: UNNotificationContent, reason: String) {
    lock.lock()
    let handler = contentHandler
    contentHandler = nil
    lock.unlock()
    guard let handler else { return }
    Self.log.notice("delivered reason=\(reason, privacy: .public) attachments=\(content.attachments.count, privacy: .public)")
    handler(content)
  }
}
