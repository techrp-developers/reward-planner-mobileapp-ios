import { useMemo } from 'react';
import { useAppTheme } from '../../../theme/ThemeContext';

export function useBusTheme() {
  const { isDark, theme } = useAppTheme();
  return useMemo(() => ({
    isDark,
    background: theme.background,
    surface: theme.card,
    surfaceAlt: '#303038',
    text: '#F4F4F5',
    muted: '#B4B4BE',
    border: theme.border,
    accent: '#FF8297',
    accentSurface: '#3B202B',
    success: '#6EE7B7',
    successSurface: '#16382D',
    info: '#93C5FD',
    infoSurface: '#1C2C48',
    warning: '#FCD34D',
    warningSurface: '#3B301C',
  }), [isDark, theme]);
}

export type BusTheme = ReturnType<typeof useBusTheme>;

export function useBusStyles<T>(createStyles: (theme: BusTheme) => T) {
  const busTheme = useBusTheme();
  const styles = useMemo(() => createStyles(busTheme), [createStyles, busTheme]);
  return { styles, busTheme };
}
