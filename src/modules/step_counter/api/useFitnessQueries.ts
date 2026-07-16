import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAchievements,
  fetchCalendarProgress,
  fetchDashboard,
  fetchFitnessStreak,
  fetchTodayHourlyStats,
  fetchTodaySummary,
  fetchWeeklyProgress,
} from "./DashboardAPI";
import { fitnessQueryKeys } from "./fitnessQueryKeys";

const queryConfig = {
  staleTime: 1000 * 60 * 30,
  gcTime: 1000 * 60 * 60,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
};

export const useDashboardQuery = () =>
  useQuery({
    queryKey: fitnessQueryKeys.dashboard(),
    queryFn: fetchDashboard,
    ...queryConfig,
  });

export const useTodaySummaryQuery = () =>
  useQuery({
    queryKey: fitnessQueryKeys.todaySummary(),
    queryFn: fetchTodaySummary,
    ...queryConfig,
  });

export const useWeeklyProgressQuery = () =>
  useQuery({
    queryKey: fitnessQueryKeys.weeklyProgress(),
    queryFn: fetchWeeklyProgress,
    ...queryConfig,
  });

export const useFitnessStreakQuery = () =>
  useQuery({
    queryKey: fitnessQueryKeys.fitnessStreak(),
    queryFn: fetchFitnessStreak,
    ...queryConfig,
  });

export const useTodayHourlyStatsQuery = () =>
  useQuery({
    queryKey: fitnessQueryKeys.todayHourlyStats(),
    queryFn: fetchTodayHourlyStats,
    ...queryConfig,
  });

export const useCalendarProgressQuery = (month: string) =>
  useQuery({
    queryKey: fitnessQueryKeys.calendarProgress(month),
    queryFn: () => fetchCalendarProgress(month),
    enabled: Boolean(month),
    ...queryConfig,
  });

export const useAchievementsQuery = () =>
  useQuery({
    queryKey: fitnessQueryKeys.achievements(),
    queryFn: fetchAchievements,
    ...queryConfig,
  });

export const useInvalidateFitnessQueries = () => {
  const queryClient = useQueryClient();

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: fitnessQueryKeys.all }),
    [queryClient]
  );
};

export { fitnessQueryKeys };
