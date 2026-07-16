import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  Animated,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "../../constants/product_cart/ProductCard";
import { fetchAllProducts, fetchSimilarProducts } from "../../api/ProductApi";
import SkeletonBox from "../../../services/component/constant/SkeletonBox";
import { normalizeProduct } from "../../utils/normalizeProduct";

type Props = {
  products?: any[];
  take?: number;
  columns?: number;           // optional – if not provided, will be responsive
  useFlatList?: boolean;
  relatedProductId?: string | number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  loadingMore?: boolean;
  hasNextPage?: boolean;
  ListFooterComponent?: React.ReactElement | null;
};

const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);
const DEFAULT_INITIAL_RENDER = 4;

// Grid spacing — fixed (not screen-width-percentage) so columns stay evenly
// balanced with no leftover center gap, regardless of device width.
const HORIZONTAL_PADDING = 24; // 12 on each side
const COLUMN_GAP = 10;
const ROW_GAP = 12;

// Responsive column logic
const getResponsiveColumns = (width: number) => (width >= 768 ? 3 : 2);

export default function ProductGrid({
  products: propProducts = [],
  take,
  columns: propColumns,
  useFlatList = true,
  relatedProductId,
  onEndReached,
  onEndReachedThreshold = 0.4,
  loadingMore = false,
  hasNextPage = false,
  ListFooterComponent = null,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const visibleProductIdsRef = useRef<Set<string>>(new Set());
  const [, forceVisibleTick] = React.useState(0);
  const { width: screenWidth } = useWindowDimensions();

  // Responsive columns: use prop if provided, otherwise auto
  const columns = propColumns ?? getResponsiveColumns(screenWidth);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const effectiveTake = take ?? columns * 3;
  const shouldFetch = !propProducts || propProducts.length === 0;
  const hasRelatedContext =
    relatedProductId !== undefined &&
    relatedProductId !== null &&
    String(relatedProductId).trim() !== "";

  const queryKey = useMemo(
    () => ["ecommerce", "grid-products", hasRelatedContext ? Number(relatedProductId) : "all", effectiveTake],
    [effectiveTake, hasRelatedContext, relatedProductId]
  );

  const {
    data: fetchedProducts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    enabled: shouldFetch,
    queryFn: async () => {
      const res = hasRelatedContext
        ? await fetchSimilarProducts({ productId: Number(relatedProductId) })
        : await fetchAllProducts();

      const allProducts =
        res?.products ??
        res?.product ??
        res?.items ??
        res?.similarProducts ??
        res?.relatedProducts ??
        res?.data?.products ??
        res?.data?.product ??
        res?.data?.items ??
        res?.data?.similarProducts ??
        res?.data?.relatedProducts ??
        res?.data ??
        [];

      const list = Array.isArray(allProducts)
        ? allProducts
        : Array.isArray(allProducts?.items)
          ? allProducts.items
          : [];

      const filteredList = hasRelatedContext
        ? list.filter((item: any) => String(item?.product_id ?? item?.id) !== String(relatedProductId))
        : list;

      if (hasRelatedContext && filteredList.length === 0) {
        const fallback = await fetchAllProducts();
        const fallbackProducts =
          fallback?.products ??
          fallback?.items ??
          fallback?.data?.products ??
          fallback?.data?.items ??
          fallback?.data ??
          [];

        const fallbackList = Array.isArray(fallbackProducts)
          ? fallbackProducts
          : Array.isArray(fallbackProducts?.items)
            ? fallbackProducts.items
            : [];

        const fallbackFiltered = fallbackList.filter(
          (item: any) => String(item?.product_id ?? item?.id) !== String(relatedProductId)
        );
        return shuffle(fallbackFiltered)
          .map(normalizeProduct)
          .slice(0, effectiveTake);
      }

      return shuffle(filteredList)
        .map(normalizeProduct)
        .slice(0, effectiveTake);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const normalizedPropProducts = useMemo(
    () => (propProducts || []).map(normalizeProduct),
    [propProducts]
  );

  const source = shouldFetch
    ? fetchedProducts
    : normalizedPropProducts;
  const list = Array.isArray(source) ? source : [];
  const dataToShow = shouldFetch ? list.slice(0, effectiveTake) : list;

  // Card width: total row width minus fixed horizontal padding and the
  // gaps *between* columns, split evenly — no leftover center gap.
  const cardWidth = Math.floor(
    (screenWidth - HORIZONTAL_PADDING - COLUMN_GAP * (columns - 1)) / columns
  );

  const skeletonItemStyles = useMemo(() => {
    return Array.from({ length: effectiveTake }, (_, index) => {
      const isLastInRow = (index + 1) % columns === 0;
      return {
        key: `skeleton-${index}`,
        wrapperStyle: {
          width: cardWidth,
          marginRight: isLastInRow ? 0 : COLUMN_GAP,
          marginBottom: ROW_GAP,
        },
      };
    });
  }, [effectiveTake, columns, cardWidth]);

  const errorMsg = error
    ? hasRelatedContext
      ? "Failed to load relevant products"
      : "Failed to load products"
    : "";

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const nextVisible = new Set<string>();
      viewableItems.forEach((entry) => {
        const product = entry.item as any;
        const key = String(product?.id ?? product?.product_id ?? product?._id ?? "");
        if (key) nextVisible.add(key);
      });
      const previousVisible = visibleProductIdsRef.current;
      const didChange =
        previousVisible.size !== nextVisible.size ||
        [...nextVisible].some((key) => !previousVisible.has(key));

      if (!didChange) return;

      visibleProductIdsRef.current = nextVisible;
      forceVisibleTick((prev) => prev + 1);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 35,
    minimumViewTime: 80,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const itemKey = String(item?.id ?? item?.product_id ?? item?._id ?? "");
      const shouldLoadImage = visibleProductIdsRef.current.has(itemKey);
      return (
        <View style={[styles.itemWrap, { width: cardWidth }]}>
          <ProductCard item={item} cardWidth={cardWidth} shouldLoadImage={shouldLoadImage} />
        </View>
      );
    },
    [cardWidth]
  );

  const handleEndReached = useCallback(() => {
    if (!useFlatList || !hasNextPage || loadingMore || !onEndReached) return;
    onEndReached();
  }, [useFlatList, hasNextPage, loadingMore, onEndReached]);

  if (isLoading) {
    return (
      <View style={styles.listContent}>
        <View style={styles.skeletonRow}>
          {skeletonItemStyles.map(({ key, wrapperStyle }) => (
            <View key={key} style={wrapperStyle}>
              <View style={styles.skeletonCard}>
                <SkeletonBox pulse={pulse} width="100%" height={Math.round(cardWidth * 1.08)} borderRadius={12} />
                <SkeletonBox pulse={pulse} width="88%" height={12} borderRadius={999} style={styles.skeletonText} />
                <SkeletonBox pulse={pulse} width="56%" height={10} borderRadius={999} style={styles.skeletonTextSmall} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  if (!dataToShow.length) return null;

  return (
    <FlatList
      data={dataToShow}
      key={columns} // important: re‑render when columns change (e.g., orientation)
      keyExtractor={(item, index) => String(item?.id ?? item?.product_id ?? item?._id ?? index)}
      numColumns={columns}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnRow}
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      removeClippedSubviews={true}
      windowSize={5}
      initialNumToRender={Math.max(DEFAULT_INITIAL_RENDER, columns * 3)}
      maxToRenderPerBatch={columns * 2}
      updateCellsBatchingPeriod={80}
      scrollEnabled={useFlatList}
      nestedScrollEnabled={useFlatList}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING / 2,
    paddingTop: 12,
    paddingBottom: 12,
  },
columnRow: {
  flexDirection: "row",
  justifyContent: "center",
  gap: 10,
},
  itemWrap: {
    alignSelf: "stretch",
    marginBottom: ROW_GAP,
  },
  skeletonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  center: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 6,
  },
  skeletonText: {
    marginTop: 8,
  },
  skeletonTextSmall: {
    marginTop: 6,
  },
});
