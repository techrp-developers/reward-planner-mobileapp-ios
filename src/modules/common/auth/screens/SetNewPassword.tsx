import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { setPassword, resetPassword } from "../api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import type { AuthStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../../theme/ThemeContext";

type SetNewPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type SetNewPasswordRouteProp = RouteProp<AuthStackParamList, "SetNewPassword">;

function SetNewPassword() {
  const navigation = useNavigation<SetNewPasswordNavigationProp>();
  const route = useRoute<SetNewPasswordRouteProp>();
  const alert = useAlert();
  const { isDark } = useAppTheme();
  const email = route.params?.email || "";
  const type = route.params?.type ?? "activation";
  const isForgotPassword = type === "forgot-password";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert.error("Validation", "Please enter both passwords");
      return;
    }

    if (newPassword.length < 6) {
      alert.warning("Weak Password", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert.error("Mismatch", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      if (isForgotPassword) {
        await resetPassword({ email, newPassword });
        alert.success("Success", "Password reset successfully");
        navigation.navigate("PasswordSuccess");
      } else {
        await setPassword({ email, password: newPassword });
        alert.success("Success", "Password set successfully");
        navigation.navigate("AccountActivationSuccess");
      }
    } catch (error: any) {
      console.log("Set password error:", error?.response?.data || error?.message);
      alert.error(
        "Failed",
        error?.response?.data?.message || "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}
      edges={["left", "right", "top"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Logo width={160} height={160} />
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? "#111113" : "#FFFFFF" }]}>
            <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>
              {isForgotPassword ? "Reset Your Password" : "Set Your New Password"}
            </Text>

            {/* New Password */}
            <Text style={[styles.label, { color: isDark ? "#D4D4D8" : "#555" }]}>New Password</Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: isDark ? "#18181B" : "#F9F9F9",
                  borderColor: isDark ? "rgba(255,255,255,0.10)" : "#E0E0E0",
                },
              ]}
            >
              <TextInput
                placeholder="Enter your new password"
                placeholderTextColor={isDark ? "#71717A" : "#999"}
                secureTextEntry={!newPasswordVisible}
                style={[styles.input, { color: isDark ? "#FFFFFF" : "#333" }]}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setNewPasswordVisible(!newPasswordVisible)}
              >
                <MaterialCommunityIcons
                  name={newPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={isDark ? "#F472B6" : "#A654CD"}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={[styles.label, { color: isDark ? "#D4D4D8" : "#555" }]}>Confirm your New Password</Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: isDark ? "#18181B" : "#F9F9F9",
                  borderColor: isDark ? "rgba(255,255,255,0.10)" : "#E0E0E0",
                },
              ]}
            >
              <TextInput
                placeholder="Confirm your New Password"
                placeholderTextColor={isDark ? "#71717A" : "#999"}
                secureTextEntry={!confirmVisible}
                style={[styles.input, { color: isDark ? "#FFFFFF" : "#333" }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setConfirmVisible(!confirmVisible)}
              >
                <MaterialCommunityIcons
                  name={confirmVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={isDark ? "#F472B6" : "#A654CD"}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSetPassword} disabled={loading}>
              <LinearGradient
                colors={["#A654CD", "#FC8BAD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmText}>
                  {loading
                    ? isForgotPassword ? "Resetting..." : "Setting Password..."
                    : isForgotPassword ? "Reset Password" : "Activate Account"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SetNewPassword;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  keyboardWrap: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },

  card: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: "100%",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    marginBottom: 25,
    textAlign: "center",
  },

  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
    marginTop: 10,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
  },

  confirmBtn: {
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
  },

  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14,

  },
});
