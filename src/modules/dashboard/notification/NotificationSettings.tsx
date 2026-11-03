import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, AppState, FlatList, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { RESULTS } from "react-native-permissions";
import { useAppTheme } from "../../../theme/ThemeContext";
import { LANGUAGES } from "../../../i18n/languages";
import OrderHeading from "../../ecommerce/constants/heading/OrderHeading";
import {
  getNotificationPermissionDetail,
  getPushDiagnostics,
  isPermissionGranted,
  openDeviceNotificationSettings,
  requestPushPermission,
  type NotificationPermissionDetail,
} from "../../notifications/FCMService";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "./notificationPreferencesAPI";

const QUIET_START = "22:00";
const QUIET_END = "07:00";
const ACCENT = "#852BAF";
// Half-hour steps, "00:00" to "23:30".
const QUIET_TIMES = Array.from({ length: 48 }, (_, index) =>
  `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);

type Update = Partial<Omit<NotificationPreferences, "stored">>;
type SaveState = "idle" | "saving" | "saved";

// Two separate things live here: the device's permission (owned by iOS or
// Android, so only shown and linked) and the backend's preferences (the source
// of truth for what is sent). Promotional switches start OFF: no saved choice
// is never treated as consent, and allowing notifications does not change them.
export default function NotificationSettings() {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [permission, setPermission] = useState<NotificationPermissionDetail | null>(null);
  const [picking, setPicking] = useState<"start" | "end" | null>(null);
  const [quietError, setQuietError] = useState("");

  const load = useCallback(() => {
    setError("");
    getNotificationPreferences()
      .then(setPrefs)
      .catch(() => setError(t("dashboard:notificationSettings.loadFailed")));
  }, [t]);
  useEffect(load, [load]);

  // The user may have changed this in the phone's settings while away.
  useEffect(() => {
    const refresh = () => {
      getNotificationPermissionDetail().then(setPermission).catch(() => {});
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (saveState !== "saved") return undefined;
    const timer = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [saveState]);

  // Only the changed fields are sent; the screen shows what the server confirms
  // and goes back to the previous values if the save fails.
  const save = async (update: Update) => {
    if (!prefs || saveState === "saving") return;
    const previous = prefs;
    setPrefs({ ...prefs, ...update });
    setSaveState("saving");
    try {
      setPrefs(await updateNotificationPreferences(update));
      setSaveState("saved");
    } catch {
      setPrefs(previous);
      setSaveState("idle");
      Alert.alert(
        t("dashboard:notificationSettings.notSavedTitle"),
        t("dashboard:notificationSettings.notSavedBody"),
      );
    }
  };

  const chooseQuietTime = (time: string) => {
    if (!prefs || !picking) return;
    const start = picking === "start" ? time : prefs.quiet_hours_start ?? QUIET_START;
    const end = picking === "end" ? time : prefs.quiet_hours_end ?? QUIET_END;
    setPicking(null);
    if (start === end) {
      setQuietError(t("dashboard:notificationSettings.quietSame"));
      return;
    }
    setQuietError("");
    save({ quiet_hours_start: start, quiet_hours_end: end });
  };

  // iOS can ask only once; after that, and always on Android, the choice lives
  // in the phone's settings.
  const canAsk = Platform.OS === "ios" && permission?.status === RESULTS.DENIED;
  const enable = () => {
    if (canAsk) {
      requestPushPermission()
        .then(() => getNotificationPermissionDetail().then(setPermission))
        .catch(() => {});
    } else {
      openDeviceNotificationSettings().catch(() => {});
    }
  };

  const colors = useMemo(() => isDark
    ? { screen: "#111827", card: "#1F2937", text: "#F3F4F6", muted: "#9CA3AF", line: "#374151", chip: "#111827" }
    : { screen: "#F5F3FF", card: "#FFFFFF", text: "#111827", muted: "#6B7280", line: "#ECE8F4", chip: "#F5F3FF" }, [isDark]);
  const text = { color: colors.text };
  const muted = { color: colors.muted };
  const card = { backgroundColor: colors.card };
  const quietOn = Boolean(prefs?.quiet_hours_start && prefs?.quiet_hours_end);
  const granted = permission !== null && isPermissionGranted(permission.status);
  const statusKey = !permission ? null
    : granted
      ? permission.provisional ? "statusQuiet" : "statusOn"
      : canAsk ? "statusNotAsked" : "statusOff";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.screen }]}>
      <OrderHeading title={t("dashboard:notificationSettings.title")} onBackPress={() => navigation.goBack()} showHelp={false} isDark={isDark} />
      {!prefs ? (
        <View style={styles.centered}>
          {error ? (
            <TouchableOpacity accessibilityRole="button" onPress={load} style={styles.touch}>
              <Text style={styles.link}>{error} {t("dashboard:notificationSettings.retry")}</Text>
            </TouchableOpacity>
          ) : <ActivityIndicator size="large" color="#6D5AE6" />}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {statusKey ? (
            <View testID="permission-status" style={[styles.card, card]}>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons
                  name={granted ? (permission?.provisional ? "bell-sleep-outline" : "bell-check-outline") : "bell-off-outline"}
                  size={24}
                  color={granted ? ACCENT : colors.muted}
                />
                <View style={styles.rowText}>
                  <Text style={[styles.heading, text]}>{t("dashboard:notificationSettings.statusTitle")}</Text>
                  <Text style={[styles.hint, muted]}>{t(`dashboard:notificationSettings.${statusKey}`)}</Text>
                </View>
              </View>
              {granted && !permission?.provisional ? null : (
                <TouchableOpacity accessibilityRole="button" onPress={enable} style={styles.primary}>
                  <Text style={styles.primaryText}>
                    {t(canAsk ? "dashboard:notificationSettings.enable" : "dashboard:notificationSettings.openSettings")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <View style={[styles.card, card]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.heading, text]}>{t("dashboard:notificationSettings.sectionPreferences")}</Text>
              {saveState === "idle" ? null : (
                <Text accessibilityLiveRegion="polite" style={[styles.saveState, muted]}>
                  {t(saveState === "saving" ? "dashboard:notificationSettings.saving" : "dashboard:notificationSettings.saved")}
                </Text>
              )}
            </View>
            {/* Informational only: the backend has no preference for these. */}
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, text]}>{t("dashboard:notificationSettings.operational")}</Text>
                <Text style={[styles.hint, muted]}>{t("dashboard:notificationSettings.operationalHint")}</Text>
              </View>
              <Text style={[styles.alwaysOn, muted]}>{t("dashboard:notificationSettings.alwaysOn")}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.line }]} />
            <Row
              label={t("dashboard:notificationSettings.offers")}
              hint={t("dashboard:notificationSettings.offersHint")}
              value={prefs.marketing_enabled}
              onChange={(value) => save({ marketing_enabled: value })}
              textStyle={text}
              mutedStyle={muted}
            />
            <View style={[styles.divider, { backgroundColor: colors.line }]} />
            <Row
              label={t("dashboard:notificationSettings.engagement")}
              hint={t("dashboard:notificationSettings.engagementHint")}
              value={prefs.engagement_enabled}
              onChange={(value) => save({ engagement_enabled: value })}
              textStyle={text}
              mutedStyle={muted}
            />
          </View>

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
                    style={[styles.languageButton, { borderColor: colors.line }, selected && styles.languageSelected]}
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
              label={t("dashboard:notificationSettings.quietHoursTitle")}
              hint={t("dashboard:notificationSettings.quietHoursHint")}
              value={quietOn}
              onChange={(value) => {
                setQuietError("");
                save(value
                  ? { quiet_hours_start: QUIET_START, quiet_hours_end: QUIET_END }
                  : { quiet_hours_start: null, quiet_hours_end: null });
              }}
              textStyle={text}
              mutedStyle={muted}
            />
            {quietOn ? (
              <View style={styles.timeRow}>
                {(["start", "end"] as const).map((which) => (
                  <TouchableOpacity
                    key={which}
                    testID={`quiet-${which}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(which === "start" ? "dashboard:notificationSettings.quietFrom" : "dashboard:notificationSettings.quietTo")} ${which === "start" ? prefs.quiet_hours_start : prefs.quiet_hours_end}`}
                    style={[styles.timeButton, { backgroundColor: colors.chip, borderColor: colors.line }]}
                    onPress={() => setPicking(which)}
                  >
                    <Text style={[styles.hint, muted]}>
                      {t(which === "start" ? "dashboard:notificationSettings.quietFrom" : "dashboard:notificationSettings.quietTo")}
                    </Text>
                    <Text style={[styles.timeText, text]}>{which === "start" ? prefs.quiet_hours_start : prefs.quiet_hours_end}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {quietError ? <Text style={styles.error}>{quietError}</Text> : null}
          </View>

          <TouchableOpacity
            testID="device-settings"
            accessibilityRole="button"
            onPress={() => { openDeviceNotificationSettings().catch(() => {}); }}
            style={[styles.card, card, styles.deviceRow]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, text]}>{t("dashboard:notificationSettings.deviceTitle")}</Text>
              <Text style={[styles.hint, muted]}>{t("dashboard:notificationSettings.deviceHint")}</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color={colors.muted} />
          </TouchableOpacity>

          <Text style={[styles.footnote, muted]}>{t("dashboard:notificationSettings.footnote")}</Text>

          {__DEV__ ? (
            <Text selectable style={[styles.diagnostics, muted]}>
              {JSON.stringify(getPushDiagnostics(), null, 2)}
            </Text>
          ) : null}
        </ScrollView>
      )}

      <Modal visible={picking !== null} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(null)} accessibilityLabel={t("common:actions.cancel")}>
          <View style={[styles.picker, card]} accessibilityViewIsModal>
            <Text style={[styles.heading, text, styles.pickerTitle]}>{t("dashboard:notificationSettings.quietPick")}</Text>
            <FlatList
              data={QUIET_TIMES}
              keyExtractor={(time) => time}
              initialNumToRender={QUIET_TIMES.length}
              initialScrollIndex={Math.max(0, QUIET_TIMES.indexOf(
                (picking === "end" ? prefs?.quiet_hours_end : prefs?.quiet_hours_start) ?? QUIET_START))}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
              renderItem={({ item: time }) => (
                <TouchableOpacity testID={`quiet-option-${time}`} accessibilityRole="button" style={styles.option} onPress={() => chooseQuietTime(time)}>
                  <Text style={[styles.timeText, text]}>{time}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
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
      <Switch value={value} onValueChange={onChange} trackColor={{ true: ACCENT }} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  touch: { minHeight: 48, justifyContent: "center" },
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 16, padding: 16 },
  statusRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  saveState: { fontSize: 12, fontWeight: "600" },
  heading: { fontSize: 16, fontWeight: "700" },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  primary: { marginTop: 16, minHeight: 48, borderRadius: 12, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 12, minHeight: 48 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  alwaysOn: { fontSize: 12, fontWeight: "600" },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  languageRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  languageButton: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  languageSelected: { backgroundColor: ACCENT, borderColor: ACCENT },
  languageText: { fontSize: 14, fontWeight: "600" },
  languageTextSelected: { color: "#FFFFFF" },
  timeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  timeButton: { flex: 1, minHeight: 56, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, justifyContent: "center" },
  timeText: { fontSize: 16, fontWeight: "600" },
  error: { color: "#DC2626", fontSize: 12, marginTop: 8 },
  deviceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  footnote: { fontSize: 12, lineHeight: 17, textAlign: "center" },
  diagnostics: { fontSize: 11 },
  link: { color: "#6D5AE6", fontWeight: "600", textAlign: "center" },
  backdrop: { flex: 1, justifyContent: "center", padding: 32, backgroundColor: "rgba(15, 10, 30, 0.45)" },
  picker: { maxHeight: 400, paddingBottom: 8 },
  pickerTitle: { marginBottom: 8 },
  option: { height: 48, justifyContent: "center", paddingHorizontal: 8 },
});
