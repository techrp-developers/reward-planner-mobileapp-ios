import type { ChatThemeKey } from '../types';

export type ChatThemePreset = {
  key: ChatThemeKey;
  name: string;
  accent: string;
  lightBackground: string;
  darkBackground: string;
  lightOtherBubble: string;
  darkOtherBubble: string;
};

export const CHAT_THEMES: ChatThemePreset[] = [
  { key: 'default', name: 'Classic', accent: '#7C3AED', lightBackground: '#FFFFFF', darkBackground: '#09090B', lightOtherBubble: '#F3F4F6', darkOtherBubble: '#27272A' },
  { key: 'violet', name: 'Violet', accent: '#7C3AED', lightBackground: '#F5F3FF', darkBackground: '#17102A', lightOtherBubble: '#EDE9FE', darkOtherBubble: '#312E81' },
  { key: 'ocean', name: 'Ocean', accent: '#0284C7', lightBackground: '#EFF6FF', darkBackground: '#071A2B', lightOtherBubble: '#DBEAFE', darkOtherBubble: '#0C4A6E' },
  { key: 'forest', name: 'Forest', accent: '#059669', lightBackground: '#F0FDF4', darkBackground: '#071C12', lightOtherBubble: '#DCFCE7', darkOtherBubble: '#14532D' },
  { key: 'sunset', name: 'Sunset', accent: '#EA580C', lightBackground: '#FFF7ED', darkBackground: '#25140A', lightOtherBubble: '#FFEDD5', darkOtherBubble: '#7C2D12' },
];

export function getChatTheme(key?: string | null) {
  return CHAT_THEMES.find(theme => theme.key === key) || CHAT_THEMES[0];
}
