
// ==============================
// TYPES
// ==============================

import api from "../../common/auth/api/axios";

// Dashboard overview
export type DashboardResponse = {
  today_steps: number;
  goal_steps: number;
};

// Today summary — drives the DailyStats card
export type TodaySummaryResponse = {
  steps: number;
  goal_steps: number;
  progress_percent: number;
  distance_km: number;
  calories: number;
  active_minutes: number;
};

// Weekly progress
export type WeeklyProgressItem = {
  date: string;
  steps: number;
};

// Fitness streak
export type FitnessStreakResponse = {
  current_streak: number;
  longest_streak: number;
};


// Calendar progress
export type CalendarDayStatus = "completed" | "missed" | "partial";

export type CalendarDayData = {
  status: CalendarDayStatus;
  steps: number;
  goal_steps: number;
  distance_km: number;
  calories: number;
  active_minutes: number;
  progress_percent: number;
};

export type CalendarApiResponse = {
  success?: boolean;
  month?: string;
  month_label?: string;
  summary: {
    completed_days: number;
    missed_days: number;
    total_steps: number;
    total_calories: number;
    total_distance_km: number;
    total_active_minutes: number;
  };
  calendar: Record<string, CalendarDayData>;
};

// Hourly stats
export type HourlyStatItem = {
  time: string;
  steps: number;
};

export type HourlyStatsResponse = {
  success: boolean;
  data: HourlyStatItem[];
};

// Step wallet history
export type StepHistoryItem = {
  id: number;
  title: string;
  description: string;
  type: "credit" | "debit";
  coins: number;
  balance_after: number | null;
  category: string;
  expiry_date: string | null;
  date: string;
};

export type StepSummary = {
  balance: number;
  expiring_coins: number;
  expiry_date: string | null;
};

export type AchievementMilestone = {
  achievement_id: number;
  title: string;
  description: string;
  target_value: number;
  reward_coins: number;
  type: string;
  icon: string | null;
  achieved: boolean;
  progress?: number;
  progress_percent?: number;
};

export type AchievementGroup = {
  group_id: number;
  group_key: string;
  title: string;
  description: string;
  icon: string | null;
  milestones: AchievementMilestone[];
};

// ─── Step Sync ────────────────────────────────────────────────────────────────

/**
 * Payload sent every time the step tracker has a meaningful update.
 * The backend uses this to build today-summary, weekly-progress,
 * streaks, calendar, and hourly stats.
 */
export type StepSyncPayload = {
  /** Raw step count for today */
  steps: number;
  /** steps × 0.0008, rounded to 2 dp */
  distance_km: number;
  /** steps × 0.04, rounded to integer */
  calories: number;
  /** max(1, floor(steps / 1000)) */
  active_minutes: number;
  /** ISO date string YYYY-MM-DD */
  date: string;
};

export type StepSyncResponse = {
  success: boolean;
  message?: string;
  data?: {
    steps?: number;
    coins_earned?: number;
    total_coins?: number;
  };
};

// Common API response wrapper
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// ==============================
// API FUNCTIONS
// ==============================

// 0️⃣ Step Sync — called by useStepTracker whenever steps update
//    Uses the shared axios instance so the auth token is included automatically.
export const syncStepsToServer = async (
  payload: StepSyncPayload
): Promise<StepSyncResponse> => {
  try {
    const res = await api.post("/v1/steps/sync", payload);

    return {
      success: true,
      message: res?.data?.message || "Steps synced",
      data: res?.data,
    };
  } catch (error: any) {
    console.error(
      "❌ syncStepsToServer error:",
      error?.response?.data || error?.message,
    );
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to sync steps",
    };
  }
};

// ─── Shared normalizer ───────────────────────────────────────────────────────
// The server may return either a flat payload  { steps, distance_km, ... }
// or a wrapped payload { success, data: { steps, distance_km, ... } }.
// This picks whichever level has the actual data object.
function unwrap(raw: any): any {
  if (raw == null) return {};
  // If the server wrapped with { success, data: { ... } }, unwrap one level.
  if (raw.data != null && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    return raw.data;
  }
  return raw;
}

