import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutChangeEvent,
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import OrderItemCard from '../../../../modules/common/order/OrderItemCard';
import { submitServiceFeedback } from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceFeedback'>;

const PURPLE = '#7C3AED';
const TRACK_STEPS = [1, 2, 3, 4, 5];

const EXPERIENCE_LABELS = ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
const EASE_LABELS = ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy'];
const EXPERT_LABELS = ['Very Poor', 'Poor', 'Neutral', 'Good', 'Excellent'];
const SCALE_ICONS = [
  'alert-circle-outline',
  'minus-circle-outline',
  'circle-outline',
  'check-circle-outline',
  'check-decagram-outline',
];

const COMPLETION_OPTIONS = [
  { label: 'Faster than expected', value: 'fast' },
  { label: 'On time', value: 'on_time' },
  { label: 'Delayed', value: 'delayed' },
];

const CONFIDENCE_OPTIONS = [
  { label: 'Yes, completely', value: 'high' },
  { label: 'Mostly', value: 'medium' },
  { label: 'Not really', value: 'low' },
];

const REUSE_OPTIONS = [
  { label: 'Definitely', value: 'definitely' },
  { label: 'Maybe', value: 'maybe' },
  { label: 'Unlikely', value: 'unlikely' },
];

export default function ServiceFeedback() {
  const navigation = useNavigation<Nav>();
  const servicesTheme = useServicesTheme();
  const route = useRoute<RouteT>();
  const {
    service_order_id,
    parent_order_id,
    order_ref,
    service_name,
    variant_name,
    image_url,
  } = route.params;

  const [rating, setRating] = useState(0);
  const [easeRating, setEaseRating] = useState(0);
  const [expertRating, setExpertRating] = useState(0);
  const [completionTime, setCompletionTime] = useState('');
  const [confidence, setConfidence] = useState('');
  const [reuseIntent, setReuseIntent] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitDisabled = rating === 0 || submitting;

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Rating required', 'Please rate your overall service experience.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitServiceFeedback({
        service_order_id,
        rating,
        ease_rating: easeRating || undefined,
        expert_rating: expertRating || undefined,
        completion_time: completionTime || undefined,
        confidence: confidence || undefined,
        reuse_intent: reuseIntent || undefined,
        comment,
      });

      if (res?.success) {
        Alert.alert('Thank you!', 'Your feedback has been submitted successfully.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ServiceOrderDetail', { parent_order_id }),
          },
        ]);
        return;
      }

      Alert.alert('Submission failed', res?.message || 'Unable to submit feedback.');
    } catch (err: any) {
      Alert.alert('Submission failed', err?.message || 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
      <Header
        title="Service Feedback"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <OrderItemCard
          image={
            image_url ? (
              <Image source={{ uri: image_url }} style={styles.productImage} />
            ) : (
              <MaterialCommunityIcons name="file-document-outline" size={34} color={PURPLE} />
            )
          }
          title={service_name || 'Service'}
          weight={variant_name || 'Tell us about your completed service'}
          orderId={order_ref}
        />

        <StarRatingCard
          title="How was your experience with this service?"
          rating={rating}
          onChange={setRating}
        />

        <IconScaleCard
          title="How easy was it to complete this service on our app?"
          value={easeRating}
          labels={EASE_LABELS}
          onChange={setEaseRating}
        />

        <IconScaleCard
          title="How was your experience with our Service Expert?"
          value={expertRating}
          labels={EXPERT_LABELS}
          onChange={setExpertRating}
        />

        <OptionCard
          title="Was your service completed within the expected time?"
          options={COMPLETION_OPTIONS}
          value={completionTime}
          onChange={setCompletionTime}
        />

        <OptionCard
          title="Did you feel confident that your service was handled correctly?"
          options={CONFIDENCE_OPTIONS}
          value={confidence}
          onChange={setConfidence}
        />

        <OptionCard
          title="Would you use this service again?"
          options={REUSE_OPTIONS}
          value={reuseIntent}
          onChange={setReuseIntent}
        />

        <View style={[styles.commentSection, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
          <Text style={[styles.commentTitle, { color: servicesTheme.colors.textStrong }]}>Anything you’d like us to improve?</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Type here"
            placeholderTextColor={servicesTheme.colors.subtle}
            multiline
            textAlignVertical="top"
            style={[styles.commentInput, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border, color: servicesTheme.colors.text }]}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={submitDisabled}
          onPress={handleSubmit}
        >
          <LinearGradient
            colors={servicesTheme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.header, { backgroundColor: servicesTheme.colors.surface, borderBottomColor: servicesTheme.colors.divider }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="chevron-left" size={30} color={servicesTheme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: servicesTheme.colors.textStrong }]}>{title}</Text>
    </View>
  );
}

