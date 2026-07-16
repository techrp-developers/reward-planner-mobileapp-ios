/**
 * Step Counter Utilities
 * Helper functions for step counting operations
 */

/**
 * Format step count with thousand separators
 * @param stepCount - The number of steps
 * @returns Formatted step count string
 */
export const formatStepCount = (stepCount: number): string => {
  return stepCount.toLocaleString('en-US');
};

/**
 * Calculate progress percentage
 * @param currentSteps - Current step count
 * @param dailyGoal - Daily step goal (default: 10000)
 * @returns Progress percentage (0-100)
 */
export const calculateProgress = (
  currentSteps: number,
  dailyGoal: number = 10000
): number => {
  const percentage = Math.round((currentSteps / dailyGoal) * 100);
  return Math.min(percentage, 100); // Cap at 100%
};

/**
 * Get motivated message based on step count
 * @param stepCount - Current step count
 * @param dailyGoal - Daily step goal
 * @returns Motivational message
 */
export const getMotivationalMessage = (
  stepCount: number,
  dailyGoal: number = 10000
): string => {
  if (stepCount === 0) {
    return 'Time to get moving! 🚶';
  } else if (stepCount < dailyGoal * 0.25) {
    return 'Great start! Keep it up! 💪';
  } else if (stepCount < dailyGoal * 0.5) {
    return 'Halfway there! You\'re doing great! 🎯';
  } else if (stepCount < dailyGoal * 0.75) {
    return 'Almost there! Just a bit more! 🔥';
  } else if (stepCount < dailyGoal) {
    return 'You\'re so close! Finish strong! 🏁';
  } else {
    return 'Congratulations! Goal reached! 🎉';
  }
};

/**
 * Get today's date range for API queries
 * @returns Object with startTime and endTime in ISO format
 */
export const getTodayDateRange = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();

  return {
    startTime: startOfDay.toISOString(),
    endTime: endOfDay.toISOString(),
  };
};

/**
 * Calculate daily statistics
 * @param stepCount - Total steps
 * @param averageStepsPerMinute - Average steps per minute
 * @returns Object with calculated stats
 */
export const calculateDailyStats = (
  stepCount: number,
  averageStepsPerMinute: number = 1.4
) => {
  // Approximate calculations
  const estimatedMinutesActive = Math.round(stepCount / averageStepsPerMinute);
  const estimatedCalories = Math.round(stepCount * 0.04); // ~0.04 calories per step
  const estimatedDistance = (stepCount * 0.000762).toFixed(2); // ~0.762 meters per step

  return {
    minutesActive: estimatedMinutesActive,
    caloriesBurned: estimatedCalories,
    distanceTraveled: estimatedDistance,
  };
};
