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

type AuthModalStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  OTPScreen: { email: string };
  SetNewPassword: { email: string };
  AccountActivationSuccess: undefined;
  VerifyEmail: { email: string };
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
          AccountActivate: 'activate',
          OTPScreen: 'otp',
          SetNewPassword: 'set-password',
          AccountActivationSuccess: 'activation-success',
          VerifyEmail: 'verify-email',
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
  console.log('[Startup] App() rendering');
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AlertProvider>
              <AuthProvider>
                <CartProvider>
                  <NavigationContainer linking={linking}>
                    <AlertContainer />
                    <RootNavigator />
                  </NavigationContainer>
                </CartProvider>
              </AuthProvider>
            </AlertProvider>
          </QueryClientProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
