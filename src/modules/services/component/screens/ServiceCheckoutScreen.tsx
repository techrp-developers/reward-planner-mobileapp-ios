import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Image,
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
import { buyNowBundle, getBuyNowBundlePreview } from '../../api/BundleAPI';
import { fetchAllAddress } from '../../../ecommerce/api/AddressApi';
import { useAuth } from '../../../common/auth/context/AuthContext';
import { useAlert } from '../../../ecommerce/components/alerts/useAlert';
import { addressesQueryKey } from '../../../ecommerce/navigation/navigationPerformance';
import { HomeStackParamList } from '../../navigation/type';
import { createServicePaymentOrder, verifyServicePayment, checkServicePaymentStatus, isServicePaymentVerified } from '../../api/ServicepaymentAPI';
import { SERVICE_CART_QUERY_KEY, SERVICE_CHECKOUT_QUERY_KEY } from '../../constant/queryKeys';
import RazorpayCheckout from "react-native-razorpay";
import { useStickyBottomCTA } from '../../../../bottombar/hooks/useStickyBottomCTA';
import { getServiceImageUrl } from '../../utils/serviceImage';
import { useServicesTheme } from '../../utils/useServicesTheme';

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
  imageUrl?: string;

  documents: string[];

  // ✅ ADD THESE
  isBundle?: boolean;
  bundle_items?: any[];
};

type PreviewSummary = {
  subtotal: number;
  discount: number;
  grandTotal: number;
  earnCoins: number;
  redeemCoins: number;
  maxRedeemCoins: number;
  walletBalance: number;
};

const waitForServicePayment = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const pollServicePaymentStatus = async (parentOrderId: string) => {
  let response: any = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (attempt > 0) await waitForServicePayment(2000);
    response = await checkServicePaymentStatus(parentOrderId);
    if (isServicePaymentVerified(response)) {
      return { outcome: 'paid' as const, response };
    }

    const status = String(response?.payment_status ?? response?.status ?? '').toLowerCase();
    if (['failed', 'cancelled', 'expired', 'refunded'].includes(status)) {
      return { outcome: 'failed' as const, response };
    }
  }

  return { outcome: 'pending' as const, response };
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

const getFirstImage = (source: any, fields: string[]): string | undefined => {
  const field = fields.find((key) => {
    const value = source?.[key];
    return typeof value === 'string' && value.trim();
  });

  return field ? String(source[field]).trim() : undefined;
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
      const selectedItemsTotal = sumBundleItemPrices(bundleItems, ['price']);
      const selectedItemsMrp = sumBundleItemPrices(bundleItems, [
        'individual_price',
        'mrp',
        'original_price',
        'price',
      ]);
      const displayPrice = selectedItemsTotal || parseMoney(bundle.bundle_total);
      const displayMrp = selectedItemsMrp || displayPrice;

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

        price: displayPrice,
        mrp: Math.max(displayMrp, displayPrice),
        imageUrl: getFirstImage(bundle, ['bundle_image']),

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
      const selectedItemsTotal = sumBundleItemPrices(bundleItems, ['price']);
      const selectedItemsMrp = sumBundleItemPrices(bundleItems, [
        'individual_price',
        'mrp',
        'original_price',
        'price',
      ]);
      const displayPrice = selectedItemsTotal || parseMoney(bundle.bundle_total);
      const displayMrp = selectedItemsMrp || displayPrice;

      const bundleCard = {
        id: `bundle-${bundle.bundle_id}`,
        service_id: null,
        variant_id: null,

        service_name: bundle.bundle_name || 'Bundle',
        variant_name: 'Bundle Pack',
        description: bundle.bundle_description || `${bundleItems.length} services included`,

        price: displayPrice,
        mrp: Math.max(displayMrp, displayPrice),
        imageUrl: getFirstImage(bundle, ['bundle_image']),

        documents: [],

        isBundle: true,
        bundle_items: bundleItems,
        bundle_id: bundle.bundle_id,
      };

      sourceItems = [bundleCard]; // ✅ IMPORTANT
    } else {
      sourceItems = Array.isArray(raw?.items)
        ? raw.items
        : raw?.item
          ? [raw.item]
          : raw?.service
            ? [raw.service]
            : raw?.service_id || raw?.variant_id || raw?.image_url
              ? [raw]
              : [];
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

        price: parseMoney(entry?.price),
        mrp: parseMoney(entry?.mrp ?? entry?.price),

        imageUrl: getFirstImage(entry, ['image_url', 'variant_image']),

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
  subtotal = parseMoney(raw.bundle.bundle_total); // ✅ MOST RELIABLE
} else if (items.length === 1 && items[0].isBundle) {
  subtotal = parseMoney(items[0].price);
} else {
  subtotal = items.reduce((s, it) => s + parseMoney(it.price), 0);
}

