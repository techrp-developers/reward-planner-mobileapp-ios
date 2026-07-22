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
import LinearGradient from "react-native-linear-gradient";

import Logo from "../../../../assets/homepage/login_logo.svg";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../common/auth/navigation/types";
import { activateAccount } from "../api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../../../theme/ThemeContext";

type LoginAccountNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "OTPScreen"
>;

function AccountActivate() {
  const navigation = useNavigation<LoginAccountNavigationProp>();
  const alert = useAlert();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!email) {
      alert.error("Validation", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await activateAccount({ email });
      alert.success("OTP Sent", "Check your email for the verification code");
      navigation.navigate("OTPScreen", { email });
    } catch (error: any) {
      console.log("Activation error:", error?.response?.data || error?.message);
      alert.error(
        "Activation Failed",
        error?.response?.data?.message || "Failed to send OTP"
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
            <Logo width={180} height={180} />
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? "#111113" : "#FFFFFF" }]}>

            <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>Activate Your Account</Text>

            {/* Email Input */}
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: isDark ? "#18181B" : "#F8F8F8",
                  borderColor: isDark ? "rgba(255,255,255,0.10)" : "#EEE",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={isDark ? "#A1A1AA" : "#999"}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={isDark ? "#71717A" : "#999"}
                style={[styles.input, { color: isDark ? "#FFFFFF" : "#333" }]}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleActivate} disabled={loading}>
              <LinearGradient
                colors={["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.loginBtn}
              >
                <Text style={styles.loginText}>{loading ? "Sending OTP..." : "Send OTP"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <View
          style={[
            styles.bottomWrap,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: isDark ? "#09090B" : "#F5F0FF",
              borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "#E8DCF7",
            },
          ]}
        >
          <View style={styles.bottomRow}>
            <Text style={[styles.bottomText, { color: isDark ? "#A1A1AA" : "#666" }]}>Already have an account?</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={[styles.signUp, { color: isDark ? "#F472B6" : "#7B2CBF" }]}>Login Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

export default AccountActivate;
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
    marginBottom: 20,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  forgotText: {
    fontSize: 13,
    color: "#852BAF",
    marginBottom: 20,
  },
  loginBtn: {
    borderRadius: 10,
    alignItems: "center",
  },
  loginText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14,

  },
  bottomWrap: {
    borderTopWidth: 1,
    paddingTop: 16,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  bottomText: {
    fontSize: 13,
    color: "#666",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signUp: {
    color: "#7B2CBF",
    fontWeight: "bold",
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  successIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7B2CBF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtext: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
