import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import BBPSHead from '../constatnt/BBPSHead';
import { createBillPayOrder, verifyBillPayPayment } from '../api/BillsAPI';
import { useAlert } from '../../ecommerce/components/alerts';
import { useBbpsTheme } from '../utils/useBbpsTheme';

// Premium Design Theme Config
const BRAND_PRIMARY = '#8665FF';
const BRAND_SECONDARY = '#5B47A3';
const BG_COLOR = '#F8F7FF';
const WHITE_CARD = '#FFFFFF';
const COLOR_DARK = '#1F2937';
const COLOR_LIGHT = '#6B7280';
const COLOR_SUCCESS = '#22C55E';
const PAYMENT_MESSAGE_DURATION_MS = 10000;

type ConfirmationRouteParams = {
  operatorName?: string;
  categoryName?: string;
  nickname?: string;
  formValues?: Record<string, string>;
  fetchBillData?: {
    success?: boolean;
    message?: string;
    data?: {
      customer?: {
        consumerNumber?: string;
        customerName?: string;
        operatorId?: string;
      };
      bill?: {
        amount?: string;
        dueDate?: string;
        billNumber?: string;
        billDate?: string;
      };
      billFetchId?: number;
      raw?: Record<string, any>;
    };
  };
};

const hasDisplayValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'null' && normalized !== 'undefined' && normalized !== '-';
};

const formatAmount = (value?: string | number) => {
  const normalized = String(value ?? '').replace(/[^0-9.]/g, '');
  if (!normalized) return '';
  const amount = Number(normalized);
  return Number.isNaN(amount) ? normalized : amount.toString();
};

const formatBillDate = (value?: string | number | null) => {
  if (!hasDisplayValue(value)) {
    return '-';
  }

  const rawValue = String(value).trim();
  const compactDate = rawValue.match(/^(\d{4})(\d{2})(\d{2})$/);
  const dashedDate = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parts = compactDate || dashedDate;

  if (!parts) {
    return rawValue;
  }

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return rawValue;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Reusable Info Row — icon + label + value, used across the Bill Summary card
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  bbpsTheme: ReturnType<typeof useBbpsTheme>;
}
const InfoRow: React.FC<InfoRowProps> = React.memo(({ icon, label, value, bbpsTheme }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowLeft}>
      <MaterialIcons name={icon} size={16} color={bbpsTheme.colors.primary} />
      <Text style={[styles.infoRowLabel, { color: bbpsTheme.colors.muted }]}>{label}</Text>
    </View>
    <Text style={[styles.infoRowValue, { color: bbpsTheme.colors.text }]} numberOfLines={1}>{value}</Text>
  </View>
));
InfoRow.displayName = 'InfoRow';

