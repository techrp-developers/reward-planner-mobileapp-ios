/**
 * Step Counter TypeScript Types
 */

/**
 * Health Record from React Native Health Connect
 */
export interface HealthRecord {
  uuid: string;
  recordType: string;
  count?: number;
  startTime?: string;
  endTime?: string;
  metadata?: Record<string, any>;
}

/**
 * Health Connect Read Result
 */
export interface HealthReadResult {
  records: HealthRecord[];
  pageToken?: string;
}

/**
 * Time range filter for queries
 */
export interface TimeRangeFilter {
  operator: 'between' | 'after' | 'before';
  startTime?: string;
  endTime?: string;
}

/**
 * Health Connect Request Options
 */
export interface HealthReadOptions {
  timeRangeFilter?: TimeRangeFilter;
  pageToken?: string;
  pageSize?: number;
  ascendingOrder?: boolean;
}

/**
 * Permission request object
 */
export interface HealthPermission {
  accessType: 'read' | 'write';
  recordType: string;
}

/**
 * Hook return type for useStepCounter
 */
export interface UseStepCounterReturn {
  steps: number;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  refreshing: boolean;
  requestHealthPermission: () => Promise<void>;
  fetchSteps: () => Promise<void>;
  checkAndFetchSteps: () => Promise<void>;
}

/**
 * Step Counter Screen Props
 */
export interface StepCounterScreenProps {
  navigation?: any;
}

/**
 * Daily Statistics
 */
export interface DailyStats {
  minutesActive: number;
  caloriesBurned: number;
  distanceTraveled: string;
}

/**
 * Step Counter Context (for state management if needed)
 */
export interface StepCounterContextType {
  steps: number;
  loading: boolean;
  permissionGranted: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  fetchSteps: () => Promise<void>;
}

/**
 * Today's date range
 */
export interface DateRange {
  startTime: string;
  endTime: string;
}

/**
 * App config for step counter
 */
export interface StepCounterConfig {
  dailyGoal: number;
  autoFetchEnabled: boolean;
  refreshInterval: number; // in milliseconds
  enableNotifications: boolean;
  averageStepsPerMinute: number;
}
