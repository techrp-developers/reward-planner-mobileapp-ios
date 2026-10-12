# Before changes

## src/services/iconService.ts
```
import { NativeModules, Platform } from 'react-native';

// These exact alternate asset names must be bundled using XCODE_SETUP.md.
const ICON_NAMES = {
  default: 'Default',
  diwali: 'DiwaliIcon',
  eid: 'EidIcon',
  christmas: 'ChristmasIcon',
  holi: 'HoliIcon',
  independence_day: 'IndependenceDayIcon',
} as const;

export type FestivalIconName = (typeof ICON_NAMES)[keyof typeof ICON_NAMES];

interface AppIconSwitcherModule {
  setIcon(name: string | null): Promise<boolean>;
  getCurrentIcon(): Promise<string>;
  isSupported(): Promise<boolean>;
}

function nativeModule(): AppIconSwitcherModule {
  const module = NativeModules.AppIconSwitcher as AppIconSwitcherModule | undefined;
  if (!module) {
    throw new Error('AppIconSwitcher is missing; add its native files to the iOS target and rebuild.');
  }
  return module;
}

export function resolveIconName(serverKey: string): FestivalIconName {
  return Object.prototype.hasOwnProperty.call(ICON_NAMES, serverKey)
    ? ICON_NAMES[serverKey as keyof typeof ICON_NAMES]
    : 'Default';
}

export const IconService = {
  async isSupported(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await nativeModule().isSupported();
    } catch (error) {
      console.warn('[IconService] Could not check support:', error);
      return false;
    }
  },

  async setIcon(name: FestivalIconName): Promise<boolean> {
    // TODO: Implement Android activity-alias switching in a future native build.
    if (Platform.OS !== 'ios') return false;
    try {
      return await nativeModule().setIcon(name === 'Default' ? null : name);
    } catch (error) {
      console.warn('[IconService] Could not change icon:', error);
      return false;
    }
  },

  async getCurrentIcon(): Promise<string> {
    // TODO: Read the enabled Android activity-alias when Android is implemented.
    if (Platform.OS !== 'ios') return 'Default';
    try {
      return await nativeModule().getCurrentIcon();
    } catch (error) {
      console.warn('[IconService] Could not read icon:', error);
      return 'Default';
    }
  },
};

```
## src/hooks/useFestivalIcon.ts
```
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { IconService, resolveIconName } from '../services/iconService';

// Matches the existing CMS router prefix in cmsContentApi.ts.
const APP_ICON_URL = `${API_BASE_URL}/content/resolved/app-icon?platform=ios`;

export function useFestivalIcon() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let previousState = AppState.currentState;
    let disposed = false;
    let running = false;
    let pending = false;
    const controller = new AbortController();

    const refresh = async () => {
      // Serialize foreground events, including events caused by the OS icon alert.
      pending = true;
      if (running) return;
      running = true;
      try {
        while (pending && !disposed) {
          pending = false;
          try {
            const response = await axios.get(APP_ICON_URL, {
              signal: controller.signal,
              timeout: 10000,
            });
            const payload = response.data;
            if (payload?.success !== true || payload?.data?.platform !== 'ios' ||
                typeof payload?.data?.icon_key !== 'string') {
              throw new Error('Invalid resolved app-icon response');
            }
            if (disposed || AppState.currentState !== 'active') continue;
            const target = resolveIconName(payload.data.icon_key);
            if (!(await IconService.isSupported()) || disposed) continue;
            const current = await IconService.getCurrentIcon();
            if (!disposed && AppState.currentState === 'active' && target !== current) {
              await IconService.setIcon(target);
            }
          } catch (error) {
            if (!disposed) console.warn('[useFestivalIcon] Could not resolve/apply icon:', error);
          }
        }
      } finally {
        running = false;
      }
    };

    void refresh();
    const subscription = AppState.addEventListener('change', nextState => {
      const becameActive = nextState === 'active' &&
        (previousState == null || previousState === 'background' || previousState === 'inactive');
      previousState = nextState;
      if (becameActive) void refresh();
    });

    return () => {
      disposed = true;
      controller.abort();
      subscription.remove();
    };
  }, []);
}

```
## ios/AppIconSwitcher.swift
```
import Foundation
import UIKit
import React

@objc(AppIconSwitcher)
class AppIconSwitcher: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc(setIcon:resolver:rejecter:)
  func setIcon(_ iconName: String?, resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let application = UIApplication.shared
      guard application.supportsAlternateIcons else {
        reject("ICON_UNSUPPORTED", "Alternate app icons are not supported", nil)
        return
      }
      let targetName = (iconName == nil || iconName == "" || iconName == "Default") ? nil : iconName
      guard application.alternateIconName != targetName else {
        resolve(true)
        return
      }
      application.setAlternateIconName(targetName) { error in
        if let error = error {
          reject("ICON_CHANGE_FAILED", error.localizedDescription, error)
        } else {
          resolve(true)
        }
      }
    }
  }

  @objc(getCurrentIcon:rejecter:)
  func getCurrentIcon(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(UIApplication.shared.alternateIconName ?? "Default")
    }
  }

  @objc(isSupported:rejecter:)
  func isSupported(_ resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      resolve(UIApplication.shared.supportsAlternateIcons)
    }
  }
}

```
## ios/AppIconSwitcher.m
```
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppIconSwitcher, NSObject)
RCT_EXTERN_METHOD(setIcon:(NSString * _Nullable)iconName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getCurrentIcon:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(isSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end

```
## App.tsx
```
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AlertProvider, AlertContainer } from './src/modules/ecommerce/components/alerts';
import { CartProvider } from './src/modules/ecommerce/context/CartContext';
import { NavigationContainer, LinkingOptions, NavigatorScreenParams } from "@react-navigation/native";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/query/queryClient';
import { AuthProvider } from './src/modules/common/auth/context/AuthContext';
import { AppThemeProvider } from './src/theme/ThemeContext';
import { flushPendingNavigation, navigationRef } from './src/navigation/navigationRef';
import NetworkGuard from './src/modules/common/noInternet/NetworkGuard';
import { CmsAppShellProvider } from './src/modules/common/cms/CmsAppShellContext';
import { useFestivalIcon } from './src/hooks/useFestivalIcon';

type AuthModalStackParamList = {
  Login: undefined;
  LoginOTP: { identifier: string };
};

type RootStackParamList = {
  SplashScreen: undefined;
  AuthStack: NavigatorScreenParams<AuthModalStackParamList>;
  AppStack: undefined;
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['rewardplanners://', 'rewardapp://'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: 'login',
          LoginOTP: 'login/otp',
        },
      },
    },
  },
};

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
// Catches any rendering exception and logs it to the Metro console so the exact
// component crash is visible even when the native bridge closes quickly.

type EBState = { error: Error | null };

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught:', error.message);
    console.error('[ErrorBoundary] stack:', error.stack);
    console.error('[ErrorBoundary] component stack:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>App crashed during render</Text>
          <Text style={eb.msg}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#DC2626', marginBottom: 12 },
  msg: { fontSize: 13, color: '#374151', textAlign: 'center' },
});

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  useFestivalIcon();
  console.log('[Startup] App() rendering');
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <CmsAppShellProvider>
              <AlertProvider>
                <AuthProvider>
                  <CartProvider>
                    <NavigationContainer
                      linking={linking}
                      ref={navigationRef}
                      onReady={flushPendingNavigation}
                    >
                      <AlertContainer />
                      <NetworkGuard>
                        <RootNavigator />
                      </NetworkGuard>
                    </NavigationContainer>
                  </CartProvider>
                </AuthProvider>
              </AlertProvider>
            </CmsAppShellProvider>
          </QueryClientProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

```
