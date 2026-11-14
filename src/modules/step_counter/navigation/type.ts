export interface DailyData {
  day: string;
  date: number;
  progress: number;
  done: boolean;
  /** YYYY-MM-DD, used as a stable list key. */
  key?: string;
  /** Unclamped percentage of the daily goal. */
  percent?: number;
  isToday?: boolean;
}

export interface StepStats {
  currentSteps: number;
  goalSteps: number;
  distance_km: number;
  active_minutes: number;
  calories: number;
}

export interface StreakPlan {
  steps: number;
  days: number;
  rewardCoins: number;
  completedDays: boolean[];
  dayLabels: string[];
}

