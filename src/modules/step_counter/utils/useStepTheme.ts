import { useAppTheme } from "../../../theme/ThemeContext";

/**
 * Step-counter screens follow the app-wide light/dark setting (AppThemeProvider).
 * Each screen keeps a light and a dark palette with identical keys and builds
 * its StyleSheet from the active one, the same pattern as useBusStyles.
 */
export function useStepPalette<P>(light: P, dark: P): { palette: P; isDark: boolean } {
  const { isDark } = useAppTheme();
  return { palette: isDark ? dark : light, isDark };
}

// Styles are built once per (factory, palette) and shared by every component
// instance, so list rows and calendar cells don't each rebuild a StyleSheet.
const styleCache = new WeakMap<Function, Map<unknown, unknown>>();

export function useStepStyles<P, S>(light: P, dark: P, createStyles: (palette: P) => S) {
  const { palette, isDark } = useStepPalette(light, dark);
  let byPalette = styleCache.get(createStyles);
  if (!byPalette) {
    byPalette = new Map();
    styleCache.set(createStyles, byPalette);
  }
  let styles = byPalette.get(palette) as S | undefined;
  if (!styles) {
    styles = createStyles(palette);
    byPalette.set(palette, styles);
  }
  return { palette, styles, isDark };
}
