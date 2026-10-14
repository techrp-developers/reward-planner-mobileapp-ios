import { useAppTheme } from "../../../theme/ThemeContext";

export const CHAT_UI = {
  overlay: "rgba(11,16,24,0.48)",
  radius: { sheet: 28 },
};

export function useChatColors() {
  const { theme, isDark } = useAppTheme();
  return {
    ...theme,
    primary: isDark ? "#A78BFA" : "#6A00FF",
    background: isDark ? "#0B1018" : "#F8FAFC",
    card: isDark ? "#1B2432" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#111827",
    secondaryText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#2A3545" : "#E8ECF2",
    isDark,
  };
}
