// src/theme/ThemeContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
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
      // Persist async without blocking the toggle
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  }, []);

  // Wait for AsyncStorage before rendering children — avoids a light→dark flash
  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={{
      isDark,
      theme: isDark ? DarkTheme : LightTheme,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
};
