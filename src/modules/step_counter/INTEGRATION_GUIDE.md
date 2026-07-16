/**
 * Step Counter Integration Guide
 * 
 * Copy and paste these sections into your navigation files
 */

// ============================================
// 1. ADD TO YOUR NAVIGATION TYPES
// ============================================
// File: src/navigation/types.ts

export type RootStackParamList = {
  // ... existing routes
  StepCounter: undefined;
  // ... other routes
};

// ============================================
// 2. ADD TO YOUR NAVIGATOR
// ============================================
// File: src/navigation/RootNavigator.tsx or wherever you define navigation

import { StepCounterScreenWithHook } from '../modules/step_counter';

const RootNavigator = () => {
  return (
    <Stack.Navigator>
      {/* ... existing screens */}
      
      <Stack.Screen 
        name="StepCounter" 
        component={StepCounterScreenWithHook}
        options={{
          headerShown: false, // We have built-in header
          animationEnabled: true,
        }}
      />
      
      {/* ... other screens */}
    </Stack.Navigator>
  );
};

// ============================================
// 3. NAVIGATE TO STEP COUNTER
// ============================================
// From any screen using useNavigation hook:

import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();
  
  const handleNavigateToStepCounter = () => {
    navigation.navigate('StepCounter');
  };
  
  return (
    <Button 
      title="View Step Counter" 
      onPress={handleNavigateToStepCounter}
    />
  );
};

// ============================================
// 4. ADD TO MENU/NAVIGATION BAR
// ============================================
// Example in a menu component:

import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native';

const MenuItem = () => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('StepCounter')}
      style={styles.menuItem}
    >
      <MaterialIcons name="directions-walk" size={24} color="#8665FF" />
      <Text style={styles.menuText}>Steps</Text>
    </TouchableOpacity>
  );
};

// ============================================
// 5. STANDALONE USAGE (If not using navigation)
// ============================================

import { StepCounterScreenWithHook } from './modules/step_counter';

export default StepCounterScreenWithHook;

// ============================================
// 6. INITIALIZE ON APP START (Optional)
// ============================================
// File: App.tsx or root component

import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

useEffect(() => {
  const requestInitialPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          'android.permission.health.READ_STEPS',
          {
            title: 'Health Connect',
            message: 'Allow access to your step count?',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Health permission granted');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };
  
  requestInitialPermissions();
}, []);

// ============================================
// 7. USAGE IN CUSTOM SCREEN
// ============================================

import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { useStepCounter } from './modules/step_counter';

const CustomStepScreen = () => {
  const {
    steps,
    loading,
    error,
    permissionGranted,
    requestHealthPermission,
    fetchSteps,
  } = useStepCounter();

  useEffect(() => {
    // Fetch steps on screen focus
    const unsubscribe = navigation.addListener('focus', () => {
      if (permissionGranted) {
        fetchSteps();
      }
    });

    return unsubscribe;
  }, [permissionGranted]);

  return (
    <View>
      <Text>Steps: {steps}</Text>
      {error && <Text>{error}</Text>}
      <Button 
        title="Connect" 
        onPress={requestHealthPermission}
        disabled={loading}
      />
      <Button 
        title="Refresh" 
        onPress={fetchSteps}
        disabled={loading}
      />
    </View>
  );
};

export default CustomStepScreen;

// ============================================
// 8. BOTTOM TAB NAVIGATOR INTEGRATION
// ============================================
// If using bottom tab navigation:

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StepCounterScreenWithHook } from './modules/step_counter';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StepCounter"
        component={StepCounterScreenWithHook}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="directions-walk" size={24} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ============================================
// TESTING
// ============================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StepCounterScreenWithHook } from './modules/step_counter';

describe('StepCounter', () => {
  it('displays step count', async () => {
    render(<StepCounterScreenWithHook />);
    
    const stepText = screen.getByText(/steps/i);
    expect(stepText).toBeTruthy();
  });

  it('shows connect button when permission not granted', () => {
    render(<StepCounterScreenWithHook />);
    
    const button = screen.getByText(/connect health/i);
    expect(button).toBeTruthy();
  });

  it('handles errors gracefully', async () => {
    const { getByText } = render(<StepCounterScreenWithHook />);
    
    await waitFor(() => {
      const errorText = getByText(/failed|error/i);
      expect(errorText).toBeTruthy();
    });
  });
});

// ============================================
// DONE!
// ============================================
// 
// Your Step Counter is now integrated!
// 
// Key Points:
// 1. Android setup is complete (SDK versions, permissions, dependency)
// 2. Add StepCounter route to your navigation
// 3. Import StepCounterScreenWithHook from './modules/step_counter'
// 4. Test on Android device/emulator with Health Connect app
//
// For more info, see: src/modules/step_counter/README.md