function StarRatingCard({
  title,
  rating,
  onChange,
}: {
  title: string;
  rating: number;
  onChange: (value: number) => void;
}) {
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.card, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
      <Text style={[styles.cardTitle, { color: servicesTheme.colors.textStrong }]}>{title}</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(value => (
          <TouchableOpacity
            key={value}
            style={styles.starItem}
            activeOpacity={0.75}
            onPress={() => onChange(value)}
          >
            <MaterialCommunityIcons
              name={value <= rating ? 'star' : 'star-outline'}
              size={28}
              color={value <= rating ? '#F59E0B' : '#CBD5E1'}
            />
            <Text style={[styles.starLabel, { color: servicesTheme.colors.muted }, value === rating && styles.selectedLabel, value === rating && { color: servicesTheme.colors.primary }]}>
              {EXPERIENCE_LABELS[value - 1]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function IconScaleCard({
  title,
  value,
  labels,
  onChange,
}: {
  title: string;
  value: number;
  labels: string[];
  onChange: (value: number) => void;
}) {
  const servicesTheme = useServicesTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedValue = value || 1;

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const updateFromTrack = (event: GestureResponderEvent) => {
    if (!trackWidth) return;
    const x = Math.max(0, Math.min(event.nativeEvent.locationX, trackWidth));
    const next = Math.min(5, Math.max(1, Math.round((x / trackWidth) * 4) + 1));
    onChange(next);
  };

  return (
    <View style={[styles.card, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
      <Text style={[styles.cardTitle, { color: servicesTheme.colors.textStrong }]}>{title}</Text>
      <View style={styles.scaleOptionRow}>
        {TRACK_STEPS.map(option => {
          const selected = option === value;
          return (
            <TouchableOpacity
              key={option}
              style={styles.scaleOptionItem}
              activeOpacity={0.75}
              onPress={() => onChange(option)}
            >
              <View style={[styles.scaleIconWrap, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border }, selected && styles.scaleIconWrapActive]}>
                <MaterialCommunityIcons
                  name={SCALE_ICONS[option - 1]}
                  size={20}
                  color={selected ? servicesTheme.colors.primary : servicesTheme.colors.subtle}
                />
              </View>
              <Text style={[styles.scaleOptionLabel, { color: servicesTheme.colors.muted }, selected && styles.selectedLabel, selected && { color: servicesTheme.colors.primary }]}>
                {labels[option - 1]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View
        onLayout={handleTrackLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={updateFromTrack}
        onResponderMove={updateFromTrack}
        style={styles.scaleTrackTouch}
      >
        <View style={[styles.scaleTrack, { backgroundColor: servicesTheme.colors.divider }]}>
          <View style={[styles.scaleFill, { width: `${selectedValue * 20}%`, backgroundColor: servicesTheme.colors.primary }]} />
          <View style={[styles.scaleThumb, { left: `${(selectedValue - 1) * 25}%` }]} />
        </View>
      </View>
    </View>
  );
}

function OptionCard({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.card, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
      <Text style={[styles.cardTitle, { color: servicesTheme.colors.textStrong }]}>{title}</Text>
      <View style={styles.optionList}>
        {options.map(option => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={styles.optionRow}
              activeOpacity={0.75}
              onPress={() => onChange(option.value)}
            >
              <View style={[styles.radio, selected && styles.radioActive]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={[styles.optionText, { color: servicesTheme.colors.text }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  scroll: {
    padding: 16,
    paddingBottom: 34,
    gap: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
  },
  cardTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 14,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starItem: {
    alignItems: 'center',
    flex: 1,
  },
  starLabel: {
    marginTop: 6,
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  scaleOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleOptionItem: {
    flex: 1,
    alignItems: 'center',
  },
  scaleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  scaleIconWrapActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  scaleOptionLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedLabel: {
    color: PURPLE,
    fontWeight: '900',
  },
  scaleTrackTouch: {
    paddingVertical: 10,
    marginTop: 6,
  },
  scaleTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 99,
  },
  scaleFill: {
    height: 5,
    backgroundColor: '#8665FF',
    borderRadius: 99,
  },
  scaleThumb: {
    position: 'absolute',
    top: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEE7FF',
    borderWidth: 3,
    borderColor: '#9A78FF',
  },
  optionList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  radioActive: {
    borderColor: PURPLE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },
  optionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  commentSection: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  commentTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 10,
  },
  commentInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    color: '#111827',
    fontSize: 13,
    backgroundColor: '#FFF',
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
