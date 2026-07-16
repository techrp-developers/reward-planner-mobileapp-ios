import { useAppTheme } from '../../../theme/ThemeContext';

const light = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#342B45',
  textStrong: '#1F2937',
  muted: '#9CA3AF',
  primary: '#3545A3',
  border: 'rgba(134,101,255,0.12)',
  shadow: '#8665FF',
};

const dark = {
  background: '#0D0F1A',
  surface: '#18181B',
  text: '#E5E7EB',
  textStrong: '#FFFFFF',
  muted: '#6B7280',
  primary: '#6B7FD4',
  border: 'rgba(255,255,255,0.08)',
  shadow: '#000000',
};

export const useServicesTheme = () => {
  const { isDark } = useAppTheme();
  return {
    isDark,
    colors: isDark ? dark : light,
  };
};
