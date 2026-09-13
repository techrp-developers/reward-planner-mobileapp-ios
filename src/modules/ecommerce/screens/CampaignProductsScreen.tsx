import React, { useMemo, useRef } from 'react';
import {
    Animated,
    FlatList,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import ProductHeadColor from '../constants/heading/Poduct_Head_Color';
import ProductCard from '../constants/product_cart/ProductCard';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { getCampaignProducts } from '../api/CampaignAPI';
import { cmsApi } from '../../../config/cmsApiClient';
import { normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
import { normalizeProduct } from '../utils/normalizeProduct';
import type { HomeStackParamList } from '../navigation/types';
import { useAppTheme } from '../../../theme/ThemeContext';

type CampaignRoute = RouteProp<HomeStackParamList, 'CampaignProducts'>;
type Navigation = NativeStackNavigationProp<HomeStackParamList>;

const campaignProductsQueryKey = (campaignId: number | string) =>
    ['ecommerce', 'campaign-products', String(campaignId)] as const;

const cmsContentProductsQueryKey = (contentId: number) =>
    ['cms', 'content', String(contentId), 'product-list'] as const;

const getCmsContentProducts = async (contentId: number) => {
    const { data } = await cmsApi.get(`/v1/cms/content/${contentId}/products`);
    const products = data?.data?.products;
    if (!Array.isArray(products)) return [];
    return products.map((product: any) => normalizeProduct({
        ...product,
        id: product.product_id ?? product.id,
        product_name: product.product_name ?? product.title,
        image: normalizeLocalCmsImageUrl(product.image),
        images: product.image ? [normalizeLocalCmsImageUrl(product.image)] : [],
        rp_price: String(product.rp_price ?? '').replace(/[^0-9.]/g, ''),
    }));
};

const normalizeCampaignProducts = (response: any) => {
    const products = Array.isArray(response?.data) ? response.data : [];

    return products.map((product: any) => normalizeProduct({
        ...product,
        id: product.product_id ?? product.id,
        campaign_item_id: product.id,
        title: product.product_name,
        brand: product.brand_name,
        price: product.price ?? product.final_price,
        originalPrice: product.original_price ?? product.mrp,
        image: product.image,
    }));
};

export default function CampaignProductsScreen() {
    const navigation = useNavigation<Navigation>();
    const route = useRoute<CampaignRoute>();
    const { theme } = useAppTheme();
    const { width } = useWindowDimensions();
    const pulse = useRef(new Animated.Value(0)).current;
    const cardWidth = (width - 44) / 2;
    const campaignId = route.params.campaignId;
    const contentId = route.params.contentId;
    const title = route.params.title || 'Campaign Products';

    const { data: products = [], isLoading, error } = useQuery({
        queryKey: contentId
            ? cmsContentProductsQueryKey(contentId)
            : campaignProductsQueryKey(campaignId ?? ''),
        queryFn: async () => contentId
            ? getCmsContentProducts(contentId)
            : normalizeCampaignProducts(await getCampaignProducts(Number(campaignId))),
        enabled: contentId
            ? Number.isFinite(contentId) && contentId > 0
            : Number.isFinite(Number(campaignId)) && Number(campaignId) > 0,
        staleTime: 5 * 60 * 1000,
    });

    const skeletonItems = useMemo(() => Array.from({ length: 6 }), []);

    return (
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
            <ProductHeadColor title={title} onBackPress={() => navigation.goBack()} />

            {isLoading ? (
                <View style={styles.skeletonGrid}>
                    {skeletonItems.map((_, index) => (
                        <View key={index} style={[styles.skeletonCard, { width: cardWidth, backgroundColor: theme.card }]}>
                            <SkeletonBox pulse={pulse} width="100%" height={cardWidth} borderRadius={14} />
                            <SkeletonBox pulse={pulse} width="86%" height={12} borderRadius={999} style={styles.skeletonText} />
                            <SkeletonBox pulse={pulse} width="58%" height={10} borderRadius={999} style={styles.skeletonTextSmall} />
                        </View>
                    ))}
                </View>
            ) : error ? (
                <View style={styles.emptyWrap}>
                    <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Unable to load this campaign.</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    numColumns={2}
                    keyExtractor={(item: any, index) => String(item?.id ?? item?.product_id ?? index)}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <ProductCard
                            item={item}
                            cardWidth={cardWidth}
                            shouldLoadImage
                            onProductPress={(productId, product) => navigation.navigate('ProductDescription', {
                                productId,
                                variantId: product.variant_id,
                                campaignId: Number(contentId ?? campaignId),
                            })}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No products found in this campaign.</Text>
                        </View>
                    }
                    ListFooterComponent={
                        products.length > 0 ? <View style={styles.footerSpace} /> : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    listContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12 },
    row: { justifyContent: 'space-between', marginBottom: 12 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 16 },
    skeletonCard: { borderRadius: 14, padding: 6, marginBottom: 12 },
    skeletonText: { marginTop: 8 },
    skeletonTextSmall: { marginTop: 6 },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { fontSize: 14, textAlign: 'center' },
    footerSpace: { height: 24 },
});
