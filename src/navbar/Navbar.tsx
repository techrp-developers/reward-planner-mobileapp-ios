import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  useNavigation,
  useRoute,
  useNavigationState,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchUserInfo, getStoredUserName } from "../modules/common/auth/api/AuthAPI";
import { fetchAllAddress } from "../modules/ecommerce/api/AddressApi";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import { handleNavigateWithPrefetch } from "../modules/ecommerce/navigation/navigationPerformance";

import ProductTop from "./assete/Product_BG.jpg";
import ServiceTop from "./assete/Service_BG.png";
import PaymentTop from "./assete/Payment_BG.png";

import WalletSvg from "../assets/homepage/navwallet.svg";
import Home_Nav from "../assets/menu/Home_Nav.svg";
import Services from "../assets/menu/Services.svg";
import Payments from "../assets/menu/Payments.svg";
import Dine_Out from "../assets/menu/Dine_Out.svg";
import Reward from "../assets/product/rewards.svg";

import type { RootStackParamList } from "@/navigation/types";

// --- Types & Constants ---
type TopTab = "Product" | "Services" | "Payments" | "DineOut";

type ApiAddress = {
  address_type?: string;
  is_default?: number;
  address1?: string;
  address2?: string | null;
  city?: string;
  state?: string;
  zipcode?: string;
};

type SvgIcon = React.ComponentType<{
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  color?: string;
}>;

type NavStateLike = {
  index: number;
  routes: Array<{
    name: string;
    state?: NavStateLike;
    params?: { moduleName?: string; screen?: string };
  }>;
};

type NavbarUserSnapshot = {
  displayName: string;
  displayAddress: string;
  rewardPoints: number;
  ts: number;
};

const NAVBAR_USER_TTL_MS = 60_000;
let navbarUserCache: NavbarUserSnapshot | null = null;
let navbarUserInFlight: Promise<NavbarUserSnapshot> | null = null;

const PRODUCT_ROUTES = new Set(["Home", "Explore", "ProductScreen", "Cart"]);
const PRODUCT_MODULE_ROUTES = new Set(["ProductModule"]);

const SERVICE_ROUTES = new Set([
  "ServiceStack",
  "ServicesModule",
  "ServicesHome",
  "Government_Document_Screen",
  "PackScreen",
  "PackEnquiryForm",
  "BundleEnquiryForm",
  "SubmittedSuccessful",
]);

const PAYMENT_ROUTES = new Set([
  "BBPSHomeStack",
  "PaymentsModule",
  "BBPSHome",
  "BBPSCategory",
  "BBPSBillers",
]);

const BG_MAP: Record<TopTab, any> = {
  Product: ProductTop,
  Services: ServiceTop,
  Payments: PaymentTop,
  DineOut: ProductTop,
};

const TAB_THEME: Record<TopTab, { bgColor: string }> = {
  Product: { bgColor: "#5F341A" },
  Services: { bgColor: "#4F6BFF" },
  Payments: { bgColor: "#7C3AED" }, // looks closer to your screenshot (purple)
  DineOut: { bgColor: "#DC2626" },
};

const TOP_TABS: TopTab[] = ["Product", "Services", "Payments", "DineOut"];

const isTopTab = (value?: string): value is TopTab => {
  if (!value) return false;
  return TOP_TABS.includes(value as TopTab);
};

// --- Helpers ---

/**
 * Detects which module (ProductModule, ServicesModule, PaymentsModule, DineOutModule)
 * is currently active in the ModuleStack by traversing the navigation state.
 * Most reliable source for activeTab since it's independent of nested route names.
 */
const getActiveModuleFromState = (state?: NavStateLike): TopTab | null => {
  if (!state?.routes?.length) return null;

  let currentState = state;
  while (currentState?.routes?.length) {
    const focused = currentState.routes[currentState.index] ?? currentState.routes[0];

    if (focused?.name === "ProductModule") return "Product";
    if (focused?.name === "ServicesModule") return "Services";
    if (focused?.name === "PaymentsModule") return "Payments";
    if (focused?.name === "DineOutModule") return "DineOut";
    if (focused?.name === "Dashboard") return "Product";

    // When navigate('Home', { screen: 'ServicesModule' }) fires, Home.state may be
    // undefined for the first render tick before ModuleStack processes the nested params.
    // Check params.screen as an immediate signal so the correct tab highlights without flash.
    const paramsScreen = focused?.params?.screen as string | undefined;
    if (paramsScreen === "ProductModule") return "Product";
    if (paramsScreen === "ServicesModule") return "Services";
    if (paramsScreen === "PaymentsModule") return "Payments";
    if (paramsScreen === "DineOutModule") return "DineOut";

    if (focused?.state) {
      currentState = focused.state;
    } else {
      break;
    }
  }

  return null;
};

