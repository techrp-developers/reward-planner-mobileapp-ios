import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import ProfileIcon from "../assets/menu/profile.svg";
import HomeIcon from "../assets/menu/Home.svg";
import CartIcon from "../assets/menu/Cart.svg";
import ExploreIcon from "../assets/menu/Explore.svg";
import SearchIcon from "../assets/menu/Search.svg";
import HistoryIcon from "../assets/menu/History.svg";
import { useAppTheme } from "../theme/ThemeContext";
import RewardIcon from "../assets/homepage/RewardPlannersLogo.png";

const FLOATING_BOTTOM_GAP = 10;
const FLOATING_BAR_HEIGHT = 64;
const CENTER_BUTTON_SIZE = 58;
export const TAB_BAR_HEIGHT = FLOATING_BAR_HEIGHT + FLOATING_BOTTOM_GAP + 24;

type AppMode = "Product" | "Services" | "Payments" | "DineOut";

export type TabKey = "Home" | "Notes" | "Cart" | "History" | "Profile" | "Search";

type Props = {
  activeMode?: AppMode;
  onTabPress?: (tab: TabKey) => void;
  cartCount?: number;
  isDashboard?: boolean;
  activeTabKey?: TabKey;
  layoutMode?: "overlay" | "navigator";
  // Navigation for the center button is delegated to the parent so BottomTabs
  // works correctly in both the MainLayout context (Dashboard) and the
  // MainTabs/HomeStack context, which have different navigation scopes.
  onCenterPress?: () => void;
};

type TabConfig = {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ width: number; height: number; color?: string }>;
};

type TabItemProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  Icon: React.ComponentType<{ width: number; height: number; color?: string }>;
  activeIconColor: string;
  activeLabelColor: string;
  inactiveColor: string;
  badgeCount?: number;
  badgeBorderColor: string;
};

// Defined outside render — stable reference, no allocation per press.
const HIT_SLOP = { top: 10, bottom: 10, left: 6, right: 6 } as const;
const NOOP = () => {};
const DASHBOARD_SLOT_WIDTH = 62;
const DASHBOARD_INDICATOR_LEFT = 9;

// Tab config is identical across modes — the parent's onTabPress handler
// (MainLayout / Dashbord) decides where each generic tab key actually
// navigates based on activeMode, so BottomTabs itself stays mode-agnostic.
const TABS: TabConfig[] = [
  { key: "Home", label: "Home", Icon: HomeIcon },
  { key: "Search", label: "Search", Icon: SearchIcon },
  { key: "Cart", label: "Cart", Icon: CartIcon },
  { key: "Profile", label: "Profile", Icon: ProfileIcon },
];

const PAYMENT_TABS: TabConfig[] = [
  { key: "Home", label: "Home", Icon: HomeIcon },
  { key: "Search", label: "Search", Icon: SearchIcon },
  { key: "History", label: "History", Icon: HistoryIcon },
  { key: "Profile", label: "Profile", Icon: ProfileIcon },
];

// On the Dashboard, the Cart slot is replaced with Explore — cart access
// already lives elsewhere on that screen, and Explore gives quick access
// to the to-do list from the bottom bar.
const DASHBOARD_TABS: TabConfig[] = [
  { key: "Home", label: "Home", Icon: HomeIcon },
  { key: "Search", label: "Search", Icon: SearchIcon },
  { key: "Notes", label: "Notes", Icon: ExploreIcon },
  { key: "Profile", label: "Profile", Icon: ProfileIcon },
];

