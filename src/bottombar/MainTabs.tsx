// src/modules/ecommerce/navigation/MainTabs.tsx
import React from "react";
import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import HomeStack from "../modules/ecommerce/navigation/HomeStack";
import type { MainTabParamList } from "../modules/ecommerce/navigation/types";
import BottomTabs from "./BottomTabs";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import { useCart } from "../modules/ecommerce/context/CartContext";

const Tab = createBottomTabNavigator<MainTabParamList>();

type CustomTabBarProps = {
  navigation: any;
  state: any;
  isAuthenticated: boolean;
};

const getFocusedRouteName = (state: any): string | undefined => {
  if (!state?.routes?.length) return undefined;

  const route = state.routes[state.index ?? 0];
  return getFocusedRouteName(route?.state) ?? route?.name;
};

function CustomTabBar({ navigation, state, isAuthenticated }: CustomTabBarProps) {
  const { totalQuantity } = useCart();
  const focusedRouteName = getFocusedRouteName(state);
  const activeTabKey = React.useMemo(() => {
    if (focusedRouteName === 'Profile') return 'Profile';
    if (focusedRouteName === 'Cart') return 'Cart';
    if (focusedRouteName === 'SearchScreen') return 'Search';
    if (focusedRouteName === 'TodoList') return 'Notes';
    return 'Home';
  }, [focusedRouteName]);

  const goTo = React.useCallback(
    (screen: string) => {
      navigation.navigate("HomeTab", { screen });
    },
    [navigation]
  );

  const handleCenterPress = React.useCallback(() => {
    const moduleStackNav = navigation.getParent?.();
    const appNav = moduleStackNav?.getParent?.();

    if (appNav?.navigate) {
      appNav.navigate("Dashboard");
      return;
    }

    navigation.navigate("HomeTab", { screen: "Home" });
  }, [navigation]);

  return (
    <BottomTabs
      layoutMode="navigator"
      activeTabKey={activeTabKey}
      cartCount={totalQuantity}
      onTabPress={(tab) => {
        switch (tab) {
          case "Home":
            goTo("Home");
            break;

          case "Search":
            goTo("SearchScreen");
            break;

          case "Cart":
            goTo("Cart");
            break;

          case "Notes":
            goTo("TodoList");
            break;

          case "Profile":
            if (isAuthenticated) {
              goTo("Profile");
            } else {
              // Fallback path (normally unreachable because app is auth-first).
              navigation.getParent?.()?.getParent?.()?.navigate("AuthStack", {
                screen: "Login",
              });
            }
            break;
        }
      }}
      onCenterPress={handleCenterPress}
    />
  );
}

export default function MainTabs() {
  const { isAuthenticated } = useAuth();

  const renderTabBar = React.useCallback(
    (props: any) => (
      <CustomTabBar
        {...props}
        isAuthenticated={isAuthenticated}
      />
    ),
    [isAuthenticated]
  );

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{ headerShown: false }}
      tabBar={renderTabBar}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
    </Tab.Navigator>
  );
}
