import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BBPSHead from '../constatnt/BBPSHead';
import { cancelUnpaidBillPayOrder, createBillPayOrder, verifyBillPayPayment } from '../api/BillsAPI';
import { compareRechargePayloads } from '../utils/rechargeDebug';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAlert } from '../../ecommerce/components/alerts';
import { useBbpsTheme } from '../utils/useBbpsTheme';

// Last successful create-order payload, kept in memory for this session so
// a failing payload (e.g. a different operator) can be diffed against it —
// see compareRechargePayloads() in utils/rechargeDebug.ts.
let lastSuccessfulOrderPayload: Record<string, any> | null = null;

type OrderFailure = {
  status: number | null;
  kind: string;
  message: string;
  error: any;
  payload: Record<string, any>;
};

const BRAND_END = '#5B47A3';
const PAYMENT_MESSAGE_DURATION_MS = 10000;

const getPlanId = (plan: any) =>
  String(plan?.planId || plan?.plan_id || plan?.id || plan?.recharge_plan_id || '');

const getPlanAmount = (plan: any) =>
  String(plan?.amount || plan?.price || plan?.rs || plan?.recharge_amount || '');

const getPlanValidity = (plan: any) =>
  String(plan?.validity || plan?.validityDescription || plan?.validity_desc || '-');

const getPlanData = (plan: any) =>
  String(plan?.data || plan?.dataBenefit || plan?.benefits || '');

