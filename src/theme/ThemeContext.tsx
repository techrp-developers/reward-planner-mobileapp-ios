// src/theme/ThemeContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { InteractionManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightTheme, DarkTheme } from "./colors";

const THEME_KEY = '@rewardsplanners_dark_theme';

type ThemeColors = typeof LightTheme;

interface ThemeContextType {
  isDark: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark]     = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted preference once on mount — prevents theme flash
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(val => { if (val === 'dark') setIsDark(true); })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      // Persist after current UI interactions so the visual toggle wins the frame.
      InteractionManager.runAfterInteractions(() => {
        AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
      });
      return next;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      isDark,
      theme: isDark ? DarkTheme : LightTheme,
      toggleTheme,
    }),
    [isDark, toggleTheme],
  );

  // Wait for AsyncStorage before rendering children — avoids a light→dark flash
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
