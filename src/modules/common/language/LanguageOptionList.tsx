import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { TFunction } from "i18next";
import { useAppTheme } from "../../../theme/ThemeContext";
import { LANGUAGES, type AppLanguage } from "../../../i18n/languages";

/** Reward Planners brand purple, as used by the sign-in screens. */
export const BRAND_PURPLE = "#852BAF";
export const BRAND_PURPLE_DARK = "#C084FC";

type Props = {
  value: AppLanguage;
  onChange: (language: AppLanguage) => void;
  disabled?: boolean;
  /** Translator for labels, so a picker can preview a language before it is applied. */
  t: TFunction;
};

export default function LanguageOptionList({ value, onChange, disabled, t }: Props) {
  const { isDark, theme } = useAppTheme();
  const accent = isDark ? BRAND_PURPLE_DARK : BRAND_PURPLE;
  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {LANGUAGES.map((language) => {
        const selected = language.code === value;
        const showEnglishName = language.code !== "en";
        return (
          <TouchableOpacity
            key={language.code}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected, disabled }}
            accessibilityLabel={t("language:optionLabel", {
              nativeName: language.nativeName,
              englishName: language.englishName,
            })}
            disabled={disabled}
            activeOpacity={0.8}
            onPress={() => onChange(language.code)}
            style={[
              styles.card,
              {
                backgroundColor: selected
                  ? isDark ? "rgba(192,132,252,0.12)" : "rgba(133,43,175,0.07)"
                  : theme.background,
                borderColor: selected ? accent : theme.border,
              },
            ]}
          >
            <View style={[styles.glyph, { backgroundColor: selected ? accent : isDark ? "#27272A" : "#F3E8FF" }]}>
              <Text style={[styles.glyphText, { color: selected ? "#FFFFFF" : accent }]}>
                {language.code === "en" ? "Aa" : language.code === "hi" ? "अ" : "म"}
              </Text>
            </View>
            <View style={styles.names}>
              <Text style={[styles.native, { color: theme.text }]}>{language.nativeName}</Text>
              {showEnglishName && (
                <Text style={[styles.english, { color: theme.secondaryText }]}>{language.englishName}</Text>
              )}
            </View>
            <View
              style={[
                styles.radio,
                { borderColor: selected ? accent : isDark ? "#52525B" : "#CBD5E1" },
                selected && { backgroundColor: accent },
              ]}
            >
              {selected && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    minHeight: 72,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  glyph: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  glyphText: { fontSize: 18, fontWeight: "700" },
  names: { flex: 1 },
  native: { fontSize: 17, fontWeight: "600", lineHeight: 26 },
  english: { fontSize: 13, lineHeight: 19, marginTop: 1 },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
