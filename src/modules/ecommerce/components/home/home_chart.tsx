import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import HomeRewards from "../../../../assets/product/rewards_step.svg";
import WalletSvg from "../../../../assets/product/wallet_categories.svg";
import RadialProgressCard from "../../chart/RadialProgressCard";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RootStackParamList } from "@/navigation/types";
import { fetchUserInfo, isAuthenticated } from "../../../common/auth/api/AuthAPI";

const HOME_CHART_STEP_PROGRESS_QUERY_KEY = ["ecommerce", "home-chart", "step-progress"] as const;

type StepProgress = {
  steps: number;
  goal_steps: number;
  progress_percent: number;
};

const safeNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeStepProgress = (response: any): StepProgress => {
  const stepsData = response?.user?.steps || response?.data?.steps || {};
  const steps = safeNumber(stepsData.steps);
  const goalSteps = safeNumber(stepsData.goal_steps);
  const progressPercent = safeNumber(
    stepsData.progress_percent,
    goalSteps > 0 ? (steps / goalSteps) * 100 : 0
  );

  return {
    steps,
    goal_steps: goalSteps,
    progress_percent: Math.max(0, Math.min(progressPercent, 100)),
  };
};

export default function Home_Chart() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();

  const stepProgressQuery = useQuery({
    queryKey: HOME_CHART_STEP_PROGRESS_QUERY_KEY,
    queryFn: async () => normalizeStepProgress(await fetchUserInfo()),
    // Stop polling when there is no auth token — avoids log spam and wasted
    // network/AsyncStorage work on every 5-second tick while unauthenticated.
    // The function form re-evaluates after each fetch so polling resumes
    // automatically once the user logs in and a re-render fires.
    refetchInterval: () => (isAuthenticated() ? 5000 : false),
    staleTime: 10000,
    refetchOnWindowFocus: isAuthenticated(),
  });

  const stepProgress = stepProgressQuery.data || {
    steps: 0,
    goal_steps: 0,
    progress_percent: 0,
  };

  const layout = useMemo(() => {
    const horizontalPadding = width >= 768 ? 20 : 12;
    const gap = width >= 768 ? 14 : 10;
    const maxContentWidth = 520;
    const contentWidth = Math.min(width - horizontalPadding * 2, maxContentWidth);
    const cardWidth = Math.floor((contentWidth - gap) / 2);

    return {
      cardWidth,
      containerPadding: horizontalPadding,
      contentWidth,
      gap,
    };
  }, [width]);

  const goToRewards = useCallback(() => {
    const parentNavigation = navigation.getParent() as
      | NativeStackNavigationProp<RootStackParamList>
      | undefined;

    parentNavigation?.navigate("RewardStack", {
      moduleName: "Step Counter",
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: HOME_CHART_STEP_PROGRESS_QUERY_KEY,
      });
    }, [queryClient])
  );

  const stepMainLabel = useMemo(
    () => `${stepProgress.steps.toLocaleString("en-IN")} steps`,
    [stepProgress.steps]
  );

  const stepSubLabel = useMemo(() => {
    const progress = Math.round(stepProgress.progress_percent);
    const goal = stepProgress.goal_steps > 0
      ? ` / ${stepProgress.goal_steps.toLocaleString("en-IN")}`
      : "";

    return `${progress}%${goal}`;
  }, [stepProgress.goal_steps, stepProgress.progress_percent]);

  return (
    <View style={[styles.container, { paddingHorizontal: layout.containerPadding }]}>
      <View style={[styles.row, { maxWidth: layout.contentWidth }]}>
        <View style={[styles.cardSlot, { marginRight: layout.gap }]}>
          <RadialProgressCard
            percentage={stepProgress.progress_percent}
            mainLabel={stepMainLabel}
            subLabel={stepSubLabel}
            color="#4CAF50"
            Icon={HomeRewards}
            onPress={goToRewards}
            cardWidth={layout.cardWidth}
            loading={stepProgressQuery.isLoading}
            errorMessage={stepProgressQuery.error ? "Failed to load steps" : ""}
            onRetry={() => stepProgressQuery.refetch()}
          />
        </View>

        <View style={styles.cardSlot}>
          <RadialProgressCard
            percentage={0}
            mainLabel="Spent ₹0"
            subLabel="0%"
            color="#F44336"
            Icon={WalletSvg}
            cardWidth={layout.cardWidth}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
  },
  cardSlot: {
    flex: 1,
    minWidth: 0,
  },
});
