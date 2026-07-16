import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ViewToken,
} from "react-native";

let FlashListComponent: any = null;

try {
  const flashListModule = require("@shopify/flash-list");
  FlashListComponent = flashListModule.FlashList ?? null;
} catch {
  FlashListComponent = null;
}

type ListItemBase = {
  id?: string | number;
};

type RenderCardArgs<T> = {
  item: T;
  index: number;
  shouldLoadImage: boolean;
};

type HorizontalProductListProps<T extends ListItemBase> = {
  data: T[];
  itemWidth: number;
  gap?: number;
  estimatedItemSize?: number;
  initialVisibleCount?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyExtractor?: (item: T, index: number) => string;
  renderCard: (args: RenderCardArgs<T>) => React.ReactElement;
};

function HorizontalProductList<T extends ListItemBase>({
  data,
  itemWidth,
  gap = 12,
  estimatedItemSize,
  initialVisibleCount = 3,
  contentContainerStyle,
  keyExtractor,
  renderCard,
}: HorizontalProductListProps<T>) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const ListComponent = FlashListComponent ?? FlatList;
  const listIsFlashList = Boolean(FlashListComponent);

  const resolveKey = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }

      const rawId = item?.id;
      return String(rawId ?? index);
    },
    [keyExtractor]
  );

  useEffect(() => {
    const nextKeys = new Set<string>();
    data.slice(0, initialVisibleCount).forEach((item, index) => {
      nextKeys.add(resolveKey(item, index));
    });
    setVisibleKeys(nextKeys);
  }, [data, initialVisibleCount, resolveKey]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const nextKeys = new Set<string>();

      viewableItems.forEach((entry) => {
        const item = entry.item as T | undefined;
        if (!item) return;

        const index = entry.index ?? 0;
        nextKeys.add(resolveKey(item, index));
      });

      if (nextKeys.size > 0) {
        setVisibleKeys(nextKeys);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 35,
    minimumViewTime: 60,
  }).current;

  const separator = useCallback(() => <View style={{ width: gap }} />, [gap]);

  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const itemKey = resolveKey(item, index);
      return (
        <View style={[styles.cardWrap, { width: itemWidth }]}>
          {renderCard({
            item,
            index,
            shouldLoadImage: visibleKeys.has(itemKey),
          })}
        </View>
      );
    },
    [itemWidth, renderCard, resolveKey, visibleKeys]
  );

  const listProps = useMemo(
    () => ({
      data,
      horizontal: true,
      renderItem,
      keyExtractor: resolveKey,
      showsHorizontalScrollIndicator: false,
      contentContainerStyle: [styles.content, contentContainerStyle],
      ItemSeparatorComponent: separator,
      onViewableItemsChanged,
      viewabilityConfig,
      removeClippedSubviews: true,
      initialNumToRender: Math.min(Math.max(initialVisibleCount, 2), 4),
      maxToRenderPerBatch: 3,
      updateCellsBatchingPeriod: 80,
      windowSize: 3,
      decelerationRate: "fast" as const,
      snapToInterval: itemWidth + gap,
      scrollEventThrottle: 16,
    }),
    [
      contentContainerStyle,
      data,
      gap,
      initialVisibleCount,
      itemWidth,
      onViewableItemsChanged,
      renderItem,
      resolveKey,
      separator,
      viewabilityConfig,
    ]
  );

  if (listIsFlashList) {
    return (
      <ListComponent
        {...listProps}
        estimatedItemSize={estimatedItemSize ?? itemWidth + gap}
      />
    );
  }

  return <ListComponent {...listProps} />;
}

const styles = StyleSheet.create({
  content: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  cardWrap: {
    overflow: "hidden",
  },
});

export default React.memo(HorizontalProductList) as typeof HorizontalProductList;