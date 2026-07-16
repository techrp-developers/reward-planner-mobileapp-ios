import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectDataManagement,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { Permission } from 'react-native-health-connect';

import { syncStepsToServer, type GoalSyncData } from '../api/Stepsapi';
import { fitnessQueryKeys } from '../api/fitnessQueryKeys';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepDataState =
  | 'loading'
  | 'no_permission'
  | 'no_source'
  | 'no_steps_today'
  | 'ok';

export type StepTrackerContextValue = {
  // Clean API (per requirements)
  steps: number;
  loading: boolean;
  syncSteps: () => Promise<void>;
  refreshSteps: () => Promise<void>;
  // Extended API used by onboarding screens
  stepDataState: StepDataState;
  healthConnectStatus: string | null;
  grantedPermissions: any[];
  healthConnectError: string | null;
  isSetupComplete: boolean;
  celebrationData: GoalSyncData | null;
  requestStepsPermission: () => Promise<boolean>;
  openHealthConnect: () => Promise<void>;
  dismissCelebration: () => void;
  // Backward-compat aliases kept so existing consumers don't need changes
  totalSteps: number;
  refreshStatus: () => Promise<void>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_STEP_DIFF   = 100;
const COOLDOWN_MS     = 15 * 60 * 1000; // 15 minutes

const STORAGE_LAST_SYNC = '@step_tracker/last_synced_steps';
const STORAGE_SETUP     = 'fitness_setup_completed';

const HC_PACKAGE = 'com.google.android.healthconnect.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasStepsPerm(permissions: any[]): boolean {
  return permissions.some(p => p.recordType === 'Steps' && p.accessType === 'read');
}

// toISOString() returns the UTC date, which can be a day off from the
// device's local "today" depending on timezone — format using local
// getters instead so the synced date matches what the user actually sees.
function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildPayload(steps: number) {
  return {
    steps,
    distance_km:    Number((steps * 0.0008).toFixed(2)),
    calories:       Math.round(steps * 0.04),
    active_minutes: Math.max(1, Math.floor(steps / 1000)),
    date:           localDateString(new Date()),
  };
}

