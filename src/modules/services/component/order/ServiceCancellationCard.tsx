import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ServiceCancellation } from '../../api/OrderAPI';
import { useServicesTheme } from '../../utils/useServicesTheme';

type Props = {
  cancellation: ServiceCancellation;
  serviceName: string;
  canCancelByStatus: boolean;
  onCancelPress: () => void;
  onViewDetailsPress: () => void;
};

export default function ServiceCancellationCard({
  cancellation,
  serviceName,
  canCancelByStatus,
  onCancelPress,
  onViewDetailsPress,
}: Props) {
  const servicesTheme = useServicesTheme();
  const hasCancellation = Boolean(cancellation.status);
  const enabled = cancellation.can_cancel && canCancelByStatus;
  const actionEnabled = hasCancellation || enabled;
  const isDetailsAction = hasCancellation;

  return (
    <View style={[styles.container, { borderTopColor: servicesTheme.colors.divider }]}>
      <TouchableOpacity
        style={[
          styles.cancelBtn,
          isDetailsAction && styles.detailsBtn,
          isDetailsAction && { backgroundColor: servicesTheme.isDark ? '#18112A' : '#F5F3FF' },
          !actionEnabled && styles.cancelBtnDisabled,
        ]}
        onPress={isDetailsAction ? onViewDetailsPress : onCancelPress}
        activeOpacity={0.8}
        disabled={!actionEnabled}
      >
        <MaterialCommunityIcons
          name={isDetailsAction ? 'file-document-outline' : enabled ? 'close-circle-outline' : 'lock-outline'}
          size={16}
          color={isDetailsAction ? '#6D5BD0' : enabled ? '#DC2626' : '#9CA3AF'}
        />
        <Text
          style={[
            styles.cancelText,
            isDetailsAction && styles.detailsText,
            !actionEnabled && styles.cancelTextDisabled,
          ]}
        >
          {isDetailsAction
            ? 'View Cancellation Details'
            : enabled
              ? `Cancel ${serviceName}`
              : 'Cancellation unavailable'}
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
  detailsBtn: {
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  detailsText: { color: '#6D5BD0' },
  cancelTextDisabled: { color: '#9CA3AF' },
});
