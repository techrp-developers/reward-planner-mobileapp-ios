import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { FitnessStackParamList } from '../../navigation/RewardHomeStack';
import {
  fetchStepHistory,
  fetchStepSummary,
  type StepHistoryItem,
  type StepSummary,
} from '../../api/DashboardAPI';
import {
  BORDER_RADIUS,
  RESPONSIVE,
  SPACING,
  TYPOGRAPHY,
} from '../../utils/theme';

import Coin from '../../../../assets/product/rewards.svg';

type PointsNavProp = NativeStackNavigationProp<FitnessStackParamList, 'CoinHistory'>;

// Violet Dusk palette — all on-dark, matching Dashboard/CoinHistoryAndPlan
const VD = {
  bg: ['#070A16', '#111735', '#201A3F'],
  accent: '#8EA2FF',
  accentDark: '#B9C4FF',
  accentDim: 'rgba(142,162,255,0.26)',
  accentFaint: 'rgba(142,162,255,0.12)',
  white: '#FFFFFF',
  whiteMid: '#CDD2EA',
  whiteLow: '#979EBC',
  whiteGhost: 'rgba(255,255,255,0.10)',
  cardBg: 'rgba(255,255,255,0.075)',
  cardBorder: 'rgba(174,188,255,0.16)',
  success: '#9AAEFF',
  successBg: 'rgba(142,162,255,0.14)',
  successBorder: 'rgba(142,162,255,0.26)',
  warning: '#F8B84E',
  warningBg: 'rgba(248,184,78,0.12)',
  warningBorder: 'rgba(248,184,78,0.25)',
};

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString('en-IN') : '0';

const formatDateParts = (value: string | null) => {
  if (!value) return { date: '--', year: '' };

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { date: value, year: '' };

  return {
    date: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
    }).format(date),
    year: String(date.getFullYear()),
  };
};

