import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, Animated, InteractionManager } from 'react-native';
// import Home_Chart from '../components/home/home_chart';
import CategoriesSection from '../components/home/categories_section';
import FeaturesProduct from '../components/home/featuresProduct';
import ProductCategory from './ProductCategoriesScreen';
import HomeBanner from '../components/home/HomeBanner';
import OfferHome from '../components/home/OfferHome';
import { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';
import RecentProduct from '../components/Promotion/RecentProduct';
import NewArrivals from '../components/Promotion/NewArrivals';
import BestSeller from '../components/Promotion/BestSeller';
import TopRated from '../components/Promotion/TopRated';
import RecommendedProducts from '../components/Promotion/RecommendedProducts';
import MostView from '../components/Promotion/MostView';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { prefetchBestSellerSection } from '../components/Promotion/BestSeller';
import { prefetchTopRatedSection } from '../components/Promotion/TopRated';
import { prefetchMostViewSection } from '../components/Promotion/MostView';
import { prefetchNewArrivalsSection } from '../components/Promotion/NewArrivals';
import { prefetchRecommendedSection } from '../components/Promotion/RecommendedProducts';
import { prefetchRecentProductSection } from '../components/Promotion/RecentProduct';
import { useAuth } from '../../common/auth/context/AuthContext';

type SectionKey =
  | 'banner'
  | 'homeChart'
  | 'categories'
  | 'bestSeller'
  | 'topRated'
  | 'offerHome'
  | 'newArrivals'
  | 'mostView'
  | 'recommended'
  | 'features'
  | 'recent'
  | 'productCategory';

type HomeSection = {
  key: SectionKey;
};

const INITIAL_SECTIONS = 2;
const PRELOAD_AHEAD_COUNT = 1;
const PREFETCH_DELAY_MS = 240;
const MOUNT_DELAY_MS = 120;

const HOME_SECTIONS: HomeSection[] = [
  { key: 'banner' },
  { key: 'homeChart' },
  { key: 'categories' },
  { key: 'bestSeller' },
  { key: 'topRated' },
  { key: 'offerHome' },
  { key: 'newArrivals' },
  { key: 'mostView' },
  { key: 'recommended' },
  { key: 'features' },
  { key: 'recent' },
  { key: 'productCategory' },
];

const SECTION_PLACEHOLDER_HEIGHT: Record<SectionKey, number> = {
  banner: 180,
  homeChart: 160,
  categories: 120,
  bestSeller: 120,
  topRated: 170,
  offerHome: 140,
  newArrivals: 170,
  mostView: 170,
  recommended: 170,
  features: 160,
  recent: 170,
  productCategory: 170,
};

const MemoHomeBanner = React.memo(HomeBanner);
// const MemoHomeChart = React.memo(Home_Chart);
const MemoCategoriesSection = React.memo(CategoriesSection);
const MemoBestSeller = React.memo(BestSeller);
const MemoTopRated = React.memo(TopRated);
const MemoOfferHome = React.memo(OfferHome);
const MemoNewArrivals = React.memo(NewArrivals);
const MemoMostView = React.memo(MostView);
const MemoRecommendedProducts = React.memo(RecommendedProducts);
const MemoFeaturesProduct = React.memo(FeaturesProduct);
const MemoRecentProduct = React.memo(RecentProduct);
const MemoProductCategory = React.memo(ProductCategory);

type SectionItemProps = {
  item: HomeSection;
  isMounted: boolean;
  isRenderable: boolean;
  pulse: Animated.Value;
};

const SectionPlaceholder = React.memo(
  ({ sectionKey, pulse }: { sectionKey: SectionKey; pulse: Animated.Value }) => (
    <View style={styles.skeletonBlock}>
      <SkeletonBox
        width="100%"
        height={SECTION_PLACEHOLDER_HEIGHT[sectionKey] ?? 170}
        borderRadius={12}
        pulse={pulse}
      />
    </View>
  )
);

SectionPlaceholder.displayName = 'SectionPlaceholder';

const SectionContent = React.memo(({ sectionKey }: { sectionKey: SectionKey }) => {
  switch (sectionKey) {
    case 'banner':
      return <MemoHomeBanner />;
    // case 'homeChart':
    //   return <MemoHomeChart />;
    case 'categories':
      return <MemoCategoriesSection />;
    case 'bestSeller':
      return <MemoBestSeller />;
    case 'topRated':
      return <MemoTopRated />;
    case 'offerHome':
      return <MemoOfferHome />;
    case 'newArrivals':
      return <MemoNewArrivals />;
    case 'mostView':
      return <MemoMostView />;
    case 'recommended':
      return <MemoRecommendedProducts />;
    case 'features':
      return <MemoFeaturesProduct />;
    case 'recent':
      return <MemoRecentProduct />;
    case 'productCategory':
      return <MemoProductCategory />;
    default:
      return null;
  }
});

SectionContent.displayName = 'SectionContent';

const SectionItem = React.memo(
  ({ item, isMounted, isRenderable, pulse }: SectionItemProps) => {
    if (!isRenderable || !isMounted) {
      return <SectionPlaceholder sectionKey={item.key} pulse={pulse} />;
    }

    return <SectionContent sectionKey={item.key} />;
  },
  (prev, next) =>
    prev.item.key === next.item.key &&
    prev.isMounted === next.isMounted &&
    prev.isRenderable === next.isRenderable &&
    prev.pulse === next.pulse
);

SectionItem.displayName = 'HomeSectionItem';

const ListFooterSpacer = React.memo(() => <View style={styles.footerSpacer} />);

ListFooterSpacer.displayName = 'HomeListFooterSpacer';

function HomeScreen() {
  const { isAuthenticated, user } = useAuth();
  const pulse = useRef(new Animated.Value(0)).current;
  const [renderableKeys, setRenderableKeys] = useState<Set<SectionKey>>(
    new Set(HOME_SECTIONS.slice(0, INITIAL_SECTIONS).map((section) => section.key))
  );
  const [mountedKeys, setMountedKeys] = useState<Set<SectionKey>>(
    new Set(HOME_SECTIONS.slice(0, INITIAL_SECTIONS).map((section) => section.key))
  );
  const mountedKeysRef = useRef(mountedKeys);
  const prefetchedKeysRef = useRef<Set<SectionKey>>(new Set());
  const queuedPrefetchKeysRef = useRef<Set<SectionKey>>(new Set());
  const queuedMountKeysRef = useRef<Set<SectionKey>>(new Set());
  const prefetchTaskRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(
    null
  );
  const mountTaskRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(
    null
  );
  const mountDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetchDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrollingRef = useRef(false);
  const isMountedRef = useRef(true);
  const prefetchByKeyRef = useRef<(key: SectionKey) => Promise<void>>(async () => {});

  useEffect(() => {
    mountedKeysRef.current = mountedKeys;
  }, [mountedKeys]);

  const prefetchByKey = useCallback(async (key: SectionKey) => {
    try {
      switch (key) {
        case 'bestSeller':
          await prefetchBestSellerSection();
          break;
        case 'topRated':
          await prefetchTopRatedSection();
          break;
        case 'mostView':
          await prefetchMostViewSection();
          break;
        case 'newArrivals':
          await prefetchNewArrivalsSection();
          break;
        case 'recommended':
          if (isAuthenticated && user?.user_id) {
            await prefetchRecommendedSection(user.user_id);
          }
          break;
        case 'recent':
          if (isAuthenticated && user?.user_id) {
            await prefetchRecentProductSection(user.user_id);
          }
          break;
        case 'offerHome':
          await prefetchTopRatedSection();
          break;
        default:
          break;
      }
    } catch {
      // ignore prefetch errors to keep scroll smooth
    }
  }, [isAuthenticated, user?.user_id]);

  useEffect(() => {
    prefetchByKeyRef.current = prefetchByKey;
  }, [prefetchByKey]);

  const flushPrefetchQueue = useCallback(() => {
    if (prefetchTaskRef.current || queuedPrefetchKeysRef.current.size === 0) {
      return;
    }

    prefetchTaskRef.current = InteractionManager.runAfterInteractions(async () => {
      const queue = Array.from(queuedPrefetchKeysRef.current);
      queuedPrefetchKeysRef.current.clear();

      for (let index = 0; index < queue.length; index += 1) {
        const key = queue[index];
        await prefetchByKeyRef.current(key);

        if (index < queue.length - 1) {
          await new Promise<void>((resolve) => {
            prefetchDelayRef.current = setTimeout(resolve, PREFETCH_DELAY_MS);
          });
        }
      }

      prefetchTaskRef.current = null;

      if (
        isMountedRef.current &&
        !isUserScrollingRef.current &&
        queuedPrefetchKeysRef.current.size > 0
      ) {
        flushPrefetchQueue();
      }
    });
  }, []);

  const enqueuePrefetch = useCallback(
    (keys: SectionKey[]) => {
      keys.forEach((key) => {
        if (prefetchedKeysRef.current.has(key)) return;
        prefetchedKeysRef.current.add(key);
        queuedPrefetchKeysRef.current.add(key);
      });

      if (!isUserScrollingRef.current) {
        flushPrefetchQueue();
      }
    },
    [flushPrefetchQueue]
  );

  const flushMountQueue = useCallback(() => {
    if (mountTaskRef.current || queuedMountKeysRef.current.size === 0) {
      return;
    }

    if (isUserScrollingRef.current) {
      return;
    }

    mountTaskRef.current = InteractionManager.runAfterInteractions(() => {
      const [nextKey] = Array.from(queuedMountKeysRef.current);
      if (!nextKey) {
        mountTaskRef.current = null;
        return;
      }

      queuedMountKeysRef.current.delete(nextKey);
      setMountedKeys((prev) => {
        if (prev.has(nextKey)) return prev;
        const next = new Set(prev);
        next.add(nextKey);
        mountedKeysRef.current = next;
        return next;
      });

      mountTaskRef.current = null;

      if (queuedMountKeysRef.current.size > 0 && isMountedRef.current) {
        mountDelayRef.current = setTimeout(flushMountQueue, MOUNT_DELAY_MS);
      }
    });
  }, []);

  const enqueueMount = useCallback(
    (keys: SectionKey[]) => {
      let changed = false;

      keys.forEach((key) => {
        if (mountedKeysRef.current.has(key) || queuedMountKeysRef.current.has(key)) return;
        queuedMountKeysRef.current.add(key);
        changed = true;
      });

      if (changed) {
        flushMountQueue();
      }
    },
    [flushMountQueue]
  );

  useEffect(() => {
    isMountedRef.current = true;

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    );
    pulseAnimation.start();

    const initialPrefetchKeys = HOME_SECTIONS.slice(0, INITIAL_SECTIONS + PRELOAD_AHEAD_COUNT).map(
      (section) => section.key
    );
    enqueuePrefetch(initialPrefetchKeys);

    return () => {
      isMountedRef.current = false;
      prefetchTaskRef.current?.cancel();
      mountTaskRef.current?.cancel();
      if (mountDelayRef.current) clearTimeout(mountDelayRef.current);
      if (prefetchDelayRef.current) clearTimeout(prefetchDelayRef.current);
      pulseAnimation.stop();
    };
  }, [enqueuePrefetch, pulse]);

  useEffect(() => {
    const toMount = Array.from(renderableKeys).filter((key) => !mountedKeys.has(key));
    if (toMount.length === 0) return;
    enqueueMount(toMount);
  }, [enqueueMount, mountedKeys, renderableKeys]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: HomeSection; index: number | null }> }) => {
      const nearKeys = new Set<SectionKey>();

      setRenderableKeys((prev) => {
        const next = new Set(prev);
        let changed = false;

        viewableItems.forEach((entry) => {
          const index = entry?.index;
          if (typeof index !== 'number' || index < 0) return;

          for (let i = index; i <= index + PRELOAD_AHEAD_COUNT; i += 1) {
            const target = HOME_SECTIONS[i];
            if (target?.key) {
              nearKeys.add(target.key);
              if (!next.has(target.key)) {
                next.add(target.key);
                changed = true;
              }
            }
          }
        });

        return changed ? next : prev;
      });

      if (nearKeys.size > 0) {
        const keys = Array.from(nearKeys);
        enqueuePrefetch(keys);
        enqueueMount(keys);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
    minimumViewTime: 120,
  }).current;

  const onScrollBegin = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  const onScrollEnd = useCallback(() => {
    isUserScrollingRef.current = false;
    flushPrefetchQueue();
    flushMountQueue();
  }, [flushMountQueue, flushPrefetchQueue]);

  const renderItem = useCallback(
    ({ item }: { item: HomeSection }) => (
      <SectionItem
        item={item}
        isRenderable={renderableKeys.has(item.key)}
        isMounted={mountedKeys.has(item.key)}
        pulse={pulse}
      />
    ),
    [mountedKeys, pulse, renderableKeys]
  );

  const keyExtractor = useCallback((item: HomeSection) => item.key, []);

  const data = useMemo(() => HOME_SECTIONS, []);
  const sectionStateKey = useMemo(
    () =>
      [
        Array.from(renderableKeys).join('|'),
        Array.from(mountedKeys).join('|'),
      ].join('::'),
    [mountedKeys, renderableKeys]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={INITIAL_SECTIONS}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={80}
        windowSize={4}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        extraData={sectionStateKey}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={onScrollBegin}
        onMomentumScrollBegin={onScrollBegin}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
        ListFooterComponent={ListFooterSpacer}
      />
    </View>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 0,
  },
  skeletonBlock: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerSpacer: {
    height: TAB_BAR_HEIGHT + 16,
  },
});
