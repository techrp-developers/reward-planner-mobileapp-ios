import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { ServiceFeedback } from '../../api/OrderAPI';

type Props = {
  feedback: ServiceFeedback;
  onSubmitFeedback?: () => void;
};

export default function ServiceFeedbackCard({ feedback, onSubmitFeedback }: Props) {
  if (!feedback.can_submit && !feedback.submitted) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="star-outline" size={16} color="#F59E0B" />
        <Text style={styles.title}>Feedback</Text>
      </View>

      {feedback.submitted && feedback.data ? (
        <View style={styles.submitted}>
          {typeof feedback.data?.rating === 'number' && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <MaterialCommunityIcons
                  key={star}
                  name={star <= feedback.data.rating ? 'star' : 'star-outline'}
                  size={18}
                  color="#F59E0B"
                />
              ))}
            </View>
          )}
          {feedback.data?.comment ? (
            <Text style={styles.comment}>{feedback.data.comment}</Text>
          ) : null}
        </View>
      ) : feedback.can_submit ? (
        <TouchableOpacity style={styles.ctaBtn} onPress={onSubmitFeedback} activeOpacity={0.8}>
          <MaterialCommunityIcons name="star-plus-outline" size={16} color="#7C3AED" />
          <Text style={styles.ctaText}>Rate this service</Text>
        </TouchableOpacity>
      ) : null}
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

  submitted: { gap: 6 },
  ratingRow: { flexDirection: 'row', gap: 2 },
  comment: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 18 },

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
