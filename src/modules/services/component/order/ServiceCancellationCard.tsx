import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ServiceCancellation } from '../../api/OrderAPI';

type Props = {
  cancellation: ServiceCancellation;
  serviceName: string;
  canCancelByStatus: boolean;
  onCancelPress: () => void;
};

export default function ServiceCancellationCard({
  cancellation,
  serviceName,
  canCancelByStatus,
  onCancelPress,
}: Props) {
  const enabled = cancellation.can_cancel && canCancelByStatus;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.cancelBtn, !enabled && styles.cancelBtnDisabled]}
        onPress={onCancelPress}
        activeOpacity={0.8}
        disabled={!enabled}
      >
        <MaterialCommunityIcons
          name={enabled ? 'close-circle-outline' : 'lock-outline'}
          size={16}
          color={enabled ? '#DC2626' : '#9CA3AF'}
        />
        <Text style={[styles.cancelText, !enabled && styles.cancelTextDisabled]}>
          {enabled ? `Cancel ${serviceName}` : 'Cancellation unavailable'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 12,
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  cancelBtnDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  cancelTextDisabled: { color: '#9CA3AF' },
});
