import React, { useEffect, useRef } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChatColors, CHAT_UI } from "./chatUiTokens";
export type MessageAction = {
  text: string;
  onPress: () => void;
  style?: "destructive";
};
export default function ChatMessageActionSheet({
  actions,
  onClose,
  title = "Message",
}: {
  actions: MessageAction[] | null;
  onClose: () => void;
  title?: string;
}) {
  const theme = useChatColors();
  const insets = useSafeAreaInsets();
  const pending = useRef<(() => void) | null>(null);
  const finish = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };
  useEffect(() => {
    if (actions || Platform.OS === "ios" || !pending.current) return;
    const timer = setTimeout(finish, 350);
    return () => clearTimeout(timer);
  }, [actions]);
  return (
    <Modal
      visible={actions !== null}
      transparent
      animationType="slide"
      onDismiss={finish}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message actions"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {actions?.map((action) => (
            <Pressable
              key={action.text}
              accessibilityRole="button"
              onPress={() => {
                if (pending.current) return;
                pending.current = action.onPress;
                onClose();
              }}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: pressed ? theme.background : theme.card },
              ]}
            >
              <Text
                style={{
                  color:
                    action.style === "destructive"
                      ? theme.isDark
                        ? "#FDA4AF"
                        : "#BE123C"
                      : theme.text,
                  fontSize: 16,
                }}
              >
                {action.text}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.action}
          >
            <Text style={{ color: theme.secondaryText, fontSize: 16 }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: CHAT_UI.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  action: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
  },
});
