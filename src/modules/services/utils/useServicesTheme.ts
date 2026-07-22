import { useMemo } from 'react';
import { useAppTheme } from '../../../theme/ThemeContext';

export const useServicesTheme = () => {
  const { isDark, theme } = useAppTheme();

  return useMemo(
    () => ({
      isDark,
      appTheme: theme,
      colors: {
        background: isDark ? '#09090B' : '#FAFAFC',
        surface: isDark ? '#26262B' : '#FFFFFF',
        surfaceAlt: isDark ? '#303038' : '#F7F7FA',
        elevated: isDark ? '#2B2B31' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#111827',
        textStrong: isDark ? '#F9FAFB' : '#1F2937',
        muted: isDark ? '#A1A1AA' : '#6B7280',
        subtle: isDark ? '#71717A' : '#9CA3AF',
        border: isDark ? 'rgba(255,255,255,0.14)' : '#ECE7FF',
        borderSoft: isDark ? 'rgba(255,255,255,0.12)' : '#F0F0F0',
        divider: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB',
        iconBg: isDark ? '#34343C' : '#F3EEFF',
        skeleton: isDark ? '#34343C' : '#E5E7EB',
        shadow: isDark ? '#000000' : '#5B47A3',
        primary: isDark ? '#A78BFA' : '#8665FF',
        primaryDark: isDark ? '#7C3AED' : '#5B47A3',
        accent: isDark ? '#F472B6' : '#FC8BAD',
        success: isDark ? '#34D399' : '#16A34A',
      },
      gradients: {
        primary: isDark ? ['#A78BFA', '#7C3AED'] : ['#8665FF', '#5B47A3'],
        brand: isDark ? ['#EC4899', '#8B5CF6'] : ['#A654CD', '#FC8BAD'],
        card: isDark ? ['#303038', '#26262B'] : ['#F7F7FF', '#E8E8F9'],
      },
    }),
    [isDark, theme],
  );
};
