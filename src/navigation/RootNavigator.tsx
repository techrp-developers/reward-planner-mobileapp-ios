import { useChatSocketSession } from "../modules/chat/hooks/useChatSocketSession";
import { useEffect, useRef, useState } from "react";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { ChatStackParamList } from "../modules/chat/types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../modules/common/auth/context/AuthContext";
import { useAppLanguage } from "../i18n/LanguageContext";
import LanguageSelectScreen from "../modules/common/language/LanguageSelectScreen";
import {
  markPushPermissionOffered,
  requestPushPermission,
  setupFCM,
  shouldOfferPushPermission,
} from "../modules/notifications/FCMService";
import NotificationPermissionSheet from "../modules/notifications/NotificationPermissionSheet";
import {
  LaunchPresentationProvider,
  LaunchScreen,
  employeeScope,
  useLaunchPresentation,
} from "../modules/common/cms/splash/launchPresentation";
import { splashLog } from "../modules/common/cms/splash/splashDiagnostics";
import { AppUpdateModal } from "../modules/common/versionupdate/AppUpdateModal";
import { OtaUpdatePrompt } from "../modules/common/versionupdate/OtaUpdatePrompt";
import { useUpdateGates } from "../modules/common/versionupdate/useUpdateGates";
import { RewardModal } from "../modules/common/reward/RewardModal";

// import Dashbord from "../modules/dashboard/dashboard";
import { StepTrackerProvider } from "../modules/step_counter/context/StepTrackerContext";

import MainLayout from "./MainLayout";
import TermsGateScreen from "../modules/common/auth/screens/TermsGateScreen";
import LoginScreen from "../modules/common/auth/screens/LoginScreen";
import OTPScreen from "../modules/common/auth/screens/OTPScreen";
import type { HomeStackParamList } from "../modules/ecommerce/navigation/types";
import type { AuthStackParamList } from "../modules/common/auth/navigation/types";
import Dashbord from "../modules/dashboard/dashboard/dashbord";
export type { AuthStackParamList };

export type AppStackParamList = {
  Dashboard: undefined;
  Home: undefined;
  Checkout: HomeStackParamList["OrderStepUI"] | undefined;
  ProductDetails: HomeStackParamList["ProductDescription"];
  Cart: undefined;
  Orders: undefined;
  MyOrder: undefined;
  WishList: undefined;
  PrivacyPolicy: undefined;
  AddressSelect: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  AddAddressMap: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  AddressDetails: undefined | { mode?: 'add' | 'edit'; addressId?: number; manageOnly?: boolean; initialData?: any };
  Profile: { context?: 'dashboard' } | undefined;
  ServiceStack: undefined;
  InssuranceStack: undefined;
  RewardStack: undefined;
  BBPSHomeStack: undefined;
  Search: undefined;
  GlobalSearchScreen: undefined;
  TrackOrders: undefined;
  Notification: undefined;
  NotificationSettings: undefined;
  ServiceSearch: undefined;
  WalletHistory: undefined;
  HelpForm: { context?: 'dashboard' | 'ecommerce' | 'services' | 'bbps' | 'step_counter' } | undefined;
  MyTickets: undefined;
  StepCount: undefined;
  TermsAndConditions: undefined;
  OrderConfirmedScreen: { order_id?: number } | undefined;
  ExploreModule: undefined;
  AIAssistant: undefined;
  TodoList: undefined;
  Quiz: undefined;
  ChatStack: NavigatorScreenParams<ChatStackParamList> | undefined;
  LanguageSettings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  App: undefined;
  TermsGate: undefined;
  LanguageSelect: undefined;
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
      <AuthStack.Screen name="LoginOTP" component={OTPScreen} />
    </AuthStack.Navigator>
  );
}

// ─── App Navigator ────────────────────────────────────────────────────────────

