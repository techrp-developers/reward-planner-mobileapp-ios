import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";

import BottomTabs, { TAB_BAR_HEIGHT, type TabKey } from "../../../../bottombar/BottomTabs";

// The four RP Move tabs and the stack routes that count as each tab.
export type FitnessTab = "Dashboard" | "AchievementCard" | "CoinHistory" | "MyPlan";

export const TAB_OF_ROUTE: Record<string, FitnessTab | undefined> = {
  Dashboard: "Dashboard",
  AfterGoal: "Dashboard",
  AchievementCard: "AchievementCard",
  CoinHistory: "CoinHistory",
  MyPlan: "MyPlan",
};

// Height of the region reserved below the screens for the bar (plus the
// device's bottom inset). Screens end above it — the bar never covers content.
export const FITNESS_TAB_BAR_HEIGHT = TAB_BAR_HEIGHT;

// The raised center logo sticks this far above the reserved region; tab
// screens receive it as their bottom inset so their last item clears it.
export const FITNESS_TAB_LOGO_OVERHANG = 26;

const KEY_OF_TAB: Record<FitnessTab, TabKey> = {
  Dashboard: "RPMove",
  AchievementCard: "Achievements",
  CoinHistory: "CoinHistory",
  MyPlan: "MyPlan",
};

const TAB_OF_KEY: Partial<Record<TabKey, FitnessTab>> = {
  RPMove: "Dashboard",
  Achievements: "AchievementCard",
  CoinHistory: "CoinHistory",
  MyPlan: "MyPlan",
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

/** The app-wide bottom bar (same look as Product, Services, Bus, Payments) with the RP Move tabs. */
function FitnessTabBar({ active, onTabPress, onCenterPress }: Props) {
  const handlePress = useCallback((key: TabKey) => {
    const tab = TAB_OF_KEY[key];
    if (tab) onTabPress(tab);
  }, [onTabPress]);

  return (
    <BottomTabs
      activeMode="Fitness"
      layoutMode="navigator"
      activeTabKey={KEY_OF_TAB[active]}
      onTabPress={handlePress}
      onCenterPress={onCenterPress}
    />
  );
}

export default React.memo(FitnessTabBar);
