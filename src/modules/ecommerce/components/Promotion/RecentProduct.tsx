import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    // Platform
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getProductImageUrl } from "../../api/ProductApi";
import ProductCard from "../../constants/product_cart/ProductCard";
import HorizontalProductList from "../common/HorizontalProductList";
import { useAuth } from "../../../common/auth/context/AuthContext";
import type { HomeStackParamList } from "../../navigation/types";
import LinearGradient from "react-native-linear-gradient";
import { getRecentProducts } from "../../api/PromotionalApi";
import { normalizeProduct } from "../../utils/normalizeProduct";
import {
    PROMO_CARD_WIDTH,
    PROMO_CARD_GAP,
    PROMO_ESTIMATED_ITEM_SIZE,
} from "../../constants/cardLayout";
// import { queryClient } from "../../../../query/queryClient";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const CACHE_TTL_MS = 5 * 60 * 1000;

const fetchRecentProductsData = async () => {
    const res = await getRecentProducts();
    const rawData = res?.data?.products ?? res?.products ?? res?.data ?? [];
    if (!Array.isArray(rawData)) return [];

    return rawData.map((item: any, index: number) => {
        const normalized = normalizeProduct(item);

        return {
            ...normalized,
            id: String(item?.product_id ?? item?.id ?? `prod-${index}`),
            image: getProductImageUrl(item?.image, "thumbnail", 40),
        };
    });
};

const RecentProduct = () => {
    const navigation = useNavigation<Nav>();
    const { user, isAuthenticated } = useAuth();
    const RECENT_QUERY_KEY = ["ecommerce", "promotion", "recent", user?.user_id ?? "guest"] as const;

    const { data: products = [], isLoading } = useQuery({
        queryKey: RECENT_QUERY_KEY,
        queryFn: fetchRecentProductsData,
        enabled: isAuthenticated,
        staleTime: CACHE_TTL_MS,
        gcTime: 30 * 60 * 1000,
    });

    const handlePressAll = React.useCallback(() => {
        navigation.navigate("ProductScreen");
    }, [navigation]);

    const renderCard = React.useCallback(
        ({ item, shouldLoadImage }: { item: any; index: number; shouldLoadImage: boolean }) => (
            <ProductCard
                item={item}
                cardWidth={PROMO_CARD_WIDTH}
                shouldLoadImage={shouldLoadImage}
            />
        ),
        []
    );

    if (!isAuthenticated || (isLoading && products.length === 0) || products.length === 0) return null;

    return (
        <View style={styles.sectionWrapper}>
            <LinearGradient
                colors={['#BCC5FF', '#F9E1FF', '#FFB6D9']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}  
                style={styles.gradientSection}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.heading}>Recently Viewed</Text>
                    <TouchableOpacity activeOpacity={0.8} onPress={handlePressAll} style={styles.viewAllBtn}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                <HorizontalProductList
                    data={products}
                    itemWidth={PROMO_CARD_WIDTH}
                    gap={PROMO_CARD_GAP}
                    estimatedItemSize={PROMO_ESTIMATED_ITEM_SIZE}
                    keyExtractor={(item) => String(item.id)}
                    renderCard={renderCard}
                    contentContainerStyle={styles.listPadding}
                />
            </LinearGradient>
        </View>
    );
};

// ... prefetchRecentProductSection remains the same ...

const styles = StyleSheet.create({
    sectionWrapper: {
        backgroundColor: '#FFFFFF',
        width: '100%',
    },
    gradientSection: {
        width: '100%',
        paddingTop: 18,
        paddingBottom: 20,
        // Ensure height is not fixed so flexible cards don't get cut off
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    heading: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1A1A1A",
        letterSpacing: -0.5,
    },
    viewAllBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#5B47A3",
    },
    listPadding: {
        paddingHorizontal: 16,
    }
});

export default React.memo(RecentProduct);