import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Logo from "../../../../assets/homepage/login_logo.svg";
import {
  verifyActivationOtp,
  verifyForgotPasswordOtp,
  resendOtp,
  resendActivationOtp,
} from "../api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import type { AuthStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../../theme/ThemeContext";

type OTPScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, "OTPScreen">;

function OTPScreen() {
  const navigation = useNavigation<OTPScreenNavigationProp>();
  const route = useRoute<OTPScreenRouteProp>();
  const alert = useAlert();
  const { isDark } = useAppTheme();

  const email = route.params?.email || "";
  const type = route.params?.type ?? "activation";
  const isForgotPassword = type === "forgot-password";

  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(true);
  const otpRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  useEffect(() => {
    if (timer === 0) {
      setResendCooldown(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otpValues];
    newOtp[index] = text;
    setOtpValues(newOtp);

    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = otpValues.join("");
    if (otp.length !== 4) {
      alert.error("Validation", "Please enter all 4 digits of OTP");
      return;
    }

    try {
      setLoading(true);

      if (isForgotPassword) {
        await verifyForgotPasswordOtp({ email, otp });
        alert.success("Verified", "OTP verified successfully");
        navigation.navigate("SetNewPassword", { email, type: "forgot-password" });
      } else {
        await verifyActivationOtp({ email, otp });
        alert.success("Verified", "OTP verified successfully");
        navigation.navigate("SetNewPassword", { email, type: "activation" });
      }
    } catch (error: any) {
      alert.error(
        "Verification Failed",
        error?.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown || resendLoading) return;

    try {
      setResendLoading(true);

      if (isForgotPassword) {
        await resendOtp({ email });
      } else {
        await resendActivationOtp({ email });
      }

      alert.info("Resent", "New OTP sent to your email");
      setTimer(60);
      setResendCooldown(true);
      setOtpValues(["", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (error: any) {
      alert.error(
        "Resend Failed",
        error?.response?.data?.message || "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}>
      <View style={styles.logoWrap}>
        <Logo width={160} height={160} />
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#111113" : "#FFFFFF" }]}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>
          {isForgotPassword ? "Reset Password OTP" : "Email OTP Verification"}
        </Text>

        <Text style={[styles.subText, { color: isDark ? "#D4D4D8" : "#555" }]}>
          Enter the OTP sent to {email || "your email"}
        </Text>

        <View style={styles.otpRow}>
          {[0, 1, 2, 3].map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                otpRefs.current[i] = ref;
              }}
              maxLength={1}
              keyboardType="number-pad"
              style={[
                styles.otpInput,
                {
                  backgroundColor: isDark ? "#18181B" : "#F9F9F9",
                  borderColor: isDark ? "rgba(255,255,255,0.10)" : "#E0E0E0",
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
              value={otpValues[i]}
              onChangeText={(text) => handleOtpChange(text, i)}
              onKeyPress={(e) => handleOtpKeyPress(e, i)}
              editable={!loading}
            />
          ))}
        </View>

        <Text style={[styles.timerText, { color: isDark ? "#A1A1AA" : "#777" }]}>
          Didn't receive an OTP?{" "}
          {timer > 0 ? (
            <Text>Resend in {timer}s</Text>
          ) : resendLoading ? (
            <Text style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]}>Sending...</Text>
          ) : (
            <Text style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]} onPress={handleResend}>
              Resend
            </Text>
          )}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleVerify}
          disabled={loading}
        >
          <LinearGradient
            colors={["#FC8BAD", "#A654CD"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.verifyBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyText}>Verify</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default OTPScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },

  card: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    marginBottom: 10,
  },

  subText: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    marginBottom: 20,
  },

  otpInput: {
    width: 45,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 18,
  },

  timerText: {
    fontSize: 12,
    color: "#777",
    marginBottom: 25,
  },

  resend: {
    fontWeight: "600",
  },

  verifyBtn: {
    width: "100%",

    borderRadius: 10,
    alignItems: "center",
    minWidth: 200,
  },

  verifyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
});
