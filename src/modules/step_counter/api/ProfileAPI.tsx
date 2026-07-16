import api from "../../common/auth/api/axios";

// =========================================
// TYPES
// =========================================

export type GoalType =
  | "weight_loss"
  | "weight_gain"
  | "stay_healthy";

export type BasicProfilePayload = {
  gender: string;
  age: number;
  goal_type: GoalType;
};

export type BodyProfilePayload = {
  height_cm: number;
  weight_kg: number;
};

const VALID_GOALS: GoalType[] = [
  "weight_loss",
  "weight_gain",
  "stay_healthy",
];

// =========================================
// GET PROFILE STEP STATUS
// =========================================

export const fetchProfileStepStatus = async () => {
  try {
    const res = await api.get("/v1/profile/status");

    return {
      success: Boolean(res?.data?.success),
      is_completed: Boolean(res?.data?.is_completed),
      data: res?.data,
    };
  } catch (error: any) {
    console.error("Profile status error", error);
    return {
      success: false,
      is_completed: false,
      data: null,
    };
  }
};

// =========================================
// POST BASIC PROFILE
// =========================================

export const updateBasicProfile = async (
  payload: BasicProfilePayload
) => {
  try {
    if (!VALID_GOALS.includes(payload.goal_type)) {
      return {
        success: false,
        message: "Invalid goal type",
      };
    }

    const res = await api.post(
      "/v1/profile/basic",
      payload
    );

    return {
      success: Boolean(res?.data?.success),
      message:
        res?.data?.message || "Profile updated successfully",
      data: res?.data,
    };
  } catch (error: any) {
    console.error("Basic profile update error", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to update profile",
      data: null,
    };
  }
};

// =========================================
// POST BODY PROFILE
// =========================================

export const updateBodyProfile = async (
  payload: BodyProfilePayload
) => {
  try {
    const res = await api.post(
      "/v1/profile/body",
      payload
    );

    return {
      success: true,
      message:
        res?.data?.message || "Body profile updated",
      data: res?.data,
    };
  } catch (error: any) {
    console.error("Body profile update error", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to update body profile",
      data: null,
    };
  }
};

export type WeeklyPlanItem = {
  week: number;
  steps: number;
};

export type ProfilePlanResponse = {
  bmi: string;
  category: string;
  recommended_steps: number;
  recommended_minutes: number;
  goal: string;
  // Flat per-day reward regardless of which weekly_plan option is chosen —
  // matches fitness_reward_config.goal_daily, the actual syncSteps payout.
  daily_reward_coins: number;
  weekly_plan: WeeklyPlanItem[];
  // The actually-saved goal, if any — distinct from the BMI recommendation
  // above (these can differ if weight changed since the goal was last set).
  current_goal: { daily_steps: number; start_date: string } | null;
};

export type SelectGoalPayload = {
  daily_steps: number;
};

// =========================================
// GET PROFILE PLAN
// GET /v1/profile/plan
// =========================================

export const fetchProfilePlan = async () => {
  try {
    const res = await api.get("/v1/profile/plan");

    return {
      success: true,
      data: res?.data as ProfilePlanResponse,
    };
  } catch (error: any) {
    console.error("Profile plan error", error);

    return {
      success: false,
      data: null,
      message:
        error?.response?.data?.message ||
        "Failed to fetch profile plan",
    };
  }
};

// =========================================
// POST SELECT GOAL
// POST /v1/profile/select-goals
// =========================================

export const selectUserGoal = async (
  payload: SelectGoalPayload
) => {
  try {
    if (!payload?.daily_steps || payload.daily_steps <= 0) {
      return {
        success: false,
        message: "Invalid daily steps value",
      };
    }

    const res = await api.post(
      "/v1/profile/select-goals",
      payload
    );

    return {
      success: true,
      message:
        res?.data?.message || "Goal set successfully",
      data: res?.data,
    };
  } catch (error: any) {
    console.error("Select goal error", error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Failed to set goal",
      data: null,
    };
  }
};
