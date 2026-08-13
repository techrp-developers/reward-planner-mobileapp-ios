import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import GiftBanner from "../../../../assets/homepage/banner_gift.svg";
import AuthButton from "../../components/AuthButton";
import OtpBoxRow from "../../components/OtpBoxRow";
import { useAlert } from "../../../ecommerce/components/alerts";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useOtpTimer } from "../hooks/useOtpTimer";
import { useOtpAutofill } from "../hooks/useOtpAutofill";
import { sendOtp, verifyOtp } from "../api/AuthAPI";
import {
  OTP_LENGTH,
  OTP_MAX_RESEND_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../constants/otp";
import { maskEmail, maskPhone } from "../utils/validators";
import type { AuthStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "OTPScreen">;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, "OTPScreen">;

function OTPScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<OTPScreenRouteProp>();
  const alert = useAlert();
  const { isDark } = useAppTheme();
  const { authenticateWithTokens } = useAuth();

  const { method, destination, maskedDestination } = route.params;
  const displayDestination =
    maskedDestination || (method === "phone" ? maskPhone(destination) : maskEmail(destination));

  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const { secondsLeft, canResend, reset: resetTimer } = useOtpTimer(OTP_RESEND_COOLDOWN_SECONDS);
  const autofill = useOtpAutofill(true);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // SMS autofill (Android) delivered a code — feed it into the boxes the
  // same way manual entry would, which triggers OtpBoxRow's onComplete.
  useEffect(() => {
    if (autofill.code) {
      const digits = autofill.code.slice(0, OTP_LENGTH).split("");
      setOtpValues(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? ""));
    }
  }, [autofill.code]);

  useEffect(() => {
    if (autofill.error) {
      alert.warning("Autofill", autofill.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill.error]);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (verifying) return;

      try {
        setVerifying(true);
        setHasError(false);

        const result = await verifyOtp(destination, code);
        await authenticateWithTokens(result);
      } catch (error: any) {
        if (__DEV__) console.log("[OTPScreen] verify failed", { method, destination, error });
        setHasError(true);
        triggerShake();
        setOtpValues(Array(OTP_LENGTH).fill(""));

        const status = error?.response?.status;
        if (!error?.response) {
          alert.error("Network Error", "Please check your connection and try again.");
        } else if (status === 429) {
          alert.warning("Too Many Attempts", "You've made too many attempts. Please wait and try again.");
        } else {
          alert.error(
            "Verification Failed",
            error?.response?.data?.message || "Invalid OTP. Please try again.",
          );
        }
      } finally {
        setVerifying(false);
      }
    },
    [verifying, method, destination, authenticateWithTokens, alert, triggerShake],
  );

  const handleResend = useCallback(async () => {
    if (!canResend || resending) return;

    if (resendCount >= OTP_MAX_RESEND_ATTEMPTS) {
      alert.warning("Resend Limit Reached", "You've reached the maximum number of resend attempts.");
      return;
    }

    try {
      setResending(true);
      await sendOtp(destination);
      setResendCount((prev) => prev + 1);
      resetTimer();
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setHasError(false);
      alert.success("Code Sent", `A new OTP has been sent to ${displayDestination}.`);
    } catch (error: any) {
      if (__DEV__) console.log("[OTPScreen] resend failed", { method, destination, error });
      const status = error?.response?.status;
      if (status === 429) {
        alert.warning("Resend Limit Reached", "Please wait before requesting another OTP.");
      } else if (!error?.response) {
        alert.error("Network Error", "Please check your connection and try again.");
      } else {
        alert.error("Couldn't Resend", error?.response?.data?.message || "Please try again.");
      }
    } finally {
      setResending(false);
    }
  }, [canResend, resending, resendCount, method, destination, resetTimer, alert, displayDestination]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}>
      <View style={styles.illustrationWrapper}>
        <GiftBanner width={220} height={156} opacity={0.16} />
      </View>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? "#18181B" : "#FFFFFF" }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={isDark ? "#FFFFFF" : "#111111"} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: isDark ? "#09090B" : "#FFFFFF" }]}>

        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#8F2BC1" }]}>Verification Code</Text>
          <Text style={[styles.instruction, { color: isDark ? "#FFFFFF" : "#111111" }]}>Enter the code</Text>
        </Animated.View>

        <Animated.View style={[styles.otpWrap, shakeStyle]}>
          <OtpBoxRow
            length={OTP_LENGTH}
            value={otpValues}
            onChange={setOtpValues}
            onComplete={handleVerify}
            disabled={verifying}
            error={hasError}
          />
        </Animated.View>

        {verifying && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator size="small" color={isDark ? "#A1A1AA" : "#852BAF"} />
            <Text style={[styles.verifyingText, { color: isDark ? "#A1A1AA" : "#852BAF" }]}>
              Verifying...
            </Text>
          </View>
        )}

        <Text style={[styles.timerText, { color: isDark ? "#A1A1AA" : "#777" }]}>
          Didn’t receive an OTP?{" "}
          {!canResend ? (
            <Text>Resend in {secondsLeft}s</Text>
          ) : resending ? (
            <Text style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]}>Sending...</Text>
          ) : (
            <Text
              style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]}
              onPress={handleResend}
            >
              Resend
            </Text>
          )}
        </Text>

        <AuthButton
          label="Verify"
          onPress={() => handleVerify(otpValues.join(""))}
          loading={verifying}
          disabled={otpValues.join("").length !== OTP_LENGTH}
        />
      </View>
    </View>
  );
}

export default React.memo(OTPScreen);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  illustrationWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  card: {
    flex: 1,
    marginTop: "29%",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 26,
  },
  instruction: {
    fontSize: 17,
    marginBottom: 18,
  },
  otpWrap: {
    marginBottom: 20,
  },
  verifyingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  verifyingText: {
    fontSize: 12,
    marginLeft: 6,
  },
  timerText: {
    fontSize: 16,
    textAlign: "right",
    marginBottom: 26,
  },
  resend: {
    fontWeight: "600",
  },
});
