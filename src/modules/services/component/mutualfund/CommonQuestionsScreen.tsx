import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/type';
import SkeletonBox from '../constant/SkeletonBox';
import { getMutualFundCategories, type MFCategory } from '../../api/MutualFundAPI';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const H_PAD = 16;
const CARD_WIDTH = (width - H_PAD * 2 - CARD_GAP) / 2;

// Cycling emoji + gradient pairs
const CARD_THEMES = [
  { icon: '📚', gradientColors: ['#8665FF', '#7253EE'] as [string, string] },
  { icon: '💡', gradientColors: ['#9B7BFF', '#5B47A3'] as [string, string] },
  { icon: '🎯', gradientColors: ['#7C5FEE', '#6B4FDD'] as [string, string] },
  { icon: '📈', gradientColors: ['#6B4FDD', '#5B47A3'] as [string, string] },
  { icon: '🌱', gradientColors: ['#1DB890', '#0E9E7A'] as [string, string] },
  { icon: '🏦', gradientColors: ['#5B7CFF', '#3B5BDB'] as [string, string] },
  { icon: '📊', gradientColors: ['#FF6B9D', '#E84393'] as [string, string] },
  { icon: '🔒', gradientColors: ['#F59E0B', '#D97706'] as [string, string] },
  { icon: '⏳', gradientColors: ['#10B981', '#059669'] as [string, string] },
];

function totalArticleCount(cat: MFCategory): number {
  if (!cat.has_children) return 0;
  return cat.children.reduce((sum, c) => sum + (c.article_count ?? 0), 0);
}

interface Props {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'CommonQuestions'>;
}

// ─── Skeleton ─────────────────────────────────────────────────────

function SkeletonGrid({ pulse }: { pulse: Animated.Value }) {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonCard}>
          <SkeletonBox pulse={pulse} width={44} height={44} borderRadius={22} />
          <SkeletonBox pulse={pulse} width="80%" height={14} style={{ marginTop: 14 }} />
          <SkeletonBox pulse={pulse} width="55%" height={11} style={{ marginTop: 8 }} />
          <SkeletonBox pulse={pulse} width="65%" height={28} borderRadius={14} style={{ marginTop: 20 }} />
        </View>
      ))}
    </View>
  );
}

// ─── Category Card ─────────────────────────────────────────────────

const CategoryCard: React.FC<{
  item: MFCategory;
  theme: typeof CARD_THEMES[0];
  articleCount: number;
  onPress: () => void;
}> = ({ item, theme, articleCount, onPress }) => (
  <TouchableOpacity activeOpacity={0.82} style={styles.card} onPress={onPress}>
    <View style={styles.cardTop}>
      <LinearGradient
        colors={theme.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconCircle}
      >
        <Text style={styles.iconEmoji}>{theme.icon}</Text>
      </LinearGradient>

      {articleCount > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{articleCount}</Text>
          <Text style={styles.countLabel}> articles</Text>
        </View>
      )}
    </View>

    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

    <View style={styles.cardCta}>
      <Text style={[styles.ctaText, { color: theme.gradientColors[0] }]}>View All</Text>
      <Text style={[styles.ctaArrow, { color: theme.gradientColors[0] }]}>{' '}›</Text>
    </View>
  </TouchableOpacity>
);

// ─── Screen ────────────────────────────────────────────────────────

const CommonQuestionsScreen: React.FC<Props> = ({ navigation }) => {
  const [categories, setCategories] = useState<MFCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );
    anim.start();

    getMutualFundCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => {
        setLoading(false);
        anim.stop();
      });

    return () => anim.stop();
  }, [pulse]);

  const renderItem: ListRenderItem<MFCategory> = ({ item, index }) => {
    const theme = CARD_THEMES[index % CARD_THEMES.length];
    return (
      <View style={styles.cardWrapper}>
        <CategoryCard
          item={item}
          theme={theme}
          articleCount={totalArticleCount(item)}
          onPress={() =>
            navigation.navigate('FAQListing', {
              categoryId: item.id.toString(),
              categoryTitle: item.title,
            })
          }
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#8665FF" />

      <LinearGradient
        colors={['#8665FF', '#5B47A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Commonly Asked Questions</Text>
          <Text style={styles.headerSubtitle}>Your guide to investing smarter</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.scrollPad}>
          <Text style={styles.sectionLabel}>Browse by Topic</Text>
          <SkeletonGrid pulse={pulse} />
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>Browse by Topic</Text>
          }
          ListFooterComponent={<View style={styles.listFooter} />}
        />
      )}
    </SafeAreaView>
  );
};

export default CommonQuestionsScreen;

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#5B47A3',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#fff', lineHeight: 30, marginTop: -2 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  scrollPad: { padding: H_PAD },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 14,
    paddingHorizontal: H_PAD,
  },
  listContent: { paddingHorizontal: H_PAD, paddingBottom: 20 },
  columnWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP, alignItems: 'stretch' },
  cardWrapper: { width: CARD_WIDTH },

  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#5B47A3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconEmoji: { fontSize: 22 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: { fontSize: 12, fontWeight: '800', color: '#8665FF' },
  countLabel: { fontSize: 10, color: '#8665FF', fontWeight: '600' },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 18,
    flex: 1,
  },
  cardCta: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  ctaText: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  ctaArrow: { fontSize: 15, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  listFooter: { height: 32 },
  skeletonCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    minHeight: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
});
