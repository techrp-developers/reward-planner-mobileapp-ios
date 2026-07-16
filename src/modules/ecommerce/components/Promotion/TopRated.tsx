import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import type { HomeStackParamList } from "../../navigation/types";
import ProductCard from "../../constants/product_cart/ProductCard";
import HorizontalProductList from "../common/HorizontalProductList";
import { fetchTopRatedProducts } from "../../api/PromotionalApi";
import { getProductImageUrl } from "../../api/ProductApi";
import SkeletonBox from "../../../services/component/constant/SkeletonBox";
import { queryClient } from "../../../../query/queryClient";
import { normalizeProduct } from "../../utils/normalizeProduct";
import {
  PROMO_CARD_WIDTH,
  PROMO_CARD_GAP,
  PROMO_ESTIMATED_ITEM_SIZE,
} from "../../constants/cardLayout";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const CACHE_TTL_MS = 5 * 60 * 1000;
const TOP_RATED_QUERY_KEY = ["ecommerce", "promotion", "top-rated"] as const;

const resolveImageUrl = (item: any) => {
  const candidate =
    (Array.isArray(item?.images) && item.images.length > 0 && item.images[0]) ||
    item?.image ||
    item?.image_url ||
    "";

  if (!candidate) return "";

  const raw = String(candidate).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return getProductImageUrl(raw, "thumbnail", 40);

  const normalizedPath = raw
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "")
    .replace(/^api\/crm\/uploads\//i, "");

  return getProductImageUrl(normalizedPath, "thumbnail", 40);
};

const normalizeTopRated = (rawList: any[]) =>
  rawList.slice(0, 4).map((item: any, index: number) => {
    const normalized = normalizeProduct(item);

    return {
      ...normalized,
      id: item?.product_id ?? item?.id ?? `top-${index}`,
      image: resolveImageUrl(item),
    };
  });

const fetchTopRatedData = async () => {
  const res = await fetchTopRatedProducts();
  const rawList =
    (Array.isArray(res?.products) && res.products) ||
    (Array.isArray(res?.data?.products) && res.data.products) ||
    (Array.isArray(res?.data) && res.data) ||
    [];

  return normalizeTopRated(rawList);
};

export const prefetchTopRatedSection = async () => {
  await queryClient.prefetchQuery({
    queryKey: TOP_RATED_QUERY_KEY,
    queryFn: fetchTopRatedData,
    staleTime: CACHE_TTL_MS,
  });
};

function TopRated() {
  const navigation = useNavigation<Nav>();
  const pulse = useState(() => new Animated.Value(0))[0];

  const { data: products = [], isLoading } = useQuery({
    queryKey: TOP_RATED_QUERY_KEY,
    queryFn: fetchTopRatedData,
    staleTime: CACHE_TTL_MS,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [pulse]);

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
        <SkeletonBox width="92%" height={140} borderRadius={12} pulse={pulse} />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Top Rated</Text>
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

export default React.memo(TopRated);