import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../../../theme/ThemeContext';

// Generate dynamic years based on the current date
const getDynamicTimeOptions = () => {
  const currentYear = new Date().getFullYear();
  const options = [
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'Last 6 Months', value: '6months' },
  ];

  // Add the last 5 years dynamically
  for (let i = 0; i < 5; i++) {
    const year = (currentYear - i).toString();
    options.push({ label: year, value: year });
  }

  return options;
};

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' },
];

export default function FilterBottomSheet({ visible, onClose, currentTime, currentStatus, onApply }) {
  const { isDark, theme } = useAppTheme();
  const TIME_OPTIONS = useMemo(() => getDynamicTimeOptions(), []);
  const [selectedTime, setSelectedTime] = useState(currentTime);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.card }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Filter Orders</Text>
          <TouchableOpacity onPress={() => { setSelectedTime('30days'); setSelectedStatus(''); }}>
            <Text style={styles.reset}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>Order Time</Text>
        <View style={styles.chipGrid}>
          {TIME_OPTIONS.map((item) => (
            <TouchableOpacity 
              key={item.value}
              onPress={() => setSelectedTime(item.value)}
              activeOpacity={0.8}
            >
              {selectedTime === item.value ? (
                <LinearGradient
                  colors={['#8665FF', '#5B47A3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeChip}
                >
                  <Text style={styles.activeChipText}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.chip, { backgroundColor: isDark ? '#111827' : '#F3F4F6', borderColor: theme.border }]}>
                  <Text style={[styles.chipText, { color: theme.text }]}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>Order Status</Text>
        <View style={styles.chipGrid}>
          {STATUS_OPTIONS.map((item) => (
            <TouchableOpacity 
              key={item.value}
              onPress={() => setSelectedStatus(item.value)}
              activeOpacity={0.8}
            >
              {selectedStatus === item.value ? (
                <LinearGradient
                  colors={['#8665FF', '#5B47A3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeChip}
                >
                  <Text style={styles.activeChipText}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.chip, { backgroundColor: isDark ? '#111827' : '#F3F4F6', borderColor: theme.border }]}>
                  <Text style={[styles.chipText, { color: theme.text }]}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => onApply(selectedTime, selectedStatus)} activeOpacity={0.9} style={styles.applyBtnWrap}>
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.applyBtn}
          >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 24,
    paddingBottom: 40
  },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  reset: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 12, marginTop: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: { 
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, 
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#F0F0F0' 
  },
  activeChip: { 
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'transparent'
  },
  chipText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  activeChipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  applyBtnWrap: {
    borderRadius: 16,
    marginTop: 10,
    backgroundColor: '#5B47A3',
    shadowColor: '#5B47A3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  applyBtn: {
    height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  applyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});
