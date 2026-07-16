import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { FitnessStackParamList } from '../../navigation/RewardHomeStack';
import type { StepStats } from '../../navigation/type';

import LocationIcon from '../../assets/StepCount/location.svg';
import ClockIcon from '../../assets/StepCount/clock_icon.svg';
import LightningIcon from '../../assets/StepCount/lightning.svg';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';

type DailyStatsNavProp = NativeStackNavigationProp<FitnessStackParamList>;

interface DailyStatsProps {
  stats: StepStats;
  onViewMore?: () => void;
}

const formatNumber = (value: number) => (
  Number.isFinite(value) ? value.toLocaleString('en-IN') : '0'
);

const safeNumber = (value: number | string) => {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
};

const DailyStats: React.FC<DailyStatsProps> = ({ stats, onViewMore }) => {
  const navigation = useNavigation<DailyStatsNavProp>();

  const progress = useMemo(() => {
    if (!stats.goalSteps || stats.goalSteps <= 0) return 0;
    return Math.min(Math.max(stats.currentSteps / stats.goalSteps, 0), 1);
  }, [stats.currentSteps, stats.goalSteps]);

  const handleViewMore = useCallback(() => {
    onViewMore?.();
    navigation.navigate('PlanProcess');
  }, [navigation, onViewMore]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.stepsLabel}>
          <Text style={styles.currentSteps}>{formatNumber(stats.currentSteps)}</Text>
          <Text style={styles.totalSteps}> / {formatNumber(stats.goalSteps)} Steps</Text>
        </Text>

        <TouchableOpacity
          style={styles.viewMoreRow}
          onPress={handleViewMore}
          activeOpacity={0.82}
        >
          <Text style={styles.viewMore}>View More</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={COLORS.primaryIndigo}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressTrack}>
        <LinearGradient
          colors={['#F779B3', '#9B5CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statBox} onPress={handleViewMore} activeOpacity={0.75}>
          <LocationIcon width={26} height={26} />
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {safeNumber(stats.distance_km).toFixed(1)} Km
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statBox} onPress={handleViewMore} activeOpacity={0.75}>
          <ClockIcon width={26} height={26} />
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatNumber(safeNumber(stats.active_minutes))} Min
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statBox} onPress={handleViewMore} activeOpacity={0.75}>
          <LightningIcon width={26} height={26} />
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatNumber(safeNumber(stats.calories))} Kcal
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default React.memo(DailyStats);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepsLabel: {
    color: '#444',
    flexShrink: 1,
  },
  currentSteps: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  totalSteps: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewMoreRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: '#F4F0FF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewMoreText: {
    color: '#3B6BFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    columnGap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  statValue: {
    width: '100%',
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
  },
  viewMore: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryIndigo,
    marginRight: 4,
  },
});
