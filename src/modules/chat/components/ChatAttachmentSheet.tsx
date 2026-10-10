import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../theme/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  onImage: () => void;
  onDocument: () => void;
  onPoll: () => void;
};

const options = [
  {
    key: 'image',
    title: 'Photos',
    subtitle: 'Choose from your gallery',
    icon: 'image-multiple-outline',
    color: '#7C3AED',
  },
  {
    key: 'document',
    title: 'Document',
    subtitle: 'Share PDF, Word or other files',
    icon: 'file-document-outline',
    color: '#2563EB',
  },
  {
    key: 'poll',
    title: 'Poll',
    subtitle: 'Ask a question and collect votes',
    icon: 'poll',
    color: '#059669',
  },
] as const;

export default function ChatAttachmentSheet({ visible, onClose, onImage, onDocument, onPoll }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const actions = { image: onImage, document: onDocument, poll: onPoll };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close share options" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.headingRow}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>Share in chat</Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Choose what you want to send</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.background }]}>
              <MaterialCommunityIcons name="close" size={21} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {options.map(option => (
              <TouchableOpacity
                key={option.key}
                accessibilityRole="button"
                accessibilityLabel={`Share ${option.title}`}
                activeOpacity={0.72}
                onPress={actions[option.key]}
                style={[styles.option, { borderColor: theme.border, backgroundColor: theme.background }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${option.color}18` }]}>
                  <MaterialCommunityIcons name={option.icon} size={27} color={option.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{option.title}</Text>
                  <Text style={[styles.optionSubtitle, { color: theme.secondaryText }]} numberOfLines={1}>{option.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 18,
  },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, marginBottom: 18 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 21, fontWeight: '800' },
  subtitle: { marginTop: 4, fontSize: 12 },
  closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  options: { gap: 10 },
  option: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 10 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, marginLeft: 13 },
  optionTitle: { fontSize: 15, fontWeight: '800' },
  optionSubtitle: { marginTop: 4, fontSize: 11 },
});
