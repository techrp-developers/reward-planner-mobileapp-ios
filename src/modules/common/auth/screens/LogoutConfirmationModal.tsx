import React, { useCallback, memo } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type LogoutConfirmationModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

const LogoutConfirmationModalComponent = ({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
}: LogoutConfirmationModalProps) => {
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon Section */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="logout"
              size={50}
              color="#852BAF"
            />
          </View>

          {/* Text Content */}
          <Text style={styles.title}>Confirm Logout</Text>
          <Text style={styles.description}>
            Are you sure you want to logout?{"\n"}
            <Text style={styles.subText}>
              You will need to login again to access your account.
            </Text>
          </Text>

          {/* Button Row */}
          <View style={styles.buttonRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCancel}
              disabled={isLoading}
              style={styles.cancelButtonContainer}
            >
              <View style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </View>
            </TouchableOpacity>

            {/* Confirm Button with Gradient */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirm}
              disabled={isLoading}
              style={styles.confirmButtonContainer}
            >
              <LinearGradient
                colors={["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.gradientBtn}
              >
                <Text style={styles.confirmBtnText}>
                  {isLoading ? "Logging out..." : "Yes, Logout"}
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
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(132, 84, 205, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#852BAF",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  subText: {
    fontWeight: "400",
    color: "#999",
    fontSize: 14,
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
    borderColor: "#E5E5E5",
    backgroundColor: "#F9F9F9",
  },
  cancelBtnText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "700",
  },
  confirmButtonContainer: {
    flex: 1,
  },
  gradientBtn: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14,

  },
});
