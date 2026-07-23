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
import { fetchProfileStepStatus } from '../api/ProfileAPI';
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
  return permissions.some(p => {
    // Some library versions return raw Android permission strings
    if (typeof p === 'string') {
      const s = p.toLowerCase();
      return s.includes('read_steps') || (s.includes('steps') && s.includes('read'));
    }
    // Handle nested shape, and any casing of both fields
    const rt = String(p.recordType ?? p.permission?.recordType ?? '').toLowerCase();
    const at = String(p.accessType ?? p.permission?.accessType ?? '').toLowerCase();
    return rt === 'steps' && at === 'read';
  });
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
  // Group by data origin and take the highest single-origin total.
  // This avoids double-counting when two apps (e.g. Google Fit + Samsung Health)
  // both sync the same physical steps to Health Connect, while still using
  // whichever source recorded the most steps.
  const byOrigin = new Map<string, number>();
  for (const record of records) {
    const origin = String(record.metadata?.dataOrigin ?? 'unknown');
    byOrigin.set(origin, (byOrigin.get(origin) ?? 0) + (Number(record.count) || 0));
  }
  if (byOrigin.size === 0) return 0;
  return Math.max(...byOrigin.values());
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StepTrackerContext = createContext<StepTrackerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StepTrackerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // ── Refs: never cause re-renders, always current ──────────────────────────
  const initialized       = useRef(false);
  const isSyncing         = useRef(false);  // sync lock — prevents concurrent API calls
  const lastSyncedSteps   = useRef(-1);     // -1 = never synced this session
  const lastSyncedDate    = useRef<string | null>(null);
  const lastSyncTime      = useRef(0);
  const stepsRef          = useRef(0);      // mirror of steps state for closures
  const stepDataStateRef  = useRef<StepDataState>('loading'); // sync mirror so callbacks read fresh state

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
    AsyncStorage.multiGet([STORAGE_LAST_SYNC, STORAGE_SETUP]).then(async pairs => {
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

      if (setupPair[1] === 'true') {
        setIsSetupComplete(true);
      } else {
        // AsyncStorage is wiped on reinstall — check the backend so users who
        // already completed setup on a previous install skip onboarding entirely.
        try {
          const status = await fetchProfileStepStatus();
          if (status.is_completed) {
            await AsyncStorage.setItem(STORAGE_SETUP, 'true');
            setIsSetupComplete(true);
          }
        } catch {
          // Network unavailable or auth not ready — leave isSetupComplete false
          // so the user goes through onboarding (will re-sync local flag then).
        }
      }
    }).catch(() => {});
  }, []);

  // ── Sync gate — only reads refs, safe to call anywhere ───────────────────
  const shouldSync = (count: number): boolean => {
    const today = localDateString(new Date());
    if (count <= 0) return false;
    if (isSyncing.current) return false;

    if (lastSyncedDate.current !== today) {
      // New day — skip cooldown (fresh start) but still require MIN_STEP_DIFF
      // so a midnight wakeup with 2 steps doesn't fire an API call.
      return count >= MIN_STEP_DIFF;
    }
    if (lastSyncedSteps.current === -1) {
      // First sync ever in this session — same threshold applies.
      return count >= MIN_STEP_DIFF;
    }
    if (count <= lastSyncedSteps.current) return false;                // no increase
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

      setHealthConnectError(null);
      queryClient.invalidateQueries({ queryKey: fitnessQueryKeys.all });
      console.log(`[Steps] Synced ${count} steps ✓`);
    } catch (e: any) {
      console.warn('[Steps] Sync failed:', e);
      setHealthConnectError(`Steps sync failed: ${e?.message || 'network error'}`);
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
        try {
          const result = await readRecords('Steps', { timeRangeFilter });
          records = Array.isArray(result?.records) ? result.records :
                    Array.isArray(result) ? result as any[] : [];
          total = sumStepRecords(records);
          console.log(`[Steps] Raw read ${total} steps today (${records.length} records, origins: ${records.map((r: any) => r?.metadata?.dataOrigin).join(', ')})`);
        } catch (readError: any) {
          console.warn('[Steps] readRecords failed:', readError?.message);
        }
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
        const nextState: StepDataState = hasHistory ? 'no_steps_today' : 'no_source';
        stepDataStateRef.current = nextState;
        setStepDataState(nextState);
        setSteps(0);
        return 0;
      }

      stepDataStateRef.current = 'ok';
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
        // Try Android 14+ built-in HC package first, fall back to standalone app package
        let ok = await initialize(HC_PACKAGE).catch(() => false as boolean);
        if (!ok) {
          ok = await initialize('com.google.android.apps.healthdata').catch(() => false as boolean);
        }
        if (!ok) {
          setHealthConnectError('Health Connect could not be initialized');
          setStepDataState('no_permission');
          setLoading(false);
          return [];
        }
        initialized.current = true;
      }

      // Check both provider packages: Android 14+ built-in and the standalone app
      let sdkStatus = await getSdkStatus(HC_PACKAGE).catch(() => SdkAvailabilityStatus.SDK_UNAVAILABLE);
      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        sdkStatus = await getSdkStatus('com.google.android.apps.healthdata').catch(() => SdkAvailabilityStatus.SDK_UNAVAILABLE);
      }
      setHealthConnectStatus(String(sdkStatus));

      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        // Health Connect is completely uninstalled — if the user previously
        // completed setup, reset that flag so they are routed back through
        // onboarding (where they'll be prompted to reinstall HC) instead of
        // landing on a broken Dashboard with 0 steps and no explanation.
        // Only do this for SDK_UNAVAILABLE (gone entirely), not for
        // SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED (installed but needs update —
        // the user shouldn't lose their onboarding progress in that case).
        if (sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
          const wasSetup = await AsyncStorage.getItem(STORAGE_SETUP).catch(() => null);
          if (wasSetup === 'true') {
            await AsyncStorage.removeItem(STORAGE_SETUP).catch(() => {});
            setIsSetupComplete(false);
          }
        }
        const msg = sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE
          ? 'Health Connect not installed'
          : 'Health Connect needs setup';
        setHealthConnectError(msg);
        setStepDataState('no_permission');
        setLoading(false);
        return [];
      }

      let granted = await getGrantedPermissions();
      console.log('[Steps] getGrantedPermissions raw:', JSON.stringify(granted));

      // On some devices/versions the permission store needs a moment to settle
      // after initialization — retry once with a short delay if we get nothing back.
      if (granted.length === 0) {
        await new Promise<void>(r => setTimeout(r, 1500));
        granted = await getGrantedPermissions();
        console.log('[Steps] getGrantedPermissions retry:', JSON.stringify(granted));
      }

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
      // Ensure SDK is initialized before calling requestPermission.
      // On first launch the mount-effect's initAndCheck() may not have completed yet.
      await initAndCheck();

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

      await readAndSync();

      // If no fitness app is writing steps to Health Connect at all, keep the user
      // in onboarding so they can connect a source — completing setup now would
      // leave them permanently stuck with 0 steps and no way back.
      // Use the ref (not state) because React state updates are async and would
      // be stale at this point in the same async call chain.
      if (stepDataStateRef.current === 'no_source') {
        setHealthConnectError(
          'No step data found. Open Google Fit or Samsung Health, enable Health Connect sync, then tap Continue.',
        );
        return false;
      }

      // Permission is granted and we have a usable data source — mark setup complete.
      // Steps may still be 0 for today (user hasn't walked yet); that's fine.
      await AsyncStorage.setItem(STORAGE_SETUP, 'true');
      setIsSetupComplete(true);
      setHealthConnectError(null);
      return true;
    } catch (err: any) {
      setHealthConnectError(err?.message || String(err));
      return false;
    }
  }, [initAndCheck, readAndSync]);

  const openHealthConnect = useCallback(async () => {
    try {
      // Mirror the same two-package fallback used in initAndCheck so Android 9-13
      // users (standalone HC app) are sent to the data management screen, not the Play Store.
      let status: number = SdkAvailabilityStatus.SDK_UNAVAILABLE;
      try { status = await getSdkStatus(HC_PACKAGE); } catch {}
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        try { status = await getSdkStatus('com.google.android.apps.healthdata'); } catch {}
      }

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
