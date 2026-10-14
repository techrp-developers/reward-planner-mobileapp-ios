import React, { memo, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ChatAvatar from "./ChatAvatar";
import PollBubble from "./PollBubble";
import { messageTime, safeChatAttachmentUrl } from "../utils";
import { messagePreview } from "../messageState";
import type { ChatMessage } from "../types";
import type { ChatThemePreset } from "../theme/chatThemes";
import { useChatColors } from "./chatUiTokens";

type Props = {
  message: ChatMessage;
  quoted?: ChatMessage;
  mine: boolean;
  group: boolean;
  showName: boolean;
  showAvatar: boolean;
  preset: ChatThemePreset;
  onReply: (message: ChatMessage) => void;
  onActions: (message: ChatMessage) => void;
  onImage: (message: ChatMessage) => void;
  onFile: (message: ChatMessage) => void;
  onQuote: (message: ChatMessage) => void;
  onRetry: (message: ChatMessage) => void;
  onVote: (message: ChatMessage, optionId: number) => Promise<void>;
};
function ChatMessageBubble({
  message: item,
  quoted,
  mine,
  group,
  showName,
  showAvatar,
  preset,
  onReply,
  onActions,
  onImage,
  onFile,
  onQuote,
  onRetry,
  onVote,
}: Props) {
  const theme = useChatColors();
  const { width } = useWindowDimensions();
  const [ratio, setRatio] = React.useState(1);
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => () => slide.stopAnimation(), [slide]);
  const replyRef = useRef(onReply);
  replyRef.current = onReply;
  const itemRef = useRef(item);
  itemRef.current = item;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !itemRef.current.deleted_at &&
          itemRef.current.message_id > 0 &&
          Math.abs(gesture.dy) < 12 &&
          (mine ? gesture.dx < -24 : gesture.dx > 24),
        onPanResponderMove: (_, gesture) =>
          slide.setValue(
            mine
              ? Math.max(-60, Math.min(0, gesture.dx))
              : Math.min(60, Math.max(0, gesture.dx))
          ),
        onPanResponderTerminate: () =>
          Animated.spring(slide, { toValue: 0, useNativeDriver: true }).start(),
        onPanResponderRelease: (_, gesture) => {
          Animated.spring(slide, { toValue: 0, useNativeDriver: true }).start();
          if (Math.abs(gesture.dx) > 44) replyRef.current(itemRef.current);
        },
      }),
    [mine, slide]
  );
  // Bubble-specific colours, checked for >=4.5:1 contrast (small text) on
  // every preset: white on the accent bubble, slate on the pastel/dark
  // incoming bubbles. Not the global secondaryText, which is too light on them.
  const foreground = mine ? "#FFFFFF" : theme.text;
  const muted = mine ? "rgba(255,255,255,0.88)" : theme.isDark ? "#CBD5E1" : "#475569";
  const mediaWidth = Math.min(width * 0.64, 268);
  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: mine ? "flex-end" : "flex-start",
          marginTop: showName ? 10 : 2,
        },
      ]}
    >
      {group && !mine && (
        <View style={styles.avatar}>
          {showAvatar && (
            <ChatAvatar
              name={item.sender_name}
              uri={item.sender_image}
              size={28}
            />
          )}
        </View>
      )}
      <Animated.View
        style={{ maxWidth: "80%", transform: [{ translateX: slide }] }}
        {...pan.panHandlers}
      >
        {showName && (
          <Text style={[styles.sender, { color: theme.primary }]}>
            {item.sender_name}
          </Text>
        )}
        <Pressable
          onLongPress={() => !item.deleted_at && onActions(item)}
          delayLongPress={350}
          accessibilityHint="Long press for message actions; swipe to reply"
          style={[
            styles.bubble,
            mine
              ? { backgroundColor: preset.accent, borderBottomRightRadius: 5 }
              : {
                  backgroundColor: theme.isDark
                    ? preset.darkOtherBubble
                    : preset.lightOtherBubble,
                  borderBottomLeftRadius: 5,
                },
          ]}
        >
          {!item.deleted_at && item.reply_to_message_id && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go to original message"
              onPress={() => quoted && onQuote(quoted)}
              disabled={!quoted}
              style={[
                styles.quote,
                {
                  borderLeftColor: mine ? "#FFFFFF" : preset.accent,
                  backgroundColor: mine
                    ? "rgba(255,255,255,.13)"
                    : `${preset.accent}0D`,
                },
              ]}
            >
              <Text
                style={[styles.quoteName, { color: foreground }]}
                numberOfLines={1}
              >
                {quoted?.sender_name || "Original message"}
              </Text>
              <Text style={{ color: muted, fontSize: 13 }} numberOfLines={2}>
                {quoted
                  ? messagePreview(quoted)
                  : "Original message is not loaded"}
              </Text>
            </TouchableOpacity>
          )}
          {item.deleted_at ? (
            <Text style={[styles.body, { color: muted, fontStyle: "italic" }]}>
              This message was deleted
            </Text>
          ) : item.message_type === "image" &&
            safeChatAttachmentUrl(item.attachment_url) ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="View shared photo"
              onPress={() => onImage(item)}
              onLongPress={() => onActions(item)}
            >
              <Image
                source={{ uri: safeChatAttachmentUrl(item.attachment_url) }}
                onLoad={(event) => {
                  const { width: w, height: h } = event.nativeEvent.source;
                  if (w && h) setRatio(w / h);
                }}
                resizeMode="contain"
                style={{
                  width: mediaWidth,
                  height: Math.min(mediaWidth / ratio, 340),
                  borderRadius: 12,
                }}
              />
            </TouchableOpacity>
          ) : item.message_type === "file" ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.attachment_name || "document"}`}
              onPress={() => onFile(item)}
              onLongPress={() => onActions(item)}
              style={[styles.file, { width: mediaWidth }]}
            >
              <View
                style={[
                  styles.fileIcon,
                  {
                    backgroundColor: mine
                      ? "rgba(255,255,255,.15)"
                      : `${preset.accent}12`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={28}
                  color={foreground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={2}
                  style={[styles.fileName, { color: foreground }]}
                >
                  {item.attachment_name || "Document"}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ color: muted, fontSize: 11, marginTop: 4 }}
                >
                  {item.attachment_mime_type || "File"}
                  {item.attachment_size
                    ? ` · ${Math.ceil(item.attachment_size / 1024)} KB`
                    : ""}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="download"
                size={20}
                color={foreground}
              />
            </TouchableOpacity>
          ) : item.message_type === "poll" && item.poll ? (
            <PollBubble
              poll={item.poll}
              mine={mine}
              textColor={foreground}
              onVote={(optionId) => onVote(item, optionId)}
            />
          ) : (
            <Text selectable style={[styles.body, { color: foreground }]}>
              {item.body ||
                (item.message_type === "image" ? "Photo unavailable" : "")}
            </Text>
          )}
          <View style={styles.meta}>
            <Text style={{ color: muted, fontSize: 11 }}>
              {messageTime(item.created_at)}
            </Text>
            {mine &&
              !item.deleted_at &&
              (item.local_status === "sending" ? (
                <ActivityIndicator size="small" color={muted} />
              ) : item.local_status === "failed" ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Retry failed message"
                  onPress={() => onRetry(item)}
                  style={styles.retry}
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={17}
                    color="#FECACA"
                  />
                  <Text style={{ color: "#FECACA", fontSize: 11 }}>Retry</Text>
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons
                  name={item.is_read ? "check-all" : "check"}
                  size={16}
                  color={item.is_read ? READ_RECEIPT : muted}
                />
              ))}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { width: "100%", flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  avatar: { width: 28, marginRight: 8, marginBottom: 2 },
  sender: { fontSize: 12, fontWeight: "600", marginLeft: 10, marginBottom: 4 },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 7,
  },
  body: { fontSize: 16, lineHeight: 22 },
  meta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  quote: { borderLeftWidth: 3, padding: 8, borderRadius: 8, marginBottom: 8 },
  quoteName: { fontSize: 13, fontWeight: "600", marginBottom: 3 },
  file: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 68 },
  fileIcon: {
    width: 44,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 14, fontWeight: "600" },
  retry: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 },
});
// Light cyan stays readable (>=4.5:1) on every accent bubble, unlike sky blue.
const READ_RECEIPT = "#A5F3FC";

export default memo(ChatMessageBubble);
