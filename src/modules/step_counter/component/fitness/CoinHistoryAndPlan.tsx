import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FitnessStackParamList } from '../../navigation/RewardHomeStack';
import {
  fetchStepHistory,
  type StepHistoryItem,
} from '../../api/DashboardAPI';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import CoinIcon from '../../../../assets/product/rewards.svg';
import HeartPlantIcon from '../../assets/StepCount/heartPlant.svg';

const VD = {
  accent:      "#8EA2FF",
  accentDark:  "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg:      "rgba(255,255,255,0.075)",
  cardSoft:    "rgba(255,255,255,0.10)",
  cardBorder:  "rgba(174,188,255,0.16)",
  ink:         "#F6F7FF",
  muted:       "#A8AEC8",
  white:       "#FFFFFF",
  whiteMid:    "#CDD2EA",
  whiteLow:    "#979EBC",
  success:     "#9AAEFF",
  warning:     "#F8B84E",
  shadow:      "#02030A",
};

type CoinHistoryNavProp = NativeStackNavigationProp<FitnessStackParamList>;

const formatCoins = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString('en-IN') : '0';

const formatHistoryDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value || '--';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
  }).format(date);
};

const CoinHistoryAndPlan: React.FC = () => {
  const navigation = useNavigation<CoinHistoryNavProp>();
  const [history, setHistory] = useState<StepHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadHistory = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setErrorMessage('');

    const res = await fetchStepHistory();

    if (res.success && res.data) {
      const sortedHistory = [...res.data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setHistory(sortedHistory);
    } else {
      setHistory([]);
      setErrorMessage(res.message || 'Failed to fetch step history');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      loadHistory(false);
    }, [loadHistory])
  );

  const visibleHistory = useMemo(() => history.slice(0, 8), [history]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Coin History</Text>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.viewMoreButton}
            onPress={() => navigation.navigate('CoinHistory')}
          >
            <Text style={styles.viewMore}>View More</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={16}
              color={VD.accentDark}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.historyState}>
            <ActivityIndicator size="small" color={VD.accent} />
            <Text style={styles.stateText}>Loading coin activity...</Text>
          </View>
        ) : errorMessage ? (
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.historyState}
            onPress={() => loadHistory()}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={VD.accent}
            />
            <Text style={styles.stateText}>Unable to load coins. Tap to retry.</Text>
          </TouchableOpacity>
        ) : visibleHistory.length === 0 ? (
          <View style={styles.historyState}>
            <MaterialCommunityIcons
              name="wallet-giftcard"
              size={22}
              color={VD.accent}
            />
            <Text style={styles.stateText}>Your earned coins will appear here.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coinList}
          >
            {visibleHistory.map((item) => {
              const isDebit = item.type === 'debit';

              return (
                <View key={item.id} style={styles.coinItem}>
                  <Text style={styles.date}>{formatHistoryDate(item.date)}</Text>
                  <View style={styles.coinColumn}>
                    <View style={styles.coinIconWrap}>
                      <CoinIcon width={22} height={22} />
                    </View>
                    <Text style={[styles.coinValue, isDebit && styles.coinDebit]}>
                      {isDebit ? '-' : '+'}{formatCoins(Math.abs(item.coins))}
                    </Text>
                    <Text numberOfLines={1} style={styles.coinTitle}>
                      {item.title || item.category || 'Steps'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.planCard}>
        <View style={styles.planCopy}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Want a personalized step plan?</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={VD.whiteLow}
            />
          </View>

          <Text style={styles.planDescription}>
            Based on your BMI, we can recommend how much to walk daily to stay healthy or lose weight.
          </Text>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.getPlanButton}
            onPress={() => navigation.navigate('BMICart')}
          >
            <Text style={styles.getPlan}>Get My Plan</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={16}
              color={VD.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.planImage}>
          <HeartPlantIcon width={44} height={44} />
        </View>
      </View>
    </View>
  );
};

export default React.memo(CoinHistoryAndPlan);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: VD.cardBg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.ink,
  },
  viewMoreButton: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: VD.accentFaint,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  viewMore: {
    ...TYPOGRAPHY.caption,
    color: VD.accentDark,
    marginRight: 4,
  },
  coinList: {
    paddingRight: SPACING.sm,
  },
  coinItem: {
    width: 96,
    minHeight: 118,
    backgroundColor: VD.cardSoft,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.large,
    alignItems: "center",
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  date: {
    ...TYPOGRAPHY.caption,
    color: VD.whiteLow,
    marginBottom: SPACING.xs,
  },
  coinColumn: {
    alignItems: "center",
    justifyContent: "center",
  },
  coinIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.15)",
    marginBottom: 4,
  },
  coinValue: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.success,
  },
  coinDebit: {
    color: VD.warning,
  },
  coinTitle: {
    ...TYPOGRAPHY.caption,
    maxWidth: 78,
    color: VD.whiteLow,
    marginTop: 2,
    textAlign: "center",
  },
  historyState: {
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.large,
    backgroundColor: VD.accentFaint,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    paddingHorizontal: SPACING.md,
  },
  stateText: {
    ...TYPOGRAPHY.caption,
    color: VD.whiteLow,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  planCard: {
    backgroundColor: VD.cardBg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  planCopy: {
    flex: 1,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  planTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.ink,
    flex: 1,
    paddingRight: SPACING.xs,
  },
  planDescription: {
    ...TYPOGRAPHY.body,
    color: VD.whiteMid,
    marginBottom: SPACING.sm,
  },
  getPlanButton: {
    alignSelf: "flex-start",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: VD.accent,
    borderWidth: 1,
    borderColor: VD.accent,
  },
  getPlan: {
    ...TYPOGRAPHY.caption,
    color: VD.white,
    marginRight: 4,
  },
  planImage: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.large,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.accentFaint,
    marginLeft: SPACING.md,
  },
});
