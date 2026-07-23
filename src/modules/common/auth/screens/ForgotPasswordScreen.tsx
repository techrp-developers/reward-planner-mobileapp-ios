import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { forgotPassword } from "../api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import type { AuthStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../../theme/ThemeContext";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const alert = useAlert();
  const { isDark } = useAppTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert.error("Validation", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({ email: cleanEmail });
      alert.success("OTP Sent", "A password reset OTP has been sent to your email");
      navigation.navigate("OTPScreen", { email: cleanEmail, type: "forgot-password" });
    } catch (error: any) {
      alert.error(
        "Failed",
        error?.response?.data?.message || "Failed to send OTP. Please try again."
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
            <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>Forgot Password</Text>

            <Text style={[styles.subText, { color: isDark ? "#D4D4D8" : "#666" }]}>
              Enter the email address associated with your account,
              and we'll send a password reset OTP.
            </Text>

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
                placeholder="Email"
                placeholderTextColor={isDark ? "#71717A" : "#999"}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: isDark ? "#FFFFFF" : "#333" }]}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSend} disabled={loading}>
              <LinearGradient
                colors={["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Send OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={[styles.bottomWrap, { backgroundColor: isDark ? "#09090B" : "#F2E8FF" }]}>
            <Text style={[styles.bottomText, { color: isDark ? "#A1A1AA" : "#555" }]}>
              Return to Login Screen -{" "}
              <Text onPress={() => navigation.navigate("Login")} style={[styles.signUp, { color: isDark ? "#F472B6" : "#852BAF" }]}>
                Login
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  keyboardWrap: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 24,
  },

  card: {
    marginTop: 12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    marginBottom: 15,
  },

  subText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
    lineHeight: 18,
  },

  inputWrap: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: "center",
    marginBottom: 20,
  },

  input: {
    fontSize: 14,
  },

  loginBtn: {
    borderRadius: 10,
    alignItems: "center",
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14,

  },

  bottomWrap: {
    paddingVertical: 18,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  bottomText: {
    fontSize: 13,
    color: "#555",
  },

  signUp: {
    color: "#852BAF",
    fontWeight: "700",
  },
});
