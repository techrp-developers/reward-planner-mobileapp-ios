// navigation/types.ts
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MainTabParamList } from '../modules/ecommerce/navigation/types';

export type RootStackParamList = {
  SplashScreen: undefined;
  AuthStack: undefined;
  AppStack: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ServiceStack: undefined;
  RewardStack: { moduleName?: string } | undefined;
  ComingSoon: { moduleName?: string } | undefined;
  BottomTabs: undefined;
  ProductModule: { moduleName?: string } | undefined;
  ServicesModule: { moduleName?: string } | undefined;
  PaymentsModule: { moduleName?: string } | undefined;
  DineOutModule: { moduleName?: string } | undefined;
  Checkout: undefined;
  Profile: undefined;
  Orders: undefined;
  Address: undefined;
  WalletHistory: undefined;
  Notification: undefined;
  SearchScreen: undefined;
  BBPSHomeStack: undefined;
  ExploreModule: undefined;
  HelpForm: undefined;
  StepCount: undefined;
  TermsAndConditions: undefined;
  OrderConfirmedScreen: { order_id?: number } | undefined;
};
