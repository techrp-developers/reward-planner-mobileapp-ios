// Verified against server/app/common/controller/authController.js:
// generateOTP() uses crypto.randomInt(100000, 1000000).
export const OTP_LENGTH = 6;

// Client UX delay. The backend has no per-code resend cooldown; its shared
// auth limiter permits 30 requests / 5 minutes. Respect Retry-After on 429.
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const AUTH_RATE_LIMIT_WINDOW_SECONDS = 300;
