import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

import {
  getServiceCancellationReasons,
  requestServiceOrderCancellation,
  type ServiceCancellationReason,
} from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceCancellationRequest'>;

const PURPLE = '#7C3AED';

export default function ServiceCancellationRequest() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const {
    service_order_id,
    parent_order_id,
    order_ref,
    service_name,
    variant_name,
    image_url,
  } = route.params;

  const [reasons, setReasons] = useState<ServiceCancellationReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<ServiceCancellationReason | null>(null);
  const [comment, setComment] = useState('');
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadReasons = useCallback(async () => {
    setLoadingReasons(true);
    try {
      const res = await getServiceCancellationReasons();
      setReasons(res.reasons);
    } catch (err: any) {
      Alert.alert(
        'Unable to load reasons',
        err?.message || 'Please try again in a moment.'
      );
      setReasons([]);
    } finally {
      setLoadingReasons(false);
    }
  }, []);

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  const isReasonOther = /isn.t listed|not listed|other/i.test(
    selectedReason?.reason_text || ''
  );
  const isSubmitDisabled =
    !selectedReason || submitting || (isReasonOther && comment.trim().length === 0);

  const submitCancellation = async () => {
    if (!selectedReason) {
      Alert.alert('Reason required', 'Please select a cancellation reason.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestServiceOrderCancellation({
        service_order_id,
        reason_id: selectedReason.reason_id,
        comment,
      });

      if (res?.success) {
        setSubmitted(true);
        return;
      }

      Alert.alert('Request failed', res?.message || 'Unable to submit cancellation request.');
    } catch (err: any) {
      Alert.alert(
        'Request failed',
        err?.message || 'Unable to submit cancellation request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.confirmScroll}>
          <LinearGradient
            colors={['#30205F', '#5B3CB4', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmTop}
          >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.navigate('ServiceOrderDetail', { parent_order_id })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.confirmHero}>
            <View style={styles.confirmCopy}>
              <Text style={styles.confirmEyebrow}>REQUEST SUBMITTED</Text>
              <Text style={styles.confirmTitle}>Cancellation Requested</Text>
              <Text style={styles.confirmSubtitle}>
                We’ve received your request and our team will review it shortly.
              </Text>
              <TouchableOpacity
                style={styles.confirmLink}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('ServiceOrderDetail', { parent_order_id })}
              >
                <Text style={styles.confirmLinkText}>View Request Details</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.successBadge}>
              <View style={styles.successCircle}>
                <MaterialCommunityIcons name="clock-check-outline" size={32} color="#FFF" />
              </View>
              <MaterialCommunityIcons
                name="star-four-points"
                size={22}
                color="#FFF"
                style={styles.sparkleOne}
              />
              <MaterialCommunityIcons
                name="star-four-points"
                size={18}
                color="#FFF"
                style={styles.sparkleTwo}
              />
            </View>
          </View>
          </LinearGradient>

          <View style={styles.confirmContent}>
            <ServiceSummaryCard
              serviceName={service_name}
              variantName={variant_name}
              orderRef={order_ref}
              imageUrl={image_url}
            />

            <View style={styles.reviewCard}>
              <View style={styles.reviewIcon}>
                <MaterialCommunityIcons name="progress-clock" size={22} color={PURPLE} />
              </View>
              <View style={styles.reviewCopy}>
                <Text style={styles.reviewTitle}>Request under review</Text>
                <Text style={styles.reviewText}>
                  Your service remains in request status until the cancellation is reviewed.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.confirmActionRow}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.75}
            >
              <Text style={styles.confirmActionText}>Keep Shopping</Text>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.confirmDivider} />

            <TouchableOpacity
              style={styles.confirmActionRow}
              onPress={() => navigation.navigate('MyOrder')}
              activeOpacity={0.75}
            >
              <Text style={styles.confirmActionText}>View All Orders</Text>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Request Cancellation" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ServiceSummaryCard
          serviceName={service_name}
          variantName={variant_name}
          orderRef={order_ref}
          imageUrl={image_url}
        />

        <View style={styles.reasonCard}>
          <View style={styles.reasonHeader}>
            <View style={styles.reasonIcon}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={PURPLE} />
            </View>
            <View style={styles.reasonHeaderCopy}>
              <Text style={styles.reasonTitle}>Reason For Cancellation</Text>
              <Text style={styles.reasonSubtitle}>
                Pick the closest reason so we can process the request smoothly.
              </Text>
            </View>
          </View>

          {loadingReasons ? (
            <View style={styles.loadingReasons}>
              <ActivityIndicator color={PURPLE} />
              <Text style={styles.loadingReasonText}>Loading reasons...</Text>
            </View>
          ) : null}

          {!loadingReasons && !selectedReason && reasons.map(reason => (
            <TouchableOpacity
              key={reason.reason_id}
              style={styles.reasonRow}
              activeOpacity={0.75}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={styles.radioOuter} />
              <Text style={styles.reasonText}>{reason.reason_text}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}

          {!loadingReasons && !selectedReason && reasons.length === 0 ? (
            <View style={styles.emptyReasonBox}>
              <Text style={styles.emptyReasonText}>
                No cancellation reasons are available right now.
              </Text>
              <TouchableOpacity onPress={loadReasons} style={styles.retryReasonsButton}>
                <Text style={styles.retryReasonsText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {selectedReason ? (
            <>
              <TouchableOpacity
                style={[styles.reasonRow, styles.reasonRowSelected]}
                activeOpacity={0.75}
                onPress={() => setSelectedReason(null)}
              >
                <View style={[styles.radioOuter, styles.radioOuterActive]}>
                  <View style={styles.radioInner} />
                </View>
                <Text style={styles.reasonText}>{selectedReason.reason_text}</Text>
                <Text style={styles.changeReasonText}>Change</Text>
              </TouchableOpacity>

              <View style={styles.commentBox}>
                <Text style={styles.commentLabel}>
                  Comments{isReasonOther ? '*' : ''}
                </Text>
                <TextInput
                  placeholder="Enter any specific questions or requirements you'd like to share"
                  placeholderTextColor="#9CA3AF"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  textAlignVertical="top"
                  style={styles.commentInput}
                />
              </View>
            </>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isSubmitDisabled}
          onPress={submitCancellation}
        >
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit Request</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <LinearGradient
      colors={['#30205F', '#5B3CB4', '#7C3AED']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <TouchableOpacity
        style={styles.headerBack}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>SERVICE REQUEST</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.headerIcon}>
        <MaterialCommunityIcons name="shield-check-outline" size={21} color="#FFF" />
      </View>
    </LinearGradient>
  );
}

function ServiceSummaryCard({
  serviceName,
  variantName,
  orderRef,
  imageUrl,
}: {
  serviceName: string;
  variantName?: string;
  orderRef: string;
  imageUrl?: string | null;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryAccent} />
      <View style={styles.summaryTop}>
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.serviceImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="file-document-outline" size={34} color={PURPLE} />
          )}
        </View>

        <View style={styles.summaryInfo}>
          <Text style={styles.serviceName} numberOfLines={2}>{serviceName}</Text>
          <Text style={styles.variantName} numberOfLines={2}>
            {variantName || 'Service cancellation request'}
          </Text>
        </View>
      </View>

      <View style={styles.orderRefRow}>
        <View>
          <Text style={styles.orderRefLabel}>ORDER ID</Text>
          <Text style={styles.orderRefText}>#{orderRef}</Text>
        </View>
        <View style={styles.copyButton}>
          <MaterialCommunityIcons name="content-copy" size={16} color="#4F46E5" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F5FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 1,
    letterSpacing: -0.4,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    overflow: 'hidden',
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  summaryAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: PURPLE,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrap: {
    width: 78,
    height: 78,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#251B40',
    letterSpacing: -0.3,
    lineHeight: 23,
  },
  variantName: {
    fontSize: 13,
    color: '#817A91',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '600',
  },
  orderRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1EEF8',
    paddingTop: 14,
  },
  orderRefLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  orderRefText: {
    fontSize: 14,
    color: '#251B40',
    fontWeight: '900',
    marginTop: 3,
  },
  copyButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  reasonCard: {
    marginTop: 14,
    backgroundColor: '#FFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    padding: 16,
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  reasonIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
    marginRight: 12,
  },
  reasonHeaderCopy: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#251B40',
    letterSpacing: -0.25,
  },
  reasonSubtitle: {
    fontSize: 12,
    color: '#817A91',
    lineHeight: 17,
    marginTop: 4,
    fontWeight: '600',
  },
  loadingReasons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingReasonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderTopColor: '#F4F1FA',
  },
  reasonRowSelected: {
    borderTopWidth: 0,
    backgroundColor: '#F7F3FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: PURPLE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#4B4658',
    fontWeight: '700',
  },
  changeReasonText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '900',
  },
  emptyReasonBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  emptyReasonText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  retryReasonsButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  retryReasonsText: {
    fontSize: 13,
    color: PURPLE,
    fontWeight: '800',
  },
  commentBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E7DDFD',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFEFF',
  },
  commentLabel: {
    fontSize: 13,
    color: '#251B40',
    fontWeight: '800',
    marginBottom: 10,
  },
  commentInput: {
    minHeight: 96,
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
    padding: 0,
  },
  submitButton: {
    height: 58,
    marginTop: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  confirmScroll: {
    flexGrow: 1,
    backgroundColor: '#F6F5FB',
    paddingBottom: 32,
  },
  confirmTop: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 72,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  confirmHero: {
    marginTop: 22,
    alignItems: 'center',
  },
  confirmCopy: {
    alignItems: 'center',
  },
  confirmEyebrow: {
    marginTop: 18,
    fontSize: 10,
    color: 'rgba(255,255,255,0.66)',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  confirmTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.7,
    marginTop: 5,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.76)',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  confirmLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  confirmLinkText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  successBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleOne: {
    position: 'absolute',
    left: 13,
    top: 15,
  },
  sparkleTwo: {
    position: 'absolute',
    right: 10,
    bottom: 17,
  },
  confirmContent: {
    marginTop: -46,
    paddingHorizontal: 20,
    gap: 14,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  reviewIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
    marginRight: 12,
  },
  reviewCopy: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 14,
    color: '#251B40',
    fontWeight: '900',
  },
  reviewText: {
    fontSize: 12,
    color: '#817A91',
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 4,
  },
  confirmActions: {
    marginTop: 14,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  confirmActionRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmActionText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#251B40',
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#D4D4D8',
  },
});
