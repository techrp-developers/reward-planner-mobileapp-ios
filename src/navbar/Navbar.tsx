import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Image as RNImage,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import {
  useNavigation,
  useRoute,
  useNavigationState,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQuery } from "@tanstack/react-query";

import { fetchUserInfo } from "../modules/common/auth/api/AuthAPI";
import { fetchWalletBalance } from "../modules/ecommerce/api/WalleteAPI";
import { getNotificationBadge } from "../modules/dashboard/notification/NotificationAPI";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import { handleNavigateWithPrefetch } from "../modules/ecommerce/navigation/navigationPerformance";

import Navbar_Background from "./Navbar_Background";
import { useNavbarBanners } from "./hooks/useNavbarBanners";
import { TAB_MODULE_MAP, TopTab, isTopTab } from "./navbarConstants";
import { useModuleIcons } from "./hooks/useModuleIcons";
import type { ApiModuleIcon } from "./api/ModuleIconsApi";
import { useNavbarScroll } from "./NavbarScrollContext";

import WalletSvg from "../assets/homepage/navwallet.svg";
import Reward from "../assets/product/rewards.svg";
import { useAppTheme } from "../theme/ThemeContext";
import { hitSlop, rs } from "../utils/responsive";

import type { RootStackParamList } from "@/navigation/types";

// --- Types & Constants ---
export type { TopTab } from "./navbarConstants";

type NavbarProps = {
  activeModule?: TopTab;
  onModuleChange?: (tab: TopTab) => void;
};

type NavStateLike = {
  index: number;
  routes: Array<{
    name: string;
    state?: NavStateLike;
    params?: { moduleName?: string; screen?: string };
  }>;
};