const formatFullDate = (value: string | null) => {
  if (!value) return 'No expiry';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const PointsStatementScreen: React.FC = () => {
  const navigation = useNavigation<PointsNavProp>();
  const { width } = useWindowDimensions();
  const contentMaxWidth = Math.min(width - RESPONSIVE.horizontalPadding * 2, 560);
  const [history, setHistory] = useState<StepHistoryItem[]>([]);
  const [summary, setSummary] = useState<StepSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const [historyRes, summaryRes] = await Promise.all([
      fetchStepHistory(),
      fetchStepSummary(),
    ]);

    if (historyRes.success && historyRes.data) {
      setHistory(historyRes.data);
    } else {
      setHistory([]);
    }

    if (summaryRes.success && summaryRes.data) {
      setSummary(summaryRes.data);
    } else {
      setSummary(null);
    }

    if (!historyRes.success || !summaryRes.success) {
      setErrorMessage(
        historyRes.message || summaryRes.message || 'Failed to fetch coin history'
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const totals = useMemo(() => {
    return history.reduce(
      (result, item) => {
        if (item.type === 'credit') {
          result.credited += item.coins;
        } else {
          result.debited += item.coins;
        }

        return result;
      },
      { credited: 0, debited: 0 }
    );
  }, [history]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={VD.bg} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: RESPONSIVE.horizontalPadding },
          ]}
        >
          <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="chevron-left" size={24} color={VD.accentDark} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Points Statement</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            <LinearGradient
              colors={['#27305F', '#1B2148', '#2A1E50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradient}
            >
              <View style={styles.balanceContent}>
                <View style={styles.balanceIconWrap}>
                  <Coin width={40} height={40} />
                </View>
                <View style={styles.balanceTextContainer}>
                  <Text style={styles.balanceTitle}>My Balance</Text>
                  <Text style={styles.balanceValue}>
                    {formatNumber(summary?.balance || 0)} Coins
                  </Text>
                </View>
              </View>

              <View style={styles.balanceMetaRow}>
                <View style={styles.balanceMiniCard}>
                  <Text style={styles.balanceMiniLabel}>Credited</Text>
                  <Text style={styles.balanceMiniValue}>+{formatNumber(totals.credited)}</Text>
                </View>
                <View style={styles.balanceMiniCard}>
                  <Text style={styles.balanceMiniLabel}>Used</Text>
                  <Text style={styles.balanceMiniValue}>-{formatNumber(totals.debited)}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.expiryCard}>
              <View style={styles.expiryLeft}>
                <View style={styles.expiryIcon}>
                  <Icon name="clock-alert-outline" size={20} color={VD.warning} />
                </View>
                <View style={styles.expiryCopy}>
                  <Text style={styles.expiryText}>
                    {formatNumber(summary?.expiring_coins || 0)} RP Coins Expiring
                  </Text>
                  <Text style={styles.expiryDate}>
                    Expiry: {formatFullDate(summary?.expiry_date || null)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
              <Text style={[styles.tableHeaderText, styles.activityColumn]}>Activity</Text>
              <Text style={[styles.tableHeaderText, styles.amountColumn]}>Amount</Text>
            </View>

            {loading ? (
              <StateBox loading message="Loading your coin history..." />
            ) : errorMessage ? (
              <StateBox message={errorMessage} onRetry={loadWallet} />
            ) : history.length === 0 ? (
              <StateBox message="No coin activity yet." />
            ) : (
              <View style={styles.transactionsContainer}>
                {history.map((item) => (
                  <TransactionRow key={item.id} item={item} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const TransactionRow = React.memo(({ item }: { item: StepHistoryItem }) => {
  const isDebit = item.type === 'debit';
  const dateParts = formatDateParts(item.date);

  return (
    <View style={styles.transactionCard}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateMain}>{dateParts.date}</Text>
        <Text style={styles.dateYear}>{dateParts.year}</Text>
      </View>

      <View style={styles.activityContainer}>
        <Text numberOfLines={1} style={styles.activityTitle}>
          {item.title || (isDebit ? 'Coins Used' : 'Coins Credited')}
        </Text>
        <Text numberOfLines={2} style={styles.activityDesc}>
          {item.description || item.category || 'Step wallet activity'}
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <View style={[styles.coinContainer, isDebit && styles.debitContainer]}>
          <Coin width={14} height={14} />
          <Text style={[styles.coinText, isDebit && styles.debitText]}>
            {isDebit ? '-' : '+'}{formatNumber(Math.abs(item.coins))}
          </Text>
        </View>
      </View>
    </View>
  );
});

const StateBox = React.memo(({
  loading,
  message,
  onRetry,
}: {
  loading?: boolean;
  message: string;
  onRetry?: () => void;
}) => (
  <View style={styles.stateBox}>
    {loading ? (
      <ActivityIndicator color={VD.accent} />
    ) : (
      <Icon name={onRetry ? 'refresh' : 'wallet-outline'} size={26} color={VD.accent} />
    )}
    <Text style={styles.stateText}>{message}</Text>
    {onRetry ? (
      <TouchableOpacity activeOpacity={0.86} style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    ) : null}
  </View>
));

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: VD.bg[0],
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  content: {
    width: '100%',
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VD.whiteGhost,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.white,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 42,
    height: 42,
  },
  balanceGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(174,188,255,0.28)',
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.large,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginRight: SPACING.md,
  },
  balanceTextContainer: {
    flex: 1,
  },
  balanceTitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.76)',
  },
  balanceValue: {
    ...TYPOGRAPHY.h2,
    color: VD.white,
    marginTop: 2,
  },
  balanceMetaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  balanceMiniCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  balanceMiniLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  balanceMiniValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.white,
    marginTop: 2,
  },
  expiryCard: {
    backgroundColor: VD.warningBg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: VD.warningBorder,
  },
  expiryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.16)',
    marginRight: SPACING.sm,
  },
  expiryCopy: {
    flex: 1,
  },
  expiryText: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.warning,
  },
  expiryDate: {
    ...TYPOGRAPHY.caption,
    color: VD.whiteLow,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  tableHeaderText: {
    ...TYPOGRAPHY.caption,
    color: VD.whiteLow,
    textTransform: 'uppercase',
  },
  dateColumn: {
    width: 74,
  },
  activityColumn: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  amountColumn: {
    width: 86,
    textAlign: 'right',
  },
  transactionsContainer: {
    paddingBottom: SPACING.sm,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VD.cardBg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  dateContainer: {
    width: 74,
  },
  dateMain: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.white,
  },
  dateYear: {
    ...TYPOGRAPHY.caption,
    color: VD.whiteLow,
    marginTop: 1,
  },
  activityContainer: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  activityTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.white,
  },
  activityDesc: {
    ...TYPOGRAPHY.caption,
    color: VD.whiteLow,
    marginTop: 2,
  },
  amountContainer: {
    width: 86,
    alignItems: 'flex-end',
  },
  coinContainer: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: VD.successBg,
    borderWidth: 1,
    borderColor: VD.successBorder,
  },
  debitContainer: {
    backgroundColor: VD.warningBg,
    borderColor: VD.warningBorder,
  },
  coinText: {
    ...TYPOGRAPHY.caption,
    color: VD.success,
    marginLeft: 4,
    fontWeight: '700',
  },
  debitText: {
    color: VD.warning,
  },
  stateBox: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VD.cardBg,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    padding: SPACING.xl,
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: VD.whiteLow,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.md,
    minHeight: 40,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VD.accentFaint,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  retryText: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.accent,
  },
});

export default React.memo(PointsStatementScreen);
