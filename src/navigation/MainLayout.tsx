import React from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useNavigationState, useRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Navbar, { type TopTab } from "../navbar/Navbar";
import BottomTabs from "../bottombar/BottomTabs";
import { TAB_BAR_HEIGHT } from "../bottombar/BottomTabs";
import { useCart } from "../modules/ecommerce/context/CartContext";
import { useServiceCartCount } from "../modules/services/hooks/useServiceCartCount";
import { useAppTheme } from "../theme/ThemeContext";

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

const ThemedSurface = React.memo(function ThemedSurface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  const { theme } = useAppTheme();
  return <View style={[style, { backgroundColor: theme.background }]}>{children}</View>;
});

const MODULE_MODE_BY_ROUTE: Record<keyof ModuleStackParamList, AppMode> = {
  ProductModule: "Product",
  ServicesModule: "Services",
  PaymentsModule: "Payments",
  DineOutModule: "DineOut",
};

const getRequestedMode = (params?: {
  screen?: string;
  moduleName?: string;
}): AppMode | null => {
  if (params?.screen && params.screen in MODULE_MODE_BY_ROUTE) {
    return MODULE_MODE_BY_ROUTE[params.screen as keyof ModuleStackParamList];
  }

  if (["Product", "Services", "Payments", "DineOut"].includes(params?.moduleName ?? "")) {
    return params?.moduleName as AppMode;
  }

  return null;
};

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
  return activeMode !== "DineOut";
};

function MainLayout() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const navigationState = useNavigationState((state) => state);
  const insets = useSafeAreaInsets();
  const moduleNavigationRef = React.useRef<any>(null);

  const routeChain = React.useMemo(
    () => getActiveRouteChain(navigationState as unknown as RouteStateLike),
    [navigationState]
  );

  const routeChainMode = React.useMemo(() => getActiveMode(routeChain), [routeChain]);
  const requestedMode = React.useMemo(
    () => getRequestedMode(route.params),
    [route.params]
  );
  const [activeMode, setActiveMode] = React.useState<AppMode>(
    () => requestedMode ?? routeChainMode
  );

  React.useLayoutEffect(() => {
    if (requestedMode) setActiveMode(requestedMode);
  }, [requestedMode]);

  const moduleScreenListeners = React.useCallback(
    ({
      navigation: moduleNavigation,
      route: moduleRoute,
    }: {
      navigation: any;
      route: { name: keyof ModuleStackParamList };
    }) => {
      moduleNavigationRef.current = moduleNavigation;
      return {
        focus: () => setActiveMode(MODULE_MODE_BY_ROUTE[moduleRoute.name]),
      };
    },
    []
  );

  const handleModuleChange = React.useCallback((tab: TopTab) => {
    const targetByTab: Record<TopTab, keyof ModuleStackParamList> = {
      Product: "ProductModule",
      Services: "ServicesModule",
      Payments: "PaymentsModule",
      DineOut: "DineOutModule",
    };
    const target = targetByTab[tab];

    // Update chrome immediately, then switch the already-mounted child
    // navigator directly instead of round-tripping through AppStack/Home.
    setActiveMode(tab);
    if (moduleNavigationRef.current) {
      moduleNavigationRef.current.navigate(target, { moduleName: tab });
      return;
    }

    navigation.navigate("Home", {
      screen: target,
      params: { moduleName: tab },
      moduleName: tab,
    });
  }, [navigation]);
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
  const serviceCartCount = useServiceCartCount(activeMode === "Services");
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
    if (leafRoute === "OrderHistory") return "History";
    if (leafRoute === "Profile") return "Profile";
    if (leafRoute === "Search" || leafRoute === "SearchScreen" || leafRoute === "ServiceSearch") return "Search";
    if (leafRoute === "TodoList") return "Notes";
    return "Home";
  }, [routeChain]);

  const navigateWithinModule = React.useCallback(
    (moduleRoute: keyof ModuleStackParamList, screen: string) => {
      if (moduleNavigationRef.current) {
        moduleNavigationRef.current.navigate(moduleRoute, { screen });
        return;
      }

      navigation.navigate("Home", {
        screen: moduleRoute,
        params: { screen },
      });
    },
    [navigation],
  );

  const contentBottomSpacing = showBottomTabs ? TAB_BAR_HEIGHT + bottomInset : 0;
  const handleBottomTabPress = React.useCallback(
    (tab: "Home" | "Search" | "Notes" | "Cart" | "History" | "Profile") => {
      if (tab === "History") {
        if (activeMode === "Payments") {
          navigateWithinModule("PaymentsModule", "OrderHistory");
        }
        return;
      }

      if (tab === "Cart") {
        if (activeMode === "Services") {
          navigateWithinModule("ServicesModule", "CartScreen");
        } else if (activeMode === "Product") {
          navigateWithinModule("ProductModule", "Cart");
        } else {
          navigation.navigate("Cart");
        }
        return;
      }

      if (tab === "Profile") {
        if (activeMode === "Services") {
          navigateWithinModule("ServicesModule", "Profile");
        } else if (activeMode === "Payments") {
          navigateWithinModule("PaymentsModule", "Profile");
        } else if (activeMode === "Product") {
          navigateWithinModule("ProductModule", "Profile");
        } else {
          navigation.navigate("Profile");
        }
        return;
      }

      if (activeMode === "Payments") {
        if (tab === "Home") navigateWithinModule("PaymentsModule", "Home");
        if (tab === "Search") navigateWithinModule("PaymentsModule", "Search");
        return;
      }

      if (activeMode === "Services") {
        if (tab === "Home") navigateWithinModule("ServicesModule", "Home");
        if (tab === "Search") navigateWithinModule("ServicesModule", "ServiceSearch");
        return;
      }

      // Product (ecommerce) mode
      if (tab === "Home") {
        navigateWithinModule("ProductModule", "Home");
      }
      if (tab === "Search") {
        navigateWithinModule("ProductModule", "SearchScreen");
      }
      if (tab === "Notes") {
        navigateWithinModule("ProductModule", "TodoList");
      }
    },
    [activeMode, navigateWithinModule, navigation]
  );

  const handleCenterPress = React.useCallback(() => {
    navigation.navigate("Dashboard");
  }, [navigation]);


  return (
    <ThemedSurface style={styles.container}>
      <View style={showNavbar ? styles.navbarSlot : styles.navbarSlotHidden}>
        <Navbar activeModule={activeMode} onModuleChange={handleModuleChange} />
      </View>
      <ThemedSurface style={[styles.content, { paddingBottom: contentBottomSpacing }]}>
        <ModuleStack.Navigator
          initialRouteName="ProductModule"
          screenListeners={moduleScreenListeners}
          screenOptions={{
            headerShown: false,
            animation: "none",
            gestureEnabled: true,
            freezeOnBlur: true,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <ModuleStack.Screen
            name="ProductModule"
            getComponent={() => require("../modules/ecommerce/navigation/HomeStack").default}
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
      </ThemedSurface>
      {showBottomTabs ? (
        <BottomTabs
          activeMode={activeMode}
          activeTabKey={activeTabKey}
          cartCount={cartCount}
          onTabPress={handleBottomTabPress}
          onCenterPress={handleCenterPress}
        />) : null}
    </ThemedSurface>
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
