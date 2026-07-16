import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { ServiceItem } from '../../api/OrderAPI';
import ServiceTimelineCard from './ServiceTimelineCard';
import ServiceFeedbackCard from './ServiceFeedbackCard';
import ServiceCancellationCard from './ServiceCancellationCard';

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending:              { color: '#D97706', bg: '#FFFBEB', label: 'Pending' },
  pending_payment:      { color: '#D97706', bg: '#FFFBEB', label: 'Payment Pending' },
  payment_done:         { color: '#16A34A', bg: '#F0FDF4', label: 'Payment Done' },
  pending_documents:    { color: '#D97706', bg: '#FFFBEB', label: 'Docs Pending' },
  documents_pending:    { color: '#D97706', bg: '#FFFBEB', label: 'Docs Pending' },
  documents_uploaded:   { color: '#7C3AED', bg: '#EDE9FE', label: 'Docs Uploaded' },
  in_progress:          { color: '#2563EB', bg: '#EFF6FF', label: 'In Progress' },
  completed:            { color: '#16A34A', bg: '#F0FDF4', label: 'Completed' },
  cancelled:            { color: '#DC2626', bg: '#FEF2F2', label: 'Cancelled' },
};

const CANCELLABLE_STATUSES = new Set([
  'pending_payment',
  'payment_done',
  'documents_pending',
  'documents_uploaded',
  'in_progress',
]);

type Props = {
  item: ServiceItem;
  onCancelPress: (item: ServiceItem) => void;
  onFeedbackPress: (item: ServiceItem) => void;
};

export default function ServiceOrderItemCard({
  item,
  onCancelPress,
  onFeedbackPress,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[item.status] || {
    color: '#6B7280',
    bg: '#F3F4F6',
    label: item.status,
  };

  return (
    <View style={styles.card}>
      {/* ── Tap to expand/collapse header ─────────────────────────────── */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(p => !p)}
        activeOpacity={0.75}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.info}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {item.service_name}
          </Text>
          <Text style={styles.variantName}>{item.variant_name}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.statusText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
            <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
          </View>

          <Text style={styles.ref}>{item.order_ref}</Text>
        </View>

        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {/* ── Expanded detail ────────────────────────────────────────────── */}
      {expanded && (
        <View style={styles.body}>
          {item.timeline.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Service progress</Text>
              <ServiceTimelineCard steps={item.timeline} />
            </>
          )}

          <ServiceFeedbackCard
            feedback={item.feedback}
            onSubmitFeedback={() => onFeedbackPress(item)}
          />

          <ServiceCancellationCard
            cancellation={item.cancellation}
            serviceName={item.service_name}
            canCancelByStatus={CANCELLABLE_STATUSES.has(item.status)}
            onCancelPress={() => onCancelPress(item)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
  },

  image: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  info: { flex: 1 },

  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  variantName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 11, fontWeight: '600' },

  price: { fontSize: 14, fontWeight: '800', color: '#111827', marginLeft: 'auto' },

  ref: { fontSize: 11, color: '#9CA3AF' },

  body: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 14,
    backgroundColor: '#FAFAFA',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
});
