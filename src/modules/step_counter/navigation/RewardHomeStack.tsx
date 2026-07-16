
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GoalSyncData, PlanOverview, OverallSummary } from '../api/Stepsapi';

export type FitnessStackParamList = {
  StepWelcome: undefined;
  StepGoal: undefined;
  Dashboard: undefined;
  PlanProcess: undefined;
  CoinHistory: undefined;
  StepForm: undefined;
  BMICart: undefined;
  AfterGoal: undefined;
  AchievementCard: undefined;
  StepsTrackerScreen: undefined;
  GoalCelebrationScreen: { response: GoalSyncData };
  TodayGoalCompletedScreen: {
    planOverview: PlanOverview;
    overallSummary: OverallSummary;
    currentStreak: number;
    reward: number;
  };
};

const Stack = createNativeStackNavigator<FitnessStackParamList>();

export default function RewardHomeStack() {
  return (
    <Stack.Navigator
      id="HomeStack"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >

      <Stack.Screen
        name="StepWelcome"
        getComponent={() => require('../component/fitness/StepWelcome').default}
      />

      <Stack.Screen
        name="StepGoal"
        getComponent={() => require('../component/fitness/StepGoal').default}
      />

      <Stack.Screen
        name="Dashboard"
        getComponent={() => require('../component/fitness/Dashboard').default}
      />

      <Stack.Screen
        name="PlanProcess"
        getComponent={() => require('../component/fitness/ProgressScreen').default}
      />

      <Stack.Screen
        name="CoinHistory"
        getComponent={() => require('../component/fitness/PointStatement').default}
      />

      <Stack.Screen
        name="StepForm"
        getComponent={() => require('../component/fitness/StepForm').default}
      />

      <Stack.Screen
        name="BMICart"
        getComponent={() => require('../component/fitness/BMIScreen').default}
      />

      <Stack.Screen
        name="AfterGoal"
        getComponent={() => require('../component/fitness/Dashboard').default}
      />

      <Stack.Screen
        name="AchievementCard"
        getComponent={() => require('../component/fitness/AchievementsScreen').default}
      />

      <Stack.Screen
        name="StepsTrackerScreen"
        getComponent={() => require('../component/StepCode/StepsTrackerScreen').default}
      />

      <Stack.Screen
        name="GoalCelebrationScreen"
        getComponent={() => require('../component/fitness/GoalCelebrationScreen').default}
      />

      <Stack.Screen
        name="TodayGoalCompletedScreen"
        getComponent={() => require('../component/fitness/TodayGoalCompletedScreen').default}
      />

    </Stack.Navigator>
  );
}
