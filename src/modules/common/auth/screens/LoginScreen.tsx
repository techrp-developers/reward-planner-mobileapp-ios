import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import GiftBanner from "../../../../assets/homepage/banner_gift.svg";
import AuthButton from "../../components/AuthButton";
import AuthTextInput from "../../components/AuthTextInput";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useAlert } from "../../../ecommerce/components/alerts";
import { checkIdentifier, sendOtp } from "../api/AuthAPI";
import { parseIdentifier } from "../utils/validators";
import type { AuthStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useAppTheme();
  const alert = useAlert();

  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = useCallback(async () => {
    const parsed = parseIdentifier(identifier);

    if (parsed.kind === "unknown") {
      setError("Enter a valid email address or 10-digit mobile number.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const checkResult = await checkIdentifier(parsed.normalized);

      if (!checkResult.registered) {
        alert.warning("Not Registered", "We couldn't find an account for this email or phone number.");
        return;
      }

      await sendOtp(parsed.normalized);

      navigation.navigate("OTPScreen", {
        method: checkResult.type ?? parsed.kind,
        destination: parsed.normalized,
      });
    } catch (err: any) {
      if (__DEV__) console.log("[LoginScreen] login failed", { identifier: parsed.normalized, err });

      const status = err?.response?.status;
      if (status === 404) {
        alert.warning("Not Registered", "We couldn't find an account for this email or phone number.");
      } else if (!err?.response) {
        alert.error("Network Error", "Please check your connection and try again.");
      } else {
        alert.error(
          "Couldn't Send Code",
          err?.response?.data?.message || "Something went wrong. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [identifier, alert, navigation]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}>
      <View style={styles.illustrationWrapper}>
        <GiftBanner width={220} height={156} opacity={0.16} />
      </View>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? "#18181B" : "#FFFFFF" }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color={isDark ? "#FFFFFF" : "#1F2937"} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: isDark ? "#09090B" : "#FFFFFF" }]}>
        <Text style={styles.title}>
          <Text style={styles.titlePurple}>Reward </Text>
          <Text style={styles.titlePink}>Planners</Text>
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#A1A1AA" : "#6B7280" }]}>
          Login to your account
        </Text>

        <View style={styles.inputSpacing}>
          <AuthTextInput
            icon="account-outline"
            placeholder="Email Address/Phone Number"
            value={identifier}
            onChangeText={(value) => {
              setIdentifier(value);
              if (error) setError(null);
            }}
            keyboardType="email-address"
            error={error ?? undefined}
            autoFocus
          />
        </View>

        <AuthButton
          label="Log in"
          onPress={handleLogin}
          loading={submitting}
          disabled={!identifier.trim()}
          icon={<MaterialCommunityIcons name="login" size={21} color="#FFFFFF" />}
        />
      </View>
    </View>
  );
}

export default React.memo(LoginScreen);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  illustrationWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  card: {
    flex: 1,
    marginTop: "36%",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 18,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  titlePurple: {
    color: "#7B2CBF",
  },
  titlePink: {
    color: "#EC4899",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 38,
  },
  inputSpacing: {
    width: "100%",
    marginBottom: 30,
  },
});
