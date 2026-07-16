import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import ScreenHeader from '../constant/navbar/ScreenHeaderColor';
import BillDetailsCard from '../../../ecommerce/constants/itemcart/BillDetailsCard';
// import CouponsSection from '../../../ecommerce/constants/coupan/CouponsSection';
import OrderProcedbutton from '../../../ecommerce/components/checkout/OrderProcedbutton';
import EmptyCart from '../../../ecommerce/components/cart/EmptyCart';
import SkeletonBox from '../constant/SkeletonBox';
import { getBuyNowPreview, getCheckoutPreview, placeBuyNowOrder, placeCartOrder, removeServiceCartItem, addServiceToCart, clearServiceCart } from '../../api/CartAPI';
import { buyNowBundle } from '../../api/BundleAPI';
import { fetchAllAddress } from '../../../ecommerce/api/AddressApi';
import { useAuth } from '../../../common/auth/context/AuthContext';
import { useAlert } from '../../../ecommerce/components/alerts/useAlert';
import { addressesQueryKey } from '../../../ecommerce/navigation/navigationPerformance';
import { HomeStackParamList } from '../../navigation/type';
import { createServicePaymentOrder, verifyServicePayment, checkServicePaymentStatus } from '../../api/ServicepaymentAPI';
import { SERVICE_CART_QUERY_KEY, SERVICE_CHECKOUT_QUERY_KEY } from '../../constant/queryKeys';
import RazorpayCheckout from "react-native-razorpay";
import { useStickyBottomCTA } from '../../../../bottombar/hooks/useStickyBottomCTA';

type RouteT = RouteProp<HomeStackParamList, 'ServiceCheckoutScreen'>;
type NavProps = NativeStackNavigationProp<HomeStackParamList>;

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

// const COUPONS = [
//   {
//     id: 1,
//     code: 'RPSLAY200',
//     title: 'Add ₹248 more to avail this offer',
//     subtitle: 'Get Flat ₹200 off',
//   },
//   {
//     id: 2,
//     code: 'RPCC200',
//     title: 'Buy for ₹7777 to avail',
//     subtitle: 'BOB Credit Card Offer',
//   },
// ];

type ServicePreviewItem = {
  id: number | string;
  service_id: number | null;
  variant_id: number | null;

  service_name: string;
  variant_name: string;
  description: string;

  price: number;
  mrp: number;

  documents: string[];

  // ✅ ADD THESE
  isBundle?: boolean;
  bundle_items?: any[];
};

type PreviewSummary = {
  subtotal: number;
  discount: number;
  grandTotal: number;
};

