export type OnboardingUser = {
  terms_accepted?: number | boolean | null;
  fitness_onboarding_done?: number | boolean | null;
};

export const isOnboardingComplete = (user?: OnboardingUser | null) => {
  const termsAccepted = user?.terms_accepted;
  const fitnessOnboardingDone = user?.fitness_onboarding_done;

  return Boolean(
    termsAccepted === 1 || termsAccepted === true,
  ) && Boolean(
    fitnessOnboardingDone === 1 || fitnessOnboardingDone === true,
  );
};