const INACTIVE_COLOR = "#9CA3AF";
const TAB_ICON_THEME: Record<AppMode, { activeIcon: string; activeLabel: string }> = {
  Product: {
    activeIcon: "#C58A16",
    activeLabel: "#111827",
  },
  Services: {
    activeIcon: "#2563EB",
    activeLabel: "#06111F",
  },
  Payments: {
    activeIcon: "#9333EA",
    activeLabel: "#120A24",
  },
  DineOut: {
    activeIcon: "#E91E63",
    activeLabel: "#1F0A13",
  },
};
const CENTER_BUTTON_THEME: Record<AppMode, { background: string; border: string; shadow: string }> = {
  Product: {
    background: "#C58A16",
    border: "#FFF4C2",
    shadow: "#C58A16",
  },
  Services: {
    background: "#2563EB",
    border: "#DBEAFE",
    shadow: "#2563EB",
  },
  Payments: {
    background: "#9333EA",
    border: "#F3E8FF",
    shadow: "#9333EA",
  },
  DineOut: {
    background: "#E91E63",
    border: "#FFE4F0",
    shadow: "#E91E63",
  },
};

// Icon "pop" when a tab becomes active — spring overshoots past ACTIVE_ICON_SCALE
// then settles, giving a bouncy feel without a background pill.
const ACTIVE_ICON_SCALE = 1.22;
const ICON_SPRING_CONFIG = { useNativeDriver: true, tension: 220, friction: 5 };