function normalizePreview(
  data: any,
  mode: 'buy_now' | 'cart',
  service_id?: number,
  variant_id?: number,
): { items: ServicePreviewItem[]; summary: PreviewSummary } {
  const raw = data?.data ?? data ?? {};
  let sourceItems: any[] = [];

  if (mode === 'cart') {
    const bundles = raw?.bundles || [];
    const individualItems = raw?.individual_items || [];

    // ✅ Convert bundle → SINGLE ITEM
    const bundleCards = bundles.map((bundle: any) => {
      const bundleItems = bundle.items || [];

      // ✅ Merge documents (no duplicate)
      const allDocs = bundleItems.flatMap((i: any) =>
        (i.documents || []).map((d: any) => d.document_name)
      );

      const uniqueDocs = Array.from(new Set<string>(allDocs));

      return {
        id: `bundle-${bundle.bundle_id}`,
        service_id: null,
        variant_id: null,

        service_name: bundle.bundle_name || `Bundle (${bundleItems.length} Services)`,
        variant_name: 'Bundle Pack',
        description: bundle.bundle_description || `${bundleItems.length} services included`,

        price: Number(bundle.bundle_total || 0),
        mrp: Number(bundle.bundle_total || 0),

        documents: uniqueDocs,

        bundle_id: bundle.bundle_id,

        // ✅ FIXED
        isBundle: true,
        bundle_items: bundleItems,
      };

    });


    sourceItems = [...bundleCards, ...individualItems];
  } else {
    // ✅ HANDLE BUNDLE PREVIEW
    if (raw?.bundle) {
      const bundle = raw.bundle;
      const bundleItems = bundle.items || [];

      const bundleCard = {
        id: `bundle-${bundle.bundle_id}`,
        service_id: null,
        variant_id: null,

        service_name: bundle.bundle_name || 'Bundle',
        variant_name: 'Bundle Pack',
        description: bundle.bundle_description || `${bundleItems.length} services included`,

        price: Number(bundle.bundle_total || 0),
        mrp: Number(bundle.bundle_total || 0),

        documents: [],

        isBundle: true,
        bundle_items: bundleItems,
        bundle_id: bundle.bundle_id,
      };

      sourceItems = [bundleCard]; // ✅ IMPORTANT
    } else {
      sourceItems = Array.isArray(raw?.items) ? raw.items : [];
    }
  }
  const items: ServicePreviewItem[] = sourceItems
    .map((entry: any) => {
      const isBundle = entry?.isBundle === true || String(entry?.id).startsWith('bundle');

      if (isBundle) {
        return entry; // ✅ keep bundle intact
      }

      const parsedId = Number(entry?.id ?? entry?.cart_item_id ?? 0);
      const parsedServiceId = Number(entry?.service_id ?? service_id ?? 0);
      const parsedVariantId = Number(entry?.variant_id ?? variant_id ?? 0);
      const fallbackBuyNowId = mode === 'buy_now' ? 1 : 0;

      return {
        id: Number.isFinite(parsedId) && parsedId > 0 ? parsedId : fallbackBuyNowId,
        service_id: Number.isFinite(parsedServiceId) ? parsedServiceId : 0,
        variant_id: Number.isFinite(parsedVariantId) ? parsedVariantId : 0,

        service_name: String(entry?.service_name ?? entry?.title ?? 'Service').trim(),
        variant_name: String(entry?.variant_name ?? 'Plan').trim(),
        description: String(entry?.description ?? entry?.short_description ?? '').trim(),

        price: Number(entry?.price ?? 0),
        mrp: Number(entry?.mrp ?? entry?.price ?? 0),

        image_url: entry?.image_url ? String(entry.image_url) : undefined,

        documents: (() => {
          const docs = entry?.documents ?? entry?.required_documents ?? [];
          if (!Array.isArray(docs)) return [];
          return docs
            .map((d: any) => String(d?.document_name ?? d?.name ?? d ?? '').trim())
            .filter(Boolean);
        })(),
      };
    })
    .filter(
      (item) =>
        item.isBundle || // ✅ allow bundle
        (item.service_id > 0 && item.variant_id > 0)
    )
  const summaryRaw = raw?.summary ?? {};

  // ✅ DIRECTLY USE API BUNDLE TOTAL
  let subtotal = 0;

  if (raw?.bundle?.bundle_total) {
    subtotal = Number(raw.bundle.bundle_total); // ✅ MOST RELIABLE
  } else if (items.length === 1 && items[0].isBundle) {
    subtotal = Number(items[0].price || 0);
  } else {
    subtotal = items.reduce((s, it) => s + Number(it.price || 0), 0);
  }

  // ✅ discount
  const discount =
    Number(summaryRaw.discount ?? 0) +
    Number(summaryRaw.reward_discount ?? 0);

  // ✅ total
  const grandTotal =
    Number(summaryRaw.total ?? subtotal);

  return {
    items,
    summary: {
      subtotal,
      discount,
      grandTotal,
    },
  };
}



const serviceCheckoutQueryKey = (
  mode: 'buy_now' | 'cart',
  service_id?: number,
  variant_id?: number,
) => {
  if (mode === 'buy_now') {
    return [...SERVICE_CHECKOUT_QUERY_KEY, 'buy-now', String(service_id ?? ''), String(variant_id ?? '')] as const;
  }
  return SERVICE_CHECKOUT_QUERY_KEY;
};

