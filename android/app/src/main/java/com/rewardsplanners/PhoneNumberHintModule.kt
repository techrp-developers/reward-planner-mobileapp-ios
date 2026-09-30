package com.rewardsplanners

import android.app.Activity
import android.content.Intent
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity

// Uses RN 0.82 native-module interop. Google's picker requires no SMS/SIM permissions.
class PhoneNumberHintModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var pending: Promise? = null

  private val activityListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CODE) return
      val number = if (resultCode == Activity.RESULT_OK && data != null) {
        try {
          Identity.getSignInClient(activity).getPhoneNumberFromIntent(data)
        } catch (_: Exception) { null }
      } else null
      finish(number)
    }
  }

  init {
    context.addActivityEventListener(activityListener)
    context.addLifecycleEventListener(this)
  }

  override fun getName() = "PhoneNumberHint"

  @ReactMethod
  fun getPhoneNumberHint(promise: Promise) {
    context.runOnUiQueueThread {
      val activity = context.currentActivity
      if (pending != null || activity == null || activity.isFinishing || activity.isDestroyed) {
        promise.resolve(null)
        return@runOnUiQueueThread
      }
      pending = promise
      try {
        val request = GetPhoneNumberHintIntentRequest.builder().build()
        Identity.getSignInClient(activity).getPhoneNumberHintIntent(request)
          .addOnSuccessListener { intent ->
            if (pending !== promise) return@addOnSuccessListener
            try {
              activity.startIntentSenderForResult(intent.intentSender, REQUEST_CODE, null, 0, 0, 0)
            } catch (_: Exception) { finish(null) }
          }
          .addOnFailureListener { if (pending === promise) finish(null) }
      } catch (_: Exception) { finish(null) }
    }
  }

  private fun finish(number: String?) {
    val promise = pending
    pending = null
    promise?.resolve(number)
  }

  override fun onHostResume() = Unit
  override fun onHostPause() = Unit
  override fun onHostDestroy() { finish(null) }

  override fun invalidate() {
    context.removeActivityEventListener(activityListener)
    context.removeLifecycleEventListener(this)
    context.runOnUiQueueThread { finish(null) }
    super.invalidate()
  }

  companion object { private const val REQUEST_CODE = 47192 }
}

class PhoneNumberHintPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(PhoneNumberHintModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
