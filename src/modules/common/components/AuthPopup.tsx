import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Modal from "react-native-modal";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../theme/ThemeContext";
import AuthButton from "./AuthButton";

type AuthPopupProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onDismiss?: () => void;
  icon?: string;
};

function AuthPopup({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onDismiss,
  icon = "account-alert-outline",
}: AuthPopupProps) {
  const { isDark } = useAppTheme();

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onDismiss}
      onBackButtonPress={onDismiss}
      animationIn="zoomIn"
      animationOut="zoomOut"
      useNativeDriver
    >
      <View style={[styles.card, { backgroundColor: isDark ? "#18181B" : "#FFFFFF" }]}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={30} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#1F2937" }]}>{title}</Text>
        <Text style={[styles.message, { color: isDark ? "#A1A1AA" : "#6B7280" }]}>{message}</Text>
        <AuthButton label={confirmLabel} onPress={onConfirm} style={styles.confirmButton} />
      </View>
    </Modal>
  );
}

export default React.memo(AuthPopup);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: "center",
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#7B2CBF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmButton: {
    marginTop: 4,
  },
});