function sumStepRecords(records: any[]): number {
  const originOf = (record: any) => String(record.metadata?.dataOrigin ?? '').toLowerCase();
  const googleRecords = records.filter(record => originOf(record).includes('fit') || originOf(record).includes('google'));
  const samsungRecords = records.filter(record => originOf(record).includes('samsung') || originOf(record).includes('shealth'));
  const selectedRecords =
    googleRecords.length > 0 ? googleRecords :
    samsungRecords.length > 0 ? samsungRecords :
    records;

  return selectedRecords.reduce((sum, record) => sum + (Number(record.count) || 0), 0);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StepTrackerContext = createContext<StepTrackerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StepTrackerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // ── Refs: never cause re-renders, always current ──────────────────────────
  const initialized     = useRef(false);
  const isSyncing       = useRef(false);  // sync lock — prevents concurrent API calls
  const lastSyncedSteps = useRef(-1);     // -1 = never synced this session
  const lastSyncedDate  = useRef<string | null>(null);
  const lastSyncTime    = useRef(0);
  const stepsRef        = useRef(0);      // mirror of steps state for closures

  // ── State ─────────────────────────────────────────────────────────────────
  const [steps,               setSteps]               = useState(0);
  const [loading,             setLoading]             = useState(true);
  const [stepDataState,       setStepDataState]       = useState<StepDataState>('loading');
  const [healthConnectStatus, setHealthConnectStatus] = useState<string | null>(null);
  const [grantedPermissions,  setGrantedPermissions]  = useState<any[]>([]);
  const [healthConnectError,  setHealthConnectError]  = useState<string | null>(null);
  const [isSetupComplete,     setIsSetupComplete]     = useState(false);
  const [celebrationData,     setCelebrationData]     = useState<GoalSyncData | null>(null);

  // Keep stepsRef in sync with state so AppState handler never reads stale value
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  // ── Restore persisted state on mount ─────────────────────────────────────
  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_LAST_SYNC, STORAGE_SETUP]).then(pairs => {
      const [lastSyncPair, setupPair] = pairs;
      const today = localDateString(new Date());
      const rawLastSync = lastSyncPair[1];

      if (rawLastSync) {
        try {
          const parsed = JSON.parse(rawLastSync);
          const n = Number(parsed?.steps);
          const date = typeof parsed?.date === 'string' ? parsed.date : null;
          if (date === today && Number.isFinite(n) && n > 0) {
            lastSyncedDate.current = date;
            lastSyncedSteps.current = n;
          }
        } catch {
          lastSyncedDate.current = null;
          lastSyncedSteps.current = -1;
        }
      }
      if (setupPair[1] === 'true') setIsSetupComplete(true);
    }).catch(() => {});
  }, []);

  // ── Sync gate — only reads refs, safe to call anywhere ───────────────────
  const shouldSync = (count: number): boolean => {
    const today = localDateString(new Date());
    if (count <= 0) return false;
    if (isSyncing.current) return false;                              // already in flight
    if (lastSyncedDate.current !== today) return true;                // first sync today
    if (lastSyncedSteps.current === -1) return true;                  // first sync ever
    if (count <= lastSyncedSteps.current) return false;               // no increase
    if (count - lastSyncedSteps.current < MIN_STEP_DIFF) return false; // < 100 new steps
    if (Date.now() - lastSyncTime.current < COOLDOWN_MS) return false; // inside 15-min window
    return true;
  };

  // ── Internal sync (accepts explicit count to avoid stale closure issues) ──
  const doSync = useCallback(async (count: number): Promise<void> => {
    if (!shouldSync(count)) return;

    isSyncing.current = true;
    try {
      const payload = buildPayload(count);
      const res = await syncStepsToServer(payload);
      if (!res.success) throw new Error(res.message || 'Sync failed');

      lastSyncedDate.current  = payload.date;
      lastSyncedSteps.current = count;
      lastSyncTime.current    = Date.now();
      await AsyncStorage.setItem(STORAGE_LAST_SYNC, JSON.stringify({ date: payload.date, steps: count }));

      // Show the celebration for either a completed daily goal OR a newly
      // unlocked lifetime achievement — these are now independent (the
      // backend checks lifetime achievements regardless of goalAchieved).
      if (res.data?.goalAchieved || (res.data?.unlockedAchievements?.length ?? 0) > 0) {
        setCelebrationData(res.data);
      }

      queryClient.invalidateQueries({ queryKey: fitnessQueryKeys.all });
      console.log(`[Steps] Synced ${count} steps ✓`);
    } catch (e) {
      console.warn('[Steps] Sync failed:', e);
    } finally {
      isSyncing.current = false;
    }
  }, [queryClient]); // queryClient is stable from useQueryClient()

  // ── Read Health Connect + conditionally sync ──────────────────────────────
  const readAndSync = useCallback(async (): Promise<number> => {
    setLoading(true);
    setStepDataState('loading');
    try {
      const now   = new Date();
      const start = new Date(); start.setHours(0, 0, 0, 0);

      const timeRangeFilter = {
        operator:  'between' as const,
        startTime: start.toISOString(),
        endTime:   now.toISOString(),
      };

      let total = 0;
      let records: any[] = [];

      try {
        const aggregate = await aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter,
        });
        total = Number(aggregate.COUNT_TOTAL) || 0;
        console.log(
          `[Steps] Aggregated ${total} steps today from origins: ${JSON.stringify(aggregate.dataOrigins || [])}`,
        );
      } catch (aggregateError: any) {
        console.warn('[Steps] Aggregate read failed, falling back to records:', aggregateError?.message);
      }

      if (total <= 0) {
        const result = await readRecords('Steps', { timeRangeFilter });
        records = Array.isArray(result.records) ? result.records : [];
        total = sumStepRecords(records);
        console.log(`[Steps] Raw read ${total} steps today (${records.length} records)`);
      }

      if (total <= 0) {
        let hasHistory = false;
        try {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const broad = await readRecords('Steps', {
            timeRangeFilter: { operator: 'between', startTime: past.toISOString(), endTime: now.toISOString() },
            pageSize: 1,
            ascendingOrder: false,
          });
          hasHistory = broad.records.length > 0;
        } catch {}
        setStepDataState(hasHistory ? 'no_steps_today' : 'no_source');
        setSteps(0);
        return 0;
      }

      setStepDataState('ok');
      setSteps(total);
      await doSync(total);
      return total;
    } catch (err: any) {
      console.warn('[Steps] HC read error:', err?.message);
      setHealthConnectError(err?.message || String(err));
      return 0;
    } finally {
      setLoading(false);
    }
  }, [doSync]);

  // ── Initialize HC + verify permissions ───────────────────────────────────
  const initAndCheck = useCallback(async (): Promise<any[]> => {
    try {
      if (!initialized.current) {
        console.log('[Steps] Initializing Health Connect SDK (once)');
        await initialize();
        initialized.current = true;
      }

      const sdkStatus = await getSdkStatus(HC_PACKAGE);
      setHealthConnectStatus(String(sdkStatus));

      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        const msg = sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE
          ? 'Health Connect not installed'
          : 'Health Connect needs setup';
        setHealthConnectError(msg);
        setStepDataState('no_permission');
        setLoading(false);
        return [];
      }

      const granted = await getGrantedPermissions();
      setGrantedPermissions(granted);

      if (!hasStepsPerm(granted)) {
        setHealthConnectError('Steps permission not granted');
        setStepDataState('no_permission');
        setLoading(false);
        return [];
      }

      setHealthConnectError(null);
      return granted;
    } catch (err: any) {
      if (
        err?.message?.includes('Service not available') ||
        err?.message?.includes('IllegalStateException')
      ) {
        initialized.current = false;
        setHealthConnectStatus('0');
        setHealthConnectError('Health Connect not installed');
        setStepDataState('no_permission');
      } else {
        setHealthConnectError(err?.message || String(err));
      }
      setLoading(false);
      return [];
    }
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const refreshSteps = useCallback(async () => {
    const granted = await initAndCheck();
    if (hasStepsPerm(granted)) await readAndSync();
  }, [initAndCheck, readAndSync]);

  // Public syncSteps() reads from stepsRef so it's never stale in callbacks
  const syncSteps = useCallback(async () => {
    await doSync(stepsRef.current);
  }, [doSync]);

  const requestStepsPermission = useCallback(async (): Promise<boolean> => {
    try {
      const perms: Permission[] = [{ accessType: 'read', recordType: 'Steps' }];
      await requestPermission(perms);
      await new Promise<void>(r => setTimeout(r, 1000));

      const granted = await getGrantedPermissions();
      setGrantedPermissions(granted);

      if (!hasStepsPerm(granted)) {
        await AsyncStorage.removeItem(STORAGE_SETUP);
        setIsSetupComplete(false);
        setHealthConnectError('Enable Steps permission in Health Connect → App permissions');
        return false;
      }

      const count = await readAndSync();
      if (count > 0) {
        await AsyncStorage.setItem(STORAGE_SETUP, 'true');
        setIsSetupComplete(true);
        setHealthConnectError(null);
        return true;
      }

      setHealthConnectError(
        'No step data yet. Open Google Fit or Samsung Health, enable Health Connect sync, walk a few steps, then tap Continue.',
      );
      return false;
    } catch (err: any) {
      setHealthConnectError(err?.message || String(err));
      return false;
    }
  }, [readAndSync]);

  const openHealthConnect = useCallback(async () => {
    try {
      let status: number = SdkAvailabilityStatus.SDK_UNAVAILABLE;
      try { status = await getSdkStatus(HC_PACKAGE); } catch {}

      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        try {
          await Linking.openURL('market://details?id=com.google.android.apps.healthdata');
        } catch {
          await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata');
        }
        return;
      }
      openHealthConnectDataManagement();
    } catch {
      try {
        await Linking.openURL('market://details?id=com.google.android.apps.healthdata');
      } catch {
        await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata');
      }
    }
  }, []);

  const dismissCelebration = useCallback(() => setCelebrationData(null), []);

  // ── AppState handler via ref — avoids stale closures without re-subscribing
  // The ref is updated every render so the listener always calls the latest logic.
  const appStateHandlerRef = useRef<(s: AppStateStatus) => void>(() => {});
  appStateHandlerRef.current = async (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      console.log('[Steps] App foregrounded — refreshing');
      const granted = await initAndCheck();
      if (hasStepsPerm(granted)) await readAndSync();
    } else if (nextState === 'background') {
      // Sync once when the user leaves the app
      console.log('[Steps] App backgrounded — syncing current steps');
      await doSync(stepsRef.current);
    }
  };

  // ── Lifecycle: mount once ─────────────────────────────────────────────────
  useEffect(() => {
    console.log('[Steps] Provider mounted — initial load');
    refreshSteps();

    const sub = AppState.addEventListener('change', s => appStateHandlerRef.current(s));
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — subscribe/unsubscribe once; handler ref stays current

  // ── Context value ─────────────────────────────────────────────────────────
  const value: StepTrackerContextValue = {
    steps,
    loading,
    syncSteps,
    refreshSteps,
    stepDataState,
    healthConnectStatus,
    grantedPermissions,
    healthConnectError,
    isSetupComplete,
    celebrationData,
    requestStepsPermission,
    openHealthConnect,
    dismissCelebration,
    // Backward-compat aliases
    totalSteps: steps,
    refreshStatus: refreshSteps,
  };

  return (
    <StepTrackerContext.Provider value={value}>
      {children}
    </StepTrackerContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStepTrackerContext(): StepTrackerContextValue {
  const ctx = useContext(StepTrackerContext);
  if (!ctx) {
    throw new Error('useStepTrackerContext must be called inside <StepTrackerProvider>');
  }
  return ctx;
}
