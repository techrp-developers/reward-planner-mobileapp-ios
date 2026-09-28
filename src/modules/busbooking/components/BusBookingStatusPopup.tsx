import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export type BusBookingPopupVariant = "success" | "error" | "warning" | "info";

export type BusBookingPopupConfig = {
  visible: boolean;
  title: string;
  message: string;
  variant?: BusBookingPopupVariant;
  buttonText?: string;
  onClose?: () => void;
};

type Props = BusBookingPopupConfig;

const variantConfig: Record<
  BusBookingPopupVariant,
  {
    icon: string;
    iconColor: string;
    iconBg: string;
    buttonColors: [string, string];
  }
> = {
  success: {
    icon: "check-circle",
    iconColor: "#0F8A4B",
    iconBg: "#E8F8EF",
    buttonColors: ["#17A45A", "#0F8A4B"],
  },
  error: {
    icon: "close-circle",
    iconColor: "#C81E3A",
    iconBg: "#FDECEF",
    buttonColors: ["#D61A33", "#AF1027"],
  },
  warning: {
    icon: "alert-circle",
    iconColor: "#C77900",
    iconBg: "#FFF3E0",
    buttonColors: ["#E39A1D", "#C77900"],
  },
  info: {
    icon: "information",
    iconColor: "#2E6EF3",
    iconBg: "#EEF4FF",
    buttonColors: ["#3D7BFF", "#2E6EF3"],
  },
};

export default function BusBookingStatusPopup({
  visible,
  title,
  message,
  variant = "info",
  buttonText = "OK",
  onClose,
}: Props) {
  const config = variantConfig[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={34}
              color={config.iconColor}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity activeOpacity={0.9} onPress={onClose} style={styles.buttonWrap}>
            <View
              style={[
                styles.button,
                { backgroundColor: config.buttonColors[0], borderColor: config.buttonColors[1] },
              ]}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export const useBusBookingPopup = () => {
  const [popup, setPopup] = React.useState<BusBookingPopupConfig>({
    visible: false,
    title: "",
    message: "",
    variant: "info",
  });

  const hidePopup = React.useCallback(() => {
    setPopup((current) => {
      current.onClose?.();

      return {
        visible: false,
        title: "",
        message: "",
        variant: current.variant,
      };
    });
  }, []);

  const showPopup = React.useCallback(
    (config: Omit<BusBookingPopupConfig, "visible">) => {
      setPopup({
        visible: true,
        title: config.title,
        message: config.message,
        variant: config.variant || "info",
        buttonText: config.buttonText || "OK",
        onClose: config.onClose,
      });
    },
    []
  );

  return {
    popup,
    showPopup,
    hidePopup,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: "#25222A",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    marginTop: 10,
    color: "#66616D",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    textAlign: "center",
  },
  buttonWrap: {
    width: "100%",
    marginTop: 20,
  },
  button: {
    minHeight: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
