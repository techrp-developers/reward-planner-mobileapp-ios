# Step Counter Module - Complete Guide

## Overview

A production-ready React Native Step Counter module that integrates with Android Health Connect to track daily steps in real-time.

## Features

✅ **Health Connect Integration** - Read step data directly from Android Health Connect API
✅ **Runtime Permissions** - Request user permission to read health data
✅ **Real-time Updates** - Fetch and refresh step count on demand
✅ **Auto-load** - Automatically loads steps on screen mount if permission granted
✅ **Error Handling** - Comprehensive error handling and user feedback
✅ **Loading States** - Visual feedback during data fetching
✅ **Formatted Display** - Numbers formatted with thousand separators
✅ **Progress Tracking** - Calculate daily goal progress percentage
✅ **Custom Hook** - Reusable `useStepCounter` hook for easy integration

## Android Setup (Already Configured)

### 1. SDK Versions
- `minSdkVersion`: 26
- `targetSdkVersion`: 34
- `compileSdkVersion`: 34

Located in: `android/build.gradle`

### 2. Permissions
Added to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.health.READ_STEPS"/>

<queries>
    <package android:name="com.google.android.apps.healthdata" />
</queries>
```

### 3. Dependency
Added to `android/app/build.gradle`:
```gradle
implementation "androidx.health.connect:connect-client:1.1.0-alpha06"
```

## Installation

### 1. Install React Native Health Connect
```bash
npm install react-native-health-connect
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

### 2. Link Native Module (if needed)
```bash
npx react-native link react-native-health-connect
```

## Usage

### Option 1: Using Custom Hook (Recommended)

```javascript
import { useStepCounter } from './modules/step_counter';

const MyScreen = () => {
  const {
    steps,
    loading,
    error,
    permissionGranted,
    refreshing,
    requestHealthPermission,
    fetchSteps,
    checkAndFetchSteps,
  } = useStepCounter();

  useEffect(() => {
    checkAndFetchSteps(); // Auto-load on mount
  }, []);

  return (
    <View>
      <Text>{steps} steps</Text>
      <Button 
        title="Connect Health" 
        onPress={requestHealthPermission}
      />
      <Button 
        title="Refresh" 
        onPress={fetchSteps}
      />
    </View>
  );
};
```

### Option 2: Using Complete Screen Component

```javascript
import { StepCounterScreenWithHook } from './modules/step_counter';

const Navigation = () => {
  return (
    <Stack.Screen 
      name="StepCounter" 
      component={StepCounterScreenWithHook}
    />
  );
};
```

### Option 3: Using Utility Functions

```javascript
import {
  formatStepCount,
  calculateProgress,
  getMotivationalMessage,
} from './modules/step_counter';

const steps = 7250;
console.log(formatStepCount(steps)); // "7,250"
console.log(calculateProgress(steps)); // 72
console.log(getMotivationalMessage(steps)); // "Almost there! Just a bit more! 🔥"
```

## API Reference

### `useStepCounter()` Hook

Returns an object with the following properties and methods:

#### Properties
- `steps: number` - Current step count (0 by default)
- `loading: boolean` - Permission request loading state
- `error: string | null` - Error message if operation failed
- `permissionGranted: boolean` - Whether user granted permission
- `refreshing: boolean` - Step fetch loading state

#### Methods
- `requestHealthPermission()` - Request user permission to read steps
- `fetchSteps()` - Fetch today's step count
- `checkAndFetchSteps()` - Check permission and fetch if available

### Utility Functions

#### `formatStepCount(stepCount: number): string`
Formats step count with thousand separators.

#### `calculateProgress(currentSteps: number, dailyGoal?: number): number`
Returns progress percentage (0-100).

#### `getMotivationalMessage(stepCount: number, dailyGoal?: number): string`
Returns emoji-based motivational message.

#### `getTodayDateRange()`
Returns today's date range in ISO format for API queries.

#### `calculateDailyStats(stepCount: number, averageStepsPerMinute?: number)`
Returns estimated activity stats:
- `minutesActive`
- `caloriesBurned`
- `distanceTraveled`

## Component: StepCounterScreen

Complete UI component with all features.

### Props
- `navigation?: any` - React Navigation prop

### Features
- Large circular step display
- Connect Health / Refresh buttons
- Error messaging
- Permission status display
- Daily goal progress tracking
- Progress bar visualization
- Stats card (goal vs progress)

## Component: StepCounterScreenWithHook

Alternative version using the `useStepCounter` hook.

### Improvements
- Cleaner state management
- Reusable hook logic
- Better code organization
- Easier to extend

## Error Handling

The module handles:

1. **Permission Denied**
   - Shows informative message
   - Prompts user to check settings
   
2. **No Data Available**
   - Displays friendly message
   - Suggests connecting health device
   
3. **API Failures**
   - Catches and logs errors
   - Shows retry option
   - Provides fallback UI

## Styling

All components use consistent styling:
- Primary color: `#8665FF`
- Secondary color: `#5B47A3`
- Background: `#F8F8F8`
- Cards: `#FFFFFF`
- Error: `#E11D48`

Fully customizable via StyleSheet.

## File Structure

```
src/modules/step_counter/
├── screens/
│   ├── StepCounterScreen.tsx          # Complete standalone component
│   └── StepCounterScreenWithHook.tsx  # Hook-based version
├── hooks/
│   └── useStepCounter.ts              # Custom hook
├── utils/
│   └── stepCounterUtils.ts            # Utility functions
├── index.ts                           # Module exports
└── README.md                          # This file
```

## Performance Optimization

1. **Memoized Callbacks** - Using `useCallback` to prevent unnecessary renders
2. **Lazy Loading** - Permissions checked on demand
3. **Auto-refresh** - Optional auto-refresh on screen focus
4. **Error States** - Prevents refetching on errors

## Troubleshooting

### "Permission denied" Error
- Ensure Health Connect app is installed on device
- Check AndroidManifest.xml includes permission
- Request permission on app start

### "No step data" Error
- Ensure step count is recorded in Health Connect
- Check date range is correct (today's date)
- Verify Health Connect integration on device

### Build Errors
```bash
# Clean and rebuild
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

### Health Connect Not Found
```bash
# Install Health Connect from Play Store
# Or use emulator with Health Connect support
```

## Future Enhancements

- [ ] Daily history chart
- [ ] Weekly stats
- [ ] Notification support
- [ ] Goal customization
- [ ] Multi-day sync
- [ ] Export health data
- [ ] iOS HealthKit support

## Support

For issues or questions, check:
1. React Native Health Connect docs: https://github.com/kylezehong/react-native-health-connect
2. Health Connect API: https://developer.android.com/training/health-connect

## License

Part of RewardsPlanners application.
