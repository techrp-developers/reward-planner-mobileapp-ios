import { queryClient } from "../../../query/queryClient";
import { fetchProductDetailsByID } from "../api/ProductApi";
import { fetchCartItems } from "../api/CartApi";
import { fetchAllAddress } from "../api/AddressApi";
import { fetchBuyNowCheckout, fetchCheckoutCart } from "../api/CheckoutApi";

const PRODUCT_DETAILS_STALE_TIME = 5 * 60 * 1000;
const CART_STALE_TIME = 10 * 60 * 1000;

export const cartItemsQueryKey = ["ecommerce", "cart-items"] as const;
export const addressesQueryKey = ["ecommerce", "addresses"] as const;
export const cartSummaryQueryKey = (useRewards: boolean) =>
  ["ecommerce", "cart-summary", useRewards] as const;

export const checkoutPreviewQueryKey = (params?: {
  mode?: "buy_now" | "cart";
  product_id?: number | string;
  variant_id?: number | string;
  qty?: number;
  use_rewards?: boolean;
}) => {
  const useRewards = params?.use_rewards ?? true;

  if (params?.mode === "buy_now") {
    return [
      "ecommerce",
      "checkout-preview",
      "buy_now",
      String(params?.product_id ?? ""),
      String(params?.variant_id ?? ""),
      String(params?.qty ?? 1),
      useRewards,
    ] as const;
  }

  return ["ecommerce", "checkout-preview", "cart", useRewards] as const;
};

export const productDetailsQueryKey = (productId: number | string) => [
  "ecommerce",
  "product-details",
  String(productId),
] as const;

type NavigateWithPrefetchOptions = {
  navigate: () => void;
  queryKey?: readonly unknown[];
  queryFn?: () => Promise<unknown>;
  staleTime?: number;
};

export const handleNavigateWithPrefetch = ({
  navigate,
  queryKey,
  queryFn,
  staleTime = PRODUCT_DETAILS_STALE_TIME,
}: NavigateWithPrefetchOptions) => {
  if (queryKey && queryFn) {
    queryClient
      .prefetchQuery({
        queryKey,
        queryFn,
        staleTime,
      })
      .catch(() => {
        // Ignore prefetch errors and continue navigation flow.
      });
  }

  // Route changes must never wait for animations or background prefetching.
  // The destination can render its skeleton while the query fills the cache.
  navigate();
};

export const prefetchProductDetails = (productId: number | string) => {
  return queryClient.prefetchQuery({
    queryKey: productDetailsQueryKey(productId),
    queryFn: () => fetchProductDetailsByID(productId),
    staleTime: PRODUCT_DETAILS_STALE_TIME,
  });
};

export const prefetchCartItems = () => {
  return queryClient.prefetchQuery({
    queryKey: cartItemsQueryKey,
    queryFn: fetchCartItems,
    staleTime: CART_STALE_TIME,
  });
};

export const prefetchAddresses = () => {
  return queryClient.prefetchQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    staleTime: CART_STALE_TIME,
  });
};

export const prefetchCartScreenData = async () => {
  await Promise.allSettled([prefetchCartItems(), prefetchAddresses()]);
};

export const prefetchCheckoutPreview = (params?: {
  mode?: "buy_now" | "cart";
  product_id?: number | string;
  variant_id?: number | string;
  qty?: number;
  use_rewards?: boolean;
}) => {
  const mode = params?.mode === "buy_now" ? "buy_now" : "cart";
  const useRewards = params?.use_rewards ?? true;

  if (mode === "buy_now") {
    const productId = Number(params?.product_id);
    const variantId = Number(params?.variant_id);
    const qty = Math.max(1, Number(params?.qty ?? 1));

    if (!productId || !variantId) {
      return Promise.resolve(undefined);
    }

    return queryClient.prefetchQuery({
      queryKey: checkoutPreviewQueryKey({
        mode,
        product_id: productId,
        variant_id: variantId,
        qty,
        use_rewards: useRewards,
      }),
      queryFn: () => fetchBuyNowCheckout(productId, variantId, qty, useRewards),
      staleTime: CART_STALE_TIME,
    });
  }

  return queryClient.prefetchQuery({
    queryKey: checkoutPreviewQueryKey({ mode: "cart", use_rewards: useRewards }),
    queryFn: () => fetchCheckoutCart(useRewards),
    staleTime: CART_STALE_TIME,
  });
};

export const prefetchCheckoutScreenData = async (params?: {
  mode?: "buy_now" | "cart";
  product_id?: number | string;
  variant_id?: number | string;
  qty?: number;
  use_rewards?: boolean;
}) => {
  await Promise.allSettled([
    prefetchAddresses(),
    prefetchCheckoutPreview(params),
  ]);
};
