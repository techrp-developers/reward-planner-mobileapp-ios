import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import BBPSHead from '../constatnt/BBPSHead';
import { pollTransactionStatus, TERMINAL_TRANSACTION_STATUSES, TransactionStatus } from '../api/BillsAPI';
import { useBbpsTheme } from '../utils/useBbpsTheme';

const BRAND_SECONDARY = '#5B47A3';

const STATUS_PRESENTATION: Record<
  TransactionStatus,
  { icon: string; color: string; bg: string; title: string }
> = {
  PENDING: { icon: 'hourglass-empty', color: '#8665FF', bg: '#F3EFFF', title: 'Processing Payment' },
  SUCCESS: { icon: 'check-circle', color: '#22C55E', bg: '#F0FDF4', title: 'Payment Successful' },
  FAILED: { icon: 'cancel', color: '#EF4444', bg: '#FEF2F2', title: 'Payment Failed' },
  REFUNDED: { icon: 'replay', color: '#F59E0B', bg: '#FFFBEB', title: 'Payment Refunded' },
  RECONCILIATION_REQUIRED: {
    icon: 'error-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Reconciliation Required',
  },
  RETRYING: {
    icon: 'hourglass-empty',
    color: '#8665FF',
    bg: '#F3EFFF',
    title: 'Payment Captured, Retrying',
  },
  REFUND_PENDING: {
    icon: 'hourglass-empty',
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Refund In Progress',
  },
};

const TransactionStatusScreenComponent = ({ navigation, route }: any) => {
  const bbpsTheme = useBbpsTheme();
  const transactionId = route?.params?.transactionId;
  const [status, setStatus] = useState<TransactionStatus>('PENDING');
  const [message, setMessage] = useState('Checking transaction status...');

  useEffect(() => {
    if (!transactionId) {
      setStatus('FAILED');
      setMessage('Transaction id is missing.');
      return;
    }

    const cancel = pollTransactionStatus(transactionId, (result) => {
      setStatus(result.status);
      setMessage(result.message);
    });

    return cancel;
  }, [transactionId]);

  const isTerminal = useMemo(
    () => TERMINAL_TRANSACTION_STATUSES.includes(status as any),
    [status]
  );

  const presentation = STATUS_PRESENTATION[status] ?? STATUS_PRESENTATION.PENDING;

  const handleGoHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bbpsTheme.colors.background }]}>
      <BBPSHead title="Payment Status" onBackPress={handleGoBack} />

      <View style={styles.container}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: bbpsTheme.colors.surface,
              shadowColor: bbpsTheme.colors.shadow,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: presentation.bg }]}>
            {!isTerminal ? (
              <ActivityIndicator color={presentation.color} size="large" />
            ) : (
              <MaterialIcons name={presentation.icon} size={48} color={presentation.color} />
            )}
          </View>

          <Text style={[styles.title, { color: bbpsTheme.colors.textStrong }]}>{presentation.title}</Text>
          <Text style={[styles.message, { color: bbpsTheme.colors.muted }]}>{message}</Text>

          {transactionId ? (
            <View style={[styles.transactionPill, { backgroundColor: bbpsTheme.colors.iconBg }]}>
              <Text style={[styles.transactionPillText, { color: bbpsTheme.colors.primary }]}>Txn ID: {String(transactionId)}</Text>
            </View>
          ) : null}
        </View>

        {isTerminal && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoHome}
            style={[
              styles.ctaShadowWrap,
              { backgroundColor: bbpsTheme.colors.primaryDark, shadowColor: bbpsTheme.colors.shadow },
            ]}
          >
            <LinearGradient
              colors={bbpsTheme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Go to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F7FF' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  transactionPill: {
    marginTop: 16,
    backgroundColor: '#F3EFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  transactionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B47A3',
  },
  ctaShadowWrap: {
    width: '100%',
    marginTop: 24,
    // Android's `elevation` needs an opaque background on this same view to
    // compute the shadow shape — without one it renders a visible light
    // rounded-rect halo on top of the gradient button underneath it.
    backgroundColor: BRAND_SECONDARY,
    borderRadius: 16,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  cta: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

const TransactionStatusScreen = React.memo(TransactionStatusScreenComponent);
export default TransactionStatusScreen;
