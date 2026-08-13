import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useAppTheme } from "../../../theme/ThemeContext";

type AuthButtonVariant = "primary" | "secondary";

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: AuthButtonVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
  style,
}: AuthButtonProps) {
  const { isDark } = useAppTheme();
  const isDisabled = disabled || loading;

  if (variant === "secondary") {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.secondaryButton,
          {
            backgroundColor: isDark ? "#18181B" : "#FFFFFF",
            borderColor: isDark ? "rgba(255,255,255,0.14)" : "#E5E7EB",
            opacity: isDisabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isDark ? "#FFFFFF" : "#7B2CBF"} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.secondaryLabel,
                { color: isDark ? "#FFFFFF" : "#1F2937" },
                icon ? styles.labelWithIcon : null,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.wrapper, { opacity: isDisabled ? 0.7 : 1 }, style]}
    >
      <LinearGradient
        colors={["#FC8BAD", "#A654CD"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, icon ? styles.labelWithIcon : null]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default React.memo(AuthButton);

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  gradient: {
    flexDirection: "row",
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  labelWithIcon: {
    marginLeft: 10,
  },
  secondaryButton: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
