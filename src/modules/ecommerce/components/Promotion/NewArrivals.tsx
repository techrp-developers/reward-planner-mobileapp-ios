import React, { useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { fetchNewArrivals } from "../../api/PromotionalApi";
import ProductCard from "../../constants/product_cart/ProductCard";
import HorizontalProductList from "../common/HorizontalProductList";
import { getProductImageUrl } from "../../api/ProductApi";
import { queryClient } from "../../../../query/queryClient";
import { normalizeProduct } from "../../utils/normalizeProduct";
import {
  PROMO_CARD_WIDTH,
  PROMO_CARD_GAP,
  PROMO_ESTIMATED_ITEM_SIZE,
} from "../../constants/cardLayout";

const CACHE_TTL_MS = 30 * 1000;
const NEW_ARRIVALS_QUERY_KEY = ["ecommerce", "promotion", "new-arrivals"] as const;

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const resolveImageUrl = (item: any) => {
  const candidate =
    (Array.isArray(item?.images) && item.images.length > 0 && item.images[0]) ||
    item?.image ||
    item?.image_url ||
    "";

  if (!candidate) return "";

  const raw = String(candidate).trim();
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return getProductImageUrl(raw, "thumbnail", 40);
  }

  const normalizedPath = raw
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "")
    .replace(/^api\/crm\/uploads\//i, "");

  return getProductImageUrl(normalizedPath, "thumbnail", 40);
};

const extractRawList = (res: any): any[] => {
  const candidates = [
    res?.products,
    res?.data?.products,
    res?.items,
    res?.data?.items,
    res?.data,
    res?.result?.products,
    res?.result?.items,
    res?.result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      if (__DEV__) {
        const sample = candidate[0];
        console.log("[NewArrivals] extractRawList found items:", {
          count: candidate.length,
          sampleKeys: Object.keys(sample ?? {}),
          rewardCoins: sample?.rewardCoins,
          reward_coins: sample?.reward_coins,
          redeem_coins: sample?.redeem_coins,
          redeemCoins: sample?.redeemCoins,
          reward: sample?.reward,
          points: sample?.points,
        });
      }
      return candidate;
    }
  }

  if (__DEV__) {
    console.warn(
      "[NewArrivals] extractRawList: no valid array found",
      Object.keys(res ?? {})
    );
  }
  return [];
};

const fetchNewArrivalsData = async () => {
  const res = await fetchNewArrivals();

  if (__DEV__) {
    console.log("[NewArrivals] raw API response shape:", {
      keys: Object.keys(res ?? {}),
      hasProducts: Array.isArray(res?.products),
      hasDataProducts: Array.isArray(res?.data?.products),
      hasItems: Array.isArray(res?.items),
      hasDataItems: Array.isArray(res?.data?.items),
      hasData: Array.isArray(res?.data),
      productsLength: res?.products?.length,
    });
  }

  const rawList = extractRawList(res);

  return rawList.map((item: any, index: number) => {
    const normalized = normalizeProduct(item);

    if (__DEV__ && normalized.rewardCoins === 0 && normalized.redeem_coins === 0) {
      console.warn("[NewArrivals] 0 coins after normalize:", {
        id: item?.id ?? item?.product_id,
        rewardCoins: item?.rewardCoins,
        reward_coins: item?.reward_coins,
        redeem_coins: item?.redeem_coins,
        redeemCoins: item?.redeemCoins,
        reward: item?.reward,
        points: item?.points,
      });
    }

    return {
      ...normalized,
      id: item?.product_id ?? item?.id ?? `new-${index}`,
      title: item?.product_name ?? item?.title ?? "Product",
      brand: item?.brand_name ?? item?.brand ?? "",
      image: resolveImageUrl(item),
      oldPrice: item?.old_price ?? item?.original_price ?? undefined,
      // Pin last — wins over any accidental spread clobber
      rewardCoins: normalized.rewardCoins,
      redeem_coins: normalized.redeem_coins,
    };
  });
};

function NewArrivals() {
  const navigation = useNavigation<Nav>();

  const { data: products = [], isLoading } = useQuery({
    queryKey: NEW_ARRIVALS_QUERY_KEY,
    queryFn: fetchNewArrivalsData,
    staleTime: CACHE_TTL_MS,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
  });

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
        <ActivityIndicator size="small" color="#FF3F6C" />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>New Arrivals</Text>
          <Text style={styles.subHeading}>The latest trends, just for you</Text>
        </View>
        <TouchableOpacity
          style={styles.exploreBtn}
          activeOpacity={0.7}
          onPress={handleViewAll}
        >
          <Text style={styles.exploreText}>View All</Text>
          <MaterialIcons name="chevron-right" size={18} color="#3B82F6" />
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

export const prefetchNewArrivalsSection = async () => {
  await queryClient.prefetchQuery({
    queryKey: NEW_ARRIVALS_QUERY_KEY,
    queryFn: fetchNewArrivalsData,
    staleTime: CACHE_TTL_MS,
  });
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFBF5",
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  subHeading: {
    fontSize: 11,
    color: "#94969F",
    marginTop: 2,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  exploreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  loaderWrap: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});

export default NewArrivals;