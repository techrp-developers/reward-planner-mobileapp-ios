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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { forgotPassword } from "../api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import type { AuthStackParamList } from "../navigation/types";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const alert = useAlert();
  const insets = useSafeAreaInsets();

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
    <SafeAreaView style={styles.screen} edges={["left", "right", "top"]}>
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

          <View style={styles.card}>
            <Text style={styles.title}>Forgot Password</Text>

            <Text style={styles.subText}>
              Enter the email address associated with your account,
              and we'll send a password reset OTP.
            </Text>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
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

        </ScrollView>

        <View style={[styles.bottomWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Return to Login Screen?</Text>

            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.signUp}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F0FF",
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
    backgroundColor: "#FFFFFF",
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
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
  },

  input: {
    fontSize: 14,
    color: "#333",
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
    backgroundColor: "#F5F0FF",
    borderTopWidth: 1,
    borderTopColor: "#E8DCF7",
    paddingTop: 16,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  bottomText: {
    fontSize: 13,
    color: "#666",
  },

  signUp: {
    color: "#7B2CBF",
    fontWeight: "bold",
    paddingVertical: 4,
  },
});
