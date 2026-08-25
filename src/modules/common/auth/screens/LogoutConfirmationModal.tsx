import React, { useCallback, memo } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type LogoutConfirmationModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDark?: boolean;
  title?: string;
  description?: string;
  subText?: string;
  icon?: string;
  confirmText?: string;
  loadingText?: string;
  danger?: boolean;
  showCancel?: boolean;
};

const LogoutConfirmationModalComponent = ({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
  isDark = false,
  title = "Confirm Logout",
  description = "Are you sure you want to logout?",
  subText = "You will need to login again to access your account.",
  icon = "logout",
  confirmText = "Yes, Logout",
  loadingText = "Logging out...",
  danger = false,
  showCancel = true,
}: LogoutConfirmationModalProps) => {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? "#111113" : "#FFFFFF",
              borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(166,84,205,0.12)",
            },
          ]}
        >
          {/* Icon Section */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: danger
                  ? isDark ? "rgba(248,113,113,0.14)" : "rgba(239,68,68,0.10)"
                  : isDark ? "rgba(166,84,205,0.18)" : "rgba(132,84,205,0.10)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={50}
              color={danger ? "#EF4444" : isDark ? "#F472B6" : "#852BAF"}
            />
          </View>

          {/* Text Content */}
          <Text style={[styles.title, { color: danger ? "#EF4444" : isDark ? "#FFFFFF" : "#852BAF" }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: isDark ? "#D4D4D8" : "#666666" }]}>
            {description}
          </Text>
          <Text style={[styles.subText, { color: isDark ? "#A1A1AA" : "#999999" }]}>
            {subText}
          </Text>

          {/* Button Row */}
          <View style={styles.buttonRow}>
            {/* Cancel Button */}
            {showCancel ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCancel}
                disabled={isLoading}
                style={styles.cancelButtonContainer}
              >
                <View
                  style={[
                    styles.cancelBtn,
                    {
                      backgroundColor: isDark ? "#18181B" : "#F9F9F9",
                      borderColor: isDark ? "rgba(255,255,255,0.10)" : "#E5E5E5",
                    },
                  ]}
                >
                  <Text style={[styles.cancelBtnText, { color: isDark ? "#E5E7EB" : "#666666" }]}>Cancel</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Confirm Button with Gradient */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirm}
              disabled={isLoading}
              style={styles.confirmButtonContainer}
            >
              <LinearGradient
                colors={danger ? ["#F87171", "#DC2626"] : ["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.confirmBtnText}>
                  {isLoading ? loadingText : confirmText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const LogoutConfirmationModal = memo(LogoutConfirmationModalComponent);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 18,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 6,
  },
  subText: {
    fontWeight: "400",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  cancelButtonContainer: {
    flex: 1,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  confirmButtonContainer: {
    flex: 1,
  },
  gradientBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});