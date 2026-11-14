import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { SdkAvailabilityStatus } from "react-native-health-connect";

import { useStepTracker } from "../component/StepCode/useStepTracker";
import { hasStepsPerm } from "../context/StepTrackerContext";
import { hasMeasurements, useProfilePlanCache, useProfilePlanQuery } from "../api/useProfilePlan";
import { fitnessQueryKeys } from "../api/fitnessQueryKeys";
import type { ProfilePlanResponse } from "../api/ProfileAPI";
import type { FitnessStackParamList } from "../navigation/RewardHomeStack";
import { useAuth } from "../../common/auth/context/AuthContext";
import { clearSelectedGender } from "./userGender";
import i18n from "../../../i18n";

/**
 * RP Move setup is three independent conditions:
 *   health  — this device can read steps (native check, per device/platform)
 *   profile — basic details + measurements saved (backend, any device)
 *   goal    — a daily goal saved; current_goal from GET /v1/profile/plan
 * The first unmet one is the stage the user resumes at.
 */
export type SetupStage = "health" | "profile" | "body" | "goal" | "ready";

type Route = { [K in keyof FitnessStackParamList]: { name: K; params?: FitnessStackParamList[K] } }[keyof FitnessStackParamList];

export const stageOf = (plan: ProfilePlanResponse | null, healthReady: boolean): SetupStage => {
  if (!healthReady) return "health";
  if (!plan) return "profile";
  if (!hasMeasurements(plan)) return "body";
  if (!plan.current_goal) return "goal";
  return "ready";
};

export const routeForStage = (stage: SetupStage): Route => {
  switch (stage) {
    case "health":  return { name: "StepsTrackerScreen" };
    case "profile": return { name: "StepForm" };
    case "body":    return { name: "StepForm", params: { startAt: "body" } };
    case "goal":    return { name: "BMICart" };
    default:        return { name: "Dashboard" };
  }
};

/**
 * Same rule StepsTrackerScreen uses to skip onboarding: the device flag set by
 * a successful permission request, plus a live check that Health Connect /
 * Apple Health is available and Steps access is granted.
 */
export function useHealthReadiness() {
  const { healthConnectStatus, grantedPermissions, isSetupComplete, loading } = useStepTracker();
  const resolved = healthConnectStatus !== null || !loading;
  const ready = isSetupComplete
    && Number(healthConnectStatus) === SdkAvailabilityStatus.SDK_AVAILABLE
    && hasStepsPerm(grantedPermissions);
  return { resolved, ready, flag: isSetupComplete };
}

export function useFitnessSetup() {
  const health = useHealthReadiness();
  const planQuery = useProfilePlanQuery();
  const plan = planQuery.data ?? null;
  const resolved = health.resolved && planQuery.isSuccess;
  return {
    resolved,
    // Safe to redirect on: not mid-refetch, so the cache is not stale.
    settled: resolved && !planQuery.isFetching,
    stage: stageOf(plan, health.ready),
    plan,
    // Device setup flag only (no live permission read), for in-module guards:
    // the live check can dip briefly while steps refresh.
    healthFlag: health.flag,
    error: planQuery.isError && !planQuery.isSuccess ? (planQuery.error as Error) : null,
    retry: planQuery.refetch,
  };
}

/** Where RP Move opens: brand-new users see the welcome screen first. */
export const entryRouteFor = (stage: SetupStage, plan: ProfilePlanResponse | null): Route =>
  stage === "health" && !plan ? { name: "StepWelcome" } : routeForStage(stage);

/**
 * Moves to the first incomplete setup stage, re-reading the plan from the
 * server first. Finishing setup resets the stack so Back cannot reopen it.
 */
export function useContinueSetup() {
  const navigation = useNavigation<any>();
  const health = useHealthReadiness();
  const { fetchFresh } = useProfilePlanCache();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const continueSetup = useCallback(async (options?: { healthReady?: boolean }) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const plan = await fetchFresh();
      const stage = stageOf(plan, options?.healthReady ?? health.ready);
      if (stage === "ready") {
        navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
      } else {
        const next = routeForStage(stage);
        navigation.navigate(next.name, next.params);
      }
    } catch (e: any) {
      Alert.alert(i18n.t("stepCounter:r2.planUnavailable"), e?.message || i18n.t("stepCounter:r2.failedToFetchProfilePlan"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [fetchFresh, health.ready, navigation]);

  return { continueSetup, busy };
}

// The account whose data the fitness caches hold. Query caches and the
// session gender are not cleared on logout app-wide, so RP Move drops its own
// user-specific data when it is opened by a different account.
let scopedUserId: number | null | undefined;

export function useFitnessAccountScope() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.userId ?? user?.user_id ?? null;
  // Runs during the first render, before any child query reads the cache.
  useState(() => {
    if (scopedUserId !== undefined && scopedUserId !== userId) {
      queryClient.removeQueries({ queryKey: ["fitness"] });
      queryClient.removeQueries({ queryKey: fitnessQueryKeys.all });
      queryClient.removeQueries({ queryKey: ["user-info"] });
      clearSelectedGender();
    }
    scopedUserId = userId;
    return null;
  });
}