const PaymentConfirmationScreenComponent = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const alert = useAlert();
  const bbpsTheme = useBbpsTheme();

  const [processing, setProcessing] = useState(false);

  // Memoizing Parameter Dependencies To Eradicate Hook Warnings
  const params = useMemo(() => (route.params || {}) as ConfirmationRouteParams, [route.params]);
  const customer = useMemo(() => params.fetchBillData?.data?.customer || {}, [params.fetchBillData]);
  const bill = useMemo(() => params.fetchBillData?.data?.bill || {}, [params.fetchBillData]);

  const consumerNumber = useMemo(() => {
    return (
      customer.consumerNumber ||
      params.formValues?.utility_acc_no ||
      Object.values(params.formValues || {}).find((v) => v?.trim()) ||
      '-'
    );
  }, [customer.consumerNumber, params.formValues]);

  const customerName = useMemo(() => customer.customerName || 'Customer', [customer.customerName]);
  const operatorName = useMemo(() => params.operatorName || 'Biller', [params.operatorName]);
  const categoryName = useMemo(() => params.categoryName || 'Bill Payment', [params.categoryName]);

  const cardTitle = useMemo(() => {
    return params.nickname ? `${params.nickname} - ${customerName}` : customerName;
  }, [params.nickname, customerName]);

  const billAmount = useMemo(() => formatAmount(bill.amount), [bill.amount]);
  const billDate = useMemo(() => formatBillDate(bill.billDate), [bill.billDate]);
  const dueDate = useMemo(() => formatBillDate(bill.dueDate), [bill.dueDate]);
  const billFetchId = useMemo(() => params.fetchBillData?.data?.billFetchId, [params.fetchBillData]);
  const rawMessage = useMemo(() => params.fetchBillData?.data?.raw?.message || '', [params.fetchBillData]);

  const isBillDetailsMissing = useMemo(() => {
    return !hasDisplayValue(bill.amount) && !hasDisplayValue(bill.dueDate) && !hasDisplayValue(bill.billNumber);
  }, [bill]);

  const isProceedDisabled = useMemo(() => processing || !billAmount, [processing, billAmount]);
  const headerTitle = useMemo(() => `Pay ${categoryName}`, [categoryName]);
  const logoText = useMemo(() => operatorName.slice(0, 2).toUpperCase() || 'BB', [operatorName]);

  // Handle Order Generation & Verification Execution
  const handleProceed = useCallback(async () => {
    if (!billFetchId) {
      alert.warning('Missing Bill', 'Bill fetch id is missing. Please fetch the bill again.');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        operator_id: String(customer.operatorId || ''),
        bill_fetch_id: billFetchId,
      };

      const response = await createBillPayOrder(payload);

      if (response.success === false) {
        alert.warning(
          'Order Failed',
          response.message || 'Unable to create bill payment order.',
          PAYMENT_MESSAGE_DURATION_MS
        );
        return;
      }

      // create-order responds with { key, orderId, amount, currency, transaction_id }
      const order = response.data;

      if (!order?.key || !order?.orderId) {
        alert.warning('Payment Failed', 'Payment order details are missing.', PAYMENT_MESSAGE_DURATION_MS);
        return;
      }

      const paymentResult = await RazorpayCheckout.open({
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'RewardsPlanners',
        description: `${operatorName} Bill Payment`,
        prefill: {
          name: customerName,
          contact: consumerNumber,
        },
        theme: {
          color: BRAND_PRIMARY,
        },
      });

      // verify-payment expects only the three razorpay_* fields — no transaction_id.
      const verifyPayload = {
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      };

      const verifyResponse = await verifyBillPayPayment(verifyPayload);

      // The backend can legitimately return success:false with a transaction_id
      // when the payment was captured but bill processing is queued/retrying
      // (HTTP 202) or already resolved by a webhook — the status screen still
      // needs to open so the user can track that in-progress/refund state.
      const transactionId = verifyResponse?.transaction_id ?? order.transaction_id;

      if (verifyResponse?.success === false && !transactionId) {
        alert.warning(
          'Payment Verification Failed',
          verifyResponse?.message || 'Unable to verify payment.',
          PAYMENT_MESSAGE_DURATION_MS
        );
        return;
      }

      navigation.navigate('TransactionStatusScreen', { transactionId });
    } catch (error: any) {
      // A rejected verify-payment call (e.g. HTTP 422 when the provider
      // permanently rejected the transaction) still carries a transaction_id —
      // route to the status screen instead of stranding the user on an alert.
      const transactionId = error?.transaction_id;
      if (transactionId) {
        navigation.navigate('TransactionStatusScreen', { transactionId });
        return;
      }

      alert.error('Error', error?.message || 'Could not create bill payment order.', PAYMENT_MESSAGE_DURATION_MS);
    } finally {
      setProcessing(false);
    }
  }, [billFetchId, customer.operatorId, operatorName, customerName, consumerNumber, alert, navigation]);

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bbpsTheme.colors.background }]}>
      {/* 1. Statically Positioned Header */}
      <BBPSHead title={headerTitle} onBackPress={handleBackPress} />

      {/* 2. Scrollable View Container Workspace */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainContainer}>

          {/* Customer Card */}
          <View style={[styles.premiumCard, { backgroundColor: bbpsTheme.colors.surface }]}>
            <LinearGradient
              colors={bbpsTheme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCardHeader}
            >
              <View style={styles.premiumLogoCircle}>
                <Text style={styles.premiumLogoText}>{logoText}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.premiumCustomerName} numberOfLines={1}>{cardTitle}</Text>
                <Text style={styles.premiumBillId} numberOfLines={1}>{consumerNumber}</Text>
              </View>
            </LinearGradient>

            <View style={styles.customerCardBody}>
              <InfoRow icon="apartment" label="Operator" value={operatorName} bbpsTheme={bbpsTheme} />
              <View style={[styles.infoRowDivider, { backgroundColor: bbpsTheme.colors.divider }]} />
              <InfoRow icon="category" label="Category" value={categoryName} bbpsTheme={bbpsTheme} />
            </View>
          </View>

          {/* Bill Summary Card */}
          <View style={[styles.billSummaryCard, { backgroundColor: bbpsTheme.colors.surface, borderColor: bbpsTheme.colors.border }]}>
            <Text style={[styles.cardSectionTitle, { color: bbpsTheme.colors.textStrong }]}>Bill Summary</Text>
            <InfoRow icon="confirmation-number" label="Bill Number" value={bill.billNumber || '-'} bbpsTheme={bbpsTheme} />
            <View style={[styles.infoRowDivider, { backgroundColor: bbpsTheme.colors.divider }]} />
            <InfoRow icon="event" label="Bill Date" value={billDate} bbpsTheme={bbpsTheme} />
            <View style={[styles.infoRowDivider, { backgroundColor: bbpsTheme.colors.divider }]} />
            <InfoRow icon="event-busy" label="Due Date" value={dueDate} bbpsTheme={bbpsTheme} />
            <View style={[styles.infoRowDivider, { backgroundColor: bbpsTheme.colors.divider }]} />
            <InfoRow icon="person-outline" label="Consumer No." value={String(consumerNumber)} bbpsTheme={bbpsTheme} />
          </View>

          {/* Conditional Warning Notification Banner */}
          {isBillDetailsMissing && (
            <View style={styles.premiumWarningBanner}>
              <MaterialIcons name="error-outline" size={18} color="#9A3412" style={styles.warningBannerIcon} />
              <Text style={styles.premiumWarningText}>
                Bill metrics currently unavailable. Verify validation parameter contexts manually before continuing.{' '}
                {rawMessage ? rawMessage : ''}
              </Text>
            </View>
          )}

          {/* Amount Card */}
          <View style={[styles.amountCard, { backgroundColor: bbpsTheme.colors.surface }]}>
            <Text style={[styles.amountCardLabel, { color: bbpsTheme.colors.muted }]}>Amount Payable</Text>
            <LinearGradient
              colors={bbpsTheme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.amountPill}
            >
              <Text style={styles.amountPillText}>₹{billAmount || '0'}</Text>
            </LinearGradient>
          </View>

          {/* Secure Gateway Trust Banner */}
          <View style={styles.securityTrustCard}>
            <MaterialIcons name="shield" size={22} color={COLOR_SUCCESS} style={styles.securityShieldIcon} />
            <View style={styles.securityContextWrap}>
              <Text style={styles.securityCardTitle}>100% Secure Payment</Text>
              <Text style={styles.securityCardSub}>Powered by Razorpay</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* 3. Outer Locked Premium Bottom Action CTA Plate */}
      <View
        style={[
          styles.premiumStickyFooter,
          {
            backgroundColor: bbpsTheme.colors.surface,
            borderColor: bbpsTheme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.premiumCTA, isProceedDisabled && styles.premiumCTADisabled]}
          activeOpacity={0.9}
          disabled={isProceedDisabled}
          onPress={handleProceed}
        >
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={isProceedDisabled ? ['#C4B5FD', '#A5B4FC'] : bbpsTheme.gradients.primary}
            style={styles.ctaGradientLayout}
          >
            {processing ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.premiumCTAText}> Processing Payment...</Text>
              </>
            ) : (
              <>
                <Text style={styles.premiumCTAText}>
                  Pay ₹{billAmount || '0'}
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" style={styles.ctaForwardArrow} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  premiumCard: {
    backgroundColor: WHITE_CARD,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_SECONDARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  premiumCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  premiumLogoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  premiumLogoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  premiumCustomerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumBillId: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  customerCardBody: {
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  billSummaryCard: {
    backgroundColor: WHITE_CARD,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1EEFF',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_DARK,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoRowLabel: {
    fontSize: 13,
    color: COLOR_LIGHT,
    fontWeight: '500',
  },
  infoRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR_DARK,
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: '#F1EEFF',
  },
  premiumWarningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    marginBottom: 16,
  },
  warningBannerIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  premiumWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 18,
    fontWeight: '600',
  },
  amountCard: {
    backgroundColor: WHITE_CARD,
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_SECONDARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  amountCardLabel: {
    fontSize: 13,
    color: COLOR_LIGHT,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  amountPill: {
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  amountPillText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  securityTrustCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
  },
  securityShieldIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  securityContextWrap: {
    flex: 1,
  },
  securityCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  securityCardSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
    lineHeight: 15,
    fontWeight: '500',
  },
  premiumStickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE_CARD,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  premiumCTA: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  premiumCTADisabled: {
    opacity: 0.8,
  },
  ctaGradientLayout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCTAText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaForwardArrow: {
    marginLeft: 6,
  },
  skeletonPremiumCard: {
    backgroundColor: WHITE_CARD,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  shimmerHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonHeaderTextWrap: {
    marginLeft: 14,
  },
  shimmerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  skeletonTopGap: {
    marginTop: 10,
  },
});

const PaymentConfirmationScreen = React.memo(PaymentConfirmationScreenComponent);
export default PaymentConfirmationScreen;
