import type { VerifyOtpResponse } from "../api/AuthAPI";

// Matches the backend's /v1/auth/check `type` field exactly.
export type AuthMethod = "phone" | "email";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTPScreen: {
    method: AuthMethod;
    destination: string;
    maskedDestination?: string;
  };
  LocationAccess: {
    verifyResult: VerifyOtpResponse;
  };
  Onboarding: undefined;
};
