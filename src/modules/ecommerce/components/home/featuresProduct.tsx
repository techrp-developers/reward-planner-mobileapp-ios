import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const FEATURED_LIMIT = 10;

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
  const [refreshSeed, setRefreshSeed] = useState(0);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["ecommerce", "home", "features-products"],
    queryFn: async () => {
      const res = await fetchAllProducts();
      return getProductList(res).map(normalizeProduct);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  useFocusEffect(
    useCallback(() => {
      setRefreshSeed((value) => value + 1);
    }, [])
  );

  const randomProducts = useMemo(
    () => pickRandomProducts(allProducts, FEATURED_LIMIT),
    [allProducts, refreshSeed]
  );

  const firstRow = useMemo(() => randomProducts.slice(0, 5), [randomProducts]);
  const secondRow = useMemo(() => randomProducts.slice(5, 10), [randomProducts]);

  const handleExplore = useCallback(() => {
    navigation.navigate("ProductScreen");
  }, [navigation]);

  const renderCard = React.useCallback(
    ({ item, shouldLoadImage }: { item: any; index: number; shouldLoadImage: boolean }) => (
      <ProductCard item={item} cardWidth={PROMO_CARD_WIDTH} shouldLoadImage={shouldLoadImage} />
    ),
    []
  );

  if (isLoading && allProducts.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#5B47A3" />
      </View>
    );
  }

  if (randomProducts.length === 0) return null;

  return (
    <LinearGradient colors={["#FFF4D6", "#FFECD6", "#FFDDCE"]} style={styles.fullScreen}>
      <View style={styles.contentWrap}>
        <View style={styles.headerCurve} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>Featured This Week</Text>
          </View>
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

// ================== RESPONSIVE STYLES ==================
const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
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
