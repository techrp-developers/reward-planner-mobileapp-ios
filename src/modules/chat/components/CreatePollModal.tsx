import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatColors } from "./chatUiTokens";
import { CHAT_UI } from "./chatUiTokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (question: string, options: string[]) => Promise<void>;
};

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;

export default function CreatePollModal({ visible, onClose, onCreate }: Props) {
  const theme = useChatColors();
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setQuestion("");
      setOptions(["", ""]);
    }
  }, [visible]);

  const close = () => {
    if (!savingRef.current) onClose();
  };
  const changeOption = (index: number, value: string) => {
    setOptions((current) =>
      current.map((item, i) => (i === index ? value : item))
    );
  };

  const submit = async () => {
    if (savingRef.current) return;
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((text) => text.trim()).filter(Boolean);
    if (!cleanQuestion)
      return Alert.alert("Add a question", "Enter a question for your poll.");
    if (cleanOptions.length < MIN_OPTIONS)
      return Alert.alert("Add options", "A poll needs at least two choices.");
    if (
      new Set(cleanOptions.map((item) => item.toLocaleLowerCase())).size !==
      cleanOptions.length
    ) {
      return Alert.alert(
        "Duplicate options",
        "Please use different option names."
      );
    }
    Keyboard.dismiss();
    savingRef.current = true;
    setSaving(true);
    try {
      await onCreate(cleanQuestion, cleanOptions);
      if (!mounted.current) return;
      setQuestion("");
      setOptions(["", ""]);
      onClose();
    } catch (error: any) {
      Alert.alert(
        "Could not create poll",
        error?.response?.data?.message || error?.message || "Please try again."
      );
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityLabel="Dismiss poll composer"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.header}>
            <View
              style={[
                styles.headerIcon,
                { backgroundColor: `${theme.primary}16` },
              ]}
            >
              <MaterialCommunityIcons
                name="poll"
                color={theme.primary}
                size={25}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text }]}>
                Create a poll
              </Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                Get everyone's opinion
              </Text>
            </View>
            <Pressable
              onPress={close}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Close poll"
              style={[styles.close, { backgroundColor: theme.background }]}
            >
              <MaterialCommunityIcons
                name="close"
                color={theme.secondaryText}
                size={21}
              />
            </Pressable>
          </View>

          <ScrollView
            style={styles.fields}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.label, { color: theme.text }]}>Question</Text>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              editable={!saving}
              placeholder="What should we decide?"
              placeholderTextColor={theme.secondaryText}
              maxLength={250}
              multiline
              style={[
                styles.questionInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
            />
            <Text style={[styles.label, { color: theme.text, marginTop: 18 }]}>
              Options
            </Text>
            {options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <View
                  style={[
                    styles.number,
                    { backgroundColor: `${theme.primary}13` },
                  ]}
                >
                  <Text style={[styles.numberText, { color: theme.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                <TextInput
                  value={option}
                  onChangeText={(text) => changeOption(index, text)}
                  editable={!saving}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor={theme.secondaryText}
                  maxLength={120}
                  returnKeyType="done"
                  style={[
                    styles.optionInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
                {options.length > MIN_OPTIONS && (
                  <Pressable
                    disabled={saving}
                    onPress={() =>
                      setOptions((current) =>
                        current.filter((_, i) => i !== index)
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Remove option ${index + 1}`}
                    style={styles.remove}
                  >
                    <MaterialCommunityIcons
                      name="close-circle-outline"
                      size={22}
                      color={theme.secondaryText}
                    />
                  </Pressable>
                )}
              </View>
            ))}
            {options.length < MAX_OPTIONS && (
              <Pressable
                disabled={saving}
                onPress={() => setOptions((current) => [...current, ""])}
                style={styles.addRow}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="plus-circle-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.addText, { color: theme.primary }]}>
                  Add option
                </Text>
              </Pressable>
            )}
            <Text style={[styles.hint, { color: theme.secondaryText }]}>
              Participants can select one option.
            </Text>
          </ScrollView>

          <Pressable
            onPress={submit}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Create poll"
            style={[
              styles.submit,
              { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitText}>Create poll</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#FFF"
                />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: CHAT_UI.overlay,
  },
  sheet: {
    maxHeight: "89%",
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 19,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, marginLeft: 12 },
  title: { fontSize: 22, letterSpacing: -0.5, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 3 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  fields: { flexGrow: 0 },
  label: { fontSize: 14, fontWeight: "800", marginBottom: 9 },
  questionInput: {
    minHeight: 72,
    maxHeight: 130,
    textAlignVertical: "top",
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13,
    fontSize: 15,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 10,
  },
  number: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { fontSize: 12, fontWeight: "800" },
  optionInput: {
    flex: 1,
    height: 47,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  remove: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  addText: { fontSize: 14, fontWeight: "700" },
  hint: { fontSize: 12, marginTop: 10, marginBottom: 20 },
  submit: {
    minHeight: 52,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: { fontSize: 15, fontWeight: "800", color: "#FFF" },
});
