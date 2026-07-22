import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import ProductCard from "../../constants/product_cart/ProductCard";
import HorizontalProductList from "../common/HorizontalProductList";
import { fetchAllProducts } from "../../api/ProductApi";
import { normalizeProduct } from "../../utils/normalizeProduct";
import {
  PROMO_CARD_WIDTH,
  PROMO_CARD_GAP,
  PROMO_ESTIMATED_ITEM_SIZE,
} from "../../constants/cardLayout";
import HomeSectionSkeleton from "./HomeSectionSkeleton";
import { queryClient } from "../../../../query/queryClient";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const FEATURED_LIMIT = 10;
const FEATURES_PRODUCTS_QUERY_KEY = ["ecommerce", "home", "features-products"] as const;

const pickRandomProducts = (products: any[], limit = FEATURED_LIMIT) => {
  if (products.length <= limit) {
    return products;
  }

  const shuffled = [...products];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, limit);
};

const getProductList = (payload: any) => {
  const source =
    payload?.products ??
    payload?.items ??
    payload?.data?.products ??
    payload?.data?.items ??
    payload?.data ??
    [];

  return Array.isArray(source) ? source : [];
};

export default function FeaturesProduct() {
  const navigation = useNavigation<Nav>();
  const { isDark, theme } = useAppTheme();

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: FEATURES_PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchAllProducts();
      return getProductList(res).map(normalizeProduct);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const randomProducts = useMemo(
    () => pickRandomProducts(allProducts, FEATURED_LIMIT),
    [allProducts]
  );

  const firstRow = useMemo(() => randomProducts.slice(0, 5), [randomProducts]);
  const secondRow = useMemo(() => randomProducts.slice(5, 10), [randomProducts]);

  const handleExplore = useCallback(() => {
    navigation.navigate("ProductScreen", { source: "all" });
  }, [navigation]);

  const renderCard = React.useCallback(
    ({ item, shouldLoadImage }: { item: any; index: number; shouldLoadImage: boolean }) => (
      <ProductCard item={item} cardWidth={PROMO_CARD_WIDTH} shouldLoadImage={shouldLoadImage} />
    ),
    []
  );

  if (isLoading && allProducts.length === 0) {
    return <HomeSectionSkeleton height={620} backgroundColor={theme.background} />;
  }

  if (randomProducts.length === 0) return null;

  return (
    <LinearGradient
      colors={isDark ? ["#09090B", "#18120D", "#2A1A0C"] : ["#F6D58B", "#D69A33", "#8A531F"]}
      style={styles.fullScreen}
    >
      <View style={styles.contentWrap}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.heading, { color: isDark ? "#FFFFFF" : "#111827" }]}>Featured This Week</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.exploreBtn,
              { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.35)" },
            ]}
            activeOpacity={0.85}
            onPress={handleExplore}
          >
            <Text style={[styles.exploreText, { color: isDark ? "#FFFFFF" : "#111827" }]}>Explore More</Text>
            <MaterialIcons name="arrow-forward-ios" size={14} color={isDark ? "#FFFFFF" : "#111827"} />
          </TouchableOpacity>
        </View>
        <HorizontalProductList
          data={firstRow}
          itemWidth={PROMO_CARD_WIDTH}
          gap={PROMO_CARD_GAP}
          estimatedItemSize={PROMO_ESTIMATED_ITEM_SIZE}
          contentContainerStyle={styles.horizontalSliderPadding}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderCard={renderCard}
        />
        <HorizontalProductList
          data={secondRow}
          itemWidth={PROMO_CARD_WIDTH}
          gap={PROMO_CARD_GAP}
          estimatedItemSize={PROMO_ESTIMATED_ITEM_SIZE}
          contentContainerStyle={styles.horizontalSliderPadding}
          keyExtractor={(item, index) => `feature-row-2-${String(item.id ?? index)}`}
          renderCard={renderCard}
        />
      </View>
    </LinearGradient>
  );
}

export const prefetchFeaturesProductSection = () =>
  queryClient.prefetchQuery({
    queryKey: FEATURES_PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetchAllProducts();
      return getProductList(res).map(normalizeProduct);
    },
    staleTime: 5 * 60 * 1000,
  });

// ================== RESPONSIVE STYLES ==================
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    marginTop: 12,
  },
  contentWrap: { paddingBottom: 8 },
  headerCurve: {
    height: 20,
    backgroundColor: "#FFF4D6",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    marginHorizontal: 16,
  },
  horizontalSliderPadding: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  loader: { paddingVertical: 24, alignItems: "center" },
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
});