const TabItem = React.memo(({
  label,
  active,
  onPress,
  Icon,
  activeIconColor,
  activeLabelColor,
  inactiveColor,
  badgeCount,
  badgeBorderColor,
}: TabItemProps) => {
  const iconColor = active ? activeIconColor : inactiveColor;
  const iconScale = useRef(new Animated.Value(active ? ACTIVE_ICON_SCALE : 1)).current;

  useEffect(() => {
    Animated.spring(iconScale, {
      toValue: active ? ACTIVE_ICON_SCALE : 1,
      ...ICON_SPRING_CONFIG,
    }).start();
  }, [active, iconScale]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.item}
      hitSlop={HIT_SLOP}
    >
      <View>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Icon width={24} height={24} color={iconColor} />
        </Animated.View>
        {(badgeCount ?? 0) > 0 && (
          <View style={[styles.badge, { borderColor: badgeBorderColor }]}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color: inactiveColor }, active && styles.labelActive, active && { color: activeLabelColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

TabItem.displayName = "TabItem";

const CenterButton = React.memo(function CenterButton({
  activeMode,
  onPress,
}: {
  activeMode: AppMode;
  onPress: () => void;
}) {
  const centerTheme = CENTER_BUTTON_THEME[activeMode] ?? CENTER_BUTTON_THEME.Product;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.fabWrap}
      hitSlop={HIT_SLOP}
    >
      <View
        style={[
          styles.centerGlow,
          {
            backgroundColor: centerTheme.background,
            shadowColor: centerTheme.shadow,
          },
        ]}
      />
      <View
        style={[
          styles.centerDiamondButton,
          {
            backgroundColor: centerTheme.background,
            borderColor: centerTheme.border,
            shadowColor: centerTheme.shadow,
          },
        ]}
      >
        <View style={styles.centerLogoPlate}>
          <Image
            source={RewardIcon}
            style={styles.centerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
});

CenterButton.displayName = "CenterButton";

function BottomTabs({
  activeMode = "Product",
  onTabPress,
  isDashboard = false,
  activeTabKey,
  cartCount = 0,
  onCenterPress,
  layoutMode = "overlay",
}: Props) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { isDark, theme } = useAppTheme();
  const bottomInset = Math.max(insets.bottom, 0);

  // Ref guards the early-return check so handlePress never needs activeTab as a dep.
  // Without this, every tab press invalidates handlePress → pressHandlers → all TabItem memos.
  const activeTabRef = useRef<TabKey>("Home");
  const dashboardIndicatorX = useRef(new Animated.Value(DASHBOARD_SLOT_WIDTH)).current;
  const [activeTab, setActiveTab] = useState<TabKey>("Home");

  const handlePress = useCallback(
    (tab: TabKey) => {
      activeTabRef.current = tab;
      setActiveTab(tab);
      onTabPress?.(tab);
    },
    [onTabPress], // no activeTab dep — ref handles the guard
  );

  const tabs = isDashboard
    ? DASHBOARD_TABS
    : activeMode === "Payments"
      ? PAYMENT_TABS
      : TABS;
  const tabTheme = TAB_ICON_THEME[activeMode] ?? TAB_ICON_THEME.Product;
  const inactiveColor = isDark ? theme.secondaryText : INACTIVE_COLOR;
  const barBackgroundColor = isDark ? theme.card : "rgba(255,255,255,0.78)";
  const barBorderColor = isDark ? theme.border : "rgba(17,24,39,0.08)";
  const activeLabelColor = isDark ? tabTheme.activeIcon : tabTheme.activeLabel;
  const dashboardPillBackground = isDark ? "rgba(11,0,24,0.82)" : "rgba(255,255,255,0.82)";
  const dashboardPillBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(75,0,130,0.1)";
  const dashboardActiveColor = isDark ? "#FFFFFF" : "#18002E";
  const dashboardInactiveColor = isDark ? "#D8CBE5" : "#625A6B";
  const dashboardIndicatorBackground = isDark ? "rgba(106,0,255,0.45)" : "rgba(255,255,255,0.96)";

  const animateDashboardIndicator = useCallback((index: number) => {
    Animated.spring(dashboardIndicatorX, {
      toValue: index * DASHBOARD_SLOT_WIDTH,
      useNativeDriver: true,
      tension: 120,
      friction: 13,
    }).start();
  }, [dashboardIndicatorX]);

  const handleDashboardPress = useCallback((tab: "Notes" | "Home" | "Profile") => {
    const index = tab === "Notes" ? 0 : tab === "Home" ? 1 : 2;
    activeTabRef.current = tab;
    setActiveTab(tab);
    animateDashboardIndicator(index);
    if (tab === "Home") {
      onCenterPress?.();
      return;
    }
    onTabPress?.(tab);
  }, [animateDashboardIndicator, onCenterPress, onTabPress]);

  // One stable handler per key — rebuilt only when handlePress (i.e. onTabPress) changes,
  // not on every tab press. Passing these as onPress keeps TabItem React.memo effective.
  const pressHandlers = useMemo<Record<TabKey, () => void>>(
    () => ({
      Home: () => handlePress("Home"),
      Notes: () => handlePress("Notes"),
      Search: () => handlePress("Search"),
      Cart: () => handlePress("Cart"),
      History: () => handlePress("History"),
      Profile: () => handlePress("Profile"),
    }),
    [handlePress],
  );

  // Keep local active tab state in sync with navigation-driven activeTabKey from parent.
  React.useEffect(() => {
    if (!isFocused || !activeTabKey) return;

    if (activeTabKey !== activeTabRef.current) {
      activeTabRef.current = activeTabKey;
      setActiveTab(activeTabKey);
    }

    if (isDashboard) {
      const index = activeTabKey === "Notes" ? 0 : activeTabKey === "Home" ? 1 : 2;
      animateDashboardIndicator(index);
    }
  }, [activeTabKey, animateDashboardIndicator, isDashboard, isFocused]);

  if (isDashboard) {
    return (
      <View style={[styles.dashboardWrap, { paddingBottom: bottomInset }]}>
        <View
          style={[
            styles.dashboardPill,
            {
              backgroundColor: dashboardPillBackground,
              borderColor: dashboardPillBorder,
              shadowColor: isDark ? "#6A00FF" : "#4B0082",
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dashboardIndicator,
              {
                backgroundColor: dashboardIndicatorBackground,
                transform: [{ translateX: dashboardIndicatorX }],
              },
            ]}
          />
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => handleDashboardPress("Notes")}
            style={styles.dashboardSideBtn}
            hitSlop={HIT_SLOP}
          >
            <MaterialCommunityIcons
              name="note-text-outline"
              size={23}
              color={activeTab === "Notes" ? dashboardActiveColor : dashboardInactiveColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleDashboardPress("Home")}
            style={styles.dashboardSideBtn}
            hitSlop={HIT_SLOP}
          >
            <MaterialCommunityIcons
              name="home"
              size={24}
              color={activeTab === "Home" ? dashboardActiveColor : dashboardInactiveColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => handleDashboardPress("Profile")}
            style={styles.dashboardSideBtn}
            hitSlop={HIT_SLOP}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color={activeTab === "Profile" ? dashboardActiveColor : dashboardInactiveColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        layoutMode === "navigator" ? styles.navigatorWrap : styles.wrap,
        {
          height: TAB_BAR_HEIGHT + bottomInset,
          backgroundColor: layoutMode === "navigator" ? theme.background : "transparent",
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            height: FLOATING_BAR_HEIGHT,
            bottom: bottomInset + FLOATING_BOTTOM_GAP,
            backgroundColor: barBackgroundColor,
            borderColor: barBorderColor,
            shadowColor: isDark ? "#000000" : "#000000",
          },
        ]}
      >
        {/* LEFT SIDE */}
        {tabs.slice(0, 2).map((tab) => (
          <TabItem
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={pressHandlers[tab.key]}
            Icon={tab.Icon}
            activeIconColor={tabTheme.activeIcon}
            activeLabelColor={activeLabelColor}
            inactiveColor={inactiveColor}
            badgeBorderColor={barBackgroundColor}
          />
        ))}

        <View style={styles.centerSpacer} />

        {/* RIGHT SIDE */}
        {tabs.slice(2).map((tab) => (
          <TabItem
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onPress={pressHandlers[tab.key]}
            Icon={tab.Icon}
            activeIconColor={tabTheme.activeIcon}
            activeLabelColor={activeLabelColor}
            inactiveColor={inactiveColor}
            badgeCount={tab.key === "Cart" ? cartCount : undefined}
            badgeBorderColor={barBackgroundColor}
          />
        ))}

        {/* CENTER BUTTON — onCenterPress is supplied by the parent so this
            component stays navigation-agnostic and works in both MainLayout
            and MainTabs (HomeStack) contexts without needing useNavigation. */}
        <CenterButton
          activeMode={activeMode}
          onPress={onCenterPress ?? NOOP}
        />
      </View>
    </View>
  );
}

export default React.memo(BottomTabs);

const styles = StyleSheet.create({
  dashboardWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  dashboardPill: {
    height: 58,
    minWidth: 204,
    paddingHorizontal: 9,
    borderRadius: 31,
    backgroundColor: "#151515",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  dashboardSideBtn: {
    width: DASHBOARD_SLOT_WIDTH,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  dashboardIndicator: {
    position: "absolute",
    left: DASHBOARD_INDICATOR_LEFT,
    width: DASHBOARD_SLOT_WIDTH,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  navigatorWrap: {
    width: "100%",
    backgroundColor: "transparent",
    alignItems: "center",
  },
  bar: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 14,
    borderRadius: 32,
    borderWidth: 1,
    elevation: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: 56,
  },
  label: {
    marginTop: 3,
    fontSize: 10.5,
    color: INACTIVE_COLOR,
    fontWeight: "600",
  },
  labelActive: {
    fontWeight: "700",
  },
  centerSpacer: {
    width: 64,
  },
  fabWrap: {
    position: "absolute",
    alignSelf: "center",
    top: -23,
    width: CENTER_BUTTON_SIZE + 8,
    height: CENTER_BUTTON_SIZE + 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  centerGlow: {
    position: "absolute",
    width: CENTER_BUTTON_SIZE + 10,
    height: CENTER_BUTTON_SIZE + 10,
    borderRadius: (CENTER_BUTTON_SIZE + 10) / 2,
    opacity: 0.18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
  centerDiamondButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 15,
    elevation: 16,
  },
  centerLogoPlate: {
    width: CENTER_BUTTON_SIZE - 12,
    height: CENTER_BUTTON_SIZE - 12,
    borderRadius: (CENTER_BUTTON_SIZE - 12) / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    overflow: "hidden",
  },
  centerLogo: {
    width: CENTER_BUTTON_SIZE - 22,
    height: CENTER_BUTTON_SIZE - 22,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
