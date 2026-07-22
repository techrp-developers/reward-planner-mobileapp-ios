import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import ProductHeadColor from "../constants/heading/Poduct_Head_Color";
import ProductCard from "../constants/product_cart/ProductCard";
import { fetchAllProducts } from "../api/ProductApi";
import {
  fetchBestSellers,
  fetchMostViewedProducts,
  fetchNewArrivals,
  fetchTopRatedProducts,
  getRecentProducts,
  getRecommendedProducts,
} from "../api/PromotionalApi";
import { normalizeProduct } from "../utils/normalizeProduct";
import type {
  HomeStackParamList,
  ProductCollectionSource,
} from "../navigation/types";
import SkeletonBox from "../../services/component/constant/SkeletonBox";
import { useAppTheme } from "../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type ProductScreenRoute = RouteProp<HomeStackParamList, "ProductScreen">;

const PAGE_SIZE = 10;

const COLLECTION_TITLES: Record<ProductCollectionSource, string> = {
  all: "All Products",
  bestSellers: "Best Sellers",
  newArrivals: "New Arrivals",
  mostViewed: "Most Viewed",
  recommended: "You May Like This",
  recent: "Recently Viewed",
  topRated: "Top Rated",
};

type CollectionPage = {
  products: any[];
  hasMore: boolean;
  nextOffset: number;
};

const toCollectionPage = (response: any, offset: number): CollectionPage => {
  const rawProducts =
    (Array.isArray(response?.products) && response.products) ||
    (Array.isArray(response?.data?.products) && response.data.products) ||
    (Array.isArray(response?.data) && response.data) ||
    [];
  const products = rawProducts.map(normalizeProduct);
  const hasMore = Boolean(response?.hasMore ?? response?.data?.hasMore ?? false);

  return {
    products,
    hasMore,
    nextOffset: Number(response?.nextOffset ?? offset + products.length),
  };
};

const fetchCollectionPage = async (
  source: ProductCollectionSource,
  offset: number
): Promise<CollectionPage> => {
  switch (source) {
    case "bestSellers":
      return toCollectionPage(await fetchBestSellers(offset), offset);
    case "newArrivals":
      return toCollectionPage(await fetchNewArrivals(offset), offset);
    case "mostViewed":
      return toCollectionPage(await fetchMostViewedProducts(offset), offset);
    case "recommended":
      return toCollectionPage(await getRecommendedProducts(offset), offset);
    case "recent":
      return toCollectionPage(await getRecentProducts(offset), offset);
    case "topRated":
      return toCollectionPage(await fetchTopRatedProducts(offset), offset);
    case "all":
    default: {
      const page = Math.floor(offset / PAGE_SIZE) + 1;
      const response = await fetchAllProducts({ page, pageSize: PAGE_SIZE });
      const result = toCollectionPage(response, offset);
      const hasMore = Boolean(response?.hasMore ?? result.products.length === PAGE_SIZE);

      return {
        ...result,
        hasMore,
        nextOffset: offset + result.products.length,
      };
    }
  }
};

function ProductScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ProductScreenRoute>();
  const { width } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0)).current;
  const { theme } = useAppTheme();
  const source = route.params?.source ?? "all";
  const title = COLLECTION_TITLES[source];

  const gap = 12;
  const horizontalPadding = 16;
  const cardWidth = useMemo(
    () => (width - horizontalPadding * 2 - gap) / 2,
    [width]
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["ecommerce", "product-collection", source],
    queryFn: ({ pageParam }) => fetchCollectionPage(source, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextOffset > 0 ? lastPage.nextOffset : undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const products = useMemo(() => {
    const uniqueProducts = new Map<string, any>();

    (data?.pages ?? []).forEach((page) => {
      page.products.forEach((product: any, index: number) => {
        const key = String(
          product?.id ?? product?.product_id ?? product?.productId ?? `${page.nextOffset}-${index}`
        );
        uniqueProducts.set(key, product);
      });
    });

    return Array.from(uniqueProducts.values());
  }, [data?.pages]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ProductHeadColor title={title} onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <View style={[styles.skeletonWrap, { backgroundColor: theme.background }]}>
          <View style={styles.skeletonRow}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`product-skeleton-${index}`} style={[styles.skeletonCard, { width: cardWidth, backgroundColor: theme.card }]}>
                <SkeletonBox pulse={pulse} width="100%" height={Math.round(cardWidth * 1.05)} borderRadius={14} />
                <SkeletonBox pulse={pulse} width="86%" height={12} borderRadius={999} style={styles.skeletonText} />
                <SkeletonBox pulse={pulse} width="60%" height={10} borderRadius={999} style={styles.skeletonTextSmall} />
              </View>
            ))}
          </View>
        </View>
      ) : error && products.length === 0 ? (
        <View style={[styles.centerWrap, { backgroundColor: theme.background }]}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            {(error as Error)?.message || `Failed to load ${title.toLowerCase()}.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => String(item?.id ?? item?.product_id ?? index)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: theme.background }}
          contentContainerStyle={[styles.listContent, { backgroundColor: theme.background }]}
          columnWrapperStyle={styles.row}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) => (
            <ProductCard item={item} cardWidth={cardWidth} shouldLoadImage />
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.centerWrap, { backgroundColor: theme.background }]}>
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No {title.toLowerCase()} found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

export default ProductScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  skeletonWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    overflow: "hidden",
  },
  skeletonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  skeletonCard: {
    marginBottom: 12,
  },
  skeletonText: {
    marginTop: 10,
  },
  skeletonTextSmall: {
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 14,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
});
