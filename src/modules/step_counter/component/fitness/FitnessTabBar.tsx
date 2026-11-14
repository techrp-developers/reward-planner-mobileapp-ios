import React, { createContext, useContext, useEffect, useRef } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import RewardLogo from "../../../../assets/homepage/RewardPlannersLogo.png";
import { useStepStyles } from "../../utils/useStepTheme";

// The four RP Move tabs and the stack routes that count as each tab.
export type FitnessTab = "Dashboard" | "AchievementCard" | "CoinHistory" | "MyPlan";

export const TAB_OF_ROUTE: Record<string, FitnessTab | undefined> = {
  Dashboard: "Dashboard",
  AfterGoal: "Dashboard",
  AchievementCard: "AchievementCard",
  CoinHistory: "CoinHistory",
  MyPlan: "MyPlan",
};

export const FITNESS_TAB_BAR_HEIGHT = 64;

const TABS: { tab: FitnessTab; label: string; icon: string; iconActive: string }[] = [
  { tab: "Dashboard", label: "stepCounter:tabs.rpMove", icon: "shoe-print", iconActive: "shoe-print" },
  { tab: "AchievementCard", label: "stepCounter:tabs.achievements", icon: "trophy-outline", iconActive: "trophy" },
  { tab: "CoinHistory", label: "stepCounter:tabs.coinHistory", icon: "database-outline", iconActive: "database" },
  { tab: "MyPlan", label: "stepCounter:tabs.myPlan", icon: "account-outline", iconActive: "account" },
];

const C_LIGHT = {
  bar: "#FFFFFF",
  border: "#EEF0F8",
  active: "#773CFF",
  inactive: "#8A90A8",
  shadow: "#3B2F8F",
  plate: "#FFFFFF",
  ring: "#EFE8FF",
};
type Palette = typeof C_LIGHT;
const C_DARK: Palette = {
  bar: "#141A33",
  border: "rgba(174,188,255,0.14)",
  active: "#B59BFF",
  inactive: "#8A90B0",
  shadow: "#000000",
  plate: "#FFFFFF",
  ring: "#2A2F52",
};

// ─── Hiding the bar from inside a tab screen ─────────────────────────────────
// Dashboard renders its goal celebrations as in-screen overlays; they hide
// the bar while showing so the celebration is truly full-screen.

type SetHidden = (owner: object, hidden: boolean) => void;
export const FitnessChromeContext = createContext<SetHidden>(() => {});

export function useHideFitnessTabBar(hidden: boolean) {
  const setHidden = useContext(FitnessChromeContext);
  const owner = useRef({}).current;
  useEffect(() => {
    setHidden(owner, hidden);
    return () => setHidden(owner, false);
  }, [hidden, owner, setHidden]);
}

// ─── Bar ─────────────────────────────────────────────────────────────────────

type Props = {
  active: FitnessTab;
  onTabPress: (tab: FitnessTab) => void;
  onCenterPress: () => void;
};

const TabItem = React.memo(({ label, icon, active, onPress, color, underline, labelStyle, itemStyle }: {
  label: string; icon: string; active: boolean; onPress: () => void;
  color: string; underline: object; labelStyle: object; itemStyle: object;
}) => (
  <TouchableOpacity
    style={itemStyle}
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityRole="tab"
    accessibilityLabel={label}
    accessibilityState={{ selected: active }}
    hitSlop={{ top: 8, bottom: 8 }}
  >
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <Text style={[labelStyle, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>{label}</Text>
    {active && <View style={underline} />}
  </TouchableOpacity>
));

function FitnessTabBar({ active, onTabPress, onCenterPress }: Props) {
  const { palette: C, styles } = useStepStyles(C_LIGHT, C_DARK, createStyles);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const renderTab = (index: number) => {
    const item = TABS[index];
    const isActive = item.tab === active;
    return (
      <TabItem
        key={item.tab}
        label={t(item.label)}
        icon={isActive ? item.iconActive : item.icon}
        active={isActive}
        onPress={() => onTabPress(item.tab)}
        color={isActive ? C.active : C.inactive}
        underline={styles.underline}
        labelStyle={[styles.label, isActive && styles.labelActive]}
        itemStyle={styles.item}
      />
    );
  };

  return (
    <View style={[styles.bar, { height: FITNESS_TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {renderTab(0)}
      {renderTab(1)}
      <View style={styles.centerSpacer} />
      {renderTab(2)}
      {renderTab(3)}

      {/* Same logo and destination as the app-wide bar's center button. */}
      <TouchableOpacity
        style={styles.centerWrap}
        onPress={onCenterPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={t("common:tabs.home")}
      >
        <View style={styles.centerRing}>
          <View style={styles.centerPlate}>
            <Image source={RewardLogo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(FitnessTabBar);

const CENTER = 62;

const createStyles = (C: Palette) => StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
    backgroundColor: C.bar,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 14,
  },
  item: {
    flex: 1,
    height: FITNESS_TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11, fontWeight: "600", marginTop: 3 },
  labelActive: { fontWeight: "800" },
  underline: {
    position: "absolute",
    bottom: 5,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.active,
  },
  centerSpacer: { width: CENTER + 10 },
  // Sized to the logo only, so it never covers the neighbouring tabs.
  centerWrap: {
    position: "absolute",
    left: "50%",
    marginLeft: -(CENTER + 8) / 2,
    top: -CENTER / 2 + 4,
    width: CENTER + 8,
    height: CENTER + 8,
  },
  centerRing: {
    width: CENTER + 8,
    height: CENTER + 8,
    borderRadius: (CENTER + 8) / 2,
    backgroundColor: C.ring,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#773CFF",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 16,
  },
  centerPlate: {
    width: CENTER,
    height: CENTER,
    borderRadius: CENTER / 2,
    backgroundColor: C.plate,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: CENTER - 18, height: CENTER - 18 },
});
