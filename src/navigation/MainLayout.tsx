import React from "react";
import { View, StyleSheet } from "react-native";
import {  useNavigation, useNavigationState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Navbar from "../navbar/Navbar";
import BottomTabs from "../bottombar/BottomTabs";
import { TAB_BAR_HEIGHT } from "../bottombar/BottomTabs";
import { useCart } from "../modules/ecommerce/context/CartContext";
import { useServiceCartCount } from "../modules/services/hooks/useServiceCartCount";

export type ModuleStackParamList = {
  ProductModule: { moduleName?: string } | undefined;
  ServicesModule: { moduleName?: string } | undefined;
  PaymentsModule: { moduleName?: string } | undefined;
  DineOutModule: { moduleName?: string } | undefined;
};

const ModuleStack = createNativeStackNavigator<ModuleStackParamList>();

type RouteStateLike = {
  index: number;
  routes: Array<{
    name: string;
    state?: RouteStateLike;
  }>;
};

type AppMode = "Product" | "Services" | "Payments" | "DineOut";

const getActiveRouteChain = (state?: RouteStateLike): string[] => {
  if (!state?.routes?.length) return [];

  const focused = state.routes[state.index] ?? state.routes[0];
  const currentName = focused?.name ? [focused.name] : [];

  if (!focused?.state) return currentName;
  return [...currentName, ...getActiveRouteChain(focused.state)];
};

const shouldShowNavbar = (routeChain: string[]): boolean => {
  if (routeChain.length === 0) return true;

  const moduleRoute = routeChain.find((routeName) =>
    ["ProductModule", "ServicesModule", "PaymentsModule", "DineOutModule"].includes(routeName)
  );

  if (!moduleRoute) {
    return routeChain[0] === "Home";
  }

  const leafRoute = routeChain[routeChain.length - 1];

  if (moduleRoute === "ProductModule") {
    return ["ProductModule", "HomeTab", "Home", "Notes"].includes(leafRoute);
  }

  if (moduleRoute === "ServicesModule") {
    return ["ServicesModule", "Home"].includes(leafRoute);
  }

  if (moduleRoute === "PaymentsModule") {
    return ["PaymentsModule", "Home"].includes(leafRoute);
  }

  if (moduleRoute === "DineOutModule") {
    return ["DineOutModule"].includes(leafRoute);
  }

  return false;
};

const getActiveMode = (routeChain: string[]): AppMode => {
  if (routeChain.includes("ServicesModule")) return "Services";
  if (routeChain.includes("PaymentsModule")) return "Payments";
  if (routeChain.includes("DineOutModule")) return "DineOut";
  return "Product";
};

const shouldShowBottomTabs = (activeMode: AppMode): boolean => {
  return activeMode === "Services" || activeMode === "Payments";
};

function MainLayout() {
  const navigation = useNavigation<any>();
  const navigationState = useNavigationState((state) => state);
  const insets = useSafeAreaInsets();

  const routeChain = React.useMemo(
    () => getActiveRouteChain(navigationState as unknown as RouteStateLike),
    [navigationState]
  );

  const activeMode = React.useMemo(() => getActiveMode(routeChain), [routeChain]);
  const showNavbar = React.useMemo(() => shouldShowNavbar(routeChain), [routeChain]);
  const showBottomTabs = React.useMemo(
    () => shouldShowBottomTabs(activeMode),
    [activeMode]
  );
  const bottomInset = Math.max(insets.bottom, 8);

  // Each module owns its own cart count — add a new entry here (and its
  // hook call above) when a future module (e.g. Health) gets its own cart.
  // Hooks are called unconditionally so this stays rules-of-hooks safe.
  const { totalQuantity: ecommerceCartCount } = useCart();
  const serviceCartCount = useServiceCartCount();
  const moduleCartCounts: Record<AppMode, number> = {
    Product: ecommerceCartCount,
    Services: serviceCartCount,
    Payments: 0,
    DineOut: 0,
  };
  const cartCount = moduleCartCounts[activeMode];

  const activeTabKey = React.useMemo(() => {
    const leafRoute = routeChain[routeChain.length - 1];
    if (leafRoute === "Cart") return "Cart";
    if (leafRoute === "Profile") return "Profile";
    if (leafRoute === "Search" || leafRoute === "ServiceSearch") return "Search";
    return "Home";
  }, [routeChain]);

  const contentBottomSpacing = showBottomTabs ? TAB_BAR_HEIGHT + bottomInset : 0;
  const handleBottomTabPress = React.useCallback(
    (tab: "Home" | "Search" | "Notes" | "Cart" | "Profile" | "History") => {
      if (tab === "Cart") {
        if (activeMode === "Services") {
          navigation.navigate("ServicesModule", { screen: "CartScreen" });
        } else {
          navigation.navigate("Cart");
        }
        return;
      }

      if (tab === "Profile") {
        if (activeMode === "Services") {
          navigation.navigate("ServicesModule", { screen: "Profile" });
        } else {
          navigation.navigate("Profile");
        }
        return;
      }

      if (tab === "History") {
        if (activeMode === "Payments") {
          (navigation as any).navigate("Home", { screen: "PaymentsModule", params: { screen: "OrderHistory" } });
        } else if (activeMode === "Services") {
          navigation.navigate("ServicesModule", { screen: "MyOrder" });
        } else {
          navigation.navigate("MyOrder");
        }
        return;
      }

      if (activeMode === "Payments") {
        if (tab === "Home") (navigation as any).navigate("Home", { screen: "PaymentsModule", params: { screen: "Home" } });
        if (tab === "Search") (navigation as any).navigate("Home", { screen: "PaymentsModule", params: { screen: "Search" } });
        return;
      }

      if (activeMode === "Services") {
        if (tab === "Home") navigation.navigate("ServicesModule", { screen: "Home" });
        if (tab === "Search") navigation.navigate("ServicesModule", { screen: "ServiceSearch" });
        return;
      }

      // Product (ecommerce) mode
      if (tab === "Home") navigation.navigate("Home");
      if (tab === "Search") navigation.navigate("Search");
    },
    [activeMode, navigation]
  );

  const handleCenterPress = React.useCallback(() => {
    navigation.navigate("Dashboard");
  }, [navigation]);


  return (
    <View style={styles.container}>
      <View style={showNavbar ? styles.navbarSlot : styles.navbarSlotHidden}>
        <Navbar />
      </View>
      <View style={[styles.content, { paddingBottom: contentBottomSpacing }]}>
        <ModuleStack.Navigator
          initialRouteName="ProductModule"
          screenOptions={{
            headerShown: false,
            animation: "fade",
            gestureEnabled: true,
          }}
        >
          <ModuleStack.Screen
            name="ProductModule"
            getComponent={() => require("../bottombar/MainTabs").default}
            initialParams={{ moduleName: "Product" }}
          />
          <ModuleStack.Screen
            name="ServicesModule"
            getComponent={() => require("../modules/services/navigation/ServiceHomeStack").default}
            initialParams={{ moduleName: "Services" }}
          />
          <ModuleStack.Screen
            name="PaymentsModule"
            getComponent={() => require("../modules/bbps/navigation/BBPSHomeStack").default}
            initialParams={{ moduleName: "Payments" }}
          />
          <ModuleStack.Screen
            name="DineOutModule"
            getComponent={() => require("../modules/ecommerce/constants/ComingSoon").default}
            initialParams={{ moduleName: "DineOut" }}
          />
        </ModuleStack.Navigator>
      </View>
      {showBottomTabs ? (
        <BottomTabs
          activeMode={activeMode}
          activeTabKey={activeTabKey}
          cartCount={cartCount}
          onTabPress={handleBottomTabPress}
          onCenterPress={handleCenterPress}
        />) : null}
    </View>
  );
}

export default React.memo(MainLayout);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbarSlot: {
    display: "flex",
  },
  navbarSlotHidden: {
    display: "none",
  },
  content: {
    flex: 1,
  },
});
