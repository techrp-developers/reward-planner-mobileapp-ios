import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme/ThemeContext';

type Props = {
  visible: boolean;
  releaseNotes?: string;
  onUpdate: () => void;
  onLater: () => void;
};

/** Optional JS bundle updates only. Native App Store updates use AppUpdateModal. */
export function OtaUpdatePrompt({ visible, releaseNotes, onUpdate, onLater }: Props) {
  const { isDark, theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1033' : '#FFFFFF' }]}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="cloud-download-outline" size={30} color="#A654CD" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Update Ready</Text>
          <Text style={[styles.body, { color: isDark ? '#D4D4D8' : '#62527E' }]}>
            {releaseNotes || 'A quick improvement is ready to apply. It only takes a second and the app will restart.'}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onUpdate} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Update Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={onLater} activeOpacity={0.7}>
            <Text style={[styles.laterBtnText, { color: isDark ? '#A1A1AA' : '#9B7FC0' }]}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: { width: '100%', borderRadius: 22, padding: 24, alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(166,84,205,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  primaryBtn: { width: '100%', backgroundColor: '#A654CD', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  laterBtn: { paddingVertical: 6 },
  laterBtnText: { fontSize: 14, fontWeight: '600' },
});
