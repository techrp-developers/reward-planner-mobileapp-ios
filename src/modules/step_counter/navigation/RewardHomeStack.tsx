import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { GoalSyncData, PlanOverview, OverallSummary } from '../api/Stepsapi';
import FitnessTabBar, {
  FitnessChromeContext,
  TAB_OF_ROUTE,
  type FitnessTab,
} from '../component/fitness/FitnessTabBar';
import {
  entryRouteFor,
  routeForStage,
  stageOf,
  useFitnessAccountScope,
  useFitnessSetup,
} from '../utils/fitnessSetup';
import { useStepPalette } from '../utils/useStepTheme';

export type FitnessStackParamList = {
  StepWelcome: undefined;
  StepGoal: undefined;
  Dashboard: undefined;
  PlanProcess: undefined;
  CoinHistory: undefined;
  // startAt "body": basic details are already saved, open on measurements.
  StepForm: { startAt?: 'body' } | undefined;
  // First-time plan + goal step of setup (no tab bar).
  BMICart: undefined;
  // My Plan tab: same screen, management mode.
  MyPlan: undefined;
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

// Screens that need setup complete. Reaching one early (deep link, revoked
// Health access) resumes setup at the first incomplete stage instead.
const SETUP_REQUIRED = new Set<string>(['Dashboard', 'AfterGoal', 'AchievementCard', 'CoinHistory', 'PlanProcess']);

const GATE = {
  light: { bg: '#F5F9FF', text: '#4A5275', accent: '#426BFF', button: 'rgba(66,107,255,0.10)' },
  dark: { bg: '#070A16', text: '#CDD2EA', accent: '#8EA2FF', button: 'rgba(142,162,255,0.12)' },
};

/** Shown while the setup state is resolved before RP Move opens. */
function SetupGate({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { palette: C } = useStepPalette(GATE.light, GATE.dark);
  return (
    <View style={[gateStyles.root, { backgroundColor: C.bg }]}>
      {error ? (
        <>
          <MaterialCommunityIcons name="wifi-off" size={34} color={C.accent} />
          <Text style={[gateStyles.text, { color: C.text }]}>{error.message}</Text>
          <TouchableOpacity style={[gateStyles.button, { backgroundColor: C.button }]} onPress={onRetry} activeOpacity={0.85}>
            <Text style={[gateStyles.buttonText, { color: C.accent }]}>{t('common:actions.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={[gateStyles.link, { color: C.text }]}>{t('common:actions.back')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <ActivityIndicator size="large" color={C.accent} />
      )}
    </View>
  );
}

export default function RewardHomeStack() {
  useFitnessAccountScope();
  const setup = useFitnessSetup();
  // Decided once: where this visit to RP Move opens.
  const [entry, setEntry] = useState<ReturnType<typeof entryRouteFor> | null>(null);

  useEffect(() => {
    if (!entry && setup.resolved) setEntry(entryRouteFor(setup.stage, setup.plan));
  }, [entry, setup.plan, setup.resolved, setup.stage]);

  if (!entry) return <SetupGate error={setup.error} onRetry={() => { setup.retry(); }} />;
  return <FitnessLayout entry={entry} setup={setup} />;
}

function FitnessLayout({
  entry,
  setup,
}: {
  entry: NonNullable<ReturnType<typeof entryRouteFor>>;
  setup: ReturnType<typeof useFitnessSetup>;
}) {
  const appNavigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { palette: C } = useStepPalette(GATE.light, GATE.dark);
  const stackNav = useRef<any>(null);
  const [focused, setFocused] = useState<string>(entry.name);
  const [hiders, setHiders] = useState<Set<object>>(() => new Set());

  const screenListeners = useCallback(
    ({ navigation, route }: { navigation: any; route: { name: string } }) => ({
      focus: () => {
        stackNav.current = navigation;
        setFocused(route.name);
      },
    }),
    [],
  );

  const setHidden = useCallback((owner: object, hidden: boolean) => {
    setHiders(prev => {
      if (prev.has(owner) === hidden) return prev;
      const next = new Set(prev);
      if (hidden) next.add(owner);
      else next.delete(owner);
      return next;
    });
  }, []);

  // ── Guard ───────────────────────────────────────────────────────────────
  // Health counts as lost only when the device flag goes true → false (Health
  // Connect removed, access denied), as Dashboard did before; the flag starts
  // false on cold start until storage is read.
  const healthWasReady = useRef(false);
  if (setup.healthFlag) healthWasReady.current = true;
  const guardStage = stageOf(setup.plan, setup.healthFlag || !healthWasReady.current);

  useEffect(() => {
    if (!setup.settled || guardStage === 'ready' || !SETUP_REQUIRED.has(focused)) return;
    const target = routeForStage(guardStage);
    stackNav.current?.reset({ index: 0, routes: [target] });
  }, [focused, guardStage, setup.settled]);

  // ── Tab bar ─────────────────────────────────────────────────────────────
  const activeTab = TAB_OF_ROUTE[focused];
  const showBar = !!activeTab && hiders.size === 0;

  const handleTabPress = useCallback((tab: FitnessTab) => {
    const nav = stackNav.current;
    if (!nav || tab === activeTab) return;
    // Dashboard stays the base of the stack and at most one other tab sits on
    // top of it, so switching never piles up entries and Back returns to RP Move.
    if (tab === 'Dashboard') nav.navigate('Dashboard');
    else if (activeTab === 'Dashboard') nav.navigate(tab);
    else nav.replace(tab);
  }, [activeTab]);

  // Existing app-wide action of the center logo: the main app home.
  const handleCenterPress = useCallback(() => appNavigation.navigate('Dashboard'), [appNavigation]);

  // While the bar shows it owns the bottom inset, so screens don't pad twice.
  const innerInsets = useMemo(
    () => (showBar ? { ...insets, bottom: 0 } : insets),
    [insets, showBar],
  );

  return (
    <FitnessChromeContext.Provider value={setHidden}>
      <View style={[layoutStyles.root, { backgroundColor: C.bg }]}>
        <SafeAreaInsetsContext.Provider value={innerInsets}>
          <View style={layoutStyles.content}>
            <Stack.Navigator
              id="HomeStack"
              initialRouteName={entry.name}
              screenListeners={screenListeners}
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                freezeOnBlur: true,
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
                options={{ animation: 'fade' }}
              />

              <Stack.Screen
                name="StepForm"
                getComponent={() => require('../component/fitness/StepForm').default}
                initialParams={entry.name === 'StepForm' ? entry.params : undefined}
              />

              <Stack.Screen
                name="BMICart"
                getComponent={() => require('../component/fitness/BMIScreen').default}
              />

              <Stack.Screen
                name="MyPlan"
                getComponent={() => require('../component/fitness/BMIScreen').default}
                options={{ animation: 'fade' }}
              />

              <Stack.Screen
                name="AfterGoal"
                getComponent={() => require('../component/fitness/Dashboard').default}
              />

              <Stack.Screen
                name="AchievementCard"
                getComponent={() => require('../component/fitness/AchievementsScreen').default}
                options={{ animation: 'fade' }}
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
          </View>
        </SafeAreaInsetsContext.Provider>
        {showBar && activeTab && (
          <FitnessTabBar active={activeTab} onTabPress={handleTabPress} onCenterPress={handleCenterPress} />
        )}
      </View>
    </FitnessChromeContext.Provider>
  );
}

const layoutStyles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});

const gateStyles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  text: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  button: { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 22 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  link: { fontSize: 13, fontWeight: '600', paddingVertical: 6 },
});
