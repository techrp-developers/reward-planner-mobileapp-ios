import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchProfilePlan, type ProfilePlanResponse } from "./ProfileAPI";
import i18n from "../../../i18n";

// One cache entry for GET /v1/profile/plan, shared by setup routing, BMI /
// My Plan and StepGoal so they never show different plans.
export const PROFILE_PLAN_QUERY_KEY = ["fitness", "profile-plan"] as const;

// The server's message when no fitness profile row exists yet.
const PROFILE_NOT_FOUND = "Profile not found";

/**
 * data: the plan, or null when the user has not created a profile yet.
 * A network/server failure is an error, never "no profile", so a flaky
 * connection cannot send a configured user back into onboarding.
 */
export const loadProfilePlan = async (): Promise<ProfilePlanResponse | null> => {
  const res = await fetchProfilePlan();
  if (res.success && res.data) return res.data;
  if (res.message === PROFILE_NOT_FOUND) return null;
  throw new Error(res.message || i18n.t("stepCounter:r2.failedToFetchProfilePlan"));
};

export function useProfilePlanQuery() {
  return useQuery<ProfilePlanResponse | null>({
    queryKey: PROFILE_PLAN_QUERY_KEY,
    queryFn: loadProfilePlan,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useProfilePlanCache() {
  const queryClient = useQueryClient();
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: PROFILE_PLAN_QUERY_KEY }),
    [queryClient],
  );
  // Writes a freshly fetched plan so the next screen routes on it immediately.
  const set = useCallback(
    (plan: ProfilePlanResponse | null) => queryClient.setQueryData(PROFILE_PLAN_QUERY_KEY, plan),
    [queryClient],
  );
  // Always hits the server; used right before routing on the result.
  const fetchFresh = useCallback(
    () => queryClient.fetchQuery({ queryKey: PROFILE_PLAN_QUERY_KEY, queryFn: loadProfilePlan, staleTime: 0 }),
    [queryClient],
  );
  return { invalidate, set, fetchFresh };
}

/** Body measurements are saved once the server has computed a BMI. */
export const hasMeasurements = (plan: ProfilePlanResponse | null | undefined) =>
  Number(plan?.bmi) > 0;
