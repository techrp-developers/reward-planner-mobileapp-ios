import { useMemo } from 'react';
import { useAppTheme } from '../../../theme/ThemeContext';

export const useBbpsTheme = () => {
  const { isDark, theme } = useAppTheme();

  const bbps = useMemo(
    () => ({
      isDark,
      appTheme: theme,
      colors: {
        background: isDark ? '#09090B' : '#F8F9FE',
        surface: isDark ? '#26262B' : '#FFFFFF',
        surfaceAlt: isDark ? '#303038' : '#FAFAFC',
        elevated: isDark ? '#2B2B31' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#111827',
        textStrong: isDark ? '#F9FAFB' : '#1A1A2E',
        muted: isDark ? '#A1A1AA' : '#6B7280',
        subtle: isDark ? '#71717A' : '#888888',
        border: isDark ? 'rgba(255,255,255,0.14)' : '#ECE7FF',
        borderSoft: isDark ? 'rgba(255,255,255,0.12)' : '#F0F0F0',
        divider: isDark ? 'rgba(255,255,255,0.12)' : '#F3F4F6',
        iconBg: isDark ? '#34343C' : '#F9FAFB',
        skeleton: isDark ? '#34343C' : '#E5E7EB',
        shadow: isDark ? '#000000' : '#5B47A3',
        primary: isDark ? '#A78BFA' : '#8665FF',
        primaryDark: isDark ? '#7C3AED' : '#5B47A3',
        accent: isDark ? '#F472B6' : '#FC8BAD',
      },
      gradients: {
        primary: isDark ? ['#A78BFA', '#7C3AED'] : ['#8665FF', '#5B47A3'],
        brand: isDark ? ['#EC4899', '#8B5CF6'] : ['#A654CD', '#FC8BAD'],
      },
    }),
    [isDark, theme],
  );

  return bbps;
};
