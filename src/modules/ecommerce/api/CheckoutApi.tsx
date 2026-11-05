// src/api/CheckoutApi.ts
import api from "../../common/auth/api/axios";

/* ================= TYPES ================= */
import type { DeliveryPreference } from '../utils/checkoutDelivery';
export type { DeliveryChoice, DeliveryPreference } from '../utils/checkoutDelivery';

// The checkout API validates delivery_preference as cheapest|fastest; older
// deployments ignore the unknown param and quote their default courier.
const deliveryParams = (preference?: DeliveryPreference) =>
  preference === undefined ? {} : { delivery_preference: preference };

export type CartOrderPayload = {
  delivery_preference?: DeliveryPreference;
  address_id: number;
  expected_total: number;
  expected_redeemable: number;
  use_rewards: boolean;
};

export type BuyNowPayload = {
  delivery_preference?: DeliveryPreference;
  product_id: number;
  variant_id: number;
  quantity: number;
  campaign_id?: number | null;
  content_id?: number | null;
  address_id: number;

  expected_total: number;
  expected_redeemable: number;

  use_rewards: boolean;
};
/* ================= CART ================= */

/**
 * Place order for all cart items (address_id optional)
 */
export const addCartOrder = async (payload?: CartOrderPayload) => {
  const res = await api.post("/v1/checkout/cart", payload);
  return res.data;
};

/**
 * Fetch cart checkout preview
 */
export const fetchCheckoutCart = async (useRewards = true, addressId?: number, deliveryPreference?: DeliveryPreference) => {
  try {
    const res = await api.get("/v1/checkout/get-cart", {
      params: { use_rewards: useRewards, address_id: addressId, ...deliveryParams(deliveryPreference) },
    });
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);
    const message = String(
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      ""
    ).toUpperCase();

    if (
      status === 400 &&
      (message.includes("CART_EMPTY") || message.includes("CART IS EMPTY"))
    ) {
      return { items: [], data: { items: [] } };
    }

    throw error;
  }
};

/* ================= BUY NOW ================= */
export const addBuyNowOrder = async (payload: BuyNowPayload) => {
  const res = await api.post("/v1/checkout/buy-now", payload);
  return res.data;
};

/**
 * Fetch Buy Now checkout preview
 */
export const fetchBuyNowCheckout = async (
  product_id: number,
  variant_id: number,
  qty: number,
  useRewards = true,
  addressId?: number,
  campaignId?: number | null,
  contentId?: number | null,
  deliveryPreference?: DeliveryPreference,
) => {
  const res = await api.get("/v1/checkout/get-buy-now", {
    params: {
      product_id,
      variant_id,
      qty,
      campaign_id: campaignId ?? undefined,
      content_id: contentId ?? undefined,
      use_rewards: useRewards,
      address_id: addressId,
      ...deliveryParams(deliveryPreference),
    },
  });
  return res.data;
};
