import React, { memo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useChatColors } from "./chatUiTokens";

const categories = [
  {
    name: "Faces",
    icon: "emoticon-happy-outline",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😍",
      "🥰",
      "😘",
      "😎",
      "🤔",
      "😮",
      "😢",
      "😭",
      "😤",
      "🥳",
      "🤗",
      "🫡",
      "😴",
    ],
  },
  {
    name: "Gestures",
    icon: "hand-wave-outline",
    emojis: [
      "👋",
      "🤚",
      "✋",
      "👌",
      "✌️",
      "🤞",
      "🤟",
      "🤙",
      "👍",
      "👎",
      "👏",
      "🙌",
      "👐",
      "🤝",
      "🙏",
      "💪",
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "✨",
      "🔥",
    ],
  },
  {
    name: "Work",
    icon: "briefcase-outline",
    emojis: [
      "💼",
      "📅",
      "📆",
      "📝",
      "📌",
      "📎",
      "📁",
      "📊",
      "📈",
      "💻",
      "📱",
      "✉️",
      "🔔",
      "⏰",
      "✅",
      "❌",
      "❓",
      "💡",
      "🎯",
      "🏆",
      "🎉",
      "🚀",
      "☕",
      "🍕",
    ],
  },
] as const;
function ChatEmojiPanel({
  onSelect,
  onBackspace,
}: {
  onSelect: (emoji: string) => void;
  onBackspace: () => void;
}) {
  const theme = useChatColors();
  const { height } = useWindowDimensions();
  const [category, setCategory] = useState(0);
  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: theme.card,
          height: Math.min(260, Math.max(120, height * 0.38)),
        },
      ]}
    >
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((item, index) => (
            <TouchableOpacity
              key={item.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: category === index }}
              accessibilityLabel={item.name}
              onPress={() => setCategory(index)}
              style={[
                styles.category,
                category === index && { backgroundColor: `${theme.primary}18` },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={22}
                color={category === index ? theme.primary : theme.secondaryText}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Delete previous character"
          onPress={onBackspace}
          style={styles.category}
        >
          <MaterialCommunityIcons
            name="backspace-outline"
            size={22}
            color={theme.secondaryText}
          />
        </TouchableOpacity>
      </View>
      <FlatList
        key={category}
        data={[...categories[category].emojis]}
        numColumns={6}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityLabel={item}
            accessibilityRole="button"
            onPress={() => onSelect(item)}
            style={styles.emoji}
          >
            <Text style={styles.glyph}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { height: 260, marginTop: 8 },
  toolbar: { flexDirection: "row", marginBottom: 4 },
  category: {
    width: 48,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 27 },
});
export default memo(ChatEmojiPanel);
