/**
 * Step Counter Module Exports
 */

// Current screens / hooks
export { default as StepsTrackerScreen } from './component/StepCode/StepsTrackerScreen';
export { useStepTracker } from './component/StepCode/useStepTracker';

// Utilities
export {
  formatStepCount,
  calculateProgress,
  getMotivationalMessage,
  getTodayDateRange,
  calculateDailyStats,
} from './utils/stepCounterUtils';
