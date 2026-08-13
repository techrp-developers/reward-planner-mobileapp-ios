import React from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../theme/ThemeContext";

type AuthTextInputProps = {
  icon?: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  error?: string;
  editable?: boolean;
  rightAccessory?: React.ReactNode;
  autoFocus?: boolean;
  textContentType?: TextInputProps["textContentType"];
  autoComplete?: TextInputProps["autoComplete"];
};

function AuthTextInput({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  maxLength,
  error,
  editable = true,
  rightAccessory,
  autoFocus,
  textContentType,
  autoComplete,
}: AuthTextInputProps) {
  const { isDark } = useAppTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: isDark ? "#18181B" : "#F9F9F9",
            borderColor: error ? "#EF4444" : isDark ? "rgba(255,255,255,0.10)" : "#E0E0E0",
          },
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isDark ? "#A1A1AA" : "#9CA3AF"}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={[styles.input, { color: isDark ? "#FFFFFF" : "#111827" }]}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#71717A" : "#9CA3AF"}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          autoFocus={autoFocus}
          textContentType={textContentType}
          autoComplete={autoComplete}
        />
        {rightAccessory}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default React.memo(AuthTextInput);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 54,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
