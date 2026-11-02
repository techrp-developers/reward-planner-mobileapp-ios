// Matches the backend's /v1/auth/check `type` field exactly.
export type AuthMethod = "phone" | "email";

// Only the screens registered in RootNavigator's AuthNavigator.
export type AuthStackParamList = {
  Login: undefined;
  LoginOTP: { identifier: string; resendAvailableAt?: number };
};
