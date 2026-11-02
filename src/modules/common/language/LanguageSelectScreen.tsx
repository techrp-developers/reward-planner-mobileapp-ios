import React, { useMemo, useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../../../i18n";
import { useAppLanguage } from "../../../i18n/LanguageContext";
import { DEFAULT_LANGUAGE, type AppLanguage } from "../../../i18n/languages";
import { useAppTheme } from "../../../theme/ThemeContext";
import { AuthButton } from "../auth/components/AuthLayout";
import Logo from "../../../assets/menu/logo.png";
import LanguageOptionList from "./LanguageOptionList";

/**
 * First-login language preference, shown once per user right after sign-in.
 * English is preselected. The screen previews the highlighted language; the
 * app-wide language changes only when the user continues.
 */
export default function LanguageSelectScreen() {
  const { isDark, theme } = useAppTheme();
  const { completeSelection } = useAppLanguage();
  const [selected, setSelected] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  // Preview the highlighted language without switching the app yet.
  const t = useMemo(() => i18n.getFixedT(selected), [selected]);

  const onContinue = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await completeSelection(selected);
    } catch {
      savingRef.current = false;
      setSaving(false);
      Alert.alert(t("common:errors.generic"), t("language:saveFailed"));
    }
  };

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={[styles.screen, { backgroundColor: isDark ? "#100E18" : "#F6F1FC" }]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.brand}>
          <Image source={Logo} style={styles.logo} resizeMode="contain" accessible={false} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          {t("language:welcomeTitle")}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#E9D5FF" : "#852BAF" }]}>{t("language:chooseTitle")}</Text>
        <Text style={[styles.body, { color: theme.secondaryText }]}>{t("language:chooseBody")}</Text>
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <LanguageOptionList value={selected} onChange={setSelected} disabled={saving} t={t} />
        </View>
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: isDark ? "#100E18" : "#F6F1FC" }]}>
        <AuthButton animatePress title={t("common:actions.continue")} busy={saving} onPress={() => void onContinue()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  brand: { alignItems: "center", marginBottom: 20 },
  logo: { width: 64, height: 64 },
  title: { fontSize: 26, fontWeight: "700", lineHeight: 36, textAlign: "center" },
  subtitle: { fontSize: 17, fontWeight: "600", lineHeight: 26, textAlign: "center", marginTop: 8 },
  body: { fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 8, marginBottom: 24 },
  card: { borderRadius: 26, borderWidth: 1, padding: 16 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
});