export default function ServiceCheckoutScreen() {
  const navigation = useNavigation<NavProps>();
  // MainLayout already reserves space for the services-module bottom bar via
  // paddingBottom on the content wrapper, so the CTA must not also offset by
  // the tab bar height itself (tabBarAware:false) — otherwise it floats above
  // the bottom bar with a visible gap instead of sitting right on top of it.
  const stickyCTA = useStickyBottomCTA({ tabBarAware: false });
  const queryClient = useQueryClient();
  const route = useRoute<RouteT>();
  const { mode: routeMode, service_id, variant_id, bundle_id, previewData: passedPreview } = route.params ?? {};
  const mode = routeMode === 'buy_now' ? 'buy_now' : 'cart';

  const { isAuthenticated } = useAuth();
  const alert = useAlert();

  const pulse = useRef(new Animated.Value(0)).current;
  // const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [hasStarted, setHasStarted] = useState(mode === 'buy_now' ? !!passedPreview : false);
  const isBuyNow = mode === 'buy_now';
  // ── redirect if not logged in ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      alert.info('Login Required', 'Please login to continue checkout.');
      navigation.goBack();
    }
  }, [alert, isAuthenticated, navigation]);

  // ── skeleton pulse animation ───────────────────────────────────────────────
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // ── address query ──────────────────────────────────────────────────────────
  const {
    data: address,
    isFetching: isAddressFetching,
  } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    select: (res: any) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list.find((a: any) => a?.is_default) ?? list[0] ?? null;
    },
  });

  // ── checkout/buy-now preview query ─────────────────────────────────────────
  const checkoutQueryKey = useMemo(
    () => serviceCheckoutQueryKey(mode, service_id, variant_id),
    [mode, service_id, variant_id],
  );

  const {
    data: checkoutData,
    isFetching: isCheckoutFetching,
    error: checkoutError,
    refetch: refetchCheckout,
  } = useQuery({
    queryKey: checkoutQueryKey,
    queryFn: () => {
      if (mode === 'buy_now') {
        if (passedPreview) return Promise.resolve(passedPreview);
        if (service_id && variant_id) {
          return getBuyNowPreview({ service_id, variant_id });
        }
        return Promise.resolve({ data: { items: [], summary: {} } });
      }
      return getCheckoutPreview();
    },
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: THIRTY_MINUTES,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    select: (res: any) => normalizePreview(res, mode, service_id, variant_id),
    retry: 1,
    throwOnError: false,
  });

  useEffect(() => {
    if (isCheckoutFetching || checkoutData || checkoutError) {
      setHasStarted(true);
    }
  }, [isCheckoutFetching, checkoutData, checkoutError]);

  // ── derived values ─────────────────────────────────────────────────────────
  const items = useMemo(
    () => checkoutData?.items ?? [],
    [checkoutData?.items]
  );

  const summary = useMemo(
    () => checkoutData?.summary ?? { subtotal: 0, discount: 0, grandTotal: 0 },
    [checkoutData?.summary]
  );

  const addressLine = address
    ? [address.address1, address.city, address.state ?? address.state_name, address.zipcode]
      .map((p: any) => String(p ?? '').trim())
      .filter(Boolean)
      .join(', ')
    : '';

  const handlePlaceOrder = useCallback(async () => {
    let createdCartOrder = false;
    const cartSnapshot =
      mode !== "buy_now"
        ? items
          .map((item) => ({
            service_id: Number(item.service_id),
            variant_id: Number(item.variant_id),
          }))
          .filter(
            (item) =>
              Number.isFinite(item.service_id) &&
              item.service_id > 0 &&
              Number.isFinite(item.variant_id) &&
              item.variant_id > 0
          )
        : [];

    const restoreCartAfterPaymentFailure = async () => {
      if (mode === "buy_now" || cartSnapshot.length === 0) {
        return;
      }

      try {
        // placeCartOrder() consumes the cart at checkout-preview level while cart-items
        // endpoint may still return stale entries. Always clear first so a clean set
        // of items is added back from the pre-order snapshot.
        await clearServiceCart().catch(() => { });

        for (const cartItem of cartSnapshot) {
          await addServiceToCart({
            service_id: cartItem.service_id,
            variant_id: cartItem.variant_id,
          });
        }

        console.log("↩️ Cart restored after payment failure/cancel");
      } catch (restoreErr) {
        console.error("❌ Failed to restore cart after payment failure:", restoreErr);
      }
    };

    try {
      if (placing) {
        console.log("⏸️ Order placement already in progress");
        return;
      }
      setPlacing(true);

      console.log("📦 Creating order...");

      console.log("🏠 Address debug:", JSON.stringify(address, null, 2));
      const address_id = Number(address?.id ?? (address as any)?.address_id ?? 0);
      if (!address_id) {
        setPlacing(false);
        Alert.alert(
          "No Address",
          "Please add a delivery address to continue.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Add Address", onPress: () => navigation.navigate('AddressSelect') },
          ],
        );
        return;
      }

      // ✅ Step 1: Create Order via API
      let orderRes;
      if (mode === "buy_now" && bundle_id) {
        const selected_items = items
          .flatMap((item) => item.bundle_items ?? [])
          .map((i: any) => Number(i.bundle_item_id))
          .filter((id) => Number.isFinite(id) && id > 0);

        orderRes = await buyNowBundle({ bundle_id: Number(bundle_id), selected_items, address_id });
      } else if (mode === "buy_now" && service_id && variant_id) {
        orderRes = await placeBuyNowOrder({
          service_id: Number(service_id),
          variant_id: Number(variant_id),
          address_id,
        });
      } else {
        orderRes = await placeCartOrder({ address_id });
        createdCartOrder = true;
      }

      // Check for explicit API failure
      if (orderRes?.success === false) {
        setPlacing(false);
        const serverMessage =
          orderRes.message ||
          orderRes.error ||
          orderRes.details ||
          "Order creation failed";
        console.error("❌ Order API returned failure:", serverMessage, orderRes);
        Alert.alert("Checkout failed", String(serverMessage));
        return;
      }

      // Extract numeric order ID for navigation
      const numeric_order_id = Number(
        orderRes?.data?.order?.id ??
        orderRes?.data?.orders?.[0]?.id ??
        orderRes?.data?.order_id ??
        orderRes?.data?.id ??
        orderRes?.order?.id ??
        orderRes?.id ??
        0
      );

      // Extract UUID/string parent_order_id for payment API
      // Prefer uuid fields, fallback to numeric id as string
      const raw_uuid =
        orderRes?.data?.order?.uuid ??
        orderRes?.data?.order?.parent_order_id ??
        orderRes?.data?.uuid ??
        orderRes?.data?.parent_order_id ??
        orderRes?.uuid;

      const parent_order_id: string = raw_uuid
        ? String(raw_uuid).trim()
        : String(numeric_order_id);

      console.log("🔍 Order Extraction Debug:", {
        mode,
        numeric_order_id,
        parent_order_id,
        raw_uuid,
        full_data: orderRes?.data,
      });

      if (!Number.isFinite(numeric_order_id) || numeric_order_id <= 0) {
        setPlacing(false);
        console.error("❌ Order ID extraction failed:", orderRes);
        Alert.alert("Order Error", "Failed to create order. Please try again.");
        return;
      }

      console.log("✅ Order created successfully:", { numeric_order_id, parent_order_id, mode });

      // ✅ Step 2: Create Payment Order
      console.log("💳 Creating payment order with parent_order_id:", parent_order_id);
      const paymentRes = await createServicePaymentOrder(parent_order_id);
      const paymentData = paymentRes.data;

      console.log("💳 Payment Order Response:", paymentData);

      const options = {
        key: paymentData.key || "rzp_test_xxx",
        amount: paymentData.amount,
        currency: paymentData.currency || "INR",
        order_id: paymentData.orderId,
        name: "Reward Planners",
        description: "Service Payment",
        theme: { color: "#8665FF" },
      };

      console.log("🔑 Razorpay options:", { order_id: options.order_id, amount: options.amount, key: options.key });

      setPlacing(false);

      // ✅ Step 3: Open Razorpay Checkout
      RazorpayCheckout.open(options)
        .then(async (response) => {
          console.log("💰 Payment successful:", response);
          try {
            setPlacing(true);

            // ✅ Clear cart for cart mode
            if (mode !== "buy_now") {
              try {
                await clearServiceCart();
                console.log("🧹 Cart cleared successfully");
                await queryClient.invalidateQueries({ queryKey: SERVICE_CART_QUERY_KEY });
                await queryClient.invalidateQueries({ queryKey: SERVICE_CHECKOUT_QUERY_KEY });
              } catch (clearErr) {
                console.error("❌ Cart clear failed:", clearErr);
              }
            }

            // ✅ Step 4: Verify payment
            try {
              const verifyRes = await verifyServicePayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              console.log("🔐 Payment verified:", verifyRes);

              if (!verifyRes?.success) {
                // Poll as fallback if verify response doesn't confirm success
                await new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
                const statusRes = await checkServicePaymentStatus(parent_order_id);
                console.log("📊 Payment status poll:", statusRes);
              }
            } catch (verifyError) {
              console.error("⚠️ Verification failed, proceeding to upload:", verifyError);
            }

            setPlacing(false);

            // ✅ Step 5: Navigate to DocumentUpload
            navigation.navigate("DocumentUpload", {
              order_id: numeric_order_id,
              parent_order_id: parent_order_id,
            });
          } catch (error) {
            console.error("❌ Post-payment flow failed:", error);
            setPlacing(false);
            navigation.navigate("DocumentUpload", {
              order_id: numeric_order_id,
              parent_order_id: parent_order_id,
            });
          }
        })
        .catch(async (error: any) => {
          setPlacing(false);
          console.error("❌ Payment cancelled/failed:", error);

          // ✅ Restore cart after payment failure
          await restoreCartAfterPaymentFailure();

          // ✅ Refresh checkout data to sync UI
          await refetchCheckout();

          const errorCode = String(error?.code ?? "");
          const errorText =
            error?.description ||
            error?.message ||
            error?.error?.description ||
            "";

          const isUserCancelled =
            errorCode === "0" ||
            /cancel|cancelled|dismiss|closed|back/i.test(String(errorText));

          if (isUserCancelled) {
            alert.info?.("Payment Cancelled", "Your cart has been restored. You can retry payment.");
            return;
          }

          alert.error?.(
            "Payment Failed",
            String(errorText || "Payment was cancelled or failed")
          );
        });
    } catch (e: any) {
      setPlacing(false);

      if (Number(e?.response?.status) === 401) {
        alert.info?.("Session Expired", "Please login again");
        navigation.goBack();
        return;
      }

      console.error("❌ Order/Payment failed:", {
        status: e?.response?.status,
        message: e?.response?.data?.message || e?.message,
        data: e?.response?.data,
        error: e?.error
      });

      if (createdCartOrder) {
        await restoreCartAfterPaymentFailure();
      }

      const serverMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.response?.data?.details ||
        e?.message ||
        "Failed to place order";
      alert.error?.("Error", serverMessage);
    }
  }, [mode, service_id, variant_id, bundle_id, address, navigation, placing, alert, items, queryClient, refetchCheckout]);
  const handleRemoveFromCheckout = useCallback(async (item: ServicePreviewItem) => {
    if (mode !== 'cart' || !item.id) return;
    if (removingId === item.id) return;

    try {
      setRemovingId(item.id);
      queryClient.setQueryData(
        SERVICE_CHECKOUT_QUERY_KEY,
        (oldData: any) => {
          if (!oldData?.items || !Array.isArray(oldData.items)) return oldData;
          return {
            ...oldData,
            items: oldData.items.filter((existing: ServicePreviewItem) => existing.id !== item.id),
          };
        },
      );

      if (item.isBundle && item.bundle_items) {
        await Promise.all(
          item.bundle_items.map((i: any) =>
            removeServiceCartItem(Number(i.id)) // ✅ force number
          )
        );
      } else {
        await removeServiceCartItem(Number(item.id)); // ✅ FIX
      }
      // ✅ Invalidate both caches; active checkout query will refetch automatically.
      await queryClient.invalidateQueries({ queryKey: SERVICE_CART_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: SERVICE_CHECKOUT_QUERY_KEY });

    } catch (err) {
      console.error("❌ Failed to remove item:", err);
      // Revert optimistic state when backend removal fails.
      await queryClient.invalidateQueries({ queryKey: SERVICE_CHECKOUT_QUERY_KEY });
      alert.error?.("Error", "Failed to remove item. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }, [mode, queryClient, removingId, alert]);

  // ── loading skeleton ───────────────────────────────────────────────────────
  const isLoading =
    isAuthenticated &&
    (!hasStarted || (!checkoutData && (isCheckoutFetching || isAddressFetching)));

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Checkout" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingWrapper}>
          <View style={styles.checkoutSkeletonCard}>
            <SkeletonBox pulse={pulse} width="60%" height={24} borderRadius={10} />
            <SkeletonBox pulse={pulse} width="100%" height={84} borderRadius={14} style={styles.checkoutSkeletonGap} />
            <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={14} style={styles.checkoutSkeletonGap} />
            <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={14} style={styles.checkoutSkeletonGap} />
            <SkeletonBox pulse={pulse} width="88%" height={50} borderRadius={12} style={styles.checkoutSkeletonGapLg} />
          </View>
        </View>
      </View>
    );
  }

  // ── empty / error state ────────────────────────────────────────────────────
  if (!isLoading && hasStarted && !isCheckoutFetching && items.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Checkout" onBackPress={() => navigation.goBack()} />
        <EmptyCart
          message={
            isBuyNow
              ? 'Unable to load the selected item. Please login and try again.'
              : 'Your cart is empty. Add products to continue.'
          }
        />
      </View>
    );
  }

  // ── main checkout UI ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScreenHeader title="Checkout" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: stickyCTA.scrollContentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Address card */}
        <View style={styles.card}>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="home-variant" size={28} color={address ? '#7C3AED' : '#EF4444'} />
            <View style={styles.addressBody}>
              <View style={styles.addressTopRow}>
                <Text style={styles.addressTitle}>
                  {address ? `Delivering to ${address.contact_name || 'User'}` : 'No delivery address'}
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AddressSelect')}>
                  <Text style={styles.changeText}>{address ? 'Change' : '+ Add Address'}</Text>
                </TouchableOpacity>
              </View>
              {address ? (
                <Text style={styles.addressSub} numberOfLines={2}>{addressLine}</Text>
              ) : (
                <Text style={[styles.addressSub, styles.addressMissing]}>
                  Please add a delivery address to continue
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Service item cards */}
        {items.map((item, idx) => (
          <View key={`${item.id}-${item.service_id}-${item.variant_id}-${idx}`} style={styles.card}>
            <View style={styles.itemRow}>
              <View style={styles.iconBg}>
                <MaterialIcons name="description" size={28} color="#8665FF" />
              </View>
              <View style={styles.itemInfo}>
                {mode === 'cart' && !item.isBundle && (<View style={styles.itemTopActions}>
                  <TouchableOpacity
                    disabled={removingId === item.id}
                    style={styles.removeBtn}
                    onPress={() => handleRemoveFromCheckout(item)}
                  >
                    <Text style={styles.removeBtnText}>{removingId === item.id ? 'Removing...' : 'Remove'}</Text>
                  </TouchableOpacity>
                </View>
                )}
                <Text style={styles.serviceName} numberOfLines={2}>{item.service_name
                }</Text>
                <View style={styles.variantTag}>
                  <Text style={styles.variantText}>{item.variant_name}</Text>
                </View>
                {!!item.description && (
                  <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{item.price.toLocaleString('en-IN')}</Text>
                  {item.mrp > item.price && (
                    <Text style={styles.mrpText}>₹{item.mrp.toLocaleString('en-IN')}</Text>
                  )}
                  {item.mrp > item.price && (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveText}>
                        Save ₹{(item.mrp - item.price).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {item.documents.length > 0 && (
              <View style={styles.docsSection}>
                <Text style={styles.docsTitle}>Documents Required</Text>
                {item.documents.map((doc, i) => (
                  <View key={`${doc}-${i}`} style={styles.docRow}>
                    <View style={styles.docDot} />
                    <Text style={styles.docText}>{doc}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Coupons */}
        {/* <View style={styles.couponsWrapper}>
          <View style={styles.couponsHeader}>
            <Text style={styles.couponsTitle}>Coupons and Offers</Text>
            <TouchableOpacity onPress={() => setShowAllCoupons((p) => !p)}>
              <Text style={styles.viewAllText}>{showAllCoupons ? 'Hide' : 'View All'}</Text>
            </TouchableOpacity>
          </View>
          <CouponsSection coupons={showAllCoupons ? COUPONS : COUPONS.slice(0, 1)} />
        </View> */}

        {/* Bill details */}
        <BillDetailsCard
          subtotal={summary.subtotal}
          totalDiscount={summary.discount}
          finalTotal={summary.grandTotal}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Place order button */}
      <OrderProcedbutton
        total={summary.grandTotal}
        count={items.length}
        loading={placing}
        disabled={isAddressFetching}
        onPlaceOrder={handlePlaceOrder}
        wrapperPaddingBottom={16}
        // Rest flush against the bottom bar; still rise above the keyboard when it's open.
        bottomOffset={stickyCTA.keyboardHeight > 0 ? stickyCTA.bottomOffset : 0}
        onLayout={stickyCTA.onCtaLayout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 16 },

  // skeleton
  loadingWrapper: { flex: 1, padding: 16 },
  checkoutSkeletonCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 2 },
  checkoutSkeletonGap: { marginTop: 12 },
  checkoutSkeletonGapLg: { marginTop: 20 },

  // shared card
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    elevation: 2,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  // address card
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressBody: { flex: 1 },
  addressTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressTitle: { fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 },
  changeText: { fontSize: 13, fontWeight: '600', color: '#7C3AED', marginLeft: 8 },
  addressSub: { marginTop: 3, fontSize: 12, color: '#6B7280', lineHeight: 18 },
  addressMissing: { color: '#EF4444', fontWeight: '500' },

  // service item card
  itemRow: { flexDirection: 'row', gap: 12 },
  iconBg: {
    width: 72,
    height: 72,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemTopActions: { alignItems: 'flex-end' },
  removeBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBtnText: { fontSize: 12, color: '#B91C1C', fontWeight: '700' },
  serviceName: { fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 20 },
  variantTag: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variantText: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },
  descText: { marginTop: 5, fontSize: 12, color: '#6B7280', lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 6 },
  priceText: { fontSize: 17, fontWeight: '800', color: '#065F46' },
  mrpText: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'line-through' },
  saveBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  saveText: { fontSize: 11, color: '#B45309', fontWeight: '700' },

  // documents
  docsSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  docsTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  docRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  docDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C3AED', marginTop: 5, flexShrink: 0 },
  docText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },

  // coupons
  couponsWrapper: { paddingHorizontal: 14, marginTop: 12 },
  couponsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  couponsTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },

  bottomSpacer: { height: 8 },
});
