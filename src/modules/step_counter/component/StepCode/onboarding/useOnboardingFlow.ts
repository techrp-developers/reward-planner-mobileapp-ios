import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { SdkAvailabilityStatus } from 'react-native-health-connect';

import { useStepTracker } from '../useStepTracker';
import { hasStepsPerm } from '../../../context/StepTrackerContext';
import { fetchProfileStepStatus } from '../../../api/ProfileAPI';

export type DevicePlatform = 'android' | 'ios';

export type OnboardingStep =
  | 'select'
  // Android
  | 'install'
  | 'open'
  | 'permission'
  // iOS
  | 'apple'
  | 'settings'
  | 'find'
  | 'allow'
  | 'success';

export const CURRENT_PLATFORM: DevicePlatform = Platform.OS === 'ios' ? 'ios' : 'android';

const HC_STORE_PACKAGE = 'com.google.android.apps.healthdata';

/**
 * Onboarding state machine on top of StepTrackerContext. All native work
 * (SDK status, permission requests, resume re-checks, setup flag) stays in the
 * context; this hook only decides which step to show. Success is reached
 * exclusively through requestStepsPermission() resolving true.
 */
export function useOnboardingFlow() {
  const tracker = useStepTracker();
  const {
    healthConnectStatus, grantedPermissions, isSetupComplete, loading,
    requestStepsPermission, openHealthConnect, refreshStatus,
  } = tracker;
  const isIOS = CURRENT_PLATFORM === 'ios';

  const [history, setHistory] = useState<OnboardingStep[]>(['select']);
  const [selected, setSelected] = useState<DevicePlatform>(CURRENT_PLATFORM);
  const [busy, setBusy] = useState(false);
  // A native request on the current step finished without success; the
  // screen derives the exact reason from live tracker state.
  const [attempted, setAttempted] = useState(false);
  const [installShown, setInstallShown] = useState(false);
  const [recoveryShown, setRecoveryShown] = useState(false);
  const [openedHc, setOpenedHc] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const busyRef = useRef(false);

  const step = history[history.length - 1];
  const sdkStatus = Number(healthConnectStatus);
  const sdkAvailable = sdkStatus === SdkAvailabilityStatus.SDK_AVAILABLE;
  const hcNeedsUpdate = sdkStatus === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED;
  // The context leaves the status null if SDK initialization throws; `loading`
  // turning false is the signal that the first check finished either way.
  const statusResolved = healthConnectStatus !== null || !loading;
  const stepsGranted = hasStepsPerm(grantedPermissions);
  const ready = sdkAvailable && stepsGranted;

  const go = useCallback((next: OnboardingStep) => {
    setAttempted(false);
    setHistory(h => (h[h.length - 1] === next ? h : [...h, next]));
  }, []);

  /** Returns false when already on the first step (caller leaves the screen). */
  const back = useCallback((): boolean => {
    if (busyRef.current) return true;
    // Setup is already saved on success; back leaves instead of re-entering
    // the permission steps.
    if (history.length <= 1 || history[history.length - 1] === 'success') return false;
    setAttempted(false);
    setHistory(h => h.slice(0, -1));
    return true;
  }, [history]);

  const run = useCallback(async (task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  // ── Step actions ─────────────────────────────────────────────────────────

  const continueFromSelect = useCallback(() => {
    if (selected !== CURRENT_PLATFORM || !statusResolved) return;
    if (isIOS) {
      go('apple');
    } else if (!sdkAvailable) {
      // Android 14+ ships Health Connect in the framework, so this is
      // normally only reached on Android 9–13 or when an update is required.
      setInstallShown(true);
      go('install');
    } else {
      go('permission');
    }
  }, [selected, statusResolved, isIOS, sdkAvailable, go]);

  const openPlayStore = useCallback(async () => {
    try {
      await Linking.openURL(`market://details?id=${HC_STORE_PACKAGE}`);
    } catch {
      await Linking.openURL(`https://play.google.com/store/apps/details?id=${HC_STORE_PACKAGE}`).catch(() => {});
    }
  }, []);

  // "Already installed?" — re-check; the effect below advances if available.
  const recheckInstall = useCallback(() => run(async () => {
    await refreshStatus();
    setAttempted(true);
  }), [run, refreshStatus]);

  // Advance automatically when Health Connect becomes available while the
  // install step is showing (user returns from Play Store; the context
  // re-checks on AppState 'active'). Only on the transition, so pressing back
  // from 'open' doesn't bounce forward again.
  const prevAvailable = useRef(sdkAvailable);
  useEffect(() => {
    if (step === 'install' && sdkAvailable && !prevAvailable.current) go('open');
    prevAvailable.current = sdkAvailable;
  }, [step, sdkAvailable, go]);

  const launchHealthConnect = useCallback(() => run(async () => {
    await openHealthConnect();
    setOpenedHc(true);
  }), [run, openHealthConnect]);

  const requestAccess = useCallback(() => run(async () => {
    const ok = await requestStepsPermission();
    if (ok) go('success');
    else setAttempted(true);
  }), [run, requestStepsPermission, go]);

  const startRecovery = useCallback(() => {
    setRecoveryShown(true);
    go('settings');
  }, [go]);

  const openAppSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  // Decide where "success" leads: the existing flow sends new users to
  // StepForm; users whose fitness profile is already complete go to Dashboard.
  useEffect(() => {
    if (step !== 'success' || profileCompleted !== null) return;
    let mounted = true;
    fetchProfileStepStatus().then(res => {
      if (mounted) setProfileCompleted(Boolean(res.success && res.is_completed));
    });
    return () => { mounted = false; };
  }, [step, profileCompleted]);

  // ── Progress (reflects skipped install / optional recovery steps) ────────

  const plan = useMemo<OnboardingStep[]>(() => {
    if (isIOS) {
      return ['select', 'apple', ...(recoveryShown ? ['settings', 'find', 'allow'] as const : []), 'success'];
    }
    const needsInstall = installShown || (statusResolved && !sdkAvailable);
    return ['select', ...(needsInstall ? ['install', 'open'] as const : []), 'permission', 'success'];
  }, [isIOS, recoveryShown, installShown, statusResolved, sdkAvailable]);

  const progress = useMemo(() => {
    const index = plan.indexOf(step);
    return index < 0 ? null : { index, total: plan.length };
  }, [plan, step]);

  return {
    tracker,
    step,
    progress,
    selected,
    setSelected,
    busy,
    attempted,
    openedHc,
    statusResolved,
    sdkAvailable,
    hcNeedsUpdate,
    stepsGranted,
    ready,
    isSetupComplete,
    profileCompleted,
    go,
    back,
    continueFromSelect,
    openPlayStore,
    recheckInstall,
    launchHealthConnect,
    requestAccess,
    startRecovery,
    openAppSettings,
  };
}
