export type AuthStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  ForgotPassword: undefined;
  OTPScreen: { email: string; type?: "forgot-password" | "activation" };
  SetNewPassword: { email: string; type?: "forgot-password" | "activation" };
  AccountActivationSuccess: undefined;
  PasswordSuccess: undefined;
  VerifyEmail: { email: string };
};
