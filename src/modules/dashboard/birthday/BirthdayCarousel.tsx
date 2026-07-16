import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';
import { rs } from '../../../utils/responsive';
import { useAppTheme } from '../../../theme/ThemeContext';
import BirthdayCard from './BirthdayCard';
import type { BirthdayEmployee } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCREEN_WIDTH      = Dimensions.get('window').width;
const H_PAD             = rs(16);
const CARD_WIDTH        = SCREEN_WIDTH - H_PAD * 2;
const AUTO_SCROLL_MS    = 4000;
const SCROLL_ANIM_MS    = 350;

// ─── Pagination dot ───────────────────────────────────────────────────────────

const PaginationDot = memo(({
  active,
  isDark,
}: {
  active: boolean;
  isDark: boolean;
}) => {
  const width = useRef(new Animated.Value(active ? rs(18) : rs(6))).current;
  const activeColor = '#818CF8';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(49,46,129,0.18)';
  const dotColor = active ? activeColor : inactiveColor;

  useEffect(() => {
    Animated.spring(width, {
      toValue: active ? rs(18) : rs(6),
      tension: 120,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [active, width]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width,
          backgroundColor: dotColor,
        },
      ]}
    />
  );
});

// ─── BirthdayCarousel ─────────────────────────────────────────────────────────
//
// Infinite-loop strategy:
//   loopData = [...items, items[0]]          (clone of first appended at end)
//   initialIndex = 0 (first real item)
//   When we scroll to the clone at loopData.length-1, instantly jump to 0
//   This makes the "wrap around" invisible.
//
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  birthdays: BirthdayEmployee[];
}

const BirthdayCarousel: React.FC<Props> = ({ birthdays }) => {
  const { isDark } = useAppTheme();
  const flatListRef   = useRef<FlatList<BirthdayEmployee>>(null);
  const currentIdxRef = useRef(0);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const jumpPendingRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);

  // Append clone of first item so the last → first wrap is invisible
  const loopData = useMemo<BirthdayEmployee[]>(() => {
    if (birthdays.length <= 1) return birthdays;
    return [...birthdays, { ...birthdays[0], id: `__clone_${birthdays[0].id}` }];
  }, [birthdays]);

  // ── getItemLayout ─────────────────────────────────────────────────────────
  // Required for scrollToIndex to work reliably.
  const getItemLayout = useCallback(
    (_: ArrayLike<BirthdayEmployee> | null | undefined, index: number) => ({
      length: CARD_WIDTH,
      offset: CARD_WIDTH * index,
      index,
    }),
    [],
  );

  // Mirror mutable values into refs so interval callbacks never close over stale state
  const loopLenRef = useRef(loopData.length);
  loopLenRef.current = loopData.length;

  const birthdaysLenRef = useRef(birthdays.length);
  birthdaysLenRef.current = birthdays.length;

  // ── Stop interval ─────────────────────────────────────────────────────────
  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Tick — reads only from refs, no stale closures ────────────────────────
  const tick = useCallback(() => {
    if (!flatListRef.current) return;
    if (jumpPendingRef.current) return;
    if (loopLenRef.current <= 1) return;

    const nextIndex = currentIdxRef.current + 1;

    flatListRef.current.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0 });

    currentIdxRef.current = nextIndex;
    setActiveIndex(nextIndex % birthdaysLenRef.current);

    if (nextIndex === loopLenRef.current - 1) {
      jumpPendingRef.current = true;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
        currentIdxRef.current = 0;
        setActiveIndex(0);
        jumpPendingRef.current = false;
      }, SCROLL_ANIM_MS);
    }
  }, []); // empty deps — everything read from refs

  // ── Start interval — clears previous before creating new ──────────────────
  const startAutoScroll = useCallback(() => {
    if (birthdaysLenRef.current <= 1) return;
    stopAutoScroll();
    intervalRef.current = setInterval(tick, AUTO_SCROLL_MS);
  }, [tick, stopAutoScroll]);

  // Run once on mount — delay first tick by a full interval to avoid instant scroll
  useEffect(() => {
    const firstTick = setTimeout(startAutoScroll, AUTO_SCROLL_MS);
    return () => {
      clearTimeout(firstTick);
      stopAutoScroll();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pause on user drag, resume on release ─────────────────────────────────
  const onScrollBeginDrag = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  // Sync currentIdxRef from actual scroll offset so manual swipes stay in sync
  const onMomentumScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (!jumpPendingRef.current) {
      const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
      currentIdxRef.current = index;
      setActiveIndex(index % birthdaysLenRef.current);
    }
    startAutoScroll();
  }, [startAutoScroll]);

  // ── Viewability — frozen ref, never reassigned ────────────────────────────
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  const onViewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (!first || first.index == null) return;
      if (jumpPendingRef.current) return;
      currentIdxRef.current = first.index;
      setActiveIndex(first.index % birthdaysLenRef.current);
    },
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: BirthdayEmployee }) => (
      <View style={styles.itemWrap}>
        <BirthdayCard employee={item} isDark={isDark} />
      </View>
    ),
    [isDark],
  );

  const keyExtractor = useCallback(
    (item: BirthdayEmployee, index: number) => `${item.id}-${index}`,
    [],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={loopData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={birthdays.length > 1}
        snapToInterval={CARD_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={(info) => {
          // Fallback: scroll to offset if index-based scroll fails on first render
          const offset = info.averageItemLength * info.index;
          flatListRef.current?.scrollToOffset({ offset, animated: false });
        }}
        removeClippedSubviews
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
      />

      {/* Pagination dots — only shown for multiple birthdays */}
      {birthdays.length > 1 && (
        <View style={styles.pagination}>
          {birthdays.map((_, i) => (
            <PaginationDot key={i} active={i === activeIndex} isDark={isDark} />
          ))}
        </View>
      )}
    </View>
  );
};

export default memo(BirthdayCarousel);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Container matches the quote banner's outer padding exactly
  container: {
    paddingHorizontal: H_PAD,
    paddingTop: rs(14),
    overflow: 'visible',
  },

  // Each FlatList item is exactly CARD_WIDTH wide — no margins on items
  // because snapToInterval is also CARD_WIDTH
  itemWrap: {
    width: CARD_WIDTH,
  },

  // Pagination row
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(10),
    gap: rs(5),
  },

  // Base dot style — width is animated per-dot
  dot: {
    height: rs(6),
    borderRadius: rs(3),
  },
});
