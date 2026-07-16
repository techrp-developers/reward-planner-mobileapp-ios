import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import ProfileIcon from "../assets/menu/profile.svg";
import HomeIcon from "../assets/menu/Home.svg";
import CenterIcon from "../assets/menu/Menu_Home.svg";
import dashbord_menu from "../assets/menu/dashbord_home.png";
import CartIcon from "../assets/menu/Cart.svg";
import ExploreIcon from "../assets/menu/Explore.svg";
import SearchIcon from "../assets/menu/Search.svg";
import HistoryIcon from "../assets/menu/History.svg";

export const TAB_BAR_HEIGHT = 68;

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
  badgeCount?: number;
};

// Defined outside render — stable reference, no allocation per press.
const HIT_SLOP = { top: 10, bottom: 10, left: 6, right: 6 } as const;
const NOOP = () => { };
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

const ACTIVE_COLOR = "#8B5CF6";
const INACTIVE_COLOR = "#9CA3AF";

const TabItem = React.memo(({ label, active, onPress, Icon, badgeCount }: TabItemProps) => {
  const iconColor = active ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.item}
      hitSlop={HIT_SLOP}
    >
      <View>
        <Icon width={24} height={24} color={iconColor} />
        {(badgeCount ?? 0) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
});

TabItem.displayName = "TabItem";

const CenterButton = React.memo(function CenterButton({
  isDashboard,
  onPress,
}: {
  isDashboard: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.fabWrap}
      hitSlop={HIT_SLOP}
    >
      <View style={styles.diamond}>
        {isDashboard ? (
          <Image source={dashbord_menu} style={styles.centerDashboardImage} resizeMode="contain" />
        ) : (
          <CenterIcon width={90} height={90} />
        )}
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
  const bottomInset = Math.max(insets.bottom, 8);

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

    const tabChanged = activeTabKey !== activeTabRef.current;
    if (tabChanged) {
      activeTabRef.current = activeTabKey;
      setActiveTab(activeTabKey);
    }

    if (isDashboard && tabChanged) {
      const index = activeTabKey === "Notes" ? 0 : activeTabKey === "Home" ? 1 : 2;
      animateDashboardIndicator(index);
    }
  }, [activeTabKey, animateDashboardIndicator, isDashboard, isFocused]);

  if (isDashboard) {
    return (
      <View style={[styles.dashboardWrap, { paddingBottom: bottomInset }]}>
        <View style={styles.dashboardPill}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dashboardIndicator,
              { transform: [{ translateX: dashboardIndicatorX }] },
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
              color={activeTab === "Notes" ? "#111827" : "#E5E7EB"}
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
              color={activeTab === "Home" ? "#111827" : "#E5E7EB"}
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
              color={activeTab === "Profile" ? "#111827" : "#E5E7EB"}
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
        { height: TAB_BAR_HEIGHT + bottomInset },
      ]}
    >
      <View
        style={[
          styles.bar,
          { height: TAB_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset },
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
            badgeCount={tab.key === "Cart" ? cartCount : undefined}
          />
        ))}

        {/* CENTER BUTTON — onCenterPress is supplied by the parent so this
            component stays navigation-agnostic and works in both MainLayout
            and MainTabs (HomeStack) contexts without needing useNavigation. */}
        <CenterButton
          isDashboard={Boolean(isDashboard)}
          onPress={onCenterPress ?? NOOP}
        />
      </View>
      <View style={styles.homeIndicator} />
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
  },
  navigatorWrap: {
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  bar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    color: INACTIVE_COLOR,
    fontWeight: "500",
  },
  labelActive: {
    color: ACTIVE_COLOR,
    fontWeight: "700",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    opacity: 0.9,
  },
  centerSpacer: {
    width: 60,
  },
  fabWrap: {
    position: "absolute",
    alignSelf: "center",
    top: -25,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  diamond: {
    width: 95,
    height: 95,
    alignItems: "center",
    justifyContent: "center",
  },
  centerDashboardImage: {
    width: 90,
    height: 90,
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