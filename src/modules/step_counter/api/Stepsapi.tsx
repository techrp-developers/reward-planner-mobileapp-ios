import api from "../../common/auth/api/axios";

// ─── Payload ──────────────────────────────────────────────────────────────────

export type StepSyncPayload = {
  steps: number;
  distance_km: number;
  calories: number;
  active_minutes: number;
  date: string; // YYYY-MM-DD
};

// ─── Full server response shape ───────────────────────────────────────────────

export type UnlockedAchievement = {
  id: number;
  title: string;
  reward_coins: number;
  type?: string;
  description?: string;
};

export type PlanOverview = {
  plan_type: string;
  total_duration_days: number;
  current_day: number;
  daily_target: number;
};

export type OverallSummary = {
  steps: number;
  calories: number;
  distance_km: number;
  active_minutes: number;
};

// Matches the GoalCelebrationScreen.StepSyncResponse interface (structurally identical)
export type GoalSyncData = {
  message: string;
  goalAchieved: boolean;
  reward: number;
  currentStreak?: number;
  unlockedAchievements?: UnlockedAchievement[];
  showGoalPopup?: boolean;
  planOverview?: PlanOverview;
  overallSummary?: OverallSummary;
};

export type StepSyncResult = {
  success: boolean;
  message?: string;
  data?: GoalSyncData;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const syncStepsToServer = async (
  payload: StepSyncPayload,
): Promise<StepSyncResult> => {
  try {
    const res = await api.post('/v1/steps/sync', payload);
    return {
      success: true,
      message: res?.data?.message || 'Steps synced',
      data: res?.data ?? undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to sync steps',
    };
  }
};
