import { Platform, type ViewStyle } from 'react-native';

// Single visual system for every step-tracker onboarding screen (Android + iOS).
export const OB = {
  bg: '#FFFFFF',
  bgAlt: '#F8F9FF',
  text: '#10152D',
  muted: '#646B80',
  subtle: '#9AA1B2',
  border: '#ECEEF5',
  track: '#E3E6EF',
  selected: '#8057FF',
  selectedBg: '#F6F2FF',
  lavender: '#F3F0FF',
  lavenderText: '#5B3FD9',
  glow: 'rgba(128,82,255,0.07)',
  glowBlue: 'rgba(66,107,255,0.06)',
  gradient: ['#426BFF', '#8052FF'],
  success: '#22B25F',
  successBg: '#E8F8EE',
  coin: '#F2A516',
  coinBg: '#FFF6E2',
  warning: '#9A5B00',
  warningBg: '#FFF6E5',
  error: '#C9303F',
  errorBg: '#FFF0F1',
  white: '#FFFFFF',
} as const;

export const OB_LAYOUT = {
  padding: 24,
  buttonHeight: 56,
  buttonRadius: 18,
  cardRadius: 22,
} as const;

export const softShadow = (elevation = 3, opacity = 0.08): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#2B2F6B',
      shadowOpacity: opacity,
      shadowRadius: elevation * 4,
      shadowOffset: { width: 0, height: elevation * 1.5 },
    },
    default: { elevation },
  }) as ViewStyle;
