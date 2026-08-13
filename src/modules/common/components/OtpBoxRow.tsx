import React, { useEffect, useRef } from "react";
import { NativeSyntheticEvent, Platform, StyleSheet, TextInput, TextInputKeyPressEventData, View } from "react-native";
import { useAppTheme } from "../../../theme/ThemeContext";

type OtpBoxRowProps = {
  length?: number;
  value: string[];
  onChange: (next: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
};

// Only one physical TextInput can meaningfully carry
// textContentType="oneTimeCode" (iOS) / autoComplete="sms-otp" (Android) —
// the OS pastes the *entire* detected code into whichever input bears it,
// so box 0 doubles as the autofill target and this component splits a
// multi-character paste/autofill across the visual boxes.
const AUTOFILL_BOX_INDEX = 0;

function OtpBoxRow({ length = 6, value, onChange, onComplete, disabled, error }: OtpBoxRowProps) {
  const { isDark } = useAppTheme();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const lastCompletedCode = useRef<string | null>(null);

  useEffect(() => {
    const code = value.join("");
    if (code.length === length && code !== lastCompletedCode.current) {
      lastCompletedCode.current = code;
      onComplete?.(code);
    }
    if (code.length < length) {
      lastCompletedCode.current = null;
    }
  }, [value, length, onComplete]);

  const focusIndex = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChangeText = (text: string, index: number) => {
    const digitsOnly = text.replace(/\D/g, "");

    if (digitsOnly.length > 1) {
      // Paste or SMS autofill delivered the whole code at once.
      const chars = digitsOnly.slice(0, length).split("");
      const next = Array.from({ length }, (_, i) => chars[i] ?? "");
      onChange(next);
      const lastFilledIndex = Math.min(chars.length, length) - 1;
      if (lastFilledIndex >= 0 && lastFilledIndex < length - 1) {
        focusIndex(lastFilledIndex + 1);
      }
      return;
    }

    const next = [...value];
    next[index] = digitsOnly;
    onChange(next);

    if (digitsOnly && index < length - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      focusIndex(index - 1);
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.box,
            {
              backgroundColor: isDark ? "#18181B" : "#F9F9F9",
              borderColor: error
                ? "#EF4444"
                : isDark
                ? "rgba(255,255,255,0.10)"
                : "#E0E0E0",
              color: isDark ? "#FFFFFF" : "#111827",
            },
          ]}
          maxLength={index === AUTOFILL_BOX_INDEX ? length : 1}
          keyboardType="number-pad"
          value={value[index]}
          onChangeText={(text) => handleChangeText(text, index)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          editable={!disabled}
          textContentType={index === AUTOFILL_BOX_INDEX ? "oneTimeCode" : "none"}
          autoComplete={
            index === AUTOFILL_BOX_INDEX && Platform.OS === "android" ? "sms-otp" : "off"
          }
        />
      ))}
    </View>
  );
}

export default React.memo(OtpBoxRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  box: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
});