function AppNavigator() {
  useChatSocketSession();
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
          name="ChatStack"
          getComponent={() => require("../modules/chat/navigation/ChatStack").default}
        />
        <AppStack.Screen
          name="LanguageSettings"
          getComponent={() => require("../modules/common/language/LanguageSettingsScreen").default}
        />
        <AppStack.Screen
          name="Quiz"
          getComponent={() => require("../modules/games/screens/QuizScreen").default}
        />
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
            require("../modules/ecommerce/profile/ProfileScreen").default
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
          initialParams={{ context: "dashboard" }}
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
          name="InssuranceStack"
          getComponent={() =>
            require("../modules/inssurance/navigation/InssuranceStack").default
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
          name="NotificationSettings"
          getComponent={() =>
            require("../modules/dashboard/notification/NotificationSettings").default
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

export default function RootNavigator() {
  const { user, isAuthenticated, isInitializing, termsAccepted, firstLoginReward, markFirstLoginRewardShown } = useAuth();
  const { status: languageStatus } = useAppLanguage();
  const { storeUpdate, onStoreUpdateLater, otaPrompt, onOtaUpdate, onOtaLater } = useUpdateGates();
  const fcmUnsubscribeRef = useRef<(() => void) | null>(null);
  const [showPushPermission, setShowPushPermission] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fcmUnsubscribeRef.current = setupFCM();
    } else {
      fcmUnsubscribeRef.current?.();
      fcmUnsubscribeRef.current = null;
    }
    return () => {
      fcmUnsubscribeRef.current?.();
    };
  }, [isAuthenticated]);

  // Show Splash while: (a) session is hydrating, OR (b) authenticated but
  // terms status API call hasn't resolved yet (termsAccepted is still null).
  const isCheckingTerms = isAuthenticated && termsAccepted === null;
  // The signed-in user's saved language is read from local storage before
  // any app screen renders, so screens never flash in the wrong language.
  const isLoadingLanguage = isAuthenticated && (languageStatus === "loading" || languageStatus === "signed-out");
  const showSplash = isInitializing || isCheckingTerms || isLoadingLanguage;
  const needsLanguage = isAuthenticated && languageStatus === "needs-selection";

  // The CMS launch campaign renders on the same Splash route as the logo and
  // replaces it, so the app opens straight after the artwork. It may hold the
  // Splash route only when the next screen is the app itself; login, language,
  // terms and update prompts are never delayed, and showSplash is unchanged.
  const promoScope = employeeScope(isAuthenticated, user);
  const launch = useLaunchPresentation({
    scope: promoScope,
    startupDone: !showSplash,
    eligible: isAuthenticated && !needsLanguage && termsAccepted === true &&
      !storeUpdate.visible && !otaPrompt.visible,
  });
  const showLaunch = showSplash || launch.holding;
  const appOpen = !showLaunch && isAuthenticated && !needsLanguage && termsAccepted === true;
  useEffect(() => {
    if (appOpen) splashLog("MAIN_APP_OPENED", { phase: launch.phase });
    // Logged when the app screen appears, not on every phase change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appOpen]);

  // Only surface the first-login reward popup once the user has actually
  // reached the authenticated app (past Splash/TermsGate), so it doesn't
  // stack on top of those gates.
  const showRewardModal =
    !showLaunch && !needsLanguage && isAuthenticated && termsAccepted === true && firstLoginReward !== null;

  // Ask once, on the app itself, and never over another prompt. A user who said
  // no can change their mind from Notification settings.
  const canOfferPushPermission =
    !showLaunch && !needsLanguage && isAuthenticated && termsAccepted === true &&
    !showRewardModal && !storeUpdate.visible && !otaPrompt.visible;
  useEffect(() => {
    if (!canOfferPushPermission) return;
    let active = true;
    shouldOfferPushPermission().then((offer) => {
      if (active && offer) setShowPushPermission(true);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [canOfferPushPermission]);

  // Auth state changes replace whole stacks. Do not animate or freeze an
  // outgoing auth screen while Fabric removes its nested views.
  const navigator = (
    <RootStack.Navigator
      screenOptions={{ ...defaultScreenOptions, animation: "none", freezeOnBlur: false }}
    >
      {showLaunch ? (
        <RootStack.Screen name="Splash" component={LaunchScreen} />
      ) : !isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : needsLanguage ? (
        <RootStack.Screen
          name="LanguageSelect"
          component={LanguageSelectScreen}
          options={{ gestureEnabled: false }}
        />
      ) : termsAccepted ? (
        <RootStack.Screen name="App" component={AppNavigator} />
      ) : (
        <RootStack.Screen
          name="TermsGate"
          component={TermsGateScreen}
          options={{ gestureEnabled: false }}
        />
      )}
    </RootStack.Navigator>
  );

  return (
    <>
      <LaunchPresentationProvider value={launch}>{navigator}</LaunchPresentationProvider>
      <AppUpdateModal
        visible={storeUpdate.visible}
        forceUpdate={storeUpdate.forceUpdate}
        maintenance={storeUpdate.maintenance}
        updateUrl={storeUpdate.updateUrl}
        onLater={onStoreUpdateLater}
      />
      <OtaUpdatePrompt
        visible={otaPrompt.visible}
        releaseNotes={otaPrompt.releaseNotes}
        onUpdate={onOtaUpdate}
        onLater={onOtaLater}
      />
      <RewardModal
        visible={showRewardModal}
        points={firstLoginReward ?? 0}
        onClose={markFirstLoginRewardShown}
      />
      <NotificationPermissionSheet
        visible={showPushPermission}
        onEnable={() => {
          setShowPushPermission(false);
          requestPushPermission().catch(() => {});
        }}
        onNotNow={() => {
          setShowPushPermission(false);
          markPushPermissionOffered().catch(() => {});
        }}
      />
    </>
  );
}
