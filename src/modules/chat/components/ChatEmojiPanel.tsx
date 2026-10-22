import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme/ThemeContext';

type Props = {
  onSelect: (emoji: string) => void;
  onBackspace: () => void;
};

const categories = [
  {
    key: 'smileys',
    icon: 'emoticon-outline',
    emojis: '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👻 💀 🤖 💩',
  },
  {
    key: 'gestures',
    icon: 'hand-wave-outline',
    emojis: '👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💪 🫶 👀 🧠 🙋 🙆 🙅 🤷 🤦 🙇 💁',
  },
  {
    key: 'hearts',
    icon: 'heart-outline',
    emojis: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💯 ✨ ⭐ 🌟 🔥 💥 🎉 🎊 🎈 🎁 🏆 🥇 ✅ ❌ ⚠️ ❓ ❗ 💡 📌 🔔',
  },
  {
    key: 'nature',
    icon: 'paw',
    emojis: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦄 🐝 🦋 🐢 🐍 🐙 🐬 🐳 🌸 🌹 🌻 🌼 🌷 🌱 🌴 🍀 🍁 🌈 ☀️ 🌙 ⚡ ❄️ 🌊',
  },
  {
    key: 'food',
    icon: 'food-apple-outline',
    emojis: '🍎 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🥭 🍍 🥥 🥑 🌽 🥕 🍞 🧀 🍳 🍔 🍟 🍕 🌭 🥪 🌮 🍜 🍝 🍣 🍱 🍛 🍚 🍰 🎂 🍩 🍪 🍫 🍿 ☕ 🍵 🥤 🧃 🍺 🥂',
  },
  {
    key: 'activity',
    icon: 'soccer',
    emojis: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏏 🏸 🏓 🥊 🏋️ 🚴 🏃 🧘 🎮 🎯 🎲 🎵 🎶 🎤 🎧 🎬 📷 💻 📱 ⌚ 📚 ✏️ 💼 📅 💰 💳 🚗 🚌 ✈️ 🚀 🏠 🏖️ 🗺️',
  },
].map(category => ({ ...category, emojis: category.emojis.split(' ') }));

const COLUMNS = 8;

export default function ChatEmojiPanel({ onSelect, onBackspace }: Props) {
  const { theme } = useAppTheme();
  const [active, setActive] = useState(categories[0].key);
  const emojis = categories.find(category => category.key === active)!.emojis;

  return (
    <View style={[styles.panel, { borderTopColor: theme.border }]}>
      <FlatList
        key={active}
        data={emojis}
        numColumns={COLUMNS}
        keyExtractor={(item, index) => `${item}-${index}`}
        keyboardShouldPersistTaps="always"
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Insert ${item}`}
            onPress={() => onSelect(item)}
            style={styles.cell}
          >
            <Text style={styles.emoji}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <View style={[styles.tabs, { borderTopColor: theme.border }]}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === category.key }}
            onPress={() => setActive(category.key)}
            style={[styles.tab, active === category.key && { backgroundColor: `${theme.primary}1A` }]}
          >
            <MaterialCommunityIcons
              name={category.icon}
              size={21}
              color={active === category.key ? theme.primary : theme.secondaryText}
            />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Delete"
          onPress={onBackspace}
          style={styles.tab}
        >
          <MaterialCommunityIcons name="backspace-outline" size={21} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { height: 290, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  cell: { flex: 1 / COLUMNS, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26 },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tab: { width: 38, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});