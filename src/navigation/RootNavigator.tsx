import { useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RESULTS } from "react-native-permissions";

import { useAuth } from "../modules/common/auth/context/AuthContext";
import {
  setupFCM,
  getNotificationPermissionStatus,
  openNotificationSettings,
} from "../modules/notifications/FCMService";
import { checkAppVersion } from "../modules/common/versionupdate/checkAppVersion";
import { AppUpdateModal } from "../modules/common/versionupdate/AppUpdateModal";
import { RewardModal } from "../modules/common/reward/RewardModal";

// import Dashbord from "../modules/dashboard/dashboard";
import { StepTrackerProvider } from "../modules/step_counter/context/StepTrackerContext";

import MainLayout from "./MainLayout";
import SplashScreen from "../modules/common/auth/screens/SplashScreen";
import TermsGateScreen from "../modules/common/auth/screens/TermsGateScreen";
import LoginScreen from "../modules/common/auth/screens/LoginScreen";
import AccountActivate from "../modules/common/auth/screens/AccountActivate";
import OTPScreen from "../modules/common/auth/screens/OTPScreen";
import SetNewPassword from "../modules/common/auth/screens/SetNewPassword";
import AccountActivationSuccess from "../modules/common/auth/screens/AccountActivationSuccess";
import VerifyEmailScreen from "../modules/common/auth/screens/VerifyEmailScreen";
import ForgotPasswordScreen from "../modules/common/auth/screens/ForgotPasswordScreen";
import PasswordUpdatedSuccess from "../modules/common/auth/screens/PasswordUpdatedSuccess";
import type { AuthStackParamList } from "../modules/common/auth/navigation/types";
import Dashbord from "../modules/dashboard/dashboard/dashbord";
export type { AuthStackParamList };

export type AppStackParamList = {
  Dashboard: undefined;
  Home: undefined;
  Checkout: undefined;
  ProductDetails: { productId: number | string };
  Cart: undefined;
  Orders: undefined;
  MyOrder: undefined;
  WishList: undefined;
  PrivacyPolicy: undefined;
  AddressSelect: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  AddAddressMap: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  AddressDetails: undefined | { mode?: 'add' | 'edit'; addressId?: number; manageOnly?: boolean; initialData?: any };
  ChangePassword: undefined;
  Profile: { context?: 'dashboard' } | undefined;
  ServiceStack: undefined;
  RewardStack: undefined;
  BBPSHomeStack: undefined;
  Search: undefined;
  GlobalSearchScreen: undefined;
  TrackOrders: undefined;
  Notification: undefined;
  ServiceSearch: undefined;
  WalletHistory: undefined;
  HelpForm: undefined;
  MyTickets: undefined;
  StepCount: undefined;
  TermsAndConditions: undefined;
  OrderConfirmedScreen: { order_id?: number } | undefined;
  ExploreModule: undefined;
  AIAssistant: undefined;
  TodoList: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
  TermsGate: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const defaultScreenOptions = {
  headerShown: false,
  animation: "slide_from_right" as const,
  gestureEnabled: true,
  freezeOnBlur: true,
};

// ─── Auth Navigator ───────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={defaultScreenOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="AccountActivate" component={AccountActivate} />
      <AuthStack.Screen name="OTPScreen" component={OTPScreen} />
      <AuthStack.Screen name="SetNewPassword" component={SetNewPassword} />
      <AuthStack.Screen name="AccountActivationSuccess" component={AccountActivationSuccess} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="PasswordSuccess" component={PasswordUpdatedSuccess} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </AuthStack.Navigator>
  );
}

// ─── App Navigator ────────────────────────────────────────────────────────────

