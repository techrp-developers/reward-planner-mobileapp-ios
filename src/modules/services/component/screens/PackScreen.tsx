import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Text, Image, ActivityIndicator, Alert } from 'react-native';

import ScreenHeader from '../constant/navbar/ScreenHeaderColor';
import Banner from '../constant/Banner';
import PriceTypeToggle from '../pack/home_pack/PriceTypeToggle';
import PackFooterCTA from '../pack/home_pack/PackFooterCTA';
import PackItemCard from '../pack/home_pack/PackItemCard';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';
import { getServiceByCategory } from '../../api/ServiceAPI';
import { addBundleToCart, getBundleDetail, getBuyNowBundlePreview, type BundleEnquiryField } from '../../api/BundleAPI';
import { useQueryClient } from '@tanstack/react-query';
import { SERVICE_CART_QUERY_KEY, SERVICE_CHECKOUT_QUERY_KEY } from '../../constant/queryKeys';
import PackBanner from '../../assete/service/PackBanner.png';
type NavProp = NativeStackNavigationProp<HomeStackParamList>;
type PackRouteProp = RouteProp<HomeStackParamList, 'PackScreen'>;





const footerStats = [
  { value: '20+', label: 'Trusted Insurance Partners' },
  { value: '15000+', label: 'Insurance Sold' },
  { value: '5+ Years', label: 'of Service Expertise' },
];

type DisplayPackItem = {
  id: string;
  serviceId?: number;
  variantId?: number;
  bundleItemId?: number;
  service_id?: number;
  variant_id?: number;
  item_id?: number;
  title: string;
  desc: string;
  oldPrice: number;
  price: number;
  bundlePrice: number;
  individualPrice: number;
  image: any;
};

type StatItem = {
  value: string;
  label: string;
};

type NormalizedSelectionItem = {
  id: string;
  serviceId: number;
  variantId: number;
  itemId: number;
};

const parsePrice = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toPositiveNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeSelectionItem = (item: DisplayPackItem): NormalizedSelectionItem => {
  const serviceId = toPositiveNumber(item.serviceId || item.service_id || 0);
  const variantId = toPositiveNumber(item.variantId || item.variant_id || 0);
  const itemId = toPositiveNumber(item.bundleItemId || item.item_id || item.id || 0);

  return {
    id: item.id,
    serviceId,
    variantId,
    itemId,
  };
};

const parseTrustStat = (raw: string): StatItem => {
  const parts = String(raw || '').trim().split(/\s+/);
  if (parts.length <= 1) {
    return { value: raw || '-', label: '' };
  }

  return {
    value: parts[0],
    label: parts.slice(1).join(' '),
  };
};




function PackScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<PackRouteProp>();
  const queryClient = useQueryClient();
  const [priceType, setPriceType] =
    useState<'bundle' | 'individual'>('bundle');
  const [dynamicItems, setDynamicItems] = useState<DisplayPackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicTitle, setDynamicTitle] = useState('New Home Set Up Pack');
  const [dynamicBannerUrl, setDynamicBannerUrl] = useState<string | null>(null);
  const [dynamicStats, setDynamicStats] = useState<StatItem[]>(footerStats);
  const [bundleEnquiryFields, setBundleEnquiryFields] = useState<BundleEnquiryField[]>([]);
  const [safetyInfo, setSafetyInfo] = useState({
    title: '100% Data Safety',
    text: 'Your personal info is protected and used only for your service request.',
  });
  const [bundleTotals, setBundleTotals] = useState({
    bundlePrice: 0,
    originalPrice: 0,
    individualPrice: 0,
    savings: 0,
  });
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const categoryId = Number(route?.params?.categoryId || 0);
  const routeBundleId = Number(route?.params?.bundleId || 0);
  const packType = route?.params?.packType;
  const packTypeToBundleId: Record<'home' | 'married' | 'job', number> = {
    home: 1,
    married: 2,
    job: 3,
  };
  const resolvedBundleId =
    routeBundleId > 0
      ? routeBundleId
      : packType
        ? packTypeToBundleId[packType]
        : 0;

  useEffect(() => {
    let isMounted = true;

    const fetchBundleDetailData = async () => {
      if (!resolvedBundleId) {
        return false;
      }

      try {
        const response = await getBundleDetail(resolvedBundleId);
        if (!response?.bundle) {
          return false;
        }

        const itemsFromApi = Array.isArray(response.items) ? response.items : [];
        const mappedItems: DisplayPackItem[] = itemsFromApi.map((item, index) => {
          const bundlePrice = parsePrice(item.bundle_price ?? item.price);
          const individualPrice = parsePrice(item.individual_price ?? item.price);
          return {
            id: String(item.id || index + 1),
            serviceId: Number(item.service_id || 0),
            variantId: Number(item.variant_id || 0),
            bundleItemId: Number(item.id || 0),
            title: item.title || item.service_name || 'Service',
            desc: item.variant_name || item.service_name || 'Service details',
            oldPrice: individualPrice,
            price: bundlePrice,
            bundlePrice,
            individualPrice,
            image: item.image_url ? { uri: item.image_url } : PackBanner,
          };
        });

        const trustStats = Array.isArray(response.sections?.trust_stats)
          ? response.sections.trust_stats.map((raw: string) => parseTrustStat(raw))
          : footerStats;
        const enquiryFields = Array.isArray(response.enquiry_fields) ? response.enquiry_fields : [];
        const firstParagraph = Array.isArray(response.sections?.paragraphs)
          ? response.sections.paragraphs[0]
          : undefined;
        const safetyTitle = String(firstParagraph?.title || '').trim() || '100% Data Safety';
        const safetyText = Array.isArray(firstParagraph?.content)
          ? String(firstParagraph?.content?.[0] || '').trim()
          : '';

        const bundlePrice = parsePrice(response.bundle.bundle_price);
        const originalPrice = parsePrice(response.bundle.original_price);
        const individualPrice = parsePrice(response.pricing?.total_price);
        const savings = parsePrice(response.pricing?.savings);

        if (isMounted) {
          setDynamicTitle(response.bundle.name || 'Bundle Services');
          setDynamicBannerUrl(response.bundle.banner_image || null);
          setDynamicItems(mappedItems);
          setSelectedItemIds(
            mappedItems
              .map(normalizeSelectionItem)
              .filter((entry) => entry.serviceId > 0 && entry.variantId > 0)
              .map((entry) => entry.id)
          );
          setDynamicStats(trustStats.length ? trustStats : footerStats);
          setBundleEnquiryFields(enquiryFields);
          setSafetyInfo({
            title: safetyTitle,
            text: safetyText || 'Your personal info is protected and used only for your service request.',
          });
          setBundleTotals({
            bundlePrice,
            originalPrice: originalPrice || bundlePrice,
            individualPrice: individualPrice || bundlePrice,
            savings,
          });
        }

        return true;
      } catch (error) {
        console.error('Failed to fetch bundle details', error);
        return false;
      }
    };

    const fetchDirectService = async () => {
      if (!Number.isFinite(categoryId) || categoryId <= 0) {
        if (isMounted) setDynamicItems([]);
        return;
      }

      try {
        const response = await getServiceByCategory(categoryId);
        const variants = Array.isArray(response?.variants) ? response.variants : [];
        const serviceImage = response?.service?.service_image || response?.category?.icon || '';

        const items: DisplayPackItem[] = variants.map((variant: any, index: number) => ({
          id: String(variant?.id || index + 1),
          serviceId: Number(response?.service?.id || 0),
          variantId: Number(variant?.id || 0),
          service_id: Number(response?.service?.id || 0),
          variant_id: Number(variant?.id || 0),
          item_id: Number(variant?.id || 0),
          title: variant?.title || variant?.variant_name || response?.service?.name || 'Service',
          desc: variant?.short_description || response?.service?.description || '',
          oldPrice: Number(variant?.mrp || variant?.price || 0),
          price: Number(variant?.price || 0),
          bundlePrice: Number(variant?.price || 0),
          individualPrice: Number(variant?.mrp || variant?.price || 0),
          image: serviceImage ? { uri: serviceImage } : PackBanner,
        }));

        if (isMounted) {
          const original = items.reduce((s, i) => s + i.oldPrice, 0);
          const discounted = items.reduce((s, i) => s + i.price, 0);

          setDynamicTitle(route?.params?.title || response?.service?.name || 'Bundle Services');
          setDynamicBannerUrl(serviceImage || null);
          setDynamicItems(items);
          setSelectedItemIds(
            items
              .map(normalizeSelectionItem)
              .filter((entry) => entry.serviceId > 0 && entry.variantId > 0)
              .map((entry) => entry.id)
          );
          setDynamicStats(footerStats);
          setBundleTotals({
            bundlePrice: discounted,
            originalPrice: original,
            individualPrice: discounted,
            savings: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch direct category details', error);
        if (isMounted) setDynamicItems([]);
      }
    };

    const loadData = async () => {
      setIsLoading(true);

      const loadedBundle = await fetchBundleDetailData();
      if (!loadedBundle) {
        await fetchDirectService();
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [categoryId, resolvedBundleId, route?.params?.title]);

  const items = dynamicItems;
  useEffect(() => {
    if (priceType === 'bundle') {
      setSelectedItemIds(items.map(item => item.id));
    }
  }, [priceType, items]);
  const totals = useMemo(() => {
    const selectedSet = new Set(selectedItemIds);

    if (priceType === 'bundle') {
      return {
        original: bundleTotals.originalPrice,
        discounted: bundleTotals.bundlePrice,
        savings: bundleTotals.savings,
      };
    }

    // ✅ Individual mode
    const selectedItems = items.filter(item => selectedSet.has(item.id));

    const original = selectedItems.reduce((s, i) => s + i.individualPrice, 0);
    const discounted = selectedItems.reduce((s, i) => s + i.price, 0);

    return {
      original,
      discounted,
      savings: 0,
    };
  }, [items, selectedItemIds, priceType, bundleTotals]);

  const screenTitle = route?.params?.title || dynamicTitle;

  const addBundlePayload = useMemo(() => {
    if (priceType === 'bundle') {
      return {
        selected_items: items
          .map(item => Number(item.bundleItemId ?? (item as any).item_id ?? 0))
          .filter(id => id > 0),
      };
    }

    const selectedSet = new Set(selectedItemIds);

    return {
      selected_items: items
        .filter(item => selectedSet.has(item.id))
        .map(item => Number(item.bundleItemId ?? (item as any).item_id ?? 0))
        .filter(id => id > 0),
    };
  }, [items, selectedItemIds, priceType]);

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };
  const handleBuyNowBundle = async () => {
    try {
      const finalBundleId = Number(resolvedBundleId);

      if (!finalBundleId) {
        Alert.alert('Error', 'Bundle ID missing');
        return;
      }

      if (addBundlePayload.selected_items.length === 0) {
        Alert.alert('Select items', 'Please select at least one service');
        return;
      }

      const selected_items = addBundlePayload.selected_items.map(Number);

      console.log("🚀 FINAL PAYLOAD:", {
        bundle_id: finalBundleId,
        selected_items,
      });

      const preview = await getBuyNowBundlePreview({
        bundle_id: finalBundleId,
        selected_items,
      });

      console.log("📦 PREVIEW RESPONSE:", preview);

      navigation.navigate("ServiceCheckoutScreen", {
        mode: "buy_now", // ✅ IMPORTANT
        previewData: preview,
        bundle_id: finalBundleId,
      });

    } catch (error: any) {
      console.error("❌ Buy Now Bundle Error:", error);
      Alert.alert("Error", error?.message || "Failed to proceed");
    }
  };

  const handleAddBundleToCart = async () => {
    if (isAddingToCart) return;

    if (!resolvedBundleId || resolvedBundleId <= 0) {
      Alert.alert('Unable to add bundle', 'Bundle ID is missing for this package.');
      return;
    }

    if (addBundlePayload.selected_items.length === 0) {
      Alert.alert('Selection required', 'Please select at least one service.');
      return;
    }

    setIsAddingToCart(true);
    try {
      console.log('[PackScreen] Selected item IDs:', selectedItemIds);
      console.log('🧾 FINAL PAYLOAD:', addBundlePayload);

      const response = await addBundleToCart(resolvedBundleId, addBundlePayload);

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to add bundle to cart');
      }



      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SERVICE_CART_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: SERVICE_CHECKOUT_QUERY_KEY }),
      ]);

      navigation.navigate('CartScreen');

    } catch (error: any) {
      const message = String(
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        'Could not add bundle to cart.'
      );
      Alert.alert('Add To Cart Failed', message);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ScreenHeader
          title={screenTitle}
          onBackPress={() => navigation.goBack()}
        />
        <ActivityIndicator size="large" color="#8665FF" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <ScreenHeader
        title={screenTitle}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* BANNER */}
        <Banner />

        {/* PRICE TOGGLE */}
        <PriceTypeToggle
          value={priceType}
          onChange={setPriceType}
        />

        <Image
          source={dynamicBannerUrl ? { uri: dynamicBannerUrl } : PackBanner}
          style={styles.packBannerImage}
          resizeMode="contain"
        />

        {/* SELECTED COUNT */}
        <Text style={styles.selectedText}>
          Selected {selectedItemIds.length} items
        </Text>

        {/* PACK ITEMS */}
        {items.map(item => (
          <PackItemCard
            key={item.id}
            selected={selectedItemIds.includes(item.id)}
            onToggleSelect={() => toggleItemSelection(item.id)}
            title={item.title}
            desc={item.desc}
            oldPrice={priceType === 'bundle' ? item.individualPrice : 0}
            price={priceType === 'bundle' ? item.bundlePrice : item.individualPrice}
            showOldPrice={priceType === 'bundle' && item.individualPrice > item.bundlePrice}
            saveText={
              priceType === 'bundle' && item.individualPrice > item.bundlePrice
                ? `Save ${Math.round(((item.individualPrice - item.bundlePrice) / item.individualPrice) * 100)}%`
                : undefined
            }
            disableSelection={priceType === 'bundle'} // ✅ IMPORTANT
            image={item.image}
          />
        ))}

        {priceType === 'bundle' && totals.savings > 0 && (
          <Text style={styles.savingsText}>You save ₹{totals.savings}</Text>
        )}

        <PackFooterCTA
          totalPrice={totals.discounted}
          originalPrice={totals.original}
          stats={dynamicStats}
          onPrimaryPress={handleBuyNowBundle}
          onEnquirePress={() =>
            navigation.navigate('PackEnquiryForm', {
              bundleId: resolvedBundleId || 0,
              title: screenTitle,
              enquiryFields: bundleEnquiryFields,
              safetyTitle: safetyInfo.title,
              safetyText: safetyInfo.text,
            })
          }
          showBottomBar
          onAddToCart={handleAddBundleToCart}
          isAddingToCart={isAddingToCart}
        />



      </ScrollView>
    </View>
  );
}

export default PackScreen;
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loader: {
    marginTop: 48,
  },
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    paddingBottom: 24,
  },

  packBannerImage: {
    width: '98%',
    // height: 100,
    alignSelf: 'center',
    marginVertical: 12,
  },

  selectedText: {
    marginHorizontal: 16,
    marginTop: 14,
    fontSize: 12,
    color: '#6B7280',
  },

  savingsText: {
    marginTop: 10,
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
});
