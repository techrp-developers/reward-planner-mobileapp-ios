import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ServiceFeedback } from '../../api/OrderAPI';
import { useServicesTheme } from '../../utils/useServicesTheme';

type Props = {
  feedback: ServiceFeedback;
  onSubmitFeedback?: () => void;
};

export default function ServiceFeedbackCard({ feedback, onSubmitFeedback }: Props) {
  const servicesTheme = useServicesTheme();

  if (!feedback.can_submit || feedback.submitted) return null;

  return (
    <View style={[styles.container, { borderTopColor: servicesTheme.colors.divider }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="star-outline" size={16} color="#F59E0B" />
        <Text style={[styles.title, { color: servicesTheme.colors.text }]}>Feedback</Text>
      </View>

      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: servicesTheme.isDark ? '#18112A' : '#EDE9FE' }]}
        onPress={onSubmitFeedback}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="star-plus-outline" size={16} color={servicesTheme.colors.primary} />
        <Text style={[styles.ctaText, { color: servicesTheme.colors.primary }]}>Rate this service</Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  title: { fontSize: 13, fontWeight: '700', color: '#374151' },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ctaText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
});
