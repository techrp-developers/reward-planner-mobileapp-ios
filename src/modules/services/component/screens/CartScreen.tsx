import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ScreenHeader from '../constant/navbar/ScreenHeaderColor';
import { getServiceCartItems, removeServiceCartItem, getBuyNowPreview } from '../../api/CartAPI';
import BillDetailsCard from '../../../ecommerce/constants/itemcart/BillDetailsCard';
import CheckoutSummary from '../../../ecommerce/components/ItemCardAddress/CheckoutSummary';
import { fetchAllAddress } from '../../../ecommerce/api/AddressApi';
import { useAuth } from '../../../common/auth/context/AuthContext';
import { addressesQueryKey } from '../../../ecommerce/navigation/navigationPerformance';
import { HomeStackParamList } from '../../navigation/type';
import { SERVICE_CART_QUERY_KEY } from '../../constant/queryKeys';
import CartCard from '../cart/CartCard';
import EmptyCart from '../../../ecommerce/components/cart/EmptyCart';
import SkeletonBox from '../constant/SkeletonBox';
import { getBuyNowBundlePreview } from '../../api/BundleAPI';
import { useStickyBottomCTA } from '../../../../bottombar/hooks/useStickyBottomCTA';
import { useServicesTheme } from '../../utils/useServicesTheme';

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const serviceCartItemsQueryKey = SERVICE_CART_QUERY_KEY;

type NavProps = NativeStackNavigationProp<HomeStackParamList>;

type ServiceCartItem = {
  id: number | string;
  service_id: number | null;
  variant_id: number | null;
  service_name: string;
  variant_name: string;
  description: string;
  price: number;
  mrp: number;
  imageUrl?: string;
  documents: string[];
  isBundle?: boolean;
  bundle_id?: number;
  bundle_items?: any[];

};

const parseMoney = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const sumBundleItemPrices = (items: any[], fields: string[]): number => {
  return items.reduce((total, item) => {
    const field = fields.find((key) => item?.[key] !== undefined && item?.[key] !== null);
    return total + parseMoney(field ? item?.[field] : 0);
  }, 0);
};

// const parsePositiveId = (value: unknown): number | null => {
//   const parsed = Number(value);
//   return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
// };

const normalizeCartItems = (response: any): ServiceCartItem[] => {
  // getServiceCartItems() returns a flat { bundles, individual_items } shape;
  // getCheckoutPreview() nests the same shape under .data. Handle both.
  const data = response?.data ?? response ?? {};
  const bundles = data?.bundles || [];
  const individualItems = data?.individual_items || [];

  const normalized: ServiceCartItem[] = [];

  // ✅ Handle Bundles as SINGLE ITEM
  bundles.forEach((bundle: any) => {
    const bundleItems = bundle.items || [];
    const selectedItemsTotal = sumBundleItemPrices(bundleItems, ['price']);
    const selectedItemsMrp = sumBundleItemPrices(bundleItems, [
      'individual_price',
      'mrp',
      'original_price',
      'price',
    ]);
    const displayPrice = selectedItemsTotal || parseMoney(bundle.bundle_total);
    const displayMrp = selectedItemsMrp || displayPrice;

    // ✅ Collect all documents

    const allDocs = bundleItems.flatMap((i: any) =>
      (i.documents || []).map((d: any) => d.document_name)
    );

    // ✅ FORCE TYPE HERE
    const uniqueDocs = Array.from(
      new Set<string>(
        allDocs.filter((doc): doc is string => typeof doc === 'string')
      )
    );


    normalized.push({
      id: `bundle-${bundle.bundle_id}`,
      service_id: null,
      variant_id: null,

      // ✅ Real bundle name from backend, falling back to a generic label
      service_name: bundle.bundle_name || `Bundle (${bundleItems.length} Services)`,

      variant_name: "Bundle Pack",

      // ✅ Real bundle description, falling back to item count
      description: bundle.bundle_description || `${bundleItems.length} services included`,

      price: displayPrice,
      mrp: Math.max(displayMrp, displayPrice),
      imageUrl: bundle.bundle_image ? String(bundle.bundle_image) : undefined,

      // 🔥 FIXED (no duplicate docs)
      documents: uniqueDocs,

      isBundle: true,
      bundle_id: bundle.bundle_id,
      bundle_items: bundleItems,
    });
  });

  // ✅ Handle Individual Items normally
  individualItems.forEach((item: any) => {
    normalized.push({
      id: Number(item.id),
      service_id: Number(item.service_id),
      variant_id: Number(item.variant_id),
      service_name: item.service_name,
      variant_name: item.variant_name,
      description: item.title,
      price: Number(item.price),
      mrp: Number(item.price),
      imageUrl: item.image_url || item.variant_image
        ? String(item.image_url || item.variant_image)
        : undefined,
      documents: (item.documents || []).map((d: any) => d.document_name),

      isBundle: false,
    });
  });

  return normalized;
};

