import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ListRenderItem,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import CalculatorCard from './CalculatorCard';
import type { CalculatorItem } from './CalculatorCard';
import type { HomeStackParamList } from '../../navigation/type';
import FAQSection from './FAQSection';
import MFBeginners from './MFBeginners';
import MFInformedInvestors from './MFInformedInvestors';
import { useServicesTheme } from '../../utils/useServicesTheme';

import SIP_Calculator from '../../assete/mutualfund/SIPCalculator.png';
import Goal_SIP_Calculator from '../../assete/mutualfund/Goal_SIP_Calculator.png';
import Smart_Goal_Calculator from '../../assete/mutualfund/Smart_Goal_Calculator.png';
import Inflation_Calculator from '../../assete/mutualfund/Inflation_Calculator.png';
import Cost_Delay_Calculator from '../../assete/mutualfund/Cost_Delay_Calculator.png';
import Lumpsum_Calculator from '../../assete/mutualfund/Lumpsum_Calculator.png';
import Retirement_Calculator from '../../assete/mutualfund/Retirement_Calculator.png';
import Up_Calculator from '../../assete/mutualfund/Step-Up_Calculator.png';
import SWP_Calculator from '../../assete/mutualfund/(SWP)_Calculator.png';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const SCREEN_PADDING = 16;
const CARD_WIDTH = (width - SCREEN_PADDING * 2 - COLUMN_GAP) / 2;
const INITIAL_VISIBLE = 4;