const RechargeConfirmationScreenComponent = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const alert = useAlert();
  const bbpsTheme = useBbpsTheme();
  const [loading, setLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const paymentFlowInProgress = useRef(false);
  const automaticPaymentStarted = useRef(false);
  const [orderFailure, setOrderFailure] = useState<OrderFailure | null>(null);
  const params = useMemo(() => route?.params ?? {}, [route?.params]);

  const plan = useMemo(
    () => params?.plan ?? {},
    [params?.plan]
  );

  const formValues = useMemo(
    () => params?.formValues ?? {},
    [params?.formValues]
  );

  const mobile =
    formValues.utility_acc_no ||
    Object.values(formValues).find((value: any) => String(value || '').trim()) ||
    '';
  const planId = getPlanId(plan);
  const amount = getPlanAmount(plan);

  useEffect(() => {
    setLogoFailed(false);
  }, [params.operatorLogoUrl]);

  const handleCreateOrder = useCallback(async () => {
    if (paymentFlowInProgress.current) return;
    if (!params.operatorId || !mobile || !params.circleId || !planId) {
      alert.warning('Missing Details', 'Recharge details are incomplete.');
      return;
    }

    setOrderFailure(null);
    setLoading(true);
    paymentFlowInProgress.current = true;
    let transactionId: string | number | null = null;
    let razorpaySucceeded = false;

    const payload = {
      operator_id: String(params.operatorId),
      utility_acc_no: String(mobile),
      circle_id: String(params.circleId),
      plan_id: planId,
      sender_name: user?.name || 'Customer',
    };

    try {
      __DEV__ && console.log('Create Recharge Order Payload:', payload);
      const response = await createBillPayOrder(payload);
      __DEV__ && console.log('Create Recharge Order Response:', response);

      if (response.success === false) {
        if (__DEV__ && lastSuccessfulOrderPayload) {
          compareRechargePayloads(
            lastSuccessfulOrderPayload,
            payload,
            'last successful order',
            `failing order (operator_id=${payload.operator_id})`
          );
        }

        setOrderFailure({
          status: response.status,
          kind: response.kind,
          message: response.message || 'Unable to create recharge order.',
          error: response.error,
          payload,
        });
        return;
      }

      lastSuccessfulOrderPayload = payload;

      // create-order responds with { key, orderId, amount, currency, transaction_id }
      const order = response.data;
      transactionId = order?.transaction_id ?? null;

      if (!order?.key || !order?.orderId) {
        setOrderFailure({
          status: null,
          kind: 'BAD_RESPONSE',
          message: 'Payment order details (key/orderId) are missing from the response.',
          error: order,
          payload,
        });
        return;
      }

      const paymentResult = await RazorpayCheckout.open({
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'RewardsPlanners',
        description: `${params.operatorName || 'Recharge'} payment`,
        prefill: {
          name: user?.name || 'Customer',
          contact: user?.phone || String(mobile),
        },
        theme: {
          color: '#8665FF',
        },
      });
      razorpaySucceeded = true;

      // verify-payment expects only the three razorpay_* fields — no transaction_id.
      const verifyPayload = {
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      };
      __DEV__ && console.log('Verify Recharge Payment Payload:', verifyPayload);
      const verifyResponse = await verifyBillPayPayment(verifyPayload);
      __DEV__ && console.log('Verify Recharge Payment Response:', verifyResponse);

      // The backend can legitimately return success:false with a transaction_id
      // when the payment was captured but bill processing is queued/retrying
      // (HTTP 202) or already resolved by a webhook — the status screen still
      // needs to open so the user can track that in-progress/refund state.
      transactionId = verifyResponse?.transaction_id ?? order.transaction_id;

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
      const errorTransactionId = error?.transaction_id ?? transactionId;
      if (razorpaySucceeded && errorTransactionId) {
        navigation.navigate('TransactionStatusScreen', { transactionId: errorTransactionId });
        return;
      }

      if (!razorpaySucceeded && errorTransactionId) {
        try {
          await cancelUnpaidBillPayOrder(errorTransactionId);
        } catch {
          // Cancellation is rejected when a payment was attempted/captured.
          // In that case status tracking is safer than inviting another pay.
          navigation.navigate('TransactionStatusScreen', {
            transactionId: errorTransactionId,
          });
          return;
        }
      }

      // Razorpay checkout cancellation/failure or verify-payment network error.
      alert.error('Error', error?.message || 'Could not create recharge order.', PAYMENT_MESSAGE_DURATION_MS);
    } finally {
      setLoading(false);
      paymentFlowInProgress.current = false;
    }
  }, [params.operatorId, params.circleId, params.operatorName, mobile, planId, user, alert, navigation]);

  useEffect(() => {
    if (!params.startPaymentImmediately || automaticPaymentStarted.current) {
      return;
    }

    automaticPaymentStarted.current = true;
    handleCreateOrder();
  }, [params.startPaymentImmediately, handleCreateOrder]);

  const handleCopyErrorDetails = useCallback(async () => {
    if (!orderFailure) return;

    const details = [
      'Order Creation Failed',
      `Status: ${orderFailure.status ?? 'N/A'}`,
      `Kind: ${orderFailure.kind}`,
      `Message: ${orderFailure.message}`,
      `Payload: ${JSON.stringify(orderFailure.payload)}`,
      `Error: ${JSON.stringify(orderFailure.error)}`,
    ].join('\n');

    try {
      await Share.share({ message: details, title: 'Recharge order error details' });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }, [orderFailure]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bbpsTheme.colors.background }]}>
      <BBPSHead
        title="Plan details"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.planDetailsHeading}>
            {params.operatorLogoUrl && !logoFailed ? (
              <Image
                source={{ uri: params.operatorLogoUrl }}
                style={[styles.detailsOperatorLogo, { borderColor: bbpsTheme.colors.border }]}
                resizeMode="contain"
                accessibilityLabel={params.operatorLogoAlt || `${params.operatorName || 'Operator'} logo`}
                onError={() => setLogoFailed(true)}
              />
            ) : null}
            <Text style={[styles.planGroupTitle, { color: bbpsTheme.colors.textStrong }]}>
              {params.planGroupLabel || 'Plan details'}
            </Text>
          </View>

          <View style={[styles.planSummaryCard, { backgroundColor: bbpsTheme.colors.surface, borderColor: bbpsTheme.colors.border }]}>
            <View style={styles.planPriceRow}>
              <Text style={[styles.summaryLabel, { color: bbpsTheme.colors.muted }]}>Plan price</Text>
              <Text style={[styles.summaryPrice, { color: bbpsTheme.colors.textStrong }]}>₹{amount || '-'}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: bbpsTheme.colors.divider }]} />
            <View style={styles.summaryFactsRow}>
              <View style={styles.summaryFact}>
                <Text style={[styles.summaryLabel, { color: bbpsTheme.colors.muted }]}>Validity</Text>
                <Text style={[styles.summaryValue, { color: bbpsTheme.colors.textStrong }]}>{getPlanValidity(plan)}</Text>
              </View>
              {getPlanData(plan) && (
                <View style={styles.summaryFact}>
                  <Text style={[styles.summaryLabel, { color: bbpsTheme.colors.muted }]}>Data</Text>
                  <Text style={[styles.summaryValue, { color: bbpsTheme.colors.textStrong }]}>{getPlanData(plan)}</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.detailsTitle, { color: bbpsTheme.colors.textStrong }]}>Details</Text>
          <Text style={[styles.detailsText, { color: bbpsTheme.colors.text }]}>
            {plan?.description || 'No description available'}
          </Text>

          {orderFailure && (
            <View style={styles.errorCard}>
              <View style={styles.errorCardHeader}>
                <MaterialIcons name="error-outline" size={20} color="#DC2626" />
                <Text style={styles.errorCardTitle}>Order Creation Failed</Text>
              </View>
              <Text style={styles.errorCardMessage}>{orderFailure.message}</Text>
              {orderFailure.status !== null && (
                <Text style={styles.errorCardMeta}>
                  Status {orderFailure.status} · {orderFailure.kind}
                </Text>
              )}
              <View style={styles.errorCardActions}>
                <TouchableOpacity
                  style={styles.errorRetryBtn}
                  activeOpacity={0.85}
                  onPress={handleCreateOrder}
                >
                  <MaterialIcons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.errorRetryText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.errorCopyBtn}
                  activeOpacity={0.85}
                  onPress={handleCopyErrorDetails}
                >
                  <MaterialIcons name="content-copy" size={16} color="#5B47A3" />
                  <Text style={styles.errorCopyText}>Copy Error Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={loading}
            onPress={handleCreateOrder}
            style={[styles.buttonShadowWrap, { backgroundColor: bbpsTheme.colors.primaryDark, shadowColor: bbpsTheme.colors.shadow }]}
          >
            <LinearGradient
              colors={bbpsTheme.gradients.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.button, loading && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Proceed to recharge</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7FF' },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  container: { flex: 1, padding: 16 },
  planDetailsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  detailsOperatorLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  planGroupTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  planSummaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  planPriceRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { fontSize: 14, fontWeight: '600' },
  summaryPrice: { fontSize: 24, fontWeight: '700' },
  summaryDivider: { height: 1 },
  summaryFactsRow: { flexDirection: 'row', padding: 16, gap: 16 },
  summaryFact: { flex: 1, gap: 8 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  detailsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  detailsText: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  operatorLogo: { width: '100%', height: '100%', borderRadius: 24, backgroundColor: '#FFFFFF' },
  headerTextWrap: { flex: 1 },
  operatorName: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  mobileText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8, fontWeight: '500' },
  cardBody: { padding: 16 },
  divider: { height: 1, backgroundColor: '#F0EDFB', marginVertical: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  value: { fontSize: 14, color: '#1F2937', fontWeight: '700' },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },
  amountLabel: { fontSize: 14, color: '#374151', fontWeight: '700' },
  amountPill: {
    backgroundColor: '#F3EFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E4DBFF',
  },
  amount: { fontSize: 18, color: '#5B47A3', fontWeight: '800' },
  buttonShadowWrap: {
    // Android's `elevation` needs an opaque background on this same view to
    // compute the shadow shape — without one it renders a visible light
    // rounded-rect halo on top of the gradient button underneath it.
    backgroundColor: BRAND_END,
    borderRadius: 16,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
    marginTop: 'auto',
  },
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.65 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  buttonIcon: { marginLeft: 8 },
  planBenefitsCard: {
    marginTop: 16,
    backgroundColor: '#FAFAFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEE8FF',
  },

  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  errorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorCardMessage: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 8,
    lineHeight: 18,
  },
  errorCardMeta: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 8,
    fontWeight: '600',
  },
  errorCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  errorRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorRetryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  errorCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DBFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorCopyText: { color: '#5B47A3', fontSize: 13, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },

  benefitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },

  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5DFFF',
  },

  benefitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B47A3',
    marginLeft: 8,
  },

  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  descriptionText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#6B7280',
  },

});

const RechargeConfirmationScreen = React.memo(RechargeConfirmationScreenComponent);
export default RechargeConfirmationScreen;
