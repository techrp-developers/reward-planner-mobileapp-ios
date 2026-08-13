import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import GiftBanner from "../../../../assets/homepage/login_logo.svg";
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
  const { height } = useWindowDimensions();
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
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <View style={[styles.illustrationWrapper, { height: height * 0.35 }]}>
        <GiftBanner width={278} height={209} />
      </View>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? "#18181B" : "#FFFFFF" }]}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color={isDark ? "#FFFFFF" : "#1F2937"} />
      </TouchableOpacity>

      <ScrollView
        style={[
          styles.card,
          { backgroundColor: isDark ? "#09090B" : "#FFFFFF", marginTop: height * 0.35 },
        ]}
        contentContainerStyle={styles.cardContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
    shadowColor: "#5B2677",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: "#6B278D",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 36,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    textShadowColor: "rgba(133,43,175,0.12)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
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
