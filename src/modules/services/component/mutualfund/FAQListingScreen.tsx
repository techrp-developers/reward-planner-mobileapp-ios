import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Image,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/type';
import SkeletonBox from '../constant/SkeletonBox';
import { getSectionContent, type MFArticleDetails } from '../../api/MutualFundAPI';
import { useServicesTheme } from '../../utils/useServicesTheme';

// ─── Types ────────────────────────────────────────────────────────

interface Props {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'FAQListing'>;
  route: RouteProp<HomeStackParamList, 'FAQListing'>;
}

// ─── Skeleton ─────────────────────────────────────────────────────

function SkeletonArticleCard({ pulse }: { pulse: Animated.Value }) {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonBox pulse={pulse} width={88} height={100} borderRadius={14} />
      <View style={styles.skeletonContent}>
        <SkeletonBox pulse={pulse} width="90%" height={14} />
        <SkeletonBox pulse={pulse} width="75%" height={14} style={{ marginTop: 8 }} />
        <SkeletonBox pulse={pulse} width="95%" height={11} style={{ marginTop: 12 }} />
        <SkeletonBox pulse={pulse} width="80%" height={11} style={{ marginTop: 6 }} />
        <View style={styles.skeletonFooter}>
          <SkeletonBox pulse={pulse} width={60} height={24} borderRadius={12} />
          <SkeletonBox pulse={pulse} width={100} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

// ─── Article Card ─────────────────────────────────────────────────

const GRADIENTS: [string, string][] = [
  ['#3545A3', '#202B72'],
  ['#2D3B91', '#171F59'],
  ['#3545A3', '#202B72'],
  ['#171F59', '#080B26'],
];

const ArticleCard: React.FC<{
  item: MFArticleDetails;
  index: number;
  onPress: () => void;
}> = ({ item, index, onPress }) => {
  const servicesTheme = useServicesTheme();
  const grad = GRADIENTS[index % GRADIENTS.length];

  return (
    <TouchableOpacity style={[styles.articleCard, { backgroundColor: servicesTheme.colors.surface, shadowColor: servicesTheme.colors.shadow }]} activeOpacity={0.82} onPress={onPress}>
      {/* Thumbnail */}
      <View style={styles.thumbContainer}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.thumbGradient}
        />
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumbImage}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.articleContent}>
        <Text style={[styles.articleTitle, { color: servicesTheme.colors.primary }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.articleSnippet, { color: servicesTheme.colors.muted }]} numberOfLines={2}>
          {item.short_description}
        </Text>

        <View style={styles.articleFooter}>
          <TouchableOpacity activeOpacity={0.75} style={styles.readBtn} onPress={onPress}>
            <Text style={styles.readBtnText}>Read Article </Text>
            <Text style={styles.readBtnArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────

const FAQListingScreen: React.FC<Props> = ({ navigation, route }) => {
  const servicesTheme = useServicesTheme();
  const { categoryId, categoryTitle } = route.params;
  const sectionId = parseInt(categoryId, 10);

  const [articles, setArticles] = useState<MFArticleDetails[]>([]);
  const [sectionTitle, setSectionTitle] = useState(categoryTitle);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const startPulse = useCallback(() => {
    pulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const fetchArticles = useCallback(async () => {
    try {
      __DEV__ && console.log('[FAQListingScreen] fetching sectionId:', sectionId, '| categoryId param:', categoryId);
      const content = await getSectionContent(sectionId);
      __DEV__ && console.log('[FAQListingScreen] section title:', content.section.title);
      __DEV__ && console.log('[FAQListingScreen] articles count:', content.articles.length);
      setSectionTitle(content.section.title ?? categoryTitle);
      setArticles(content.articles);
    } catch (err) {
      console.error('[FAQListingScreen] fetch error:', err);
      setArticles([]);
    }
  }, [sectionId, categoryTitle, categoryId]);

  useEffect(() => {
    startPulse();
    fetchArticles().finally(() => {
      setLoading(false);
      pulse.stopAnimation();
    });
  }, [fetchArticles, pulse, startPulse]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchArticles();
    setRefreshing(false);
  }, [fetchArticles]);

  const renderSkeleton = () => (
    <View style={styles.pad}>
      {[0, 1, 2, 3].map(i => (
        <SkeletonArticleCard key={i} pulse={pulse} />
      ))}
    </View>
  );

  const renderItem: ListRenderItem<MFArticleDetails> = ({ item, index }) => (
    <ArticleCard
      item={item}
      index={index}
      onPress={() =>
        navigation.navigate('ArticleDetails', {
          articleId: item.id,
          sectionId,
        })
      }
    />
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#080B26" />

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.headerShadow}>
      <LinearGradient
        colors={['#3545A3', '#080B26']}
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

        <View style={styles.headerTextBlock}>
          <Text style={styles.headerCategory}>Commonly Asked Questions</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{categoryTitle}</Text>
        </View>

        {articles.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeNum}>{articles.length}</Text>
            <Text style={styles.headerBadgeLabel}>articles</Text>
          </View>
        )}
      </LinearGradient>
      </View>

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={articles}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[servicesTheme.colors.primary]}
              tintColor={servicesTheme.colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderTitle, { color: servicesTheme.colors.textStrong }]}>{sectionTitle}</Text>
              <Text style={[styles.listHeaderSub, { color: servicesTheme.colors.muted }]}>
                {articles.length > 0
                  ? `${articles.length} articles · Tap any to read`
                  : 'No articles available'}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        />
      )}
    </SafeAreaView>
  );
};

export default FAQListingScreen;

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },

  headerShadow: {
      shadowColor: '#080B26',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 8,
    },

  header: {
    flexDirection: 'row',
    alignItems: 'center',

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 12,
    ...Platform.select({
      ios: {
      },
      android: {},
    }),
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center', marginLeft: 20

  },
  backIcon: { fontSize: 26, color: '#fff', lineHeight: 30, marginTop: -2 },
  headerTextBlock: {
    flex: 1, paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
  },
  headerCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 50,
  },
  headerBadgeNum: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 22 },
  headerBadgeLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  listHeader: { paddingTop: 20, paddingBottom: 16 },
  listHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.4,
  },
  listHeaderSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#080B26',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  thumbContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#F1EEFF',
    padding: 6,
  },
  thumbGradient: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  articleContent: { padding: 14 },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3545A3',
    lineHeight: 20,
  },
  articleSnippet: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 6,
    flexShrink: 1,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  readBtn: { flexDirection: 'row', alignItems: 'center' },
  readBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171F59',
    textDecorationLine: 'underline',
  },
  readBtnArrow: { fontSize: 15, color: '#171F59', fontWeight: '700', marginTop: -1 },

  pad: { padding: 16, paddingTop: 20 },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    padding: 14,
    marginBottom: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  skeletonContent: { flex: 1, justifyContent: 'center' },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
