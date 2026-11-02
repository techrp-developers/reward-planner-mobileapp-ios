# Device-scoped logout: mobile and backend contract

Audience: Backend Agent and React Native developers.
Status: proposal. The app ships a temporary workaround until the backend change lands.

## Problem

`POST /v1/auth/logout` treats a missing `fcm_token` as "sign out every device":
`AuthModel.clearFcmToken(userId, null)` deactivates all of the employee's rows in
`user_push_tokens`. One iPhone that cannot read its FCM token at logout would stop
pushes on all of that employee's other phones.

## Current workaround (app)

`getLogoutFCMToken()` in `src/modules/notifications/FCMService.ts` always sends a value:
the registered token, then the stored token, then Firebase (3 second limit), and finally
the placeholder `no-device-token`.

This depends on three backend behaviours, read from commit `13733d4`:

1. `logoutUser` accepts any string up to 512 characters as `fcm_token`.
2. `clearFcmToken(userId, token)` only updates rows matching that token, so the
   placeholder matches nothing.
3. The refresh session is revoked before and independently of the token cleanup.

If any of these change, for example token format validation returning 400, the placeholder
must be revisited. It must never be registered as a real token.

Known gap: with the placeholder, this device's own row stays active on the backend. The app
deletes its Firebase token (and retries on the next session if that fails), so FCM reports the
token as unregistered and the existing send path deactivates the row on the next send.

## Proposed contract

Add an explicit field, so that intent is never inferred from a missing token:

```json
{ "refreshToken": "<token>", "fcm_token": "<token or null>", "push_scope": "device" }
```

| `push_scope` | `fcm_token` | Behaviour |
|---|---|---|
| `device` | present | Deactivate that token only |
| `device` | null | Revoke the session and change no push rows |
| `all_devices` | ignored | Deactivate every device (an explicit user action only) |
| absent | any | Today's behaviour, kept for older app builds |

Once deployed, the app sends `push_scope: "device"` on every logout and drops the placeholder.
