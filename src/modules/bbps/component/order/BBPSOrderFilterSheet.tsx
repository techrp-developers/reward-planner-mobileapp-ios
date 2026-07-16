import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBbpsTheme } from '../../utils/useBbpsTheme';

export type BBPSOrderStatus = '' | 'successful' | 'pending' | 'failed' | 'refunded';
export type BBPSOrderTime = '' | '30days' | '3months' | '6months' | 'currentYear' | string;

type Props = {
  visible: boolean;
  currentStatus: BBPSOrderStatus;
  currentTime: BBPSOrderTime;
  onClose: () => void;
  onApply: (status: BBPSOrderStatus, time: BBPSOrderTime) => void;
  bbpsTheme?: ReturnType<typeof useBbpsTheme>;
};

const STATUS_OPTIONS: Array<{ label: string; value: BBPSOrderStatus }> = [
  { label: 'Successful', value: 'successful' },
  { label: 'Pending', value: 'pending' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
];

export const TIME_LABELS: Record<string, string> = {
  '30days': 'Last 30 days',
  '3months': 'Last 3 months',
  '6months': 'Last 6 months',
  currentYear: 'Current Year',
};

export const STATUS_LABELS: Record<string, string> = {
  successful: 'Successful',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
};

export default function BBPSOrderFilterSheet({
  visible,
  currentStatus,
  currentTime,
  onClose,
  onApply,
  bbpsTheme: providedTheme,
}: Props) {
  const insets = useSafeAreaInsets();
  const fallbackTheme = useBbpsTheme();
  const bbpsTheme = providedTheme || fallbackTheme;
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(currentYear - index));
  }, []);
  const [status, setStatus] = useState<BBPSOrderStatus>(currentStatus);
  const [time, setTime] = useState<BBPSOrderTime>(currentTime);

  useEffect(() => {
    if (!visible) return;
    setStatus(currentStatus);
    setTime(currentTime);
  }, [currentStatus, currentTime, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 20),
              backgroundColor: bbpsTheme.colors.surface,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: bbpsTheme.colors.textStrong }]}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={30} color={bbpsTheme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[styles.sectionTitle, { color: bbpsTheme.colors.muted }]}>SORT BY</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((option) => {
                const selected = status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setStatus(selected ? '' : option.value)}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: bbpsTheme.colors.elevated,
                        borderColor: bbpsTheme.colors.border,
                      },
                      selected && styles.statusChipSelected,
                      selected && { backgroundColor: bbpsTheme.isDark ? '#18112A' : '#F3EEFF', borderColor: bbpsTheme.colors.primary },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: bbpsTheme.colors.muted }, selected && styles.statusTextSelected, selected && { color: bbpsTheme.colors.primary }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { color: bbpsTheme.colors.muted }]}>SORT BY TIME</Text>
            {[
              ['30days', 'Last 30 days'],
              ['3months', 'Last 3 months'],
              ['6months', 'Last 6 months'],
              ['currentYear', 'Current Year'],
              ...years.map((year) => [year, year]),
            ].map(([value, label]) => {
              const selected = time === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setTime(selected ? '' : value)}
                  style={styles.radioRow}
                >
                  <MaterialCommunityIcons
                    name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={27}
                    color={selected ? bbpsTheme.colors.primary : bbpsTheme.colors.subtle}
                  />
                  <Text style={[styles.radioLabel, { color: bbpsTheme.colors.text }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity onPress={() => onApply(status, time)} activeOpacity={0.9}>
            <LinearGradient
              colors={bbpsTheme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyButton}
            >
              <Text style={styles.applyText}>Apply</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  sheet: {
    maxHeight: '82%',
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#27272A', fontSize: 22, fontWeight: '800' },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 18 },
  sectionTitle: { marginTop: 8, marginBottom: 12, color: '#52525B', fontSize: 13, fontWeight: '800' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statusChip: {
    minWidth: 82,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7E4E2',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  statusChipSelected: { borderColor: '#7C3AED', backgroundColor: '#F3EEFF' },
  statusText: { color: '#71717A', fontSize: 13, fontWeight: '500' },
  statusTextSelected: { color: '#6D4ACB', fontWeight: '700' },
  radioRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  radioLabel: { marginLeft: 12, color: '#52525B', fontSize: 14, fontWeight: '600' },
  applyButton: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
