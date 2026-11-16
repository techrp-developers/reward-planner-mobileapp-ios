// Verified against server/app/common/controller/authController.js:
// generateOTP() uses crypto.randomInt(100000, 1000000).
export const OTP_LENGTH = 6;

// Client UX delay. The backend has no per-code resend cooldown; its shared
// auth limiter permits 30 requests / 5 minutes. Respect Retry-After on 429.
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const AUTH_RATE_LIMIT_WINDOW_SECONDS = 300;

// Delivery may wait for the messaging provider. Keep both requests bounded,
// without extending timeouts for the rest of the application.
export const OTP_REQUEST_TIMEOUT_MS = 45000;
export const OTP_VERIFY_TIMEOUT_MS = 30000;
