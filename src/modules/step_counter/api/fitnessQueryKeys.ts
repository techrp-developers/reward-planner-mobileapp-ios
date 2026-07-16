export const fitnessQueryKeys = {
  all: ["step-counter"] as const,
  dashboard: () => [...fitnessQueryKeys.all, "dashboard"] as const,
  todaySummary: () => [...fitnessQueryKeys.all, "today-summary"] as const,
  weeklyProgress: () => [...fitnessQueryKeys.all, "weekly-progress"] as const,
  fitnessStreak: () => [...fitnessQueryKeys.all, "fitness-streak"] as const,
  todayHourlyStats: () => [...fitnessQueryKeys.all, "today-hourly-stats"] as const,
  calendarProgress: (month: string) =>
    [...fitnessQueryKeys.all, "calendar-progress", month] as const,
  achievements: () => [...fitnessQueryKeys.all, "achievements"] as const,
};
