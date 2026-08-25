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
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../../../ecommerce/components/alerts";
import Logo from "../../../../assets/homepage/login_logo.svg";
import type { AuthStackParamList } from "../navigation/types";
import {
  getLoginIdentifierKeyboardType,
  parseLoginIdentifier,
} from "../utils/loginIdentifier";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { requestLoginOtp, loading } = useAuth();
  const { isDark } = useAppTheme();
  const alert = useAlert();
  const [identifier, setIdentifier] = useState("");

  const onLogin = useCallback(async () => {
    try {
      const parsedIdentifier = parseLoginIdentifier(identifier);

      if (parsedIdentifier.kind === "empty") {
        alert.error("Login Error", "Please enter your email address or phone number");
        return;
      }

      if (parsedIdentifier.kind === "invalid") {
        alert.error("Login Error", "Enter a valid email address or 10-digit phone number");
        return;
      }

      await requestLoginOtp(parsedIdentifier.normalized);
      navigation.navigate("LoginOTP", { identifier: parsedIdentifier.normalized });
    } catch (error: any) {
      const data = error?.response?.data;

      const message = data?.message || "Unable to send the login code";

      alert.error("Login Error", String(message));
    }
  }, [identifier, requestLoginOtp, navigation, alert]);

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
            <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>Login to Your Account</Text>

            <View style={styles.identifierGroup}>
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
                  name="account-outline"
                  size={18}
                  color={isDark ? "#A1A1AA" : "#999"}
                  style={styles.inputIcon}
                />

                <TextInput
                  placeholder="Email Address or Phone Number"
                  placeholderTextColor={isDark ? "#71717A" : "#999"}
                  autoCapitalize="none"
                  keyboardType={getLoginIdentifierKeyboardType(identifier)}
                  style={[styles.input, { color: isDark ? "#FFFFFF" : "#333" }]}
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>

              <Text style={[styles.helperText, { color: isDark ? "#A1A1AA" : "#777" }]}>
                Registered email or mobile number
              </Text>
            </View>

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
                  <Text style={styles.loginText}>Send Login Code</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  identifierGroup: {
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  helperText: {
    marginTop: -8,
    marginBottom: 0,
    fontSize: 12,
    color: "#777",
  },
  loginBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  loginText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomWrap: {
    borderTopWidth: 1,
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