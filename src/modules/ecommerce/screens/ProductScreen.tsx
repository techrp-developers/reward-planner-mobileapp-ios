import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProductHeadColor from "../constants/heading/Poduct_Head_Color";
import ProductCard from "../constants/product_cart/ProductCard";
import { fetchAllProducts } from "../api/ProductApi";
import { normalizeProduct } from "../utils/normalizeProduct";
import type { HomeStackParamList } from "../navigation/types";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const PAGE_SIZE = 10;

function ProductScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const pulse = useRef(new Animated.Value(0)).current;

  const [products, setProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gap = 12;
  const horizontalPadding = 16;
  const cardWidth = useMemo(
    () => (width - horizontalPadding * 2 - gap) / 2,
    [width]
  );

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

  const fetchPage = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await fetchAllProducts({ page: pageNum, pageSize: PAGE_SIZE });

      const rawList = res?.products ?? [];
      const normalized = rawList.map(normalizeProduct);

      // Fisher-Yates shuffle
      const shuffled = [...normalized];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setProducts((prev) => (pageNum === 1 ? shuffled : [...prev, ...shuffled]));
      setCurrentPage(pageNum);
      setHasMore(res?.hasMore ?? false);
      setError(null);
    } catch (err: any) {
      console.error("ProductScreen Fetch Error:", err?.message || err);
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setProducts([]);
      setCurrentPage(1);
      setHasMore(true);
      fetchPage(1);
    }, [fetchPage])
  );

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    fetchPage(currentPage + 1);
  }, [loading, loadingMore, hasMore, currentPage, fetchPage]);

  return (
    <View style={styles.screen}>
      <ProductHeadColor title="All Products" onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.skeletonWrap}>
          <View style={styles.skeletonRow}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`product-skeleton-${index}`} style={[styles.skeletonCard, { width: cardWidth }]}>
                <SkeletonBox pulse={pulse} width="100%" height={Math.round(cardWidth * 1.05)} borderRadius={14} />
                <SkeletonBox pulse={pulse} width="86%" height={12} borderRadius={999} style={styles.skeletonText} />
                <SkeletonBox pulse={pulse} width="60%" height={10} borderRadius={999} style={styles.skeletonTextSmall} />
              </View>
            ))}
          </View>
        </View>
      ) : error && products.length === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          renderItem={({ item }) => (
            <ProductCard item={item} cardWidth={cardWidth} shouldLoadImage={true} />
          )}
          ListFooterComponent={
            loadingMore && hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#5B47A3" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Text style={styles.emptyText}>No products found.</Text>
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
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  },
});
