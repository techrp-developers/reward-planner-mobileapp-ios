import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { ChatThemeKey } from '../types';
import { CHAT_THEMES } from '../theme/chatThemes';

type Props = {
  visible: boolean;
  value: ChatThemeKey;
  saving: boolean;
  onClose: () => void;
  onChange: (theme: ChatThemeKey) => void;
};

export default function ChatSettingsSheet({ visible, value, saving, onClose, onChange }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.heading}>
            <View style={[styles.headingIcon, { backgroundColor: `${theme.primary}18` }]}>
              <MaterialCommunityIcons name="pencil-outline" size={23} color={theme.primary} />
            </View>
            <View style={styles.headingText}>
              <Text style={[styles.title, { color: theme.text }]}>Chat settings</Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Changes are visible to everyone in this chat</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.close, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="close" size={21} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="palette-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
          </View>
          <Text style={[styles.sectionHint, { color: theme.secondaryText }]}>Choose the colors for this conversation</Text>
          <View style={styles.themeGrid}>
            {CHAT_THEMES.map(option => {
              const selected = option.key === value;
              return (
                <TouchableOpacity key={option.key} disabled={saving} activeOpacity={0.75} onPress={() => onChange(option.key)} style={[styles.themeOption, { borderColor: selected ? option.accent : theme.border, backgroundColor: theme.background }, selected && styles.selected]}>
                  <View style={[styles.preview, { backgroundColor: option.lightBackground }]}>
                    <View style={[styles.otherBubble, { backgroundColor: option.lightOtherBubble }]} />
                    <View style={[styles.myBubble, { backgroundColor: option.accent }]} />
                    {selected ? <View style={[styles.check, { backgroundColor: option.accent }]}><MaterialCommunityIcons name="check" size={13} color="#FFF" /></View> : null}
                  </View>
                  <Text style={[styles.themeName, { color: theme.text }]}>{option.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {saving ? <View style={styles.saving}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.savingText, { color: theme.secondaryText }]}>Updating for everyone…</Text></View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, elevation: 20 },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, marginBottom: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headingIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1, marginLeft: 12 }, title: { fontSize: 20, fontWeight: '800' }, subtitle: { fontSize: 11, marginTop: 3 },
  close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sectionTitle: { fontSize: 16, fontWeight: '800' }, sectionHint: { fontSize: 12, marginTop: 4, marginBottom: 15 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeOption: { width: '31%', borderWidth: 1, borderRadius: 15, padding: 7, alignItems: 'center' }, selected: { borderWidth: 2 },
  preview: { width: '100%', height: 62, borderRadius: 10, padding: 8, overflow: 'hidden' }, otherBubble: { width: 34, height: 13, borderRadius: 7 }, myBubble: { alignSelf: 'flex-end', width: 39, height: 14, borderRadius: 7, marginTop: 8 },
  check: { position: 'absolute', right: 4, top: 4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  themeName: { fontSize: 11, fontWeight: '700', marginTop: 7 }, saving: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, savingText: { fontSize: 11 },
});
