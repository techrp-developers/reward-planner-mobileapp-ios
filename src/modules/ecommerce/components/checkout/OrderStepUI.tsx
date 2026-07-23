import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  InteractionManager,
  BackHandler,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RazorpayCheckout from 'react-native-razorpay';
import ProductHeadColor from '../../constants/heading/Poduct_Head_Color';
// import CouponsSection from "../../constants/coupan/CouponsSection";
import BillDetailsCard from '../../constants/itemcart/BillDetailsCard';
import ProductGrid from '../home/productgrid';

// import PaymentOptionsUI from "./PaymentOptionsUI";
import OrderProcedbutton from './OrderProcedbutton';
import CheckoutItemCart from './CheckoutItemCart';
import {
  addToCart,
  deleteAllCartItems,
  fetchCartItems,
  updateCartQty,
} from '../../api/CartApi';
import {
  fetchCheckoutCart,
  fetchBuyNowCheckout,
  addBuyNowOrder,
  addCartOrder,
} from '../../api/CheckoutApi';
import { fetchAllAddress } from '../../api/AddressApi';
import {
  createPaymentOrder,
  verifyPayment,
  checkPaymentStatus,
  cancelPendingPaymentOrder,
} from '../../api/Payment';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StackActions, CommonActions } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/types';
import type { RouteProp } from '@react-navigation/native';

import { useRoute } from '@react-navigation/native';
import EmptyCart from '../cart/EmptyCart';
import { useAuth } from '../../../common/auth/context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useAlert } from '../alerts/useAlert';
import SkeletonBox from '../../../services/component/constant/SkeletonBox';
import {
  addressesQueryKey,
  cartItemsQueryKey,
  cartSummaryQueryKey,
  checkoutPreviewQueryKey,
} from '../../navigation/navigationPerformance';
import RecommendedProducts from '../Promotion/RecommendedProducts';
import { useStickyBottomCTA } from '../../../../bottombar/hooks/useStickyBottomCTA';
import { useAppTheme } from '../../../../theme/ThemeContext';

type RouteT = RouteProp<HomeStackParamList, 'OrderStepUI'>;
type StepStatus = 'done' | 'current' | 'upcoming';
type CheckoutSummary = {
  productTotal: number;
  shippingTotal: number;
  payableAmount: number;
  reward: {
    redeemCoins: number;
    earnCoins: number;
  };
};

// const COUPONS = [
//   {
//     id: 1,
//     code: "RPSLAY200",
//     title: "Add ₹248 more to avail this offer",
//     subtitle: "Get Flat ₹200 off",
//   },
//   {
//     id: 2,
//     code: "RPCC200",
//     title: "Buy for ₹7777 to avail",
//     subtitle: "BOB Credit Card Offer",
//   },
// ];

const PURPLE_1 = '#8665FF';
const PURPLE_2 = '#5B47A3';
const BG = '#FFF';
const GREY_LINE = '#D9D9DE';
const GREY_DOT = '#E6E6EA';
const TEXT_GREY = '#9AA0A6';
const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

const emptyCheckoutSummary = (): CheckoutSummary => ({
  productTotal: 0,
  shippingTotal: 0,
  payableAmount: 0,
  reward: {
    redeemCoins: 0,
    earnCoins: 0,
  },
});

const getCheckoutPayableAmount = (summary: CheckoutSummary) =>
  Number(summary.payableAmount || 0);

const formatPhoneForRazorpay = (phone: string | undefined): string => {
  if (!phone) return '';
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  // Ensure it's 10 digits (Indian mobile)
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3);
  // Return as is if can't format
  return digits;
};

const safeToNumber = (value: any, defaultValue = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

const isPaymentVerified = (res: any) => {
  const status = String(res?.status ?? res?.payment_status ?? '').toLowerCase();
  return (
    res?.success === true ||
    res?.verified === true ||
    status === 'paid' ||
    status === 'captured' ||
    status === 'success' ||
    status === 'verified'
  );
};

const wait = (milliseconds: number) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

const pollForFinalPaymentStatus = async (orderId: number) => {
  let lastResponse: any = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (attempt > 0) await wait(2000);
    lastResponse = await checkPaymentStatus(orderId);
    if (isPaymentVerified(lastResponse)) {
      return { outcome: 'paid' as const, response: lastResponse };
    }

    const status = String(
      lastResponse?.status ?? lastResponse?.paymentStatus ?? '',
    ).toLowerCase();
    if (['cancelled', 'failed', 'expired', 'refunded'].includes(status)) {
      return { outcome: 'failed' as const, response: lastResponse };
    }
  }

  return { outcome: 'pending' as const, response: lastResponse };
};

export default function OrderStepUI() {
  const { isAuthenticated, logout, user } = useAuth();
  const { isDark, theme } = useAppTheme();
  const stickyCTA = useStickyBottomCTA();
  const { removeItem: removeFromCart } = useCart();
  const alert = useAlert();
  const alertRef = useRef(alert);
  alertRef.current = alert;
  const [items, setItems] = useState<any[]>([]);
  // const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [useRewards, setUseRewards] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const isCreatingOrder = useRef(false);
  const [hasCheckoutStarted, setHasCheckoutStarted] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();
  const skipItemsRefresh = useRef(false);
  const lastRedeemableCoins = useRef(0);
  const isSkippingEmptyCheckoutBack = useRef(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const handleUnauthorized = useCallback(async () => {
    Alert.alert(
      'Session expired',
      'Your session has expired. Please log in again.',
    );
    try {
      await logout();
    } catch (e) {
      console.warn('Failed to clear session during unauthorized handling', e);
    }

    const parent = (navigation as any)?.getParent?.();
    if (parent && typeof parent.reset === 'function') {
      parent.reset({ index: 0, routes: [{ name: 'AuthStack' }] });
    } else {
      navigation.navigate('Home');
    }
  }, [logout, navigation]);

  const route = useRoute<RouteT>();
  const mode = route?.params?.mode === 'buy_now' ? 'buy_now' : 'cart';
  const product_id = Number(route?.params?.product_id);
  const variant_id = Number(route?.params?.variant_id);
  const qty = Math.max(1, Number(route?.params?.qty ?? 1));
  const [buyNowQty, setBuyNowQty] = useState(qty);
  const [cartSummary, setCartSummary] =
    useState<CheckoutSummary>(emptyCheckoutSummary);

  useEffect(() => {
    setBuyNowQty(qty);
  }, [qty]);

  const isBuyNowValid =
    mode !== 'buy_now' ||
    (Number.isFinite(product_id) &&
      product_id > 0 &&
      Number.isFinite(variant_id) &&
      variant_id > 0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const normalizeCheckoutItem = useCallback(
    (item: any) => ({
      ...item,
      product_name:
        item?.product_name ||
        item?.title ||
        item?.name ||
        item?.product?.name ||
        item?.product?.title ||
        'Product',
      variant_name:
        item?.variant_name ||
        item?.variant?.name ||
        item?.subcategory_name ||
        '',
    }),
    [],
  );

  const parseCheckoutResponse = useCallback(
    (res: any) => {
      const itemsArray =
        Array.isArray(res?.items) && res.items.length > 0
          ? res.items
          : Array.isArray(res?.data?.items) && res.data.items.length > 0
          ? res.data.items
          : res?.item
          ? [res.item]
          : res?.data?.item
          ? [res.data.item]
          : [];

      const normalizedItems = itemsArray.map(normalizeCheckoutItem);

      const data = res?.data ?? res ?? {};
      const reward = data?.reward ?? res?.reward ?? {};
      const toAmount = (value: any) => Number(value) || 0;

      const productTotal = toAmount(data?.productTotal ?? res?.productTotal);
      const shippingBreakdown =
        (Array.isArray(data?.shippingBreakdown) && data.shippingBreakdown) ||
        (Array.isArray(res?.shippingBreakdown) && res.shippingBreakdown) ||
        [];
      const breakdownShippingTotal = shippingBreakdown.reduce(
        (sum: number, entry: any) => sum + toAmount(entry?.shipping_charges),
        0,
      );
      const shippingTotal = toAmount(
        data?.shippingTotal ?? res?.shippingTotal ?? breakdownShippingTotal,
      );
      const payableAmount = toAmount(data?.payableAmount ?? res?.payableAmount);
      const summary: CheckoutSummary = {
        productTotal,
        shippingTotal,
        payableAmount,
        reward: {
          redeemCoins: toAmount(
            reward?.redeemCoins ??
              reward?.redeemedCoins ??
              data?.totalDiscount ??
              res?.totalDiscount,
          ),
          earnCoins: toAmount(reward?.earnCoins),
        },
      };

      return {
        items: normalizedItems,
        summary,
      };
    },
    [normalizeCheckoutItem],
  );

  const selectAddress = useCallback((res: any) => {
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
    return (
      list.find((a: any) => Number(a?.is_default) === 1) || list[0] || null
    );
  }, []);

  const checkoutQueryKey = useMemo(
    () =>
      checkoutPreviewQueryKey({
        mode,
        product_id,
        variant_id,
        qty: buyNowQty,
        use_rewards: useRewards,
      }),
    [mode, product_id, variant_id, buyNowQty, useRewards],
  );

  const {
    data: address,
    isFetching: isAddressFetching,
    error: addressError,
  } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    select: selectAddress,
  });

  const {
    data: checkoutData,
    isFetching: isCheckoutFetching,
    error: checkoutError,
  } = useQuery({
    queryKey: checkoutQueryKey,
    queryFn: async () => {
      if (mode === 'buy_now') {
        return fetchBuyNowCheckout(
          product_id,
          variant_id,
          buyNowQty,
          useRewards,
        );
      }
      return fetchCheckoutCart(useRewards);
    },
    enabled: isAuthenticated && isBuyNowValid,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
    // Reward toggles change the query key. Retain the current checkout preview
    // while the reward totals refresh so shipping and delivery details do not
    // disappear or jump back to the full-screen skeleton.
    placeholderData: previousData => previousData,
    select: parseCheckoutResponse,
    retry: (failureCount, error: any) => {
      const status = Number(error?.response?.status || 0);
      return status >= 500 && failureCount < 1;
    },
    throwOnError: false,
  });

  // An addressless preview has no shipping charge. When an address is added,
  // removed, or changed, force a fresh preview so shipping and EDD are not
  // reused from the previous cached response.
  const previousAddressIdRef = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    if (isAddressFetching) return;

    const currentAddressId = address
      ? Number(address?.address_id ?? address?.id) || null
      : null;

    if (previousAddressIdRef.current === undefined) {
      previousAddressIdRef.current = currentAddressId;
      return;
    }

    if (previousAddressIdRef.current !== currentAddressId) {
      previousAddressIdRef.current = currentAddressId;
      queryClient
        .invalidateQueries({ queryKey: checkoutQueryKey })
        .catch(() => {});
    }
  }, [address, checkoutQueryKey, isAddressFetching, queryClient]);

  const addressLine = [
    address?.address1,
    address?.city,
    address?.state || address?.state_name,
    address?.zipcode,
  ]
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    const status = Number((checkoutError as any)?.response?.status);
    if (status === 401) {
      handleUnauthorized();
    }
  }, [checkoutError, handleUnauthorized]);

  useEffect(() => {
    if (
      !hasCheckoutStarted &&
      (isCheckoutFetching || checkoutData || checkoutError)
    ) {
      setHasCheckoutStarted(true);
    }
  }, [hasCheckoutStarted, isCheckoutFetching, checkoutData, checkoutError]);

  useEffect(() => {
    if (!checkoutData || items.length === 0) {
      setShowRecommendations(false);
      return undefined;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      setShowRecommendations(true);
    });

    return () => task.cancel();
  }, [checkoutData, items.length]);

  useEffect(() => {
    const status = Number((addressError as any)?.response?.status);
    if (status === 401) {
      handleUnauthorized();
    }
  }, [addressError, handleUnauthorized]);

  const prevCheckoutDataRef = useRef<typeof checkoutData>(undefined);
  useEffect(() => {
    if (prevCheckoutDataRef.current === checkoutData) {
      return;
    }

    prevCheckoutDataRef.current = checkoutData;
    if (checkoutData) {
      if (!skipItemsRefresh.current) {
        setItems(Array.isArray(checkoutData.items) ? checkoutData.items : []);
      }
      skipItemsRefresh.current = false;
      setCartSummary(prev => {
        const s = checkoutData.summary;
        if (!s) return prev;
        if (
          prev.productTotal === s.productTotal &&
          prev.shippingTotal === s.shippingTotal &&
          prev.payableAmount === s.payableAmount &&
          prev.reward.redeemCoins === s.reward.redeemCoins &&
          prev.reward.earnCoins === s.reward.earnCoins
        )
          return prev;
        return s;
      });
    } else {
      setItems(prev => (prev.length === 0 ? prev : []));
      setCartSummary(prev =>
        prev.productTotal === 0 &&
        prev.shippingTotal === 0 &&
        prev.payableAmount === 0 &&
        prev.reward.redeemCoins === 0 &&
        prev.reward.earnCoins === 0
          ? prev
          : emptyCheckoutSummary(),
      );
    }
  }, [checkoutData]);

  const checkoutPayableAmount = useMemo(() => {
    return getCheckoutPayableAmount(cartSummary);
  }, [cartSummary]);

  const latestRedeemableCoins = Math.max(
    0,
    Number(
      checkoutData?.summary?.reward?.redeemCoins ??
        cartSummary.reward.redeemCoins ??
        0,
    ),
  );

  if (useRewards && checkoutData) {
    lastRedeemableCoins.current = latestRedeemableCoins;
  }

  const rewardCoinsAvailable = useRewards
    ? latestRedeemableCoins
    : lastRedeemableCoins.current;

  useEffect(() => {
    if (
      checkoutData &&
      checkoutData.items.length > 0 &&
      useRewards &&
      checkoutData.summary.reward.redeemCoins <= 0
    ) {
      setUseRewards(false);
    }
  }, [checkoutData, useRewards]);

  const relatedProductId = mode === 'buy_now' ? product_id : undefined;

  const checkoutItemCount = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Math.max(1, Number(item?.quantity || 1)),
      0,
    );
  }, [items]);

  const markCartAsCleared = useCallback(() => {
    const emptySummary = emptyCheckoutSummary();
    const emptyCartSummary = {
      cartTotal: 0,
      finalPayable: 0,
      totalRewardEarn: 0,
      totalRedeemed: 0,
    };

    setItems([]);
    setCartSummary(emptySummary);
    queryClient.setQueryData(cartItemsQueryKey, { items: [] });
    queryClient.setQueryData(cartSummaryQueryKey(true), emptyCartSummary);
    queryClient.setQueryData(cartSummaryQueryKey(false), emptyCartSummary);
    const emptyCheckoutData = {
      items: [],
      summary: emptySummary,
    };
    queryClient.setQueryData(
      checkoutPreviewQueryKey({ mode: 'cart', use_rewards: true }),
      emptyCheckoutData,
    );
    queryClient.setQueryData(
      checkoutPreviewQueryKey({ mode: 'cart', use_rewards: false }),
      emptyCheckoutData,
    );
  }, [queryClient]);

  const navigateToOrderConfirm = useCallback(
    (orderId: number) => {
      __DEV__ &&
        console.log('🚀 Navigating to OrderConfirm with order_id:', orderId);

      try {
        // ✅ Use CommonActions.reset to completely reset navigation stack
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: 'Home' },
              {
                name: 'OrderConfirm',
                params: { order_id: orderId },
              },
            ],
          }),
        );
        return true;
      } catch (error) {
        console.error('❌ Navigation failed with CommonActions.reset:', error);
      }

      // Fallback: Try StackActions.replace
      try {
        navigation.dispatch(
          StackActions.replace('OrderConfirm', { order_id: orderId }),
        );
        return true;
      } catch (error) {
        console.error('❌ Navigation failed with StackActions.replace:', error);
      }

      // Final fallback: Direct navigate
      try {
        navigation.navigate('OrderConfirm', { order_id: orderId } as any);
        return true;
      } catch (error) {
        console.error('❌ All navigation attempts failed:', error);
      }

      return false;
    },
    [navigation],
  );

  const handleEmptyCheckoutBack = useCallback(() => {
    isSkippingEmptyCheckoutBack.current = true;
    const state = navigation.getState();

    if (state.index >= 2) {
      navigation.dispatch(StackActions.pop(2));
      return;
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      }),
    );
  }, [navigation]);

  const exitBuyNowCheckout = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Home');
  }, [navigation]);

  const handlePlaceOrder = async () => {
    if (isCreatingOrder.current) {
      __DEV__ &&
        console.log('⏸️ Order creation already in progress (ref guard)');
      return;
    }
    let createdOrderId: number | null = null;
    const cartSnapshot =
      mode !== 'buy_now'
        ? items
            .map(item => ({
              product_id: Number(item.product_id),
              variant_id: Number(item.variant_id),
              quantity: Number(item.quantity ?? 1),
            }))
            .filter(
              item =>
                Number.isFinite(item.product_id) &&
                item.product_id > 0 &&
                Number.isFinite(item.variant_id) &&
                item.variant_id > 0,
            )
        : [];

    const restoreCartAfterPaymentFailure = async () => {
      if (mode === 'buy_now' || cartSnapshot.length === 0) {
        return;
      }

      try {
        const existingCart = await fetchCartItems();
        const existingItems = existingCart?.items || existingCart?.data || [];

        if (Array.isArray(existingItems) && existingItems.length > 0) {
          __DEV__ &&
            console.log(
              'ℹ️ Cart already has items after payment failure, skipping restore',
            );
          await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
          return;
        }

        for (const cartItem of cartSnapshot) {
          await addToCart(cartItem);
        }

        __DEV__ && console.log('↩️ Cart restored after payment failure/cancel');
        await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
      } catch (restoreErr) {
        console.error(
          '❌ Failed to restore cart after payment failure:',
          restoreErr,
        );
      }
    };

    const cancelOrderAndRestoreCart = async (orderId: number) => {
      try {
        await cancelPendingPaymentOrder(orderId);
        await restoreCartAfterPaymentFailure();
        return true;
      } catch (cancelError: any) {
        const responseStatus = Number(cancelError?.response?.status ?? 0);
        const orderStatus = String(
          cancelError?.response?.data?.status ?? '',
        ).toLowerCase();

        // Cancellation is intentionally idempotent from the checkout UI's
        // perspective. A 404 means the unpaid order has already been removed
        // or expired, while these terminal states can no longer capture a
        // payment. In either case it is safe to restore the cart and keep the
        // customer on checkout instead of opening a now-missing order.
        if (
          responseStatus === 404 ||
          ['cancelled', 'canceled', 'expired', 'failed'].includes(orderStatus)
        ) {
          await restoreCartAfterPaymentFailure();
          return true;
        }

        // The order may already have been paid by the webhook. Restoring the
        // cart in that state could create a duplicate purchase.
        console.error('Failed to release pending order:', cancelError);
        return false;
      }
    };

    try {
      if (placing) {
        __DEV__ && console.log('⏸️ Order placement already in progress');
        return;
      }
      isCreatingOrder.current = true;
      setPlacing(true);

      const t0 = performance.now();
      __DEV__ && console.log('🕐 [t=0ms] Checkout tap');

      const selectedAddressId = address?.address_id ?? address?.id;
      if (!selectedAddressId) {
        isCreatingOrder.current = false;
        setPlacing(false);
        Alert.alert('Select Address', 'Please select an address.');
        return;
      }

      __DEV__ &&
        console.log(
          '📦 Creating order...',
          `[t=${(performance.now() - t0).toFixed(0)}ms]`,
        );

      // Re-fetch with the selected address so the anti-tamper totals use the
      // latest server-side price, rewards, and shipping quote.
      const latestCheckoutData = await queryClient.fetchQuery({
        queryKey: checkoutQueryKey,
        queryFn: async () => {
          if (mode === 'buy_now') {
            return fetchBuyNowCheckout(
              product_id,
              variant_id,
              buyNowQty,
              useRewards,
              safeToNumber(selectedAddressId),
            );
          }
          return fetchCheckoutCart(useRewards, safeToNumber(selectedAddressId));
        },
        staleTime: 0,
      });
      const latestSummary = parseCheckoutResponse(latestCheckoutData).summary;
      const expectedPrice = getCheckoutPayableAmount(latestSummary);

      __DEV__ &&
        console.log('🧾 Checkout expected price:', {
          expectedPrice,
          useRewards,
          productTotal: latestSummary.productTotal,
          shippingTotal: latestSummary.shippingTotal,
          payableAmount: latestSummary.payableAmount,
        });

      let orderRes;
      if (mode === 'buy_now' && product_id && variant_id) {
        const buyNowOrderPayload = {
          product_id: safeToNumber(product_id),
          variant_id: safeToNumber(variant_id),
          quantity: buyNowQty,
          address_id: safeToNumber(selectedAddressId),
          expected_total: safeToNumber(expectedPrice),
          expected_redeemable: useRewards
            ? safeToNumber(latestSummary.reward?.redeemCoins)
            : 0,
          use_rewards: useRewards,
        };
        __DEV__ && console.log('📤 Buy Now order payload:', buyNowOrderPayload);
        orderRes = await addBuyNowOrder(buyNowOrderPayload);
      } else {
        const cartOrderPayload = {
          address_id: safeToNumber(selectedAddressId),
          expected_total: safeToNumber(expectedPrice),
          expected_redeemable: useRewards
            ? safeToNumber(latestSummary.reward?.redeemCoins)
            : 0,
          use_rewards: useRewards,
        };
        __DEV__ && console.log('📤 Cart order payload:', cartOrderPayload);
        orderRes = await addCartOrder(cartOrderPayload);
      }

      if (orderRes?.success === false) {
        isCreatingOrder.current = false;
        setPlacing(false);
        const serverMessage =
          orderRes.message ||
          orderRes.error ||
          orderRes.details ||
          'Checkout failed';
        console.error(
          '❌ Order API returned failure:',
          serverMessage,
          orderRes,
        );
        alert.error('Checkout Failed', String(serverMessage));
        return;
      }

      const orderId = Number(
        orderRes?.order_id ??
          orderRes?.orderId ??
          orderRes?.data?.order_id ??
          orderRes?.data?.orderId,
      );
      createdOrderId = Number.isFinite(orderId) && orderId > 0 ? orderId : null;

      if (!Number.isFinite(orderId) || orderId <= 0) {
        isCreatingOrder.current = false;
        setPlacing(false);
        __DEV__ && console.log('Order ID missing');
        alert.error('Order Error', 'Order ID missing. Please try again.');
        return;
      }

      const paymentAmount = expectedPrice;

      __DEV__ &&
        console.log(
          '✅ Order created:',
          orderId,
          'Amount:',
          paymentAmount,
          `[t=${(performance.now() - t0).toFixed(0)}ms]`,
        );

      // ✅ Step 2: Create Payment Order with Razorpay
      const paymentData = await createPaymentOrder(orderId);
      __DEV__ &&
        console.log(
          '💳 Payment order created:',
          paymentData,
          `[t=${(performance.now() - t0).toFixed(0)}ms]`,
        );

      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        order_id: paymentData.orderId,
        name: 'Reward Planners',
        description: 'Order Payment',
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: formatPhoneForRazorpay(user?.phone),
        },
        theme: { color: '#8665FF' },
      };

      __DEV__ &&
        console.log(
          '🚀 Opening Razorpay...',
          `[t=${(performance.now() - t0).toFixed(0)}ms]`,
        );
      // ✅ Step 3: Open Razorpay Checkout
      RazorpayCheckout.open(options)
        .then(async response => {
          __DEV__ && console.log('💰 Payment successful:', response);

          try {
            // ✅ Step 4: Verify payment
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            __DEV__ && console.log('🔐 Verification response:', verifyRes);

            if (isPaymentVerified(verifyRes)) {
              // ✅ Payment verified, proceed with success flow
              if (mode !== 'buy_now') {
                try {
                  await deleteAllCartItems();
                  markCartAsCleared();
                  __DEV__ && console.log('🧹 Cart cleared');
                } catch (clearErr) {
                  console.error('❌ Cart clear failed:', clearErr);
                }
              }

              isCreatingOrder.current = false;
              setPlacing(false);
              navigateToOrderConfirm(orderId);
              return;
            }

            // Verification is webhook-backed, so allow Razorpay's
            // asynchronous webhook time to finalise the order.
            __DEV__ &&
              console.log('⚠️ Verification failed, checking payment status...');
            const statusResult = await pollForFinalPaymentStatus(orderId);
            __DEV__ &&
              console.log('📊 Payment status check:', statusResult.response);

            if (statusResult.outcome === 'paid') {
              // ✅ Status check passed
              if (mode !== 'buy_now') {
                try {
                  await deleteAllCartItems();
                  markCartAsCleared();
                  __DEV__ && console.log('🧹 Cart cleared after status check');
                } catch (clearErr) {
                  console.error('❌ Cart clear failed:', clearErr);
                }
              }

              isCreatingOrder.current = false;
              setPlacing(false);
              navigateToOrderConfirm(orderId);
              return;
            }

            isCreatingOrder.current = false;
            setPlacing(false);

            if (statusResult.outcome === 'pending') {
              alert.info(
                'Payment Processing',
                'Do not pay again; check this order shortly.',
              );
              navigateToOrderConfirm(orderId);
              return;
            }

            const released = await cancelOrderAndRestoreCart(orderId);
            if (released) {
              alert.error(
                'Payment Failed',
                'The payment was not completed. Your cart has been restored.',
              );
            } else {
              alert.info(
                'Payment Status Pending',
                'Check your order before trying another payment.',
              );
              navigateToOrderConfirm(orderId);
            }
          } catch (verifyError) {
            console.error('❌ Payment verification error:', verifyError);
            try {
              const statusResult = await pollForFinalPaymentStatus(orderId);
              isCreatingOrder.current = false;
              setPlacing(false);
              if (statusResult.outcome === 'paid') {
                if (mode !== 'buy_now') markCartAsCleared();
                navigateToOrderConfirm(orderId);
              } else if (statusResult.outcome === 'pending') {
                alert.info(
                  'Payment Processing',
                  'Do not pay again; check this order shortly.',
                );
                navigateToOrderConfirm(orderId);
              } else {
                const released = await cancelOrderAndRestoreCart(orderId);
                if (released) {
                  alert.error(
                    'Payment Failed',
                    'The payment was not completed. Your cart has been restored.',
                  );
                } else {
                  alert.info(
                    'Payment Status Pending',
                    'Check your order before trying another payment.',
                  );
                  navigateToOrderConfirm(orderId);
                }
              }
            } catch (statusError) {
              isCreatingOrder.current = false;
              setPlacing(false);
              console.error('Payment status unavailable:', statusError);
              alert.info(
                'Payment Status Unavailable',
                'Do not pay again yet. Please check your order after a few minutes.',
              );
              navigateToOrderConfirm(orderId);
            }
          }
        })
        .catch(async (error: any) => {
          isCreatingOrder.current = false;
          setPlacing(false);
          console.error('❌ Payment cancelled/failed:', error);

          const errorCode = String(error?.code ?? '');
          let errorText =
            error?.error?.description ||
            error?.description ||
            error?.message ||
            '';

          // Try to parse nested error descriptions
          if (
            typeof error?.description === 'string' &&
            error.description.trim().startsWith('{')
          ) {
            try {
              const parsed = JSON.parse(error.description);
              errorText =
                parsed?.error?.description ||
                parsed?.error?.reason ||
                errorText;
            } catch {
              // Keep fallback text if parsing fails
            }
          }

          if (!errorText || String(errorText).toLowerCase() === 'undefined') {
            errorText = 'Payment failed during authentication. Please retry.';
          }

          const isUserCancelled =
            errorCode === '0' ||
            errorCode === '1' ||
            /cancel|cancelled|dismiss|closed|back/i.test(String(errorText));

          if (isUserCancelled) {
            __DEV__ && console.log('👤 User cancelled payment');
            const released = await cancelOrderAndRestoreCart(orderId);
            if (released) {
              alert.warning(
                'Payment Cancelled',
                'You cancelled the payment. Your cart has been restored.',
              );
            } else {
              alert.info(
                'Payment Status Pending',
                'Check your order before paying again.',
              );
              navigateToOrderConfirm(orderId);
            }
            return;
          }

          // Payment failed
          const released = await cancelOrderAndRestoreCart(orderId);
          if (released) {
            alert.error('Payment Failed', String(errorText));
          } else {
            alert.info(
              'Payment Status Pending',
              'Check your order before trying another payment.',
            );
            navigateToOrderConfirm(orderId);
          }
        });
    } catch (e: any) {
      isCreatingOrder.current = false;
      setPlacing(false);

      if (Number(e?.response?.status) === 401) {
        await handleUnauthorized();
        return;
      }

      console.error(
        '❌ Order/Payment failed:',
        e?.response?.data || e?.message || e,
      );

      if (createdOrderId) {
        await cancelOrderAndRestoreCart(createdOrderId);
      }

      const serverMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.response?.data?.details ||
        'Failed to place order';
      alert.error('Error', String(serverMessage));
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      alertRef.current.info(
        'Login Required',
        'Please login to continue checkout.',
      );
      navigation.goBack();
    }
  }, [isAuthenticated, navigation]);

  const increaseQty = async (item: any) => {
    const newQty = item.quantity + 1;

    if (Number.isFinite(Number(item?.stock)) && newQty > Number(item.stock)) {
      alert.warning('Stock Limit', 'Only limited stock available');
      return;
    }

    if (mode === 'buy_now') {
      setBuyNowQty(newQty);
      setItems(prev => prev.map(i => ({ ...i, quantity: newQty })));
      return;
    }

    // Optimistic update before API call
    setItems(p =>
      p.map(i =>
        i.cart_item_id === item.cart_item_id ? { ...i, quantity: newQty } : i,
      ),
    );
    try {
      await updateCartQty(item.cart_item_id, newQty);
      skipItemsRefresh.current = true;
      await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
    } catch {
      // Revert on failure
      setItems(p =>
        p.map(i =>
          i.cart_item_id === item.cart_item_id
            ? { ...i, quantity: item.quantity }
            : i,
        ),
      );
      alert.error(
        'Update Failed',
        'Could not update quantity. Please try again.',
      );
    }
  };

  const decreaseQty = async (item: any) => {
    if (item.quantity <= 1) return;
    const newQty = item.quantity - 1;

    if (mode === 'buy_now') {
      setBuyNowQty(Math.max(1, newQty));
      setItems(prev =>
        prev.map(i => ({ ...i, quantity: Math.max(1, newQty) })),
      );
      return;
    }

    // Optimistic update before API call
    setItems(p =>
      p.map(i =>
        i.cart_item_id === item.cart_item_id ? { ...i, quantity: newQty } : i,
      ),
    );
    try {
      await updateCartQty(item.cart_item_id, newQty);
      skipItemsRefresh.current = true;
      await queryClient.invalidateQueries({ queryKey: checkoutQueryKey });
    } catch {
      // Revert on failure
      setItems(p =>
        p.map(i =>
          i.cart_item_id === item.cart_item_id
            ? { ...i, quantity: item.quantity }
            : i,
        ),
      );
      alert.error(
        'Update Failed',
        'Could not update quantity. Please try again.',
      );
    }
  };

  const removeItem = async (item: any) => {
    if (mode === 'buy_now') {
      exitBuyNowCheckout();
      return;
    }

    setItems(p => p.filter(i => i.cart_item_id !== item.cart_item_id));
    try {
      await removeFromCart(item.cart_item_id);
    } catch (err) {
      console.error('Error removing item from cart:', err);
      // Restore item on error
      setItems(p => [...p, item]);
    }
  };

  const removeAll = async () => {
    if (mode === 'buy_now') {
      exitBuyNowCheckout();
      return;
    }

    await deleteAllCartItems();
    markCartAsCleared();
  };

  const checkoutDataItems = Array.isArray(checkoutData?.items)
    ? checkoutData.items
    : [];
  const checkoutHasItemsPendingSync =
    checkoutDataItems.length > 0 && items.length === 0;
  const isEmptyCheckoutState =
    items.length === 0 &&
    checkoutDataItems.length === 0 &&
    hasCheckoutStarted &&
    !isCheckoutFetching &&
    checkoutData !== undefined &&
    mode !== 'buy_now';

  useFocusEffect(
    useCallback(() => {
      if (!isEmptyCheckoutState) {
        return undefined;
      }

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleEmptyCheckoutBack();
          return true;
        },
      );

      return () => subscription.remove();
    }, [handleEmptyCheckoutBack, isEmptyCheckoutState]),
  );

  useEffect(() => {
    if (!isEmptyCheckoutState) {
      isSkippingEmptyCheckoutBack.current = false;
      return undefined;
    }

    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (isSkippingEmptyCheckoutBack.current) {
        return;
      }

      event.preventDefault();
      handleEmptyCheckoutBack();
    });

    return unsubscribe;
  }, [handleEmptyCheckoutBack, isEmptyCheckoutState, navigation]);

  const loading =
    isAuthenticated &&
    (!isBuyNowValid ||
      !hasCheckoutStarted ||
      (isCheckoutFetching && checkoutData === undefined) ||
      (hasCheckoutStarted && checkoutData === undefined && !checkoutError) ||
      checkoutHasItemsPendingSync ||
      (mode === 'buy_now' &&
        isBuyNowValid &&
        items.length === 0 &&
        !checkoutError));

  if (loading) {
    return (
      <View
        style={[styles.loadingWrapper, { backgroundColor: theme.background }]}
      >
        <View style={styles.checkoutSkeletonCard}>
          <SkeletonBox
            pulse={pulse}
            width="60%"
            height={24}
            borderRadius={10}
          />
          <SkeletonBox
            pulse={pulse}
            width="100%"
            height={84}
            borderRadius={14}
            style={styles.checkoutSkeletonGap}
          />
          <SkeletonBox
            pulse={pulse}
            width="100%"
            height={112}
            borderRadius={14}
            style={styles.checkoutSkeletonGap}
          />
          <SkeletonBox
            pulse={pulse}
            width="100%"
            height={112}
            borderRadius={14}
            style={styles.checkoutSkeletonGap}
          />
          <SkeletonBox
            pulse={pulse}
            width="88%"
            height={50}
            borderRadius={12}
            style={styles.checkoutSkeletonGapLg}
          />
        </View>
      </View>
    );
  }

  if (isEmptyCheckoutState) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ProductHeadColor
          title="Cart"
          onBackPress={handleEmptyCheckoutBack}
          showSearch={false}
          isDark={isDark}
        />
        <EmptyCart
          message="Your cart is empty. Add products to continue."
          onBrowse={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProductHeadColor
        title="Checkout"
        onBackPress={() => navigation.goBack()}
        showSearch={false}
        isDark={isDark}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: stickyCTA.scrollContentPaddingBottom },
        ]}
      >
        <View style={styles.scrollPadding}>
          {/* Step Counter */}
          <View style={styles.stepRow}>
            <Step status="done" label="Address" />
            <Line />
            <Step status="current" label="Order Summary" />
            <Line />
            <Step status="upcoming" label="Payment" />
          </View>

          {/* Address Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name="home-variant"
                size={30}
                color={theme.text}
                style={styles.homeIcon}
              />

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    {address
                      ? `Delivering to ${address.contact_name || 'User'}`
                      : 'Delivery address'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AddressSelect')}
                  >
                    <Text style={styles.change}>
                      {address ? 'Change' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.address, { color: theme.secondaryText }]}>
                  {address
                    ? addressLine || 'No address selected'
                    : 'No address selected'}
                </Text>
              </View>
            </View>
          </View>

          {/* Select/Remove Row */}
          {mode !== 'buy_now' && items.length > 0 && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={removeAll}>
                <Text style={styles.actionDanger}>Remove all</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cart Items */}
          {items.map((item, index) => (
            <CheckoutItemCart
              key={String(
                item.cart_item_id ??
                  `${item.product_id ?? 'p'}-${
                    item.variant_id ?? 'v'
                  }-${index}`,
              )}
              item={item}
              onIncrease={() => increaseQty(item)}
              onDecrease={() => decreaseQty(item)}
              onRemove={() => removeItem(item)}
              onPress={() =>
                Number(item?.product_id) > 0 &&
                navigation.navigate('ProductDescription', {
                  productId: Number(item.product_id),
                })
              }
            />
          ))}

          {/* Coupons */}
          {/* <View style={styles.wrapper}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Coupons and Offers</Text>
              <TouchableOpacity onPress={() => setShowAllCoupons((p) => !p)}>
                <Text style={styles.viewAllText}>{showAllCoupons ? "Hide" : "View All"}</Text>
              </TouchableOpacity>
            </View>

            <CouponsSection coupons={showAllCoupons ? COUPONS : COUPONS.slice(0, 1)} />
          </View> */}

          <BillDetailsCard
            cartTotal={cartSummary.productTotal}
            finalPayable={cartSummary.payableAmount}
            totalRedeemed={cartSummary.reward.redeemCoins}
            totalRewardEarn={cartSummary.reward.earnCoins}
            shippingCharges={cartSummary.shippingTotal}
            shippingLabel="Shipping Fee"
            bagDiscount={0}
            handlingFees={0}
            showHandlingFees
            rewardCoinsAvailable={rewardCoinsAvailable}
            useRewards={useRewards}
            onUseRewardsChange={setUseRewards}
          />

          {/* <PaymentOptionsUI /> */}
        </View>

        {showRecommendations && (
          <>
            <RecommendedProducts />
            {relatedProductId ? (
              <View style={styles.relatedSection}>
                <Text style={[styles.relatedTitle, { color: theme.text }]}>
                  Related Products
                </Text>
                <ProductGrid
                  key={`related-${relatedProductId}`}
                  useFlatList={false}
                  relatedProductId={relatedProductId}
                  take={8}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <OrderProcedbutton
        total={checkoutPayableAmount}
        count={checkoutItemCount}
        loading={placing}
        onPlaceOrder={handlePlaceOrder}
        bottomOffset={0}
        onLayout={stickyCTA.onCtaLayout}
      />
    </View>
  );
}

/* Step circle */
const Step = ({ status, label }: { status: StepStatus; label: string }) => {
  const isDone = status === 'done';
  const isCurrent = status === 'current';

  return (
    <View style={styles.stepWrap}>
      {isDone ? (
        <LinearGradient colors={[PURPLE_1, PURPLE_2]} style={styles.stepCircle}>
          <Text style={styles.stepTick}>✓</Text>
        </LinearGradient>
      ) : isCurrent ? (
        <View style={styles.stepCurrentOuter}>
          <View style={styles.stepCurrentInner} />
        </View>
      ) : (
        <View style={styles.stepUpcoming} />
      )}

      <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

/* Connecting line */
const Line = () => <View style={styles.line} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingTop: 14, paddingBottom: 24 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepWrap: { alignItems: 'center', width: 90 },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTick: { color: '#fff', fontWeight: '800', fontSize: 12, marginTop: -1 },
  stepCurrentOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PURPLE_1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCurrentInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE_1,
  },
  stepUpcoming: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GREY_DOT,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: TEXT_GREY,
    fontWeight: '500',
  },
  stepLabelActive: { color: '#111', fontWeight: '700' },
  line: {
    height: 3,
    width: 42,
    borderRadius: 2,
    backgroundColor: GREY_LINE,
    marginHorizontal: 2,
    marginTop: -12,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  checkoutSkeletonCard: {
    width: '100%',
  },
  checkoutSkeletonGap: {
    marginTop: 14,
  },
  checkoutSkeletonGapLg: {
    marginTop: 22,
  },
  card: {
    backgroundColor: '#FFFBF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    padding: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  homeIcon: { marginTop: 2, marginRight: 10 },
  cardContent: { flex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    paddingRight: 10,
  },
  change: { fontSize: 14, fontWeight: '800', color: PURPLE_1 },
  address: { marginTop: 6, fontSize: 13, color: '#555', lineHeight: 18 },
  actionsRow: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3585FF',
  },
  actionDanger: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3585FF',
  },

  wrapper: { paddingHorizontal: 14, marginTop: 10 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  headerText: { fontSize: 15, fontWeight: '700', color: '#111' },

  viewAllText: { fontSize: 14, fontWeight: '700', color: '#3585FF' },
  scrollPadding: { paddingHorizontal: 16 },
  relatedSection: {
    marginTop: 10,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
});
