import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { InteractionManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightTheme, DarkTheme, IndependenceLightTheme, IndependenceDarkTheme } from "./colors";
import { isFestivePeriod } from "../utils/festiveTheme";

const THEME_KEY = "@rewardsplanners_dark_theme";

type ThemeColors = typeof LightTheme;

interface ThemeContextType {
  isDark: boolean;
  isFestive: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Computed once per session — app restart picks up date change.
  const isFestive = useMemo(() => isFestivePeriod(), []);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((val) => {
        if (val === "dark") setIsDark(true);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      InteractionManager.runAfterInteractions(() => {
        AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light").catch(() => {});
      });
      return next;
    });
  }, []);

  const contextValue = useMemo(() => {
    const theme = isFestive
      ? isDark ? IndependenceDarkTheme : IndependenceLightTheme
      : isDark ? DarkTheme : LightTheme;

    return { isDark, isFestive, theme, toggleTheme };
  }, [isDark, isFestive, toggleTheme]);

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
};
