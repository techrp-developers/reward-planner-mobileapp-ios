import React, { useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useAppLanguage } from "../../../i18n/LanguageContext";
import type { AppLanguage } from "../../../i18n/languages";
import { useAppTheme } from "../../../theme/ThemeContext";
import LanguageOptionList from "./LanguageOptionList";

/** Profile → Settings → App Language. Switching applies instantly, without a restart. */
export default function LanguageSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useAppTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useAppLanguage();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const change = async (next: AppLanguage) => {
    if (next === language || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await setLanguage(next);
    } catch {
      Alert.alert(t("common:errors.generic"), t("language:saveFailed"));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F8FAFC" }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.goBack")}
          onPress={() => navigation.goBack()}
          style={styles.back}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: theme.text }]}>
          {t("language:settingsTitle")}
        </Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={[styles.description, { color: theme.secondaryText }]}>{t("language:settingsBody")}</Text>
        <LanguageOptionList value={language} onChange={(next) => void change(next)} disabled={saving} t={t} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700" },
  content: { padding: 20, width: "100%", maxWidth: 560, alignSelf: "center" },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
});
