import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, AppState, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RESULTS } from "react-native-permissions";
import { useAppTheme } from "../../../theme/ThemeContext";
import { LANGUAGES } from "../../../i18n/languages";
import OrderHeading from "../../ecommerce/constants/heading/OrderHeading";
import {
  getNotificationPermissionStatus,
  getPushDiagnostics,
  isPermissionGranted,
  openNotificationSettings,
  requestPushPermission,
} from "../../notifications/FCMService";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "./notificationPreferencesAPI";

const QUIET_START = "22:00";
const QUIET_END = "07:00";

// Promotional switches start OFF: no saved choice is never treated as consent,
// and allowing notifications on the device does not change them.
export default function NotificationSettings() {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState<string | null>(null);

  const load = useCallback(() => {
    setError("");
    getNotificationPreferences()
      .then(setPrefs)
      .catch(() => setError(t("dashboard:notificationSettings.loadFailed")));
  }, [t]);
  useEffect(load, [load]);

  // The user may have changed this in iOS Settings while the app was away.
  useEffect(() => {
    const refresh = () => {
      getNotificationPermissionStatus().then(setPermission).catch(() => {});
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, []);

  const save = async (update: Partial<Omit<NotificationPreferences, "stored">>) => {
    if (!prefs || saving) return;
    const previous = prefs;
    setPrefs({ ...prefs, ...update });
    setSaving(true);
    try {
      setPrefs(await updateNotificationPreferences(update));
    } catch {
      setPrefs(previous);
      Alert.alert(
        t("dashboard:notificationSettings.notSavedTitle"),
        t("dashboard:notificationSettings.notSavedBody"),
      );
    } finally {
      setSaving(false);
    }
  };

  const enable = () => {
    if (permission === RESULTS.DENIED) {
      requestPushPermission().then(setPermission).catch(() => {});
    } else {
      openNotificationSettings().catch(() => {});
    }
  };

  const text = { color: isDark ? "#F3F4F6" : "#111827" };
  const muted = { color: isDark ? "#9CA3AF" : "#6B7280" };
  const card = { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" };
  const quietOn = Boolean(prefs?.quiet_hours_start && prefs?.quiet_hours_end);
  const permissionGranted = permission !== null && isPermissionGranted(permission);

  return (
    <SafeAreaView style={[styles.safe, isDark ? styles.safeDark : styles.safeLight]}>
      <OrderHeading title={t("dashboard:notificationSettings.title")} onBackPress={() => navigation.goBack()} showHelp={false} isDark={isDark} />
      {!prefs ? (
        <View style={styles.centered}>
          {error ? (
            <TouchableOpacity onPress={load}>
              <Text style={styles.link}>{error} {t("dashboard:notificationSettings.retry")}</Text>
            </TouchableOpacity>
          ) : <ActivityIndicator size="large" color="#6D5AE6" />}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {Platform.OS === "ios" && permission !== null ? (
            <View style={[styles.card, card]}>
              <Text style={[styles.heading, text]}>{t("dashboard:notificationSettings.statusTitle")}</Text>
              <Text style={[styles.hint, muted]}>
                {t(permissionGranted
                  ? "dashboard:notificationSettings.statusOn"
                  : permission === RESULTS.DENIED
                    ? "dashboard:notificationSettings.statusNotAsked"
                    : "dashboard:notificationSettings.statusOff")}
              </Text>
              {permissionGranted ? null : (
                <TouchableOpacity accessibilityRole="button" onPress={enable} style={styles.statusAction}>
                  <Text style={styles.link}>
                    {t(permission === RESULTS.DENIED
                      ? "dashboard:notificationSettings.enable"
                      : "dashboard:notificationSettings.openSettings")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <View style={[styles.card, card]}>
            <Text style={[styles.heading, text]}>{t("dashboard:notificationSettings.languageTitle")}</Text>
            <Text style={[styles.hint, muted]}>{t("dashboard:notificationSettings.languageHint")}</Text>
            <View style={styles.languageRow}>
              {LANGUAGES.map((language) => {
                const selected = prefs.language === language.code;
                return (
                  <TouchableOpacity
                    key={language.code}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.languageButton, selected && styles.languageSelected]}
                    onPress={() => save({ language: language.code })}
                  >
                    <Text style={[styles.languageText, selected ? styles.languageTextSelected : text]}>{language.nativeName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, card]}>
            <Row
              label={t("dashboard:notificationSettings.offers")}
              hint={t("dashboard:notificationSettings.offersHint")}
              value={prefs.marketing_enabled}
              onChange={(value) => save({ marketing_enabled: value })}
              textStyle={text}
              mutedStyle={muted}
            />
            <Row
              label={t("dashboard:notificationSettings.engagement")}
              hint={t("dashboard:notificationSettings.engagementHint")}
              value={prefs.engagement_enabled}
              onChange={(value) => save({ engagement_enabled: value })}
              textStyle={text}
              mutedStyle={muted}
            />
            <Row
              label={t("dashboard:notificationSettings.quietHours", { start: QUIET_START, end: QUIET_END })}
              hint={t("dashboard:notificationSettings.quietHoursHint")}
              value={quietOn}
              onChange={(value) => save(value
                ? { quiet_hours_start: QUIET_START, quiet_hours_end: QUIET_END }
                : { quiet_hours_start: null, quiet_hours_end: null })}
              textStyle={text}
              mutedStyle={muted}
            />
          </View>

          <Text style={[styles.footnote, muted]}>{t("dashboard:notificationSettings.footnote")}</Text>

          {__DEV__ ? (
            <Text selectable style={[styles.diagnostics, muted]}>
              {JSON.stringify(getPushDiagnostics(), null, 2)}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, hint, value, onChange, textStyle, mutedStyle }: {
  label: string; hint: string; value: boolean; onChange: (value: boolean) => void;
  textStyle: object; mutedStyle: object;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, textStyle]}>{label}</Text>
        <Text style={[styles.hint, mutedStyle]}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: "#852BAF" }} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  safeDark: { backgroundColor: "#111827" },
  safeLight: { backgroundColor: "#F5F3FF" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 16, padding: 16 },
  heading: { fontSize: 16, fontWeight: "700" },
  hint: { fontSize: 12, marginTop: 4 },
  statusAction: { marginTop: 10 },
  languageRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  languageButton: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#D1D5DB", paddingVertical: 10, alignItems: "center" },
  languageSelected: { backgroundColor: "#852BAF", borderColor: "#852BAF" },
  languageText: { fontSize: 14, fontWeight: "600" },
  languageTextSelected: { color: "#FFFFFF" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  footnote: { fontSize: 12, textAlign: "center" },
  diagnostics: { fontSize: 11 },
  link: { color: "#6D5AE6", fontWeight: "600", textAlign: "center" },
});
