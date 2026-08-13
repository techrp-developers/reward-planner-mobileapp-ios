// OTP_LENGTH confirmed from the real backend's verify-otp examples
// ("4821", "1234") — 4 digits. Real OTP validity is 15 min for phone (SMS),
// 10 min for email — not currently surfaced in the UI (no expiry countdown
// exists, only the resend-cooldown timer below), so OTP_EXPIRY_SECONDS is
// kept as a single conservative floor (the shorter, email duration) rather
// than two unused constants. OTP_RESEND_COOLDOWN_SECONDS/
// OTP_MAX_RESEND_ATTEMPTS remain placeholders — the backend has an
// IP-level authLimiter of 8 requests/15min, but no dedicated per-OTP
// resend cooldown value is documented. Ideally send-otp's response would
// carry its own otpExpirySeconds/resendAfterSeconds to override these (see
// SendOtpResponse in AuthAPI.tsx).
export const OTP_LENGTH = 4;
export const OTP_RESEND_COOLDOWN_SECONDS = 30;
export const OTP_EXPIRY_SECONDS = 600;
export const OTP_MAX_RESEND_ATTEMPTS = 5;

// SMS Retriever auto-read timeout — after this many seconds with no SMS
// detected, silently stop listening and let the user type manually.
export const SMS_AUTOFILL_TIMEOUT_SECONDS = 25;
