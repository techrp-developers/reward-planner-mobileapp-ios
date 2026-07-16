import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { resendActivationOtp } from "../api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import type { AuthStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type VerifyRoute = RouteProp<AuthStackParamList, "VerifyEmail">;

function VerifyEmailScreenComponent() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<VerifyRoute>();
  const alert = useAlert();
  const [resent, setResent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const email = route.params?.email || "";

  const handleResend = useCallback(async () => {
    if (!email || resendLoading) return;
    try {
      setResendLoading(true);
      await resendActivationOtp({ email });
      setResent(true);
      alert.success("Resent", "Activation OTP resent successfully");
    } catch (error: any) {
      setResent(false);
      alert.error(
        "Resend Failed",
        error?.response?.data?.message || "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  }, [email, resendLoading, alert]);

  const handleGoToLogin = useCallback(() => {
    navigation.navigate("Login");
  }, [navigation]);

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "top"]}>
      <View style={styles.logoWrap}>
        <Logo width={160} height={160} />
      </View>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="email-check-outline" size={34} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Verify Successfully</Text>
        <Text style={styles.subtitle}>
          Verification link has been sent to
        </Text>
        <Text style={styles.email}>{email || "your email"}</Text>
        <Text style={styles.helper}>
          Open your email and click the verify link, then login to continue.
        </Text>

        {resent && (
          <Text style={styles.resentText}>
            Verification email re-sent successfully.
          </Text>
        )}

        <TouchableOpacity
          disabled={resendLoading}
          onPress={handleResend}
        >
          <Text style={styles.link}>
            {resendLoading ? "Sending..." : "Resend verification email"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={handleGoToLogin}>
          <LinearGradient
            colors={["#FC8BAD", "#A654CD"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.loginBtn}
          >
            <Text style={styles.loginText}>Go to Login</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const VerifyEmailScreen = React.memo(VerifyEmailScreenComponent);
export default VerifyEmailScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F0FF",
    paddingHorizontal: 20,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    marginTop: -20,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#7B2CBF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    textAlign: "center",
  },
  email: {
    marginTop: 4,
    color: "#852BAF",
    fontWeight: "700",
    fontSize: 15,
  },
  helper: {
    marginTop: 10,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  resentText: {
    marginTop: 8,
    color: "#16A34A",
    fontWeight: "600",
  },
  link: {
    marginTop: 14,
    color: "#5B47A3",
    fontWeight: "600",
    textAlign: "center",
  },
  loginBtn: {
    marginTop: 16,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14,

  },
});
