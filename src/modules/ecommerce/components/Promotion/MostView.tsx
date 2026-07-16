import React, { useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import type { HomeStackParamList } from "../../navigation/types";
import ProductCard from "../../constants/product_cart/ProductCard";
import HorizontalProductList from "../common/HorizontalProductList";
import { fetchMostViewedProducts } from "../../api/PromotionalApi";
import { getProductImageUrl } from "../../api/ProductApi";
import { queryClient } from "../../../../query/queryClient";
import { normalizeProduct } from "../../utils/normalizeProduct";
import {
  PROMO_CARD_WIDTH,
  PROMO_CARD_GAP,
  PROMO_ESTIMATED_ITEM_SIZE,
} from "../../constants/cardLayout";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MOST_VIEW_QUERY_KEY = ["ecommerce", "promotion", "most-viewed"] as const;

const resolveImageUrl = (item: any) => {
  const candidate =
    (Array.isArray(item?.images) && item.images.length > 0 && item.images[0]) ||
    item?.image ||
    item?.image_url ||
    "";

  if (!candidate) return "";

  const raw = String(candidate).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return getProductImageUrl(raw, "thumbnail", 45);

  const normalizedPath = raw
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "")
    .replace(/^api\/crm\/uploads\//i, "");

  return getProductImageUrl(normalizedPath, "thumbnail", 45);
};

const mapMostViewItem = (item: any, index: number) => {
  const normalized = normalizeProduct(item);

  return {
    ...normalized,
    id: item?.product_id ?? item?.id ?? `most-viewed-${index}`,
    image: resolveImageUrl(item),
  };
};


function MostView() {
  const navigation = useNavigation<Nav>();
  const fetchMostViewData = useCallback(async () => {
    const res = await fetchMostViewedProducts();
    const rawList =
      (Array.isArray(res?.products) && res.products) ||
      (Array.isArray(res?.data?.products) && res.data.products) ||
      (Array.isArray(res?.data) && res.data) ||
      [];

    return rawList.slice(0, 8).map(mapMostViewItem);
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: MOST_VIEW_QUERY_KEY,
    queryFn: fetchMostViewData,
    staleTime: CACHE_TTL_MS,
    gcTime: 30 * 60 * 1000,
  });

  const handleExplore = useCallback(() => {
    navigation.navigate("ProductScreen");
  }, [navigation]);

  const renderCard = useCallback(
    ({ item, shouldLoadImage }: { item: any; index: number; shouldLoadImage: boolean }) => (
      <ProductCard item={item} cardWidth={PROMO_CARD_WIDTH} shouldLoadImage={shouldLoadImage} />
    ),
    []
  );

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color="#5B47A3" />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Most Viewed</Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          activeOpacity={0.85}
          onPress={handleExplore}
        >
          <Text style={styles.exploreText}>Explore More</Text>
          <MaterialIcons name="arrow-forward-ios" size={14} color="#5B47A3" />
        </TouchableOpacity>
      </View>
      <HorizontalProductList
        data={products}
        itemWidth={PROMO_CARD_WIDTH}
        gap={PROMO_CARD_GAP}
        estimatedItemSize={PROMO_ESTIMATED_ITEM_SIZE}
        keyExtractor={(item) => String(item.id)}
        renderCard={renderCard}
      />
    </View>
  );
}

export const prefetchMostViewSection = async () => {
  await queryClient.prefetchQuery({
    queryKey: MOST_VIEW_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchMostViewedProducts();
      const rawList =
        (Array.isArray(res?.products) && res.products) ||
        (Array.isArray(res?.data?.products) && res.data.products) ||
        (Array.isArray(res?.data) && res.data) ||
        [];

      return rawList.slice(0, 8).map(mapMostViewItem);
    },
    staleTime: CACHE_TTL_MS,
  });
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 14,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#F3F0FF",
  },
  exploreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B47A3",
    marginRight: 4,
  },
  loaderWrap: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});

export default MostView;