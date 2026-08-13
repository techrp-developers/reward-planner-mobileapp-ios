import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AuthButton from "../../components/AuthButton";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { completeOnboarding } from "../api/AuthAPI";
import { useAuth } from "../context/AuthContext";

function OnboardingScreen() {
  const { isDark } = useAppTheme();
  const { setTermsAccepted } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleComplete = useCallback(async () => {
    setSaving(true);
    try {
      await completeOnboarding();
      setTermsAccepted(true);
    } catch (error) {
      if (__DEV__) console.log("[OnboardingScreen] complete failed", error);
    } finally {
      setSaving(false);
    }
  }, [setTermsAccepted]);

  return (
    <LinearGradient
      colors={isDark ? ["#09090B", "#111113"] : ["#F5F0FF", "#FFF0F7"]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={[styles.title, isDark ? darkStyles.title : undefined]}>Welcome aboard</Text>
        <Text style={[styles.description, isDark ? darkStyles.description : undefined]}>
          This one-time onboarding step confirms your account is ready and takes you into the app.
        </Text>
        <AuthButton
          label={saving ? "Finishing..." : "Complete onboarding"}
          onPress={handleComplete}
          loading={saving}
          disabled={saving}
        />
        {saving ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={isDark ? "#F472B6" : "#852BAF"} />
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

export default React.memo(OnboardingScreen);

const darkStyles = StyleSheet.create({
  title: {
    color: "#FFFFFF",
  },
  description: {
    color: "#D4D4D8",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#852BAF",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    color: "#4B5563",
  },
  loadingRow: {
    marginTop: 12,
    alignItems: "center",
  },
});
