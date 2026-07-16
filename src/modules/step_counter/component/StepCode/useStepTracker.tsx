/**
 * useStepTracker — thin context consumer.
 *
 * All Health Connect logic lives in StepTrackerProvider (mounted once at the
 * app root). This hook simply reads from that shared context so multiple
 * screens always see the same state without triggering duplicate HC reads or
 * API syncs.
 *
 * Place <StepTrackerProvider> in RootNavigator (or App.tsx) above any screen
 * that calls this hook.
 */
export {
  useStepTrackerContext as useStepTracker,
  type StepDataState,
  type StepTrackerContextValue,
} from '../../context/StepTrackerContext';