// Safely coerce any value (string, number, null, undefined) to a finite number.
function n(val: unknown, fallback = 0): number {
  const v = Number(val);
  return Number.isFinite(v) ? v : fallback;
}

// 1️⃣ Dashboard Overview
export const fetchDashboard = async (): Promise<ApiResponse<DashboardResponse>> => {
  try {
    const res = await api.get("/v1/dashboard/");
    const d   = unwrap(res.data);
    return {
      success: true,
      data: {
        today_steps: n(d.today_steps),
        goal_steps:  n(d.goal_steps),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch dashboard",
    };
  }
};

// 2️⃣ Today Summary
//    Returns steps, goal_steps, progress_percent, distance_km, calories, active_minutes
//    These are computed server-side from the last syncStepsToServer call.
export const fetchTodaySummary = async (): Promise<ApiResponse<TodaySummaryResponse>> => {
  try {
    const res = await api.get("/v1/dashboard/today-summary");
    const d   = unwrap(res.data);
    console.log("[API] today-summary raw:", JSON.stringify(d));
    return {
      success: true,
      data: {
        steps:            n(d.steps),
        goal_steps:       n(d.goal_steps),
        progress_percent: n(d.progress_percent),
        distance_km:      n(d.distance_km),
        calories:         n(d.calories),
        active_minutes:   n(d.active_minutes),
      },
    };
  } catch (error: any) {
    console.error("[API] today-summary error:", error?.response?.data || error?.message);
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch today summary",
    };
  }
};

// 3️⃣ Weekly Progress
export const fetchWeeklyProgress = async (): Promise<ApiResponse<WeeklyProgressItem[]>> => {
  try {
    const res  = await api.get("/v1/dashboard/weekly-progress");
    const raw  = res.data?.data ?? res.data ?? [];
    const items: any[] = Array.isArray(raw) ? raw : [];
    return {
      success: true,
      data: items.map(item => ({
        date:  String(item.date  || ""),
        steps: n(item.steps),
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch weekly progress",
    };
  }
};

// 4️⃣ Fitness Streak
export const fetchFitnessStreak = async (): Promise<ApiResponse<FitnessStreakResponse>> => {
  try {
    const res = await api.get("/v1/dashboard/fitness-streak");
    const d   = unwrap(res.data);
    return {
      success: true,
      data: {
        current_streak: n(d.current_streak),
        longest_streak: n(d.longest_streak),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch streak",
    };
  }
};

// 5️⃣ Calendar Progress
export const fetchCalendarProgress = async (
  month: string // YYYY-MM
): Promise<ApiResponse<CalendarApiResponse>> => {
  try {
    const res = await api.get(`/v1/progress/calendar?month=${month}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch calendar",
    };
  }
};

// 6️⃣ Today Hourly Stats
export const fetchTodayHourlyStats = async (): Promise<ApiResponse<HourlyStatItem[]>> => {
  try {
    const res = await api.get("/v1/stats/today-hourly-stats");
    return {
      success: res.data?.success ?? true,
      data: res.data?.data || [],
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch hourly stats",
    };
  }
};

// 7️⃣ Step Wallet History
export const fetchStepHistory = async (): Promise<ApiResponse<StepHistoryItem[]>> => {
  try {
    const res = await api.get("/v1/wallet/steps-history");
    const responseData = res.data;
    const history = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
      ? responseData.data
      : [];
    return { success: true, data: history };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch step history",
    };
  }
};

// 8️⃣ Step Summary (coin wallet)
export const fetchStepSummary = async (): Promise<ApiResponse<StepSummary>> => {
  try {
    const res = await api.get("/v1/wallet/steps-summary");
    return {
      success: true,
      data: {
        balance:        Number(res.data?.balance || 0),
        expiring_coins: Number(res.data?.expiring_coins || 0),
        expiry_date:    res.data?.expiry_date || null,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch step summary",
    };
  }
};

// 9️⃣ Achievements
export const fetchAchievements = async (): Promise<ApiResponse<AchievementGroup[]>> => {
  try {
    const res = await api.get("/v1/achievement/");
    const responseData = res.data;
    const achievements = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
      ? responseData.data
      : [];
    return { success: true, data: achievements };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Failed to fetch achievements",
    };
  }
};