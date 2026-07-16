import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import ProductCard from "../../constants/product_cart/ProductCard";
import HorizontalProductList from "../common/HorizontalProductList";
import { useAuth } from "../../../common/auth/context/AuthContext";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import type { HomeStackParamList } from "../../navigation/types";
import { getRecommendedProducts } from "../../api/PromotionalApi";
import { queryClient } from "../../../../query/queryClient";
import { normalizeProduct } from "../../utils/normalizeProduct";
import {
    PROMO_CARD_WIDTH,
    PROMO_CARD_GAP,
    PROMO_ESTIMATED_ITEM_SIZE,
} from "../../constants/cardLayout";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const CACHE_TTL_MS = 5 * 60 * 1000;

const normalizeRecommended = (rawList: any[]) =>
    rawList
        .map((item: any, index: number) => {
            const normalized = normalizeProduct(item);

            return {
                ...normalized,
                id: item?.product_id ?? item?.id ?? `rec-${index}`,
            };
        })
        .sort((a: any, b: any) => Number(b?.score ?? 0) - Number(a?.score ?? 0));

const fetchRecommendedData = async () => {
    const res = await getRecommendedProducts();
    const rawList =
        (Array.isArray(res?.products) && res.products) ||
        (Array.isArray(res?.data?.products) && res.data.products) ||
        [];

    return normalizeRecommended(rawList);
};

function RecommendedProducts() {
    const navigation = useNavigation<Nav>();
    const { isAuthenticated, user } = useAuth();
    const recommendedQueryKey = useMemo(
        () => ["ecommerce", "promotion", "recommended", user?.user_id ?? "guest"] as const,
        [user?.user_id]
    );

    const {
        data: products = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: recommendedQueryKey,
        queryFn: fetchRecommendedData,
        enabled: isAuthenticated,
        staleTime: CACHE_TTL_MS,
        gcTime: 30 * 60 * 1000,
    });

    const authRequired = !isAuthenticated || (error as any)?.response?.status === 401;

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
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#5B47A3" />
            </View>
        );
    }

    if (authRequired || products.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.heading}>You May Like This</Text>
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

export const prefetchRecommendedSection = async (userId: number) => {
    const queryKey = ["ecommerce", "promotion", "recommended", userId] as const;

    await queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
            const res = await getRecommendedProducts();
            const rawList =
                (Array.isArray(res?.products) && res.products) ||
                (Array.isArray(res?.data?.products) && res.data.products) ||
                [];

            return normalizeRecommended(rawList);
        },
        staleTime: CACHE_TTL_MS,
    });
};

export default React.memo(RecommendedProducts);

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF", // Screen-best white background
        paddingVertical: 16,
        marginVertical: 4,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 10,
    },
 heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
    loadingWrap: {
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
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