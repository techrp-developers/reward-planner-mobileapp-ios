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
import CouponsSection from '../../../ecommerce/constants/coupan/CouponsSection';
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

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;
const serviceCartItemsQueryKey = SERVICE_CART_QUERY_KEY;

const SERVICE_COUPONS = [
  {
    id: 1,
    code: 'SERV20',
    title: 'Save 20% on your service order',
    subtitle: 'Valid on all government document services',
  },
  {
    id: 2,
    code: 'FIRSTSERV',
    title: 'Extra ₹100 off on first service booking',
    subtitle: 'New users only. Limited time offer.',
  },
  {
    id: 3,
    code: 'BUNDLE50',
    title: 'Save ₹50 when bundling 2+ services',
    subtitle: 'Add more services to unlock this discount',
  },
];

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
  documents: string[];
  isBundle?: boolean;
  bundle_id?: number;
  bundle_items?: any[];

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

      price: Number(bundle.bundle_total || 0),
      mrp: Number(bundle.bundle_total || 0),

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
      documents: (item.documents || []).map((d: any) => d.document_name),

      isBundle: false,
    });
  });

  return normalized;
};

function CartScreen() {
  const navigation = useNavigation<NavProps>();
  // MainLayout already reserves space for the services-module bottom bar via
  // paddingBottom on the content wrapper, so the CTA must not also offset by
  // the tab bar height itself (tabBarAware:false) — otherwise it floats above
  // the bottom bar with a visible gap instead of sitting right on top of it.
  const stickyCTA = useStickyBottomCTA({ tabBarAware: false });
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const pulse = useRef(new Animated.Value(0)).current;
  const [items, setItems] = useState<ServiceCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | number | null>(null);
  const [buyNowLoadingId, setBuyNowLoadingId] = useState<string | number | null>(null); const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [error, setError] = useState('');

  const { data: addressData, isFetching: isAddressFetching } = useQuery({
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
        setLoading(true);
      }

      const response = await getServiceCartItems();
      const normalized = normalizeCartItems(response);

      setItems(normalized);
      queryClient.setQueryData(serviceCartItemsQueryKey, response);
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch cart items.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [queryClient]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
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

        const selected_items = item.bundle_items.map((i: any) => Number(i.bundle_item_id));

        console.log("📦 Bundle Buy Now:", {
          bundle_id: item.bundle_id,
          selected_items,
        });

        const previewData = await getBuyNowBundlePreview({
          bundle_id: item.bundle_id,
          selected_items,
        });

        navigation.navigate('ServiceCheckoutScreen', {
          mode: 'buy_now', // ✅ SAME MODE
          previewData,     // ✅ IMPORTANT
          bundle_id: item.bundle_id,
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

    } catch (error) {
      console.error("❌ Buy Now Error:", error);

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

    return {
      subtotal,
      discount,
      grandTotal: subtotal,
    };
  }, [items]);

  const onProceedToCheckout = useCallback(() => {
    navigation.navigate('ServiceCheckoutScreen', {
      mode: 'cart',
      // Don't pass previewData - let checkout fetch fresh data from backend
    });
  }, [navigation]);

  const showInitialSkeleton =
    loading ||
    (isAuthenticated && items.length === 0 && !error && isAddressFetching && !addressData);

  const renderItem = useCallback(({ item }: { item: ServiceCartItem }) => (
    <CartCard
      id={item.id}
      serviceName={item.service_name}
      variantName={item.variant_name}
      description={item.description}
      price={item.price}
      mrp={item.mrp}
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
      />
      <View style={styles.listBottomSpace} />
    </>
  ), [totals]);

  if (!loading && !error && !refreshing && items.length === 0) {
    return (
      <View style={styles.container}>
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
      <View style={styles.container}>
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
      <View style={styles.container}>
        <ScreenHeader title="Cart" onBackPress={() => navigation.goBack()} />
        <View style={styles.centeredWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadCart()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
