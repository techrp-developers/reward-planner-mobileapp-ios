import { AUTH_RATE_LIMIT_WINDOW_SECONDS, OTP_LENGTH } from "../constants/otp";

export const emptyOtp = () => Array<string>(OTP_LENGTH).fill("");

export function updateOtpDigits(previous: string[], text: string, index: number) {
  const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH);
  const next = [...previous];
  const start = digits.length === OTP_LENGTH ? 0 : index;
  if (!text) next[index] = "";
  for (let offset = 0; offset < digits.length && start + offset < OTP_LENGTH; offset++) {
    next[start + offset] = digits[offset];
  }
  return { digits: next, focusIndex: Math.min(start + digits.length, OTP_LENGTH - 1) };
}

type AuthFailure = {
  code?: string;
  message?: string;
  response?: { status?: number; data?: { message?: unknown } };
};

export function isAuthTimeout(error: unknown): boolean {
  const failure = error as AuthFailure;
  return !failure?.response && (failure?.code === "ECONNABORTED" || failure?.code === "ETIMEDOUT" || /timeout.*exceeded/i.test(failure?.message ?? ""));
}

export function isAuthConnectionError(error: unknown): boolean {
  const failure = error as AuthFailure;
  return isAuthTimeout(error) || (!failure?.response &&
    (failure?.code === "ERR_NETWORK" || /network error|offline/i.test(failure?.message ?? ""))) ||
    (failure?.response?.status ?? 0) >= 500 || failure?.response?.status === 408;
}

export function authErrorMessage(error: unknown, fallback: string): string {
  const failure = error as AuthFailure;
  if (isAuthTimeout(error)) return "The server is taking longer than expected. Please try again shortly.";
  if (isAuthConnectionError(error)) return "We couldn't connect to the sign-in service. Check your connection and try again.";
  const message = failure?.response?.data?.message || failure?.message;
  return typeof message === "string" && message ? message : fallback;
}

export function rateLimitDelay(error: unknown): number | null {
  const response = (error as { response?: { status?: number; headers?: Record<string, unknown> } })?.response;
  if (response?.status !== 429) return null;
  const retryAfter = response.headers?.["retry-after"];
  if (retryAfter != null) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds);
    const date = Date.parse(String(retryAfter));
    if (Number.isFinite(date) && date > Date.now()) return Math.ceil((date - Date.now()) / 1000);
  }
  return AUTH_RATE_LIMIT_WINDOW_SECONDS;
}
