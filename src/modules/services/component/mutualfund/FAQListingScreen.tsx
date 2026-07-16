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
    <TouchableOpacity
      style={[styles.articleCard, {
        backgroundColor: servicesTheme.colors.surface,
        shadowColor: servicesTheme.colors.shadow,
      }]}
      activeOpacity={0.82}
      onPress={onPress}
    >
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
        <Text
          style={[styles.articleTitle, { color: servicesTheme.colors.primary }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.articleSnippet, { color: servicesTheme.colors.muted }]}
          numberOfLines={2}
        >
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
    <SafeAreaView
      style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#080B26" />

      {/* ── Header ─────────────────────────────────────────── */}
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
              <Text style={[styles.listHeaderTitle, { color: servicesTheme.colors.textStrong }]}>
                {sectionTitle}
              </Text>
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
  safe: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  headerTextBlock: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 10,

    alignItems: 'center',
    minWidth: 48,
    flexShrink: 0,
  },
  headerBadgeNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  headerBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // ── List ────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listHeader: {
    paddingTop: 16,
    paddingBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  listHeaderSub: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Skeleton ────────────────────────────────────────────────────
  pad: {
    padding: 16,
    gap: 14,
  },
  skeletonCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    gap: 12,
  },
  skeletonContent: {
    flex: 1,
    paddingVertical: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  // ── Article Card ────────────────────────────────────────────────
  articleCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  thumbContainer: {
    width: 96,
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  thumbImage: {
    width: 72,
    height: 72,
    margin: 12,
  },
  articleContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 14,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  articleSnippet: {
    fontSize: 12,
    lineHeight: 17,
  },
  articleFooter: {
    marginTop: 10,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3545A3',
  },
  readBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3545A3',
    lineHeight: 18,
  },
});
