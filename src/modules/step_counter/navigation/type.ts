export interface DailyData {
  day: string;
  date: number;
  progress: number;
  done: boolean;
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