const normalizeCartRewards = (response: any) => {
  const rewards = (response?.data ?? response ?? {})?.rewards ?? {};
  return {
    earnCoins: parseMoney(rewards.earn_coins),
    maxRedeemCoins: parseMoney(rewards.max_redeem_coins),
  };
};

function CartScreen() {
  const navigation = useNavigation<NavProps>();
  const servicesTheme = useServicesTheme();
  // MainLayout already reserves space for the services-module bottom bar via
  // paddingBottom on the content wrapper, so the CTA must not also offset by
  // the tab bar height itself (tabBarAware:false) — otherwise it floats above
  // the bottom bar with a visible gap instead of sitting right on top of it.
  const stickyCTA = useStickyBottomCTA({ tabBarAware: false });
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const pulse = useRef(new Animated.Value(0)).current;
  const cachedCartItems = useMemo(() => {
    const cached = queryClient.getQueryData(serviceCartItemsQueryKey);
    return cached ? normalizeCartItems(cached) : [];
  }, [queryClient]);
  const [items, setItems] = useState<ServiceCartItem[]>(cachedCartItems);
  const [cartRewards, setCartRewards] = useState(() => {
    const cached = queryClient.getQueryData(serviceCartItemsQueryKey);
    return normalizeCartRewards(cached);
  });
  const [useRewardCoins, setUseRewardCoins] = useState(false);
  const [loading, setLoading] = useState(cachedCartItems.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | number | null>(null);
  const [buyNowLoadingId, setBuyNowLoadingId] = useState<string | number | null>(null);
  const [error, setError] = useState('');

  const { data: addressData } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

  const address = useMemo(() => {
    const list = Array.isArray(addressData?.data) ? addressData.data : [];
    return list.find((a: any) => Number(a?.is_default) === 1) || list[0] || null;
  }, [addressData?.data]);

  // const syncCartInBackground = useCallback(() => {
  //   queryClient
  //     .prefetchQuery({
  //       queryKey: serviceCartItemsQueryKey,
  //       queryFn: getServiceCartItems,
  //       staleTime: TEN_MINUTES,
  //     })
  //     .catch(() => {
  //       // Ignore prefetch failures and keep the visible cart flow responsive.
  //     });
  // }, [queryClient]);

  const loadCart = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(items.length === 0);
      }

      const response = await getServiceCartItems();
      const normalized = normalizeCartItems(response);

      setItems(normalized);
      setCartRewards(normalizeCartRewards(response));
      queryClient.setQueryData(serviceCartItemsQueryKey, response);
      // Prefix-invalidate so the count subkey ([...key, 'count']) used by
      // useServiceCartCount also refetches — setQueryData only updates the
      // exact key and does not propagate to sub-keys on its own.
      queryClient.invalidateQueries({ queryKey: serviceCartItemsQueryKey });
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch cart items.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [items.length, queryClient]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (cartRewards.maxRedeemCoins <= 0 && useRewardCoins) {
      setUseRewardCoins(false);
    }
  }, [cartRewards.maxRedeemCoins, useRewardCoins]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

 const onBuyNow = useCallback(async (item: ServiceCartItem) => {
  try {
    setBuyNowLoadingId(item.id);

    // =========================
    // ✅ BUNDLE FLOW
    // =========================
    if (item.isBundle) {
      if (!item.bundle_id || !item.bundle_items) {
        Alert.alert('Error', 'Bundle data missing');
        return;
      }

      const selected_items = item.bundle_items
        .map((i: any) => Number(i.bundle_item_id ?? i.item_id ?? i.id))
        .filter((id: number) => Number.isFinite(id) && id > 0);

      const previewData = await getBuyNowBundlePreview({
        bundle_id: item.bundle_id,
        selected_items,
      });

      navigation.navigate('ServiceCheckoutScreen', {
        mode: 'buy_now', // ✅ SAME MODE
        previewData,     // ✅ IMPORTANT
        bundle_id: item.bundle_id,
        selected_items,
      });

      return;
    }

    // =========================
    // ✅ SINGLE SERVICE FLOW
    // =========================
    if (!item.service_id || !item.variant_id) {
      Alert.alert('Unable to continue', 'Service information is incomplete.');
      return;
    }

    const previewData = await getBuyNowPreview({
      service_id: item.service_id,
      variant_id: item.variant_id,
    });

    navigation.navigate('ServiceCheckoutScreen', {
      mode: 'buy_now',
      service_id: item.service_id,
      variant_id: item.variant_id,
      previewData,
    });

  } catch (buyNowError) {
    console.error("❌ Buy Now Error:", buyNowError);

    // fallback navigation
    navigation.navigate('ServiceCheckoutScreen', {
      mode: 'buy_now',
    });

  } finally {
    setBuyNowLoadingId(null);
  }
}, [navigation]);

  const onRemove = useCallback(async (item: ServiceCartItem) => {
    try {
      setBusyItemId(item.id as any);

      if (item.isBundle && item.bundle_items && item.bundle_items.length > 0) {
        // Removing any one bundle item deletes the whole bundle server-side
        // (see serviceCartModel.removeItem) — calling this per item in
        // parallel just races duplicate deletes against an already-removed
        // row, producing spurious 404s. One call is enough.
        await removeServiceCartItem(item.bundle_items[0].id);
      } else {
        await removeServiceCartItem(item.id as number);
      }

      await loadCart();
    } catch {
      await loadCart();
    } finally {
      setBusyItemId(null);
    }
  }, [loadCart]);




  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.price, 0);
    const mrpTotal = items.reduce((acc, item) => acc + (item.mrp > 0 ? item.mrp : item.price), 0);
    const discount = Math.max(mrpTotal - subtotal, 0);

    const redeemCoins = useRewardCoins
      ? Math.min(cartRewards.maxRedeemCoins, subtotal)
      : 0;

    return {
      subtotal,
      discount,
      redeemCoins,
      grandTotal: Math.max(0, subtotal - redeemCoins),
    };
  }, [cartRewards.maxRedeemCoins, items, useRewardCoins]);

  const onProceedToCheckout = useCallback(() => {
    navigation.navigate('ServiceCheckoutScreen', {
      mode: 'cart',
      redeem_coins: totals.redeemCoins,
      // Don't pass previewData - let checkout fetch fresh data from backend
    });
  }, [navigation, totals.redeemCoins]);

  // Address loading must not block the service cart. Users can proceed to
  // checkout without one and select an address before placing the order.
  const showInitialSkeleton = loading;

  const renderItem = useCallback(({ item }: { item: ServiceCartItem }) => (
    <CartCard
      id={item.id}
      serviceName={item.service_name}
      variantName={item.variant_name}
      description={item.description}
      price={item.price}
      mrp={item.mrp}
      imageUrl={item.imageUrl}
      documents={item.documents}
      isBundle={item.isBundle} // ✅ ADD THIS

      removing={busyItemId === item.id}
      buyingNow={buyNowLoadingId === item.id}
      onRemove={() => onRemove(item)}
      onBuyNow={() => onBuyNow(item)} />
  ), [busyItemId, buyNowLoadingId, onRemove, onBuyNow]);

  const keyExtractor = useCallback((item: ServiceCartItem, index: number) =>
    String(item.id ?? index), []);

  const footer = useMemo(() => (
    <>
      {/* ── Coupons & Offers (temporarily disabled) ──────────────────────
      <View style={styles.wrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Coupons and Offers</Text>
          <TouchableOpacity onPress={() => setShowAllCoupons(p => !p)}>
            <Text style={styles.viewAllText}>{showAllCoupons ? 'Hide' : 'View All'}</Text>
          </TouchableOpacity>
        </View>
        <CouponsSection coupons={showAllCoupons ? SERVICE_COUPONS : SERVICE_COUPONS.slice(0, 1)} />
      </View>
      ── end Coupons & Offers ───────────────────────────────────────── */}
      <BillDetailsCard
        subtotal={totals.subtotal}
        totalDiscount={totals.discount}
        finalTotal={totals.grandTotal}
        totalRewardEarn={cartRewards.earnCoins}
        totalRedeemed={totals.redeemCoins}
        rewardCoinsAvailable={cartRewards.maxRedeemCoins}
        useRewards={useRewardCoins}
        onUseRewardsChange={(enabled) => {
          setUseRewardCoins(enabled && cartRewards.maxRedeemCoins > 0);
        }}
        showRedeemableCoins
      />
      <View style={styles.listBottomSpace} />
    </>
  ), [cartRewards, totals, useRewardCoins]);

  if (!loading && !error && !refreshing && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
        <ScreenHeader title="Cart" onBackPress={() => navigation.goBack()} />
        <EmptyCart
          onBrowse={() => navigation.goBack()}
          message="Your service cart is empty. Browse services to get started."
        />
      </View>
    );
  }

  if (showInitialSkeleton) {
    return (
      <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
        <ScreenHeader title="Cart" onBackPress={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={[styles.skeletonScrollContent, { paddingBottom: stickyCTA.scrollContentPaddingBottom }]}>
          <SkeletonBox pulse={pulse} width="100%" height={98} borderRadius={14} />
          <SkeletonBox pulse={pulse} width="100%" height={118} borderRadius={14} style={styles.skeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={118} borderRadius={14} style={styles.skeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={132} borderRadius={14} style={styles.skeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={56} borderRadius={14} style={styles.skeletonGapLg} />
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
        <ScreenHeader title="Cart" onBackPress={() => navigation.goBack()} />
        <View style={styles.centeredWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: servicesTheme.colors.textStrong }]} onPress={() => loadCart()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
      <ScreenHeader title="Cart" onBackPress={() => navigation.goBack()} />

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListFooterComponent={footer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: stickyCTA.scrollContentPaddingBottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadCart(true)} />
        }
        removeClippedSubviews
        windowSize={7}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        showsVerticalScrollIndicator={false}
      />

      <CheckoutSummary
        address={address}
        total={totals.grandTotal}
        count={items.length}
        onProceedToBuy={onProceedToCheckout}
        wrapperPaddingBottom={16}
        // Rest flush against the bottom bar; still rise above the keyboard when it's open.
        bottomOffset={stickyCTA.keyboardHeight > 0 ? stickyCTA.bottomOffset : 0}
        onLayout={stickyCTA.onCtaLayout}
      />
    </View>
  );
}

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 24 },
  skeletonScrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24 },
  skeletonGap: { marginTop: 14 },
  skeletonGapLg: { marginTop: 20 },
  wrapper: { paddingHorizontal: 14, marginTop: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  headerText: { fontSize: 15, fontWeight: '600', color: '#111' },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  listBottomSpace: { height: 12 },
  centeredWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: '#B91C1C', textAlign: 'center', marginBottom: 14 },
  retryButton: { backgroundColor: '#111827', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#FFF', fontWeight: '700' },
});
