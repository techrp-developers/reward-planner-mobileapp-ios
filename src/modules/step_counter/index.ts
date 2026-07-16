/**
 * Step Counter Module Exports
 */

// Screens
export { default as StepCounterScreen } from './screens/StepCounterScreen';
export { default as StepCounterScreenWithHook } from './screens/StepCounterScreenWithHook';

// Hooks
export { useStepCounter } from './hooks/useStepCounter';

// Utilities
export {
  formatStepCount,
  calculateProgress,
  getMotivationalMessage,
  getTodayDateRange,
  calculateDailyStats,
} from './utils/stepCounterUtils';
