import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "../../constants/product_cart/ProductCard";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { HomeStackParamList } from "../../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchBestSellers } from "../../api/PromotionalApi";
import HorizontalProductList from "../common/HorizontalProductList";
import SkeletonBox from "../../../services/component/constant/SkeletonBox";
import { queryClient } from "../../../../query/queryClient";
import { normalizeProduct } from "../../utils/normalizeProduct";
import {
  PROMO_CARD_WIDTH,
  PROMO_CARD_GAP,
  PROMO_ESTIMATED_ITEM_SIZE,
} from "../../constants/cardLayout";

const CACHE_TTL_MS = 5 * 60 * 1000;
const BEST_SELLER_QUERY_KEY = ["ecommerce", "promotion", "best-seller"] as const;

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const normalizeBestSeller = (rawList: any[]) =>
  rawList.map((item: any, index: number) => {
    const normalized = normalizeProduct(item);

    return {
      ...normalized,
      id: item?.product_id ?? item?.id ?? `best-seller-${index}`,
      image: item?.image,
    };
  });

const fetchBestSellerData = async () => {
  const res = await fetchBestSellers();
  const rawList =
    (Array.isArray(res?.products) && res.products) ||
    (Array.isArray(res?.data?.products) && res.data.products) ||
    (Array.isArray(res?.data) && res.data) ||
    [];

  return normalizeBestSeller(rawList);
};

export const prefetchBestSellerSection = async () => {
  await queryClient.prefetchQuery({
    queryKey: BEST_SELLER_QUERY_KEY,
    queryFn: fetchBestSellerData,
    staleTime: CACHE_TTL_MS,
  });
};

function BestSeller() {
  const navigation = useNavigation<Nav>();
  const pulse = useState(() => new Animated.Value(0))[0];

  const { data: products = [], isLoading } = useQuery({
    queryKey: BEST_SELLER_QUERY_KEY,
    queryFn: fetchBestSellerData,
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

  const handleViewAll = useCallback(() => {
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
        <SkeletonBox width="92%" height={100} borderRadius={12} pulse={pulse} />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Best Sellers</Text>
          <View style={styles.trendingBadge}>
            <MaterialIcons name="trending-up" size={12} color="#FF3F6C" />
            <Text style={styles.trendingText}>MOST POPULAR RIGHT NOW</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialIcons name="keyboard-arrow-right" size={20} color="#FF3F6C" />
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
    backgroundColor: "#FAD4E5",
    paddingVertical: 14,
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
    color: "#1A1A1A",
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  trendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF3F6C",
    marginLeft: 4,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF3F6C",
  },
  loaderWrap: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAD4E5",
  },
});

export default React.memo(BestSeller);