const getDeepestFocusedRoute = (
  state?: NavStateLike
): { routeName: string; moduleName?: string } => {
  if (!state?.routes?.length) return { routeName: "Home" };
  const focused = state.routes[state.index] ?? state.routes[0];
  if (focused?.state) return getDeepestFocusedRoute(focused.state);
  return {
    routeName: focused?.name ?? "Home",
    moduleName: focused?.params?.moduleName,
  };
};

const getActiveTab = (
  routeName: string,
  moduleName?: string,
  moduleFromState?: TopTab | null
): TopTab => {
  // Priority 1: Module detected from navigation state (most reliable)
  // This correctly identifies the active module even for ambiguous route names like "Home"
  if (moduleFromState) return moduleFromState;

  // Priority 2: moduleName param (for explicit routing)
  if (isTopTab(moduleName)) return moduleName;

  // Priority 3: routeName-based detection (fallback for edge cases)
  if (PRODUCT_ROUTES.has(routeName) || PRODUCT_MODULE_ROUTES.has(routeName)) return "Product";
  if (SERVICE_ROUTES.has(routeName)) return "Services";
  if (PAYMENT_ROUTES.has(routeName)) return "Payments";
  if (routeName === "DineOutModule") return "DineOut";

  return "Product";
};

// --- Sub-component (✅ tints SVG icon + label properly) ---
const TopIconWithLabel = React.memo(
  ({
    active,
    onPress,
    Icon,
    label,
    activeColor,
  }: {
    active: boolean;
    onPress: () => void;
    Icon: SvgIcon;
    label: string;
    activeColor: string;
  }) => {
    const tint = active ? "#FFFFFF" : "#374151";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          styles.topTabCard,
          active && styles.topTabCardActive,
          active && { backgroundColor: activeColor },
        ]}
      >
        {/* NOTE: depending on how your SVG is exported, it may use fill/stroke or color.
            We pass all 3 so it works in most cases. */}
        <Icon width={28} height={28} fill={tint} stroke={tint} color={tint} />

        <Text style={[styles.topTabLabel, { color: tint }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
);

export default function Navbar() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [rewardPoints, setRewardPoints] = React.useState(0);
  const rewardPointsLabel = React.useMemo(() => {
    const points = Number(rewardPoints || 0);
    if (points >= 100000) return `${Math.floor(points / 1000)}k`;
    if (points >= 10000) return `${(points / 1000).toFixed(1)}k`;
    return points.toLocaleString("en-IN");
  }, [rewardPoints]);
  // ✅ Get full navigation state once and derive both deepest route and active module
  const navigationState = useNavigationState((state) => state);

  const { deepestRoute, activeModuleTab } = React.useMemo(() => {
    return {
      deepestRoute: getDeepestFocusedRoute(navigationState as unknown as NavStateLike),
      activeModuleTab: getActiveModuleFromState(navigationState as unknown as NavStateLike),
    };
  }, [navigationState]);

  // Depend only on primitive moduleName, not route.params object
  const routeModuleName = route?.params?.moduleName;
  const moduleName = routeModuleName ?? deepestRoute.moduleName;

  const activeTab = React.useMemo<TopTab>(
    () =>
      getActiveTab(deepestRoute.routeName || route.name, moduleName, activeModuleTab),
    [deepestRoute.routeName, route.name, moduleName, activeModuleTab]
  );
  const showLocation = activeTab === "Product";

  const bgSource = React.useMemo(() => BG_MAP[activeTab], [activeTab]);
  const activeThemeColor = React.useMemo(
    () => TAB_THEME[activeTab]?.bgColor ?? TAB_THEME.Product.bgColor,
    [activeTab]
  );
  const isNavigatingRef = React.useRef(false);

  // Cross-fade the background instead of remounting the Image on every tab
  // switch — remounting could briefly leave the previous module's background
  // visible underneath while the content below had already switched, and
  // felt like a hard cut rather than a smooth transition.
  const [prevBgSource, setPrevBgSource] = React.useState(bgSource);
  const bgFade = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (bgSource === prevBgSource) return;
    bgFade.setValue(0);
    Animated.timing(bgFade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setPrevBgSource(bgSource);
    });
  }, [bgSource, prevBgSource, bgFade]);

  const [displayName, setDisplayName] = React.useState("User");
  const [displayAddress, setDisplayAddress] =
    React.useState("Address not set");
  const hasAddress = String(displayAddress || "").trim() !== "Address not set";

  const applyUserSnapshot = React.useCallback((snapshot: NavbarUserSnapshot) => {
    setDisplayName((prev) => (prev === snapshot.displayName ? prev : snapshot.displayName));
    setDisplayAddress((prev) =>
      prev === snapshot.displayAddress ? prev : snapshot.displayAddress
    );
    setRewardPoints((prev) =>
      prev === snapshot.rewardPoints ? prev : snapshot.rewardPoints
    );
  }, []);

  const navigateToScreen = React.useCallback(
    (screen: string, params?: any) => {
      handleNavigateWithPrefetch({
        navigate: () => {
          try {
            if (params) (navigation as any).navigate(screen, params);
            else (navigation as any).navigate(screen);
          } catch (error) {
            console.warn(`Navigation to ${screen} failed:`, error);
            const parentNav = (navigation as any).getParent?.();
            try {
              if (parentNav) {
                if (params) parentNav.navigate?.(screen, params);
                else parentNav.navigate?.(screen);
              }
            } catch (parentError) {
              console.error(
                `Parent navigation to ${screen} also failed:`,
                parentError
              );
            }
          }
        },
      });
    },
    [navigation]
  );

  const handleTab = React.useCallback(
    (tab: TopTab) => {
      if (tab === activeTab || isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      const SCREEN: Record<TopTab, string> = {
        Product: "ProductModule",
        Services: "ServicesModule",
        Payments: "PaymentsModule",
        DineOut: "DineOutModule",
      };

      // navigate('Home', { screen }) works from both Dashboard (AppStack – mounts MainLayout
      // then navigates inside ModuleStack) and from within MainLayout (already on Home –
      // React Navigation detects the screen is focused and updates the nested state directly).
      // No handleNavigateWithPrefetch wrapper so the switch is instant (<1 frame).
      (navigation as any).navigate("Home", {
        screen: SCREEN[tab],
        params: { moduleName: tab },
      });

      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    },
    [activeTab, navigation]
  );

  const navigateToAddAddress = React.useCallback(() => {
    navigateToScreen("AddressSelect");
  }, [navigateToScreen]);

  const navigateToChangeAddress = React.useCallback(() => {
    navigateToScreen("AddressSelect");
  }, [navigateToScreen]);

  const loadNavbarUser = React.useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      applyUserSnapshot({
        displayName: "Guest",
        displayAddress: "Address not set",
        rewardPoints: 0,
        ts: Date.now(),
      });
      return;
    }

    const now = Date.now();
    const hasFreshCache =
      !forceRefresh &&
      navbarUserCache &&
      now - navbarUserCache.ts < NAVBAR_USER_TTL_MS;

    if (hasFreshCache) {
      applyUserSnapshot(navbarUserCache as NavbarUserSnapshot);
      return;
    }

    if (navbarUserInFlight) {
      const snapshot = await navbarUserInFlight;
      applyUserSnapshot(snapshot);
      return;
    }

    navbarUserInFlight = (async () => {
      try {
        const storedName = await getStoredUserName();
        const userInfo = await fetchUserInfo();
        const user = userInfo?.user || null;
        const fetchedRewardPoints = Number(
          user?.rewardPoints || userInfo?.data?.rewardPoints || 0
        );
        const userName =
          userInfo?.name ||
          user?.name ||
          user?.full_name ||
          user?.username ||
          storedName ||
          "User";

        const addressRes = await fetchAllAddress();
        const addresses: ApiAddress[] = Array.isArray(addressRes?.data)
          ? addressRes.data
          : [];

        const selectedAddress =
          addresses.find((item) => Number(item?.is_default) === 1) ||
          addresses[0];

        const addressText = [
          selectedAddress?.address1,
          selectedAddress?.address2,
          selectedAddress?.city,
          selectedAddress?.state,
          selectedAddress?.zipcode,
        ]
          .map((part) => String(part || "").trim())
          .filter(Boolean)
          .join(", ");

        const snapshot: NavbarUserSnapshot = {
          displayName: String(userName),
          displayAddress: addressText || "Address not set",
          rewardPoints: fetchedRewardPoints,
          ts: Date.now(),
        };

        navbarUserCache = snapshot;
        return snapshot;
      } catch (error) {
        console.warn("Failed to load navbar user info:", error);
        return {
          displayName: navbarUserCache?.displayName || "User",
          displayAddress: navbarUserCache?.displayAddress || "Address not set",
          rewardPoints: navbarUserCache?.rewardPoints || 0,
          ts: Date.now(),
        } as NavbarUserSnapshot;
      } finally {
        navbarUserInFlight = null;
      }
    })();

    const snapshot = await navbarUserInFlight;
    applyUserSnapshot(snapshot);
  }, [applyUserSnapshot, isAuthenticated]);

  React.useEffect(() => {
    loadNavbarUser(false);
  }, [loadNavbarUser]);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 8 }]}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ✅ Background cross-fades smoothly between modules */}
      <View style={styles.bgWrapper} pointerEvents="none">
        <Image
          source={prevBgSource}
          style={[styles.absoluteFill, { top: -insets.top }]}
          resizeMode="cover"
        />
        {bgSource !== prevBgSource && (
          <Animated.Image
            source={bgSource}
            style={[styles.absoluteFill, { top: -insets.top, opacity: bgFade }]}
            resizeMode="cover"
          />
        )}
      </View>

      {/* TOP 4 ICON TABS */}
      <View style={styles.topIconsRow}>
        <TopIconWithLabel
          active={activeTab === "Product"}
          onPress={() => handleTab("Product")}
          Icon={Home_Nav as unknown as SvgIcon}
          label="Product"
          activeColor={TAB_THEME.Product.bgColor}
        />

        <TopIconWithLabel
          active={activeTab === "Services"}
          onPress={() => handleTab("Services")}
          Icon={Services as unknown as SvgIcon}
          label="Services"
          activeColor={TAB_THEME.Services.bgColor}
        />

        <TopIconWithLabel
          active={activeTab === "Payments"}
          onPress={() => handleTab("Payments")}
          Icon={Payments as unknown as SvgIcon}
          label="Payments"
          activeColor={TAB_THEME.Payments.bgColor}
        />

        <TopIconWithLabel
          active={activeTab === "DineOut"}
          onPress={() => handleTab("DineOut")}
          Icon={Dine_Out as unknown as SvgIcon}
          label="Dine Out"
          activeColor={TAB_THEME.DineOut.bgColor}
        />
      </View>

      {/* LOCATION */}
      <View style={styles.topRow}>
        <View
          style={[styles.locationRow, !showLocation && styles.locationRowHidden]}
          pointerEvents={showLocation ? "auto" : "none"}
        >
          <MaterialCommunityIcons name="map-marker" size={18} color="#16A34A" />
          <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.homeBold}>HOME- </Text>
            {displayName}
            {hasAddress ? `, ${displayAddress}` : ""}
          </Text>
          {hasAddress ? (
            <Text
              style={styles.addAddressLink}
              numberOfLines={1}
              onPress={navigateToChangeAddress}
            >
              {" "}Change
            </Text>
          ) : (
            <Text
              style={styles.addAddressLink}
              numberOfLines={1}
              onPress={navigateToAddAddress}
            >
              {" "}Add Address
            </Text>
          )}
        </View>
      </View>

      {/* SEARCH + WALLET */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.searchContainer}
          onPress={() => {
            if (activeTab === "Services") {
              navigateToScreen("ServiceSearch");
            } else {
              navigateToScreen("SearchScreen");
            }
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color="#111827" />
          <Text style={styles.fakePlaceholder}>Search “Reward Planners”</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.walletBox}
          onPress={() => navigateToScreen("WalletHistory")}
          hitSlop={{ top: 6, bottom: 10, left: 6, right: 6 }}
        >
          <WalletSvg width={26} height={26} />
          <View
            style={[
              styles.walletTag,
              { backgroundColor: activeThemeColor },
            ]}
          >
            <View style={styles.walletTagInner}>
              <Reward width={11} height={11} />
              <Text style={styles.walletTagText} numberOfLines={1}>
                {rewardPointsLabel}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  android: {
    elevation: 6,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
  },

  bgWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: -1,
    overflow: "hidden",
  },

  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },

  topIconsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 8,
  },

  topTabCard: {
    width: 82,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...shadow,
  },

  topTabCardActive: {
    borderColor: "transparent",
  },

  topTabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 12,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "72%",
    marginRight: 10,
  },

  locationRowHidden: {
    opacity: 0,
  },

  homeBold: {
    fontWeight: "900",
    color: "#111827",
  },

  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    flexShrink: 1,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 15,
    marginTop: 10,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderColor: "rgba(0,0,0,0.10)",
    borderWidth: 1,
    ...shadow,
  },

  fakePlaceholder: {
    flex: 1,
    marginLeft: 9,
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },

  walletBox: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    overflow: "visible",
    ...shadow,
  },

  walletTag: {
    position: "absolute",
    bottom: -7,
    right: -6,
    minWidth: 28,
    height: 18,
    borderRadius: 999,
    borderWidth: 1.25,
    borderColor: "#fff",
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  walletTagInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  walletTagText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 10,
    lineHeight: 12,
    maxWidth: 34,
  },

  addAddressLink: {
    color: "#2563EB",
    textDecorationLine: "underline",
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 0,
  },
});
