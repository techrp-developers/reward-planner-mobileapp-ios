import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../../theme/ThemeContext";

const logo = require("../../assets/homepage/RewardPlannersLogo.png");
const ACCENT = "#6D5AE6";
const BENEFITS = [
  ["package-variant-closed", "benefitOrders"],
  ["calendar-check-outline", "benefitBookings"],
  ["gift-outline", "benefitRewards"],
  ["tag-outline", "benefitOffers"],
] as const;

type Props = {
  visible: boolean;
  onEnable: () => void;
  onNotNow: () => void;
};

// Branded explanation shown once, before the system permission dialog. It is
// clearly the app's own sheet, and the system dialog always follows "Enable".
export default function NotificationPermissionSheet({ visible, onEnable, onNotNow }: Props) {
  const { t } = useTranslation();
  const { isDark } = useAppTheme();
  const colors = isDark
    ? { sheet: "#1E1B2E", title: "#FFFFFF", body: "#C9C5DA", halo: "#2E2748" }
    : { sheet: "#FFFFFF", title: "#1F1A33", body: "#5B5670", halo: "#F1EDFF" };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onNotNow} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.sheet }]} accessibilityViewIsModal>
          <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
          <View style={[styles.halo, { backgroundColor: colors.halo }]}>
            <MaterialCommunityIcons name="bell-ring-outline" size={40} color={ACCENT} />
          </View>
          <Text style={[styles.title, { color: colors.title }]} accessibilityRole="header">
            {t("dashboard:notificationSettings.permissionTitle")}
          </Text>
          <Text style={[styles.body, { color: colors.body }]}>
            {t("dashboard:notificationSettings.permissionBody")}
          </Text>
          <View style={styles.benefits}>
            {BENEFITS.map(([icon, key]) => (
              <View key={key} style={styles.benefit}>
                <MaterialCommunityIcons name={icon} size={20} color={ACCENT} />
                <Text style={[styles.benefitText, { color: colors.title }]}>{t(`dashboard:notificationSettings.${key}`)}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.note, { color: colors.body }]}>
            {t("dashboard:notificationSettings.permissionNote")}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onEnable}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <Text style={styles.primaryText}>{t("dashboard:notificationSettings.enable")}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onNotNow} style={styles.secondary} hitSlop={8}>
            <Text style={[styles.secondaryText, { color: colors.body }]}>{t("dashboard:notificationSettings.maybeLater")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 10, 30, 0.45)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28, alignItems: "center" },
  logo: { width: 140, height: 36, marginBottom: 16 },
  halo: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 22, textAlign: "center", marginBottom: 6 },
  benefits: { alignSelf: "stretch", gap: 8, marginTop: 8, marginBottom: 16 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitText: { flex: 1, fontSize: 14, lineHeight: 20 },
  note: { fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 20, opacity: 0.85 },
  primary: { alignSelf: "stretch", minHeight: 48, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: ACCENT },
  pressed: { opacity: 0.85 },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondary: { marginTop: 8, minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  secondaryText: { fontSize: 15, fontWeight: "600" },
});
