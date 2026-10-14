import React, { memo, useEffect, useRef } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatColors } from "./chatUiTokens";
import { CHAT_UI } from "./chatUiTokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  onImage: () => void;
  onDocument: () => void;
  onPoll: () => void;
};

const choices = [
  {
    key: "image",
    title: "Photos",
    subtitle: "Share moments from your gallery",
    icon: "image-multiple-outline",
    accent: "#7C3AED",
  },
  {
    key: "document",
    title: "Documents",
    subtitle: "PDFs, reports and other files",
    icon: "file-document-outline",
    accent: "#2563EB",
  },
  {
    key: "poll",
    title: "Poll",
    subtitle: "Ask everyone a question",
    icon: "poll",
    accent: "#059669",
  },
] as const;

function ChatAttachmentSheet({
  visible,
  onClose,
  onImage,
  onDocument,
  onPoll,
}: Props) {
  const theme = useChatColors();
  const insets = useSafeAreaInsets();
  const actions = { image: onImage, document: onDocument, poll: onPoll };
  const pending = useRef<(() => void) | null>(null);
  const finish = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };
  useEffect(() => {
    if (visible || Platform.OS === "ios" || !pending.current) return;
    const timer = setTimeout(finish, 350);
    return () => clearTimeout(timer);
  }, [visible]);
  const choose = (key: keyof typeof actions) => {
    if (pending.current) return;
    pending.current = actions[key];
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
      onDismiss={finish}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Dismiss attachments"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
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
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: theme.primary }]}>
                ATTACHMENT
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                Share in chat
              </Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                Choose what you'd like to send
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close attachments"
              accessibilityRole="button"
              hitSlop={6}
              style={[styles.close, { backgroundColor: theme.background }]}
            >
              <MaterialCommunityIcons
                name="close"
                color={theme.secondaryText}
                size={21}
              />
            </Pressable>
          </View>
          <View style={styles.list}>
            {choices.map((choice) => (
              <Pressable
                key={choice.key}
                onPress={() => choose(choice.key)}
                accessibilityRole="button"
                accessibilityLabel={`Attach ${choice.title}`}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconTile,
                    { backgroundColor: `${choice.accent}16` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={choice.icon}
                    size={25}
                    color={choice.accent}
                  />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>
                    {choice.title}
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtitle,
                      { color: theme.secondaryText },
                    ]}
                    numberOfLines={1}
                  >
                    {choice.subtitle}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.secondaryText}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: CHAT_UI.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: CHAT_UI.radius.sheet,
    borderTopRightRadius: CHAT_UI.radius.sheet,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
  },
  handle: {
    height: 5,
    width: 40,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerCopy: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 4 },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { gap: 10 },
  option: {
    minHeight: 76,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  iconTile: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCopy: { flex: 1, marginHorizontal: 12 },
  optionTitle: { fontSize: 15, fontWeight: "700" },
  optionSubtitle: { fontSize: 12, marginTop: 3 },
});

export default memo(ChatAttachmentSheet);
