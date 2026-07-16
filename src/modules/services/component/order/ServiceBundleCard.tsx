import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import type { ServiceItem, ServiceDetailBundle } from '../../api/OrderAPI';
import ServiceOrderItemCard from './ServiceOrderItemCard';

type Props = {
  bundle: ServiceDetailBundle;
  bundleIndex: number;
  onCancelItem: (item: ServiceItem) => void;
  onFeedbackItem: (item: ServiceItem) => void;
};

export default function ServiceBundleCard({
  bundle,
  bundleIndex,
  onCancelItem,
  onFeedbackItem,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.wrapper}>
      {/* Bundle header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(p => !p)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8665FF', '#5B47A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <MaterialCommunityIcons name="package-variant-closed" size={16} color="#FFF" />
          <Text style={styles.bundleLabel}>Bundle #{bundleIndex}</Text>
          <View style={styles.countChip}>
            <Text style={styles.countText}>{bundle.items.length} services</Text>
          </View>
        </LinearGradient>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Bundle Total</Text>
          <Text style={styles.totalAmount}>
            ₹{bundle.bundle_total.toLocaleString('en-IN')}
          </Text>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </View>
      </TouchableOpacity>

      {/* Bundle items */}
      {expanded && (
        <View style={styles.items}>
          {bundle.items.map(item => (
            <ServiceOrderItemCard
              key={item.id}
              item={item}
              onCancelPress={onCancelItem}
              onFeedbackPress={onFeedbackItem}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // borderWidth: 1,
    // borderColor: '#E5E7EB',
    // borderRadius: 16,
    // overflow: 'hidden',
    // backgroundColor: '#FFF',
    marginBottom: 14,
  },

  header: {},

  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },

  bundleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },

  countChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 6,
  },
  totalLabel: { fontSize: 13, color: '#6B7280', flex: 1 },
  totalAmount: { fontSize: 15, fontWeight: '800', color: '#111827' },

  items: { padding: 10 },
});