function AppNavigator() {
  return (
    <StepTrackerProvider>
      <AppStack.Navigator
        screenOptions={{
          ...defaultScreenOptions,
          contentStyle: { backgroundColor: "transparent" },
        }}
      >

        <AppStack.Screen name="Dashboard" component={Dashbord} />
        <AppStack.Screen
          name="Home"
          component={MainLayout}
          options={{ animation: "fade" }}
        />

        <AppStack.Screen
          name="Checkout"
          getComponent={() =>
            require("../modules/ecommerce/components/checkout/OrderStepUI").default
          }
        />
        <AppStack.Screen
          name="ProductDetails"
          getComponent={() =>
            require("../modules/ecommerce/screens/product_description_screen").default
          }
        />
        <AppStack.Screen
          name="Cart"
          getComponent={() =>
            require("../modules/ecommerce/screens/cartScreen").default
          }
        />
        <AppStack.Screen
          name="Orders"
          getComponent={() =>
            require("../modules/ecommerce/components/order/MyOrder").default
          }
        />
        <AppStack.Screen
          name="Profile"
          getComponent={() =>
            require("../modules/dashboard/dashboard/ProfileScreen").default
          }
        />
        <AppStack.Screen
          name="Search"
          getComponent={() =>
            require("../modules/ecommerce/screens/SearchScreen").default
          }
        />
        <AppStack.Screen
          name="ServiceSearch"
          getComponent={() =>
            require("../modules/services/component/screens/ServiceSearchScreen").default
          }
        />
        <AppStack.Screen
          name="WalletHistory"
          getComponent={() =>
            require("../modules/ecommerce/components/home/Wallet_History").default
          }
          options={{
            animation: "fade",
            presentation: "transparentModal",
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <AppStack.Screen
          name="ServiceStack"
          getComponent={() => require("../modules/services/navigation/ServiceHomeStack").default}
        />
        <AppStack.Screen
          name="RewardStack"
          getComponent={() => require("../modules/step_counter/navigation/RewardHomeStack").default}
        />
        <AppStack.Screen
          name="BBPSHomeStack"
          getComponent={() => require("../modules/bbps/navigation/BBPSHomeStack").default}
        />
        <AppStack.Screen
          name="HelpForm"
          getComponent={() =>
            require("../modules/ecommerce/constants/Support/HelpForm").default
          }
        />
        <AppStack.Screen
          name="MyTickets"
          getComponent={() =>
            require("../modules/ecommerce/constants/Support/MyTickets").default
          }
        />
        <AppStack.Screen
          name="TermsAndConditions"
          getComponent={() =>
            require("../modules/ecommerce/profile/TermsandCondition").default
          }
        />
        <AppStack.Screen
          name="OrderConfirmedScreen"
          getComponent={() =>
            require("../modules/ecommerce/screens/OrderConfirmedScreen").default
          }
        />

        <AppStack.Screen
          name="ExploreModule"
          getComponent={() =>
            require("../modules/dashboard/explore/ExploreModule").default
          }
        />

        <AppStack.Screen
          name="AIAssistant"
          getComponent={() =>
            require("../modules/dashboard/aiassist/AIAssistantScreen").default
          }
        />

        <AppStack.Screen
          name="TodoList"
          getComponent={() =>
            require("../modules/ecommerce/profile/TodoList").default
          }
        />
        <AppStack.Screen
          name="MyOrder"
          getComponent={() =>
            require("../modules/ecommerce/components/order/MyOrder").default
          }
        />
        <AppStack.Screen
          name="WishList"
          getComponent={() =>
            require("../modules/ecommerce/screens/WishlistScreen").default
          }
        />
        <AppStack.Screen
          name="PrivacyPolicy"
          getComponent={() =>
            require("../modules/ecommerce/profile/PrivacyPolicy").default
          }
        />
        <AppStack.Screen
          name="AddressSelect"
          getComponent={() =>
            require("../modules/ecommerce/components/ItemCardAddress/AddressSelectScreen").default
          }
        />
        <AppStack.Screen
          name="AddAddressMap"
          getComponent={() =>
            require("../modules/ecommerce/components/ItemCardAddress/AddAddressMapScreen").default
          }
        />
        <AppStack.Screen
          name="AddressDetails"
          getComponent={() =>
            require("../modules/ecommerce/components/ItemCardAddress/NewAddressForm").default
          }
        />
        <AppStack.Screen
          name="ChangePassword"
          getComponent={() =>
            require("../modules/common/auth/screens/ChangePasswordScreen").default
          }
        />
        <AppStack.Screen
          name="GlobalSearchScreen"
          getComponent={() =>
            require("../modules/dashboard/dashboard/GlobalSearchScreen").default
          }
        />
        <AppStack.Screen
          name="TrackOrders"
          getComponent={() =>
            require("../modules/dashboard/globalorder/TrackOrderScreen").default
          }
        />
        <AppStack.Screen
          name="Notification"
          getComponent={() =>
            require("../modules/dashboard/notification/Notification").default
          }
        />


      </AppStack.Navigator>
    </StepTrackerProvider>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
//
//  Routing logic:
//
//  isInitializing = true
//    └─ Splash  (session hydration in progress)
//
//  isAuthenticated = false
//    └─ Auth  (login / register flow)
//
//  isAuthenticated = true, termsAccepted = null
//    └─ Splash  (terms status API call in progress, triggered by login/restore)
//
//  isAuthenticated = true, termsAccepted = false
//    └─ TermsGate  (first-time acceptance; back gesture + hardware back locked)
//
//  isAuthenticated = true, termsAccepted = true
//    └─ App  (normal app flow)

type VersionModalState = {
  visible: boolean;
  forceUpdate: boolean;
  maintenance: boolean;
  updateUrl: string;
};

const MODAL_HIDDEN: VersionModalState = {
  visible: false,
  forceUpdate: false,
  maintenance: false,
  updateUrl: "",
};

export default function RootNavigator() {
  const { isAuthenticated, isInitializing, termsAccepted, firstLoginReward, markFirstLoginRewardShown } = useAuth();
  const [versionModal, setVersionModal] = useState<VersionModalState>(MODAL_HIDDEN);
  const fcmUnsubscribeRef = useRef<(() => void) | null>(null);
  const deniedAlertShownRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      fcmUnsubscribeRef.current = setupFCM();

      if (Platform.OS === 'ios' && !deniedAlertShownRef.current) {
        getNotificationPermissionStatus().then((status) => {
          if (status === RESULTS.DENIED || status === RESULTS.BLOCKED) {
            deniedAlertShownRef.current = true;
            Alert.alert(
              'Notifications Disabled',
              'Turn on notifications to receive order updates, delivery alerts, and reward credits.',
              [
                { text: 'Not Now', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: openNotificationSettings,
                },
              ],
            );
          }
        });
      }
    } else {
      fcmUnsubscribeRef.current?.();
      fcmUnsubscribeRef.current = null;
    }
    return () => {
      fcmUnsubscribeRef.current?.();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;

    const checkVersion = async () => {
      const result = await checkAppVersion();

      if (!mounted || !result.success) return;

      if (result.maintenance || result.updateAvailable) {
        setVersionModal({
          visible: true,
          maintenance: result.maintenance,
          forceUpdate: result.forceUpdate,
          updateUrl: result.updateUrl,
        });
      }
    };

    checkVersion();

    return () => {
      mounted = false;
    };
  }, []);

  // Show Splash while: (a) session is hydrating, OR (b) authenticated but
  // terms status API call hasn't resolved yet (termsAccepted is still null).
  const isCheckingTerms = isAuthenticated && termsAccepted === null;
  const showSplash = isInitializing || isCheckingTerms;

  // Only surface the first-login reward popup once the user has actually
  // reached the authenticated app (past Splash/TermsGate), so it doesn't
  // stack on top of those gates.
  const showRewardModal =
    !showSplash && isAuthenticated && termsAccepted === true && firstLoginReward !== null;

  const navigator = showSplash ? (
    <RootStack.Navigator screenOptions={defaultScreenOptions}>
      <RootStack.Screen name="Splash" component={SplashScreen} />
    </RootStack.Navigator>
  ) : (
    <RootStack.Navigator screenOptions={defaultScreenOptions}>
      {isAuthenticated ? (
        termsAccepted ? (
          // ── Normal app — terms already accepted ─────────────────
          <RootStack.Screen
            name="App"
            component={AppNavigator}
          />
        ) : (
          // ── Terms gate — must accept before entering app ─────────
          // gestureEnabled: false prevents swipe-back.
          // BackHandler in TermsGateScreen prevents hardware back.
          <RootStack.Screen
            name="TermsGate"
            component={TermsGateScreen}
            options={{
              gestureEnabled: false,
              animation: "fade",
            }}
          />
        )
      ) : (
        // ── Auth flow ─────────────────────────────────────────────
        <RootStack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </RootStack.Navigator>
  );

  return (
    <>
      {navigator}
      <AppUpdateModal
        visible={versionModal.visible}
        forceUpdate={versionModal.forceUpdate}
        maintenance={versionModal.maintenance}
        updateUrl={versionModal.updateUrl}
        onLater={() => setVersionModal(MODAL_HIDDEN)}
      />
      <RewardModal
        visible={showRewardModal}
        points={firstLoginReward ?? 0}
        onClose={markFirstLoginRewardShown}
      />
    </>
  );
}
