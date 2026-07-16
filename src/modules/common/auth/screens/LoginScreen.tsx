import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../../../ecommerce/components/alerts";
import Logo from "../../../../assets/homepage/login_logo.svg";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login, loading } = useAuth();
  const alert = useAlert();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const onLogin = useCallback(async () => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        alert.error("Login Error", "Please enter your email address");
        return;
      }

      if (!password) {
        alert.error("Login Error", "Please enter your password");
        return;
      }

      await login({
        email: cleanEmail,
        password,
      });
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      const data = error?.response?.data;

      if (status === 403 && data?.device_verification_required) {
        alert.error(
          "New Device Detected",
          data?.message ||
          "Approval email has been sent to your registered email. Please allow this device and login again.",
        );
        return;
      }

      const message =
        data?.message ||
        (status === 403
          ? "Email not verified. Please verify your email before login."
          : "Login failed");

      alert.error("Login Error", String(message));
    }
  }, [email, password, login, alert]);

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
            <Logo width={180} height={180} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Login to Your Account</Text>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color="#999"
                style={styles.inputIcon}
              />

              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={18}
                color="#999"
                style={styles.inputIcon}
              />

              <TextInput
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry={!passwordVisible}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                onPress={() => setPasswordVisible((prev) => !prev)}
              >
                <MaterialCommunityIcons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#A654CD"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Log in</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[styles.bottomWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>New to Rewards Planners?</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("AccountActivate")}
            >
              <Text style={styles.signUp}>Activate Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    paddingBottom: 20,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EEE",
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
    color: "#333",
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
  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: 16,
    marginTop: -6,
  },
  forgotText: {
    fontSize: 13,
    color: "#A654CD",
    fontWeight: "600",
  },
});