// ✅ discount
const discount =
  parseMoney(summaryRaw.discount);
const redeemCoins = parseMoney(summaryRaw.redeem_coins ?? summaryRaw.reward_discount);

// ✅ total
const grandTotal =
  mode === 'cart'
    ? parseMoney(summaryRaw.total ?? Math.max(subtotal - discount - redeemCoins, 0))
    : parseMoney(summaryRaw.total ?? subtotal);

return {
  items,
  summary: {
    subtotal,
    discount,
    grandTotal,
    earnCoins: parseMoney(summaryRaw.earn_coins),
    redeemCoins,
    maxRedeemCoins: parseMoney(summaryRaw.max_redeem_coins),
    walletBalance: parseMoney(summaryRaw.wallet_balance),
  },
};
}

 

const serviceCheckoutQueryKey = (
  mode: 'buy_now' | 'cart',
  service_id?: number,
  variant_id?: number,
  redeemCoins = 0,
) => {
  if (mode === 'buy_now') {
    return [...SERVICE_CHECKOUT_QUERY_KEY, 'buy-now', String(service_id ?? ''), String(variant_id ?? ''), redeemCoins] as const;
  }
  return [...SERVICE_CHECKOUT_QUERY_KEY, 'cart', redeemCoins] as const;
};

export default function ServiceCheckoutScreen() {
  const navigation = useNavigation<NavProps>();
  const servicesTheme = useServicesTheme();
  // MainLayout already reserves space for the services-module bottom bar via
  // paddingBottom on the content wrapper, so the CTA must not also offset by
  // the tab bar height itself (tabBarAware:false) — otherwise it floats above
  // the bottom bar with a visible gap instead of sitting right on top of it.
  const stickyCTA = useStickyBottomCTA({ tabBarAware: false });
  const queryClient = useQueryClient();
  const route = useRoute<RouteT>();
  const {
    mode: routeMode,
    service_id,
    variant_id,
    bundle_id,
    selected_items: routeSelectedItems,
    previewData: passedPreview,
    redeem_coins: initialRedeemCoins = 0,
  } = route.params ?? {};
  const mode = routeMode === 'buy_now' ? 'buy_now' : 'cart';

  const { isAuthenticated } = useAuth();
  const alert = useAlert();

  const pulse = useRef(new Animated.Value(0)).current;
  // const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [useRewardCoins, setUseRewardCoins] = useState(initialRedeemCoins > 0);
  const [requestedRedeemCoins, setRequestedRedeemCoins] = useState(initialRedeemCoins);
  const redeemCoinsForRequest = useRewardCoins ? requestedRedeemCoins : 0;
  const paymentFlowInProgress = useRef(false);
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
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // ── address query ──────────────────────────────────────────────────────────
  const {
    data: address,
  } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    select: (res: any) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list.find((a: any) => Number(a?.is_default) === 1) ?? list[0] ?? null;
    },
  });

  // ── checkout/buy-now preview query ─────────────────────────────────────────
  const checkoutQueryKey = useMemo(
    () => serviceCheckoutQueryKey(mode, service_id, variant_id, redeemCoinsForRequest),
    [mode, redeemCoinsForRequest, service_id, variant_id],
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
        if (bundle_id) {
          return getBuyNowBundlePreview({
            bundle_id: Number(bundle_id),
            selected_items: routeSelectedItems ?? [],
            redeem_coins: redeemCoinsForRequest,
          });
        }
        if (passedPreview && redeemCoinsForRequest === 0) return Promise.resolve(passedPreview);
        if (service_id && variant_id) {
          return getBuyNowPreview({ service_id, variant_id, redeem_coins: redeemCoinsForRequest });
        }
        return Promise.resolve({ data: { items: [], summary: {} } });
      }
      return getCheckoutPreview(redeemCoinsForRequest);
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    gcTime: THIRTY_MINUTES,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Keep the current service summary mounted during background refreshes
    // (including the refresh triggered after selecting an address).
    placeholderData: previousData => previousData,
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
    () => checkoutData?.summary ?? { subtotal: 0, discount: 0, grandTotal: 0, earnCoins: 0, redeemCoins: 0, maxRedeemCoins: 0, walletBalance: 0 },
    [checkoutData?.summary]
  );

  const addressLine = address
    ? [address.address1, address.city, address.state ?? address.state_name, address.zipcode]
      .map((p: any) => String(p ?? '').trim())
      .filter(Boolean)
      .join(', ')
    : '';

  const handlePlaceOrder = useCallback(async () => {
    if (paymentFlowInProgress.current) return;
    paymentFlowInProgress.current = true;
    let createdParentOrderId: string | null = null;
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

        __DEV__ && console.log("↩️ Cart restored after payment failure/cancel");
      } catch (restoreErr) {
        console.error("❌ Failed to restore cart after payment failure:", restoreErr);
      }
    };

    try {
      if (placing) {
        __DEV__ && console.log("⏸️ Order placement already in progress");
        paymentFlowInProgress.current = false;
        return;
      }
      setPlacing(true);

      __DEV__ && console.log("📦 Creating order...");

      __DEV__ && console.log("🏠 Address debug:", JSON.stringify(address, null, 2));
      const address_id = Number(address?.id ?? (address as any)?.address_id ?? 0);
      if (!address_id) {
        setPlacing(false);
        paymentFlowInProgress.current = false;
        Alert.alert(
          "Select Address",
          "Please select an address.",
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
        const selected_items = (routeSelectedItems?.length ? routeSelectedItems : items
          .flatMap((item) => item.bundle_items ?? [])
          .map((i: any) => Number(i.bundle_item_id ?? i.item_id ?? i.id)))
          .filter((id) => Number.isFinite(id) && id > 0);

        orderRes = await buyNowBundle({ bundle_id: Number(bundle_id), selected_items, address_id, redeem_coins: redeemCoinsForRequest });
      } else if (mode === "buy_now" && service_id && variant_id) {
        orderRes = await placeBuyNowOrder({
          service_id: Number(service_id),
          variant_id: Number(variant_id),
          address_id,
          redeem_coins: redeemCoinsForRequest,
        });
      } else {
        orderRes = await placeCartOrder({ address_id, redeem_coins: redeemCoinsForRequest });
      }

      // Check for explicit API failure
      if (orderRes?.success === false) {
        setPlacing(false);
        paymentFlowInProgress.current = false;
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
      createdParentOrderId = parent_order_id;

      __DEV__ && console.log("🔍 Order Extraction Debug:", {
        mode,
        numeric_order_id,
        parent_order_id,
        raw_uuid,
        full_data: orderRes?.data,
      });

      if (!Number.isFinite(numeric_order_id) || numeric_order_id <= 0) {
        setPlacing(false);
        paymentFlowInProgress.current = false;
        console.error("❌ Order ID extraction failed:", orderRes);
        Alert.alert("Order Error", "Failed to create order. Please try again.");
        return;
      }

      __DEV__ && console.log("✅ Order created successfully:", { numeric_order_id, parent_order_id, mode });

      // ✅ Step 2: Create Payment Order
      __DEV__ && console.log("💳 Creating payment order with parent_order_id:", parent_order_id);
      const paymentRes = await createServicePaymentOrder(parent_order_id);
      const paymentData = paymentRes.data;

      __DEV__ && console.log("💳 Payment Order Response:", paymentData);

      if (!paymentData?.key || !paymentData?.orderId || !Number(paymentData?.amount)) {
        throw new Error("Invalid payment order response");
      }

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency || "INR",
        order_id: paymentData.orderId,
        name: "Reward Planners",
        description: "Service Payment",
        theme: { color: "#8665FF" },
      };

      __DEV__ && console.log("🔑 Razorpay options:", { order_id: options.order_id, amount: options.amount, key: options.key });

      setPlacing(false);

      // ✅ Step 3: Open Razorpay Checkout
      RazorpayCheckout.open(options)
        .then(async (response) => {
          __DEV__ && console.log("💰 Payment successful:", response);
          try {
            setPlacing(true);
            let paymentOutcome: 'paid' | 'failed' | 'pending' = 'pending';

            try {
              const verifyRes = await verifyServicePayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              __DEV__ && console.log("🔐 Payment verified:", verifyRes);
              paymentOutcome = isServicePaymentVerified(verifyRes) ? 'paid' : 'pending';
            } catch (verifyError) {
              console.error("⚠️ Direct verification failed; polling status:", verifyError);
            }

            if (paymentOutcome !== 'paid') {
              const statusResult = await pollServicePaymentStatus(parent_order_id);
              paymentOutcome = statusResult.outcome;
              __DEV__ && console.log("📊 Payment status result:", statusResult.response);
            }

            setPlacing(false);
            paymentFlowInProgress.current = false;

            if (paymentOutcome === 'paid') {
              await queryClient.invalidateQueries({ queryKey: SERVICE_CART_QUERY_KEY });
              await queryClient.invalidateQueries({ queryKey: SERVICE_CHECKOUT_QUERY_KEY });
              navigation.navigate("DocumentUpload", {
                order_id: numeric_order_id,
                parent_order_id,
              });
              return;
            }

            if (paymentOutcome === 'failed') {
              await restoreCartAfterPaymentFailure();
              await refetchCheckout();
              alert.error?.("Payment Failed", "The payment failed. Your cart has been restored.");
              return;
            }

            alert.info?.(
              "Payment Processing",
              "Do not pay again. Your payment is still being confirmed.",
            );
            navigation.navigate("ServiceOrderDetail", { parent_order_id });
          } catch (error) {
            console.error("❌ Post-payment flow failed:", error);
            setPlacing(false);
            paymentFlowInProgress.current = false;
            alert.info?.(
              "Payment Status Unavailable",
              "Do not pay again yet. Check this order after a few minutes.",
            );
            navigation.navigate("ServiceOrderDetail", { parent_order_id });
          }
        })
        .catch(async (error: any) => {
          setPlacing(false);
          console.error("❌ Payment cancelled/failed:", error);

          const errorCode = String(error?.code ?? "");
          const errorText =
            error?.description ||
            error?.message ||
            error?.error?.description ||
            "";

          const isUserCancelled =
            errorCode === "0" ||
            errorCode === "1" ||
            /cancel|cancelled|dismiss|closed|back/i.test(String(errorText));

          try {
            const statusResult = await pollServicePaymentStatus(parent_order_id);
            paymentFlowInProgress.current = false;

            if (statusResult.outcome === 'paid') {
              navigation.navigate("DocumentUpload", {
                order_id: numeric_order_id,
                parent_order_id,
              });
              return;
            }

            if (statusResult.outcome === 'failed') {
              await restoreCartAfterPaymentFailure();
              await refetchCheckout();
              alert.error?.(
                isUserCancelled ? "Payment Cancelled" : "Payment Failed",
                "The payment was not completed. Your cart has been restored.",
              );
              return;
            }

            alert.info?.(
              isUserCancelled ? "Cancellation Processing" : "Payment Processing",
              "Do not pay again. Check the order status shortly.",
            );
            navigation.navigate("ServiceOrderDetail", { parent_order_id });
          } catch (statusError) {
            paymentFlowInProgress.current = false;
            console.error("❌ Payment status unavailable:", statusError);
            alert.info?.(
              "Payment Status Unavailable",
              "Do not pay again yet. Check this order after a few minutes.",
            );
            navigation.navigate("ServiceOrderDetail", { parent_order_id });
            return;
          }
        });
    } catch (e: any) {
      setPlacing(false);
      paymentFlowInProgress.current = false;

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

      const serverMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.response?.data?.details ||
        e?.message ||
        "Failed to place order";
      alert.error?.("Error", serverMessage);
      if (createdParentOrderId) {
        navigation.navigate("ServiceOrderDetail", {
          parent_order_id: createdParentOrderId,
        });
      }
    }
  }, [mode, service_id, variant_id, bundle_id, routeSelectedItems, address, navigation, placing, alert, items, queryClient, refetchCheckout, redeemCoinsForRequest]);
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
    (!hasStarted || (!checkoutData && isCheckoutFetching));

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
        <ScreenHeader title="Checkout" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingWrapper}>
          <View style={[styles.checkoutSkeletonCard, { backgroundColor: servicesTheme.colors.surface }]}>
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
      <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
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
    <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
      <ScreenHeader title="Checkout" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: stickyCTA.scrollContentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Address card */}
        <View style={[styles.card, { backgroundColor: servicesTheme.colors.surface, shadowColor: servicesTheme.colors.shadow }]}>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="home-variant" size={28} color={address ? servicesTheme.colors.primary : '#EF4444'} />
            <View style={styles.addressBody}>
              <View style={styles.addressTopRow}>
                <Text style={[styles.addressTitle, { color: servicesTheme.colors.textStrong }]}>
                  {address ? `Delivering to ${address.contact_name || 'User'}` : 'No delivery address'}
                </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('AddressSelect')}>
                  <Text style={[styles.changeText, { color: servicesTheme.colors.primary }]}>{address ? 'Change' : '+ Add Address'}</Text>
                </TouchableOpacity>
              </View>
              {address ? (
                <Text style={[styles.addressSub, { color: servicesTheme.colors.muted }]} numberOfLines={2}>{addressLine}</Text>
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
          <View key={`${item.id}-${item.service_id}-${item.variant_id}-${idx}`} style={[styles.card, { backgroundColor: servicesTheme.colors.surface, shadowColor: servicesTheme.colors.shadow }]}>
            <View style={styles.itemRow}>
              <View style={[styles.iconBg, { backgroundColor: servicesTheme.colors.iconBg }]}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: getServiceImageUrl(item.imageUrl) }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialIcons name="description" size={28} color="#8665FF" />
                )}
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
                <Text style={[styles.serviceName, { color: servicesTheme.colors.textStrong }]} numberOfLines={2}>{item.service_name
                }</Text>
                <View style={[styles.variantTag, { backgroundColor: servicesTheme.colors.iconBg }]}>
                  <Text style={[styles.variantText, { color: servicesTheme.colors.primary }]}>{item.variant_name}</Text>
                </View>
                {!!item.description && (
                  <Text style={[styles.descText, { color: servicesTheme.colors.muted }]} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={[styles.priceText, { color: servicesTheme.colors.success }]}>₹{item.price.toLocaleString('en-IN')}</Text>
                  {item.mrp > item.price && (
                    <Text style={[styles.mrpText, { color: servicesTheme.colors.subtle }]}>₹{item.mrp.toLocaleString('en-IN')}</Text>
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
              <View style={[styles.docsSection, { borderTopColor: servicesTheme.colors.divider }]}>
                <Text style={[styles.docsTitle, { color: servicesTheme.colors.textStrong }]} >Documents Required</Text>
                {item.documents.map((doc, i) => (
                  <View key={`${doc}-${i}`} style={styles.docRow}>
                    <View style={styles.docDot} />
                    <Text style={[styles.docText, { color: servicesTheme.colors.text }]}>{doc}</Text>
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
          bagDiscount={summary.discount}
          finalTotal={summary.grandTotal}
          totalRewardEarn={summary.earnCoins}
          totalRedeemed={summary.redeemCoins}
          rewardCoinsAvailable={Math.min(summary.walletBalance, summary.maxRedeemCoins)}
          showRedeemableCoins
          useRewards={useRewardCoins}
          onUseRewardsChange={(enabled) => {
            const redeemableCoins = Math.min(summary.walletBalance, summary.maxRedeemCoins);
            setUseRewardCoins(enabled && redeemableCoins > 0);
            setRequestedRedeemCoins(
              enabled && redeemableCoins > 0 ? redeemableCoins : 0,
            );
          }}
          showShippingCharges={false}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Place order button */}
      <OrderProcedbutton
        total={summary.grandTotal}
        count={items.length}
        loading={placing}
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
  itemImage: {
    width: 58,
    height: 62,
    borderRadius: 8,
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
