
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import Logo from "../../../../assets/menu/logo.png";
import { useAppTheme } from "../../../../theme/ThemeContext";

export function AuthLayout({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack?: () => void;
}) {
  const { isDark, theme } = useAppTheme();
  const { width } = Dimensions.get("window");

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: isDark ? "#100E18" : "#F6F1FC",
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.backRow}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={styles.back}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 16,
                  }}
                >
                  ‹ Back
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.brand}>
            <Image
              source={Logo}
              style={[
                styles.logo,
                {
                  width: width * 0.32,
                  height: width * 0.32,
                },
              ]}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              <Text style={styles.reward}>Reward</Text>
              <Text style={styles.space}> </Text>
              <Text style={styles.planners}>Planners</Text>
            </Text>

            <Text
              style={[
                styles.tagline,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              Employee Benefits Platform
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            {children}
          </View>

          <Text
            style={[
              styles.footer,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            Your benefits. One simple sign-in.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthButton({
  title,
  onPress,
  busy = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || busy;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: isDisabled,
        busy,
      }}
      style={{
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <LinearGradient
        colors={["#A654CD", "#DA609E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        {busy && <ActivityIndicator color="#FFFFFF" />}

        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export const authStyles = StyleSheet.create({
  title: {
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 33,
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },

  error: {
    color: "#C62842",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },

  link: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 14,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  backRow: {
    height: 48,
    justifyContent: "center",
  },

  back: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  brand: {
    alignItems: "center",
    marginBottom: 32,
  },

  tagline: {
    fontSize: 13,
    marginTop: 7,
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
  },

  footer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 28,
  },

  button: {
    minHeight: 54,
    borderRadius: 15,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  logo: {
    marginBottom: 16,
  },

  title: {
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
    textAlign: "center",
  },

  reward: {
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 29,
    color: "#852BAF",
  },

  space: {
    fontSize: 24,
  },

  planners: {
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 29,
    color: "#FC3F78",
  },
});