export const CALCULATORS: CalculatorItem[] = [
  {
    id: 'sip',
    title: 'SIP Calculator',
    subtitle: 'Estimate the future value of your monthly SIP investment.',
    image: SIP_Calculator,
    screen: 'SIPCalculator',
  },
  {
    id: 'goal_sip',
    title: 'Goal SIP Calculator',
    subtitle: 'Find out the monthly SIP needed to reach your goal.',
    image: Goal_SIP_Calculator,
    screen: 'GoalSIPCalculator',
  },
  {
    id: 'smart_goal',
    title: 'Smart Goal Calculator',
    subtitle: 'Plan goals by calculating SIP or lumpsum needed with existing investments.',
    image: Smart_Goal_Calculator,
    screen: 'SmartGoalCalculator',
  },
  {
    id: 'inflation',
    title: 'Inflation Calculator',
    subtitle: 'Calculate the impact of inflation on your expenses and goals.',
    image: Inflation_Calculator,
    screen: 'InflationCalculator',
  },
  {
    id: 'cost_delay',
    title: 'Cost of Delay Calculator',
    subtitle: 'Check the real cost of delaying your investment start date.',
    image: Cost_Delay_Calculator,
    screen: 'CostOfDelayCalculator',
  },
  {
    id: 'lumpsum',
    title: 'Lumpsum Calculator',
    subtitle: 'Calculate your potential returns on a one-time investment.',
    image: Lumpsum_Calculator,
    screen: 'LumpsumCalculator',
  },
  {
    id: 'retirement',
    title: 'Retirement Calculator',
    subtitle: 'Estimate your corpus and the monthly SIP needed to retire comfortably.',
    image: Retirement_Calculator,
    screen: 'RetirementCalculator',
  },
  {
    id: 'stepup_sip',
    title: 'Step-Up SIP Calculator',
    subtitle: 'Calculate returns when you increase your SIP periodically.',
    image: Up_Calculator,
    screen: 'StepUpSIPCalculator',
  },
  {
    id: 'swp',
    title: 'SWP Calculator',
    subtitle: 'Calculate remaining value after regular withdrawals with interest.',
    image: SWP_Calculator,
    screen: 'SWPCalculator',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'MutualFundCalculators'>;
}

interface FooterProps extends Props {
  expanded: boolean;
  hiddenCount: number;
  chevronRotate: Animated.AnimatedInterpolation<string>;
  onToggle: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST HEADER
// ─────────────────────────────────────────────────────────────────────────────

const ListHeader = memo<Props>(({ navigation }) => {
  const servicesTheme = useServicesTheme();

  return (
    <>
      <LinearGradient
        colors={['#080B26', '#171F59', '#3545A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={14} color="#FFFFFF" />
          <Text style={styles.heroBadgeText}>SMART WEALTH TOOLS</Text>
        </View>
        <Text style={styles.heroTitle}>Smart Investment{'\n'}Planner</Text>
        <Text style={styles.heroSubtitle}>
          Calculate returns, learn the basics, and track your financial future.
        </Text>
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{CALCULATORS.length}</Text>
            <Text style={styles.heroStatLabel}>Calculators</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>FAQ</Text>
            <Text style={styles.heroStatLabel}>Guides</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>MF</Text>
            <Text style={styles.heroStatLabel}>Learning</Text>
          </View>
        </View>
      </LinearGradient>

      <FAQSection navigation={navigation} />

      <View style={styles.sectionHeadingRow}>
        <View style={styles.sectionHeadingLeft}>
          <MaterialCommunityIcons name="calculator-variant-outline" size={18} color="#3545A3" />
          <Text style={[styles.sectionHeading, { color: servicesTheme.colors.textStrong }]}>MF Calculators</Text>
        </View>
        <View style={[styles.sectionBadge, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
          <Text style={[styles.sectionBadgeText, { color: servicesTheme.colors.primary }]}>{CALCULATORS.length} tools</Text>
        </View>
      </View>
    </>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// LIST FOOTER
// ─────────────────────────────────────────────────────────────────────────────

const ListFooter = memo<FooterProps>(
  ({ navigation, expanded, hiddenCount, chevronRotate, onToggle }) => (
    <View>
      {/* View More / Less button */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.88}
        style={styles.viewMoreOuter}
      >
        <LinearGradient
          colors={['#3545A3', '#080B26']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewMoreGradient}
        >
          <View style={styles.viewMoreIconCircle}>
            <MaterialCommunityIcons
              name={expanded ? 'minus' : 'plus'}
              size={16}
              color="#fff"
            />
          </View>
          <View style={styles.viewMoreTextBlock}>
            <Text style={styles.viewMoreTitle}>
              {expanded ? 'Show less' : `View all ${CALCULATORS.length} calculators`}
            </Text>
            {!expanded && (
              <Text style={styles.viewMoreSub}>{hiddenCount} more tools available</Text>
            )}
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }], marginRight: 16 }}>
            <MaterialCommunityIcons name="chevron-down" size={18} color="rgba(255,255,255,0.85)" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Learn Section Divider */}
      <View style={styles.learnSection}>
        <MFBeginners navigation={navigation} />
        <MFInformedInvestors navigation={navigation} />
      </View>
      <View style={styles.bottomPad} />
    </View>
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const MFScreen: React.FC<Props> = ({ navigation }) => {
  const servicesTheme = useServicesTheme();
  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const hiddenCount = CALCULATORS.length - INITIAL_VISIBLE;

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [expanded, chevronAnim]);

  const chevronRotate = useMemo(
    () =>
      chevronAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    [chevronAnim],
  );

  const visibleCalculators = useMemo(
    () => (expanded ? CALCULATORS : CALCULATORS.slice(0, INITIAL_VISIBLE)),
    [expanded],
  );

  const handleToggle = useCallback(() => setExpanded(prev => !prev), []);

  const renderItem: ListRenderItem<CalculatorItem> = useCallback(
    ({ item }) => (
      <View style={styles.cardWrapper}>
        <CalculatorCard
          item={item}
          onPress={() => navigation.navigate(item.screen as any)}
        />
      </View>
    ),
    [navigation],
  );

  const listHeader = useMemo(
    () => <ListHeader navigation={navigation} />,
    [navigation],
  );

  const listFooter = useMemo(
    () => (
      <ListFooter
        navigation={navigation}
        expanded={expanded}
        hiddenCount={hiddenCount}
        chevronRotate={chevronRotate}
        onToggle={handleToggle}
      />
    ),
    [navigation, expanded, hiddenCount, chevronRotate, handleToggle],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]} edges={['top']}>
      <StatusBar barStyle={servicesTheme.isDark ? 'light-content' : 'dark-content'} backgroundColor={servicesTheme.colors.background} />

      {/* ── Top Header ──────────────────────────────────────── */}
      <LinearGradient
        colors={servicesTheme.isDark ? ['#111113', '#18181B'] : ['#FFFFFF', '#F7F4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { borderBottomColor: servicesTheme.colors.divider }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border }]}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={servicesTheme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerTitle, { color: servicesTheme.colors.textStrong }]}>Mutual Funds</Text>
          <Text style={[styles.headerSubtitle, { color: servicesTheme.colors.muted }]}>Calculators · Learn · Grow</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border }]}>
          <Text style={styles.badgeCount}>{CALCULATORS.length}</Text>
          <Text style={[styles.badgeLabel, { color: servicesTheme.colors.primaryDark }]}>Tools</Text>
        </View>
      </LinearGradient>

      {/* ── Content ─────────────────────────────────────────── */}
      <FlatList
        data={visibleCalculators}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
      />
    </SafeAreaView>
  );
};

export default MFScreen;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F4FF',
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',

    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#5B47A3',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.08)',
  },
  headerTextBlock: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#241C3B',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#7A718A',
    marginTop: 1,
    fontWeight: '500',
  },

  // ── Badge ────────────────────────────────────────────────────
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 48,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.12)',
  },
  badgeCount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#3545A3',
    lineHeight: 21,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#171F59',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Hero ─────────────────────────────────────────────────────
  heroSection: {
    borderRadius: 28,
    // paddingHorizontal: 22,
    // paddingTop: 20,
    // paddingBottom: 22,
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#5B47A3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  heroGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.14)',
    right: -40,
    top: -48,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    left: -42,
    bottom: -46,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginTop: 12,
    marginLeft: 12,

  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,

  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 35,
    marginBottom: 10,
    marginLeft: 12,

  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '400',
    paddingLeft: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    marginTop: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginLeft: 12,
    marginRight: 12,

  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',

  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ── Section Headings ─────────────────────────────────────────
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 12,
  },
  sectionHeadingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#241C3B',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(134,101,255,0.16)',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3545A3',
  },

  // ── List ─────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 24,
  },
  columnWrapper: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
    alignItems: 'stretch',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },

  // ── View More ─────────────────────────────────────────────────
  viewMoreOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#5B47A3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
    }),
  },
  viewMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewMoreIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,

  },
  viewMoreTextBlock: { flex: 1 },
  viewMoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    marginTop: 10,
  },
  viewMoreSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: 10,
  },

  // ── Learn Section ─────────────────────────────────────────────
  learnSection: {
    paddingTop: 28,
    paddingBottom: 16,
  },
  learnSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    marginLeft: 26,
  },
  bottomPad: { height: 40 },
});
