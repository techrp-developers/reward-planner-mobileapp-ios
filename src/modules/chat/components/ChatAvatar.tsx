import React, { memo, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { chatImageUrl, initials } from "../utils";
import { useChatColors } from "./chatUiTokens";
function ChatAvatar({
  name,
  uri,
  size = 52,
  online = false,
}: {
  name?: string;
  uri?: string | null;
  size?: number;
  online?: boolean;
}) {
  const theme = useChatColors();
  const source = chatImageUrl(uri);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);
  return (
    <View style={{ width: size, height: size }}>
      {source && !failed ? (
        <Image
          source={{ uri: source }}
          onError={() => setFailed(true)}
          accessibilityLabel={name ? `${name}'s avatar` : "Avatar"}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.border,
          }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: `${theme.primary}18`,
            },
          ]}
        >
          <Text
            style={{
              color: theme.primary,
              fontWeight: "700",
              fontSize: size * 0.34,
            }}
          >
            {initials(name)}
          </Text>
        </View>
      )}
      {online && <View style={[styles.online, { borderColor: theme.card }]} />}
    </View>
  );
}
const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  online: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    right: 0,
    bottom: 1,
    backgroundColor: "#22C55E",
    borderWidth: 2,
  },
});
export default memo(ChatAvatar);