type NavbarUserSnapshot = {
  rewardPoints: number;
  displayName: string;
  locationLabel: string;
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

const getReadableTextColor = (backgroundColor: string): string => {
  const color = backgroundColor.trim();
  let r = 139;
  let g = 92;
  let b = 246;

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex.slice(0, 6);

    if (normalized.length === 6) {
      r = parseInt(normalized.slice(0, 2), 16);
      g = parseInt(normalized.slice(2, 4), 16);
      b = parseInt(normalized.slice(4, 6), 16);
    }
  } else {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (match) {
      r = Number(match[1]);
      g = Number(match[2]);
      b = Number(match[3]);
    }
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.66 ? "#1F2937" : "#FFFFFF";
};

const compactAddressLine = (user: any): string => {
  const address = user?.defaultAddress || {};
  const parts = [
    address?.address1,
    address?.address2,
    address?.city || user?.city,
    address?.state || user?.state,
    address?.zipcode || user?.pincode,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  return parts.join(", ");
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

const TOP_TAB_BY_ROUTE_KEY: Record<string, TopTab> = {
  ProductModule: "Product",
  ServicesModule: "Services",
  PaymentsModule: "Payments",
  DineOutModule: "DineOut",
};

const MODULE_KEY_BY_TOP_TAB = Object.entries(TAB_MODULE_MAP).reduce(
  (acc, [tab, moduleKey]) => {
    acc[tab as TopTab] = moduleKey;
    return acc;
  },
  {} as Record<TopTab, string>
);

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const ACTIVE_TAB_SCALE = 1.04;
const PRESSED_SCALE_DELTA = 0.06;
const NAV_TABS_H_PADDING = rs(16);
const NAV_TAB_GAP = rs(10);

// --- Sub-component (icon-forward, no card background — dot indicator marks active) ---
const TopIconWithLabel = React.memo(
  ({
    active,
    onPress,
    iconUrl,
    moduleKey,
    label,
    activeTint,
    inactiveTint,
    gradientStart,
    gradientEnd,
    itemWidth,
    iconSize,
    gradientWrapSize,
    gradientInnerSize,
  }: {
    active: boolean;
    onPress: () => void;
    iconUrl: string | null;
    moduleKey: string;
    label: string;
    activeTint?: string;
    inactiveTint: string;
    gradientStart?: string | null;
    gradientEnd?: string | null;
    itemWidth: number;
    iconSize: number;
    gradientWrapSize: number;
    gradientInnerSize: number;
  }) => {
    const hasGradient = Boolean(gradientStart && gradientEnd);
    const tint = active ? activeTint ?? "#FFFFFF" : inactiveTint;
    const [imageUrl, setImageUrl] = React.useState(iconUrl);

    React.useEffect(() => {
      setImageUrl(iconUrl);
    }, [iconUrl]);
    // Base scale grows with a spring when the tab becomes active (visual
    // weight), and presses shrink from whatever the current base is —
    // never fighting an in-flight active/inactive transition.
    const scale = React.useRef(new Animated.Value(active ? ACTIVE_TAB_SCALE : 1)).current;
    const isPressedRef = React.useRef(false);

    React.useEffect(() => {
      if (isPressedRef.current) return;
      Animated.spring(scale, {
        toValue: active ? ACTIVE_TAB_SCALE : 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 8,
      }).start();
    }, [active, scale]);

    const handlePressIn = React.useCallback(() => {
      isPressedRef.current = true;
      Animated.spring(scale, {
        toValue: (active ? ACTIVE_TAB_SCALE : 1) - PRESSED_SCALE_DELTA,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }).start();
    }, [active, scale]);

    const handlePressOut = React.useCallback(() => {
      isPressedRef.current = false;
      Animated.spring(scale, {
        toValue: active ? ACTIVE_TAB_SCALE : 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
    }, [active, scale]);

    return (
      <AnimatedTouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tabItem, { width: itemWidth, transform: [{ scale }] }]}
        hitSlop={hitSlop(8)}
      >
        {imageUrl ? (
          hasGradient ? (
            <LinearGradient
              colors={[gradientStart as string, gradientEnd as string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.moduleIconGradientWrap,
                {
                  width: gradientWrapSize,
                  height: gradientWrapSize,
                  borderRadius: Math.round(gradientWrapSize * 0.3),
                },
              ]}
            >
              <RNImage
                source={{ uri: imageUrl }}
                style={{ width: gradientInnerSize, height: gradientInnerSize }}
                resizeMode="contain"
                onLoad={() => {
                  if (__DEV__) {
                    console.log("[CMS] Module icon loaded:", moduleKey);
                  }
                }}
                onError={() => {
                  if (__DEV__) {
                    console.log("[CMS] Module icon failed:", moduleKey, imageUrl);
                  }
                  if (imageUrl !== iconUrl) return;
                  setImageUrl(null);
                }}
              />
            </LinearGradient>
          ) : (
            <RNImage
              source={{ uri: imageUrl }}
              style={{ width: iconSize, height: iconSize }}
              resizeMode="contain"
              onLoad={() => {
                if (__DEV__) {
                  console.log("[CMS] Module icon loaded:", moduleKey);
                }
              }}
              onError={() => {
                if (__DEV__) {
                  console.log("[CMS] Module icon failed:", moduleKey, imageUrl);
                }
                setImageUrl(null);
              }}
            />
          )
        ) : null}

        <Text
          style={[
            styles.topTabLabel,
            active ? styles.topTabLabelActive : styles.topTabLabelInactive,
            { color: tint },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {active ? (
          <View style={[styles.activeIndicator, { backgroundColor: tint }]} />
        ) : (
          <View style={styles.activeIndicatorSpacer} />
        )}
      </AnimatedTouchableOpacity>
    );
  }
);

export default function Navbar({ activeModule, onModuleChange }: NavbarProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { isAuthenticated } = useAuth();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { scrollY } = useNavbarScroll();
  const [rewardPoints, setRewardPoints] = React.useState(0);
  const [customerName, setCustomerName] = React.useState("Guest");
  const [customerLocation, setCustomerLocation] = React.useState("Set delivery location");
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

  const detectedActiveTab = React.useMemo<TopTab>(
    () =>
      getActiveTab(deepestRoute.routeName || route.name, moduleName, activeModuleTab),
    [deepestRoute.routeName, route.name, moduleName, activeModuleTab]
  );
  const activeTab = activeModule ?? detectedActiveTab;

  // Campaign-driven banner config per tab (falls back to the bundled static
  // images/colors in navbarConstants when the API has no data for a tab).
  const { banners } = useNavbarBanners();
  React.useEffect(() => {
    if (!__DEV__) return;
    console.log("[CMS] Navbar active tab:", activeTab);
    console.log("[CMS] Navbar banner:", banners[activeTab]);
    console.log("[CMS] Navbar image URL:", banners[activeTab]?.imageUrl);
  }, [activeTab, banners]);

  // API failure/empty response just yields an empty list — no hardcoded
  // Product/Services/Payments/etc. fallback, per the CMS-only requirement.
  const { modules } = useModuleIcons();
  const { width: screenWidth } = useWindowDimensions();
  // Evenly size tab items so the module row fills the navbar width instead
  // of a fixed minWidth left-packing 4 icons into less than half the bar —
  // clamped so it doesn't blow up with 1-2 modules or shrink too far with many.
  const tabItemWidth = React.useMemo(() => {
    const count = Math.max(modules.length, 1);
    const raw = (screenWidth - NAV_TABS_H_PADDING * 2 - NAV_TAB_GAP * (count - 1)) / count;
    return Math.max(rs(64), Math.min(Math.floor(raw), rs(96)));
  }, [screenWidth, modules.length]);
  const moduleIconSize = Math.round(Math.min(tabItemWidth * 0.62, rs(52)));
  const moduleGradientWrapSize = moduleIconSize + rs(4);
  const moduleGradientInnerSize = Math.round(moduleIconSize * 0.68);
  const activeModuleKeyFromRoute = MODULE_KEY_BY_TOP_TAB[activeTab];
  const [selectedModuleKey, setSelectedModuleKey] = React.useState(activeModuleKeyFromRoute);
  const selectedModule = React.useMemo(
    () => modules.find((module) => module.module_key === selectedModuleKey),
    [modules, selectedModuleKey],
  );

  React.useEffect(() => {
    setSelectedModuleKey(activeModuleKeyFromRoute);
  }, [activeModuleKeyFromRoute]);

  React.useEffect(() => {
    if (!__DEV__) return;
    console.log("[CMS] Modules:", modules);
    modules.forEach((module) => {
      console.log("[CMS] Module:", {
        module_key: module.module_key,
        label: module.label,
        icon_url: module.icon_url,
        active_icon_url: module.active_icon_url,
        route_key: module.route_key,
        is_active: module.is_active,
      });
    });
  }, [modules]);

  const moduleNormalColor = React.useMemo(
    () => selectedModule?.normal_color || (isDark ? "#FFFFFF" : "#111827"),
    [isDark, selectedModule?.normal_color],
  );
  const activeThemeColor = React.useMemo(
    () => {
      const bannerColor = banners[activeTab]?.bgColor;
      return selectedModule?.active_color ||
        (bannerColor && bannerColor !== "transparent" ? bannerColor : "#FFC83D");
    },
    [activeTab, banners, selectedModule?.active_color],
  );
  const walletBadgeColor = React.useMemo(
    () => activeThemeColor,
    [activeThemeColor]
  );
  const walletBadgeTextColor = React.useMemo(
    () => getReadableTextColor(walletBadgeColor),
    [walletBadgeColor]
  );
  // Search bar + wallet button float over the campaign banner, so they read
  // as translucent glass cards rather than solid boxes on top of it.
  const frostedSurface = isDark ? "rgba(20,20,20,0.55)" : "rgba(255,255,255,0.88)";
  const navbarBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)";
  const navbarIconColor = moduleNormalColor;
  const navbarMutedColor = moduleNormalColor;
  const isNavigatingRef = React.useRef(false);

  const headerOpacity = 1;
  const headerTranslateY = 0;
  const headerHeight = rs(78);
  const headerMarginTop = 0;
  const headerPaddingBottom = rs(2);
  const searchHeight = rs(34);
  const compactScale = 1;
  const modulesTranslateY = 0;
  const modulesAnimatedStyle = React.useMemo(
    () => ({
      transform: [{ translateY: modulesTranslateY }, { scale: compactScale }] as any,
    }),
    [compactScale, modulesTranslateY],
  );

  const { data: notificationBadge } = useQuery({
    queryKey: ["notification", "badge"],
    queryFn: getNotificationBadge,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  const hasUnreadNotifications = Boolean(notificationBadge?.success && notificationBadge.count > 0);

  const applyUserSnapshot = React.useCallback((snapshot: NavbarUserSnapshot) => {
    setRewardPoints((prev) =>
      prev === snapshot.rewardPoints ? prev : snapshot.rewardPoints
    );
    setCustomerName((prev) =>
      prev === snapshot.displayName ? prev : snapshot.displayName
    );
    setCustomerLocation((prev) =>
      prev === snapshot.locationLabel ? prev : snapshot.locationLabel
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

  const handleSearchPress = React.useCallback(() => {
    if (activeTab === "Services") {
      navigateToScreen("ServiceSearch");
    } else if (activeTab === "Payments") {
      (navigation as any).navigate("Home", {
        screen: "PaymentsModule",
        params: { screen: "Search" },
      });
    } else {
      navigateToScreen("SearchScreen");
    }
  }, [activeTab, navigateToScreen, navigation]);

  const handleAddressPress = React.useCallback(() => {
    navigateToScreen("AddressSelect", { manageOnly: true });
  }, [navigateToScreen]);

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
       if (onModuleChange) {
         onModuleChange(tab);
       } else {
         (navigation as any).navigate("Home", {
           screen: SCREEN[tab],
           params: { moduleName: tab },
         });
       }

      requestAnimationFrame(() => {
        isNavigatingRef.current = false;
      });
    },
    [activeTab, navigation, onModuleChange]
  );

  const handleModulePress = React.useCallback(
    (module: ApiModuleIcon) => {
      if (module.module_key === selectedModuleKey || isNavigatingRef.current) return;

      setSelectedModuleKey(module.module_key);

      if (!module.route_key) return;

      const knownTab = TOP_TAB_BY_ROUTE_KEY[module.route_key];
      if (knownTab) {
        handleTab(knownTab);
        return;
      }

      try {
        (navigation as any).navigate("Home", {
          screen: module.route_key,
          params: { moduleName: module.module_key },
          moduleName: module.module_key,
        });
      } catch (error) {
        if (__DEV__) {
          console.warn("Navigation to CMS module failed:", {
            module_key: module.module_key,
            route_key: module.route_key,
            error,
          });
        }
      }
    },
    [handleTab, navigation, selectedModuleKey]
  );

  const loadNavbarUser = React.useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      applyUserSnapshot({
        rewardPoints: 0,
        displayName: "Guest",
        locationLabel: "Set delivery location",
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
        const [userInfo, walletBalance] = await Promise.all([
          fetchUserInfo(),
          fetchWalletBalance().catch((walletError) => {
            if (__DEV__) {
              console.warn("Failed to load navbar wallet balance:", walletError);
            }
            return null;
          }),
        ]);
        const user = userInfo?.user || null;
        const walletData = walletBalance?.data || null;
        const fetchedRewardPoints = Number(
          walletData?.balance ?? user?.rewardPoints ?? userInfo?.data?.rewardPoints ?? 0
        );
        const fetchedName = String(
          userInfo?.name || user?.name || user?.full_name || user?.username || "Guest"
        ).trim();
        const fetchedLocation = compactAddressLine(user);


        const snapshot: NavbarUserSnapshot = {
          rewardPoints: fetchedRewardPoints,
          displayName: fetchedName || "Guest",
          locationLabel: fetchedLocation || "Set delivery location",
          ts: Date.now(),
        };

        navbarUserCache = snapshot;
        return snapshot;
      } catch (error) {
        console.warn("Failed to load navbar user info:", error);
        return {
          rewardPoints: navbarUserCache?.rewardPoints || 0,
          displayName: navbarUserCache?.displayName || "Guest",
          locationLabel: navbarUserCache?.locationLabel || "Set delivery location",
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
    <View style={[styles.wrapper, { paddingTop: insets.top + rs(14) }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ✅ Campaign-driven banner, cross-fades smoothly between modules */}
      <Navbar_Background
        activeTab={activeTab}
        banners={banners}
        insetsTop={insets.top}
        isDark={isDark}
        scrollY={scrollY}
      />

      <Animated.View
        style={[
          styles.searchActionsRow,
          {
            height: headerHeight,
            marginTop: headerMarginTop,
            paddingBottom: headerPaddingBottom,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        
        <View style={styles.topRow}>
          <AnimatedTouchableOpacity
            activeOpacity={0.9}
            style={styles.deliveryContainer}
            onPress={handleAddressPress}
          >
            <MaterialCommunityIcons
              name="map-marker"
              size={21}
              color={navbarIconColor}
              style={styles.deliveryPin}
            />
            <View style={styles.deliveryTextBlock}>
              <View style={styles.deliveryTitleRow}>
                <Text style={[styles.deliveryPrefix, { color: navbarMutedColor }]} numberOfLines={1}>
                  Deliver to
                </Text>
                <Text style={[styles.deliveryTitle, { color: navbarIconColor }]} numberOfLines={1}>
                  {customerName}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color={navbarIconColor}
                  style={styles.deliveryChevron}
                />
              </View>
              <Text style={[styles.deliveryAddress, { color: navbarMutedColor }]} numberOfLines={1}>
                {customerLocation}
              </Text>
            </View>
          </AnimatedTouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.walletBox, { backgroundColor: frostedSurface, borderColor: navbarBorder }]}
            onPress={() => navigateToScreen("WalletHistory")}
            hitSlop={hitSlop(8)}
          >
            <WalletSvg width={19} height={19} />
            <View
              style={[
                styles.walletTag,
                { backgroundColor: walletBadgeColor },
              ]}
            >
              <View style={styles.walletTagInner}>
                <Reward width={11} height={11} />
                <Text
                  style={[styles.walletTagText, { color: walletBadgeTextColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                >
                  {rewardPointsLabel}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <AnimatedTouchableOpacity
            activeOpacity={0.86}
            style={[styles.searchBar, { backgroundColor: frostedSurface, borderColor: navbarBorder, height: searchHeight }]}
            onPress={handleSearchPress}
            hitSlop={hitSlop(6)}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={navbarIconColor} />
            <Text style={[styles.searchPlaceholder, { color: navbarMutedColor }]} numberOfLines={1}>
              Search products and services
            </Text>
          </AnimatedTouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.bellBtn, { backgroundColor: frostedSurface, borderColor: navbarBorder }]}
            onPress={() => navigateToScreen("Notification")}
            hitSlop={hitSlop(8)}
          >
            <MaterialCommunityIcons name="bell-outline" size={19} color={navbarIconColor} />
            {hasUnreadNotifications ? <View style={styles.bellDot} /> : null}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* MODULE TABS */}
      <Animated.View style={modulesAnimatedStyle}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topIconsRow}
        >
          {modules.map((module) => {
            const active = module.module_key === selectedModuleKey;
            const iconUrl = active
              ? module.active_icon_url || module.icon_url
              : module.icon_url;

            return (
              <TopIconWithLabel
                key={module.module_key}
                active={active}
                onPress={() => handleModulePress(module)}
                iconUrl={iconUrl}
                moduleKey={module.module_key}
                label={module.label}
                activeTint={module.active_color || activeThemeColor}
                inactiveTint={module.normal_color || navbarIconColor}
                gradientStart={module.gradient_start_color}
                gradientEnd={module.gradient_end_color}
                itemWidth={tabItemWidth}
                iconSize={moduleIconSize}
                gradientWrapSize={moduleGradientWrapSize}
                gradientInnerSize={moduleGradientInnerSize}
              />
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // paddingTop set inline: insets.top (safe area / status bar height,
    // needed since StatusBar is translucent) + rs(14) breathing room.
  },

  searchActionsRow: {
    flexDirection: "column",
    alignItems: "stretch",
    paddingHorizontal: rs(14),
    gap: rs(6),
    overflow: "visible",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
    minWidth: 0,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    minWidth: 0,
  },

  avatarWrap: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    flexShrink: 0,
  },

  bellBtn: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    width: rs(34),
    height: rs(34),
    borderWidth: 0,
  },

  bellDot: {
    position: "absolute",
    top: rs(8),
    right: rs(9),
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  deliveryContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    minHeight: rs(32),
    paddingRight: rs(2),
  },

  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: rs(16),
    borderWidth: 1,
    paddingHorizontal: rs(12),
    gap: rs(8),
  },

  searchPlaceholder: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    fontWeight: "600",
    includeFontPadding: false,
  },

  deliveryIconWrap: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    alignItems: "center",
    justifyContent: "center",
    marginRight: rs(6),
    flexShrink: 0,
  },

  deliveryPin: {
    marginRight: rs(5),
    flexShrink: 0,
  },

  deliveryTextBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  deliveryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  deliveryPrefix: {
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "500",
    includeFontPadding: false,
    marginRight: rs(3),
  },

  deliveryTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900",
    includeFontPadding: false,
  },

  deliveryChevron: {
    marginLeft: rs(4),
    flexShrink: 0,
  },

  deliveryChangeText: {
    marginLeft: rs(6),
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    includeFontPadding: false,
    flexShrink: 0,
  },

  deliveryAddress: {
    marginTop: rs(1),
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "600",
    includeFontPadding: false,
  },

  searchIconButton: {
    borderRadius: rs(16),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  walletBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    minWidth: rs(82),
    height: rs(34),
    borderWidth: 0,
    paddingLeft: rs(7),
    paddingRight: rs(5),
    gap: rs(4),
  },

  walletTag: {
    height: rs(22),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    paddingHorizontal: rs(6),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },

  walletTagInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: rs(4),
  },

  walletTagText: {
    fontWeight: "900",
    fontSize: 10.5,
    lineHeight: 12,
    includeFontPadding: false,
    textAlignVertical: "center",
    textAlign: "center",
  },

  // --- Module tabs: no box, icon-forward, bottom of navbar ---
  // Item width and icon sizes are computed at runtime (see tabItemWidth /
  // moduleIconSize in Navbar) so exactly `modules.length` tabs evenly fill
  // the bar instead of a fixed minWidth left-packing them into part of it.
  topIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: "100%",
    paddingHorizontal: NAV_TABS_H_PADDING,
    paddingTop: rs(6),
    paddingBottom: 0,
    gap: NAV_TAB_GAP,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Only used when a module has both gradient_start_color and
  // gradient_end_color from the CMS — keeps the same footprint as the plain
  // icon so layout never shifts, just shows a colored backdrop.
  moduleIconGradientWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  topTabLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    letterSpacing: 0,
    marginTop: rs(2),
  },

  topTabLabelActive: {
    opacity: 1,
  },

  topTabLabelInactive: {
    opacity: 0.65,
  },

  activeIndicator: {
    width: rs(18),
    height: rs(3),
    borderRadius: 999,
    marginTop: rs(4),
  },

  activeIndicatorSpacer: {
    height: rs(7),
    marginTop: rs(4),
  },

});
