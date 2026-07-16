import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";

import { BASE_API_URL } from './api';

const SERVICE_API_BASE = BASE_API_URL.includes('/v1')
  ? BASE_API_URL
  : `${BASE_API_URL.replace(/\/$/, '')}/v1`;

if (!BASE_API_URL.includes('/v1')) {
  console.warn(`⚠️ BASE_API_URL missing /v1. Using fallback base: ${SERVICE_API_BASE}`);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryError = (error: any) => {
  const status = Number(error?.response?.status || 0);
  return !status || status >= 500;
};


const getWithRetry = async (url: string, config: any, attempts = 2) => {
  let lastError: any;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await axios.get(url, config);
    } catch (error: any) {
      lastError = error;
      if (!shouldRetryError(error) || i === attempts - 1) {
        break;
      }
      await wait(300 * (i + 1));
    }
  }
  throw lastError;
};

// ======================================================
// 🛒 ADD TO SERVICE CART
// ======================================================
export const addServiceToCart = async ({
  service_id,
  variant_id,
}: {
  service_id: number;
  variant_id: number;
}) => {
  try {
    if (!Number.isFinite(Number(service_id)) || Number(service_id) <= 0) {
      throw new Error('Invalid service_id for addServiceToCart');
    }

    if (!Number.isFinite(Number(variant_id)) || Number(variant_id) <= 0) {
      throw new Error('Invalid variant_id for addServiceToCart');
    }

    const headers = await getAuthHeaders();
    const url = `${SERVICE_API_BASE}/service-cart/add`;

    console.log('📦 Adding service to cart...', {
      url,
      service_id,
      variant_id,
      hasAuthToken: !!headers?.Authorization,
    });

    const res = await axios.post(
      url,
      { service_id, variant_id },
      { headers },
    );

    if (res?.data?.success === false) {
      throw new Error(String(res?.data?.message || 'Unable to add service to cart'));
    }

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }
    console.error("❌ Add Service Cart Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// ======================================================
// 📦 GET SERVICE CART ITEMS
// ======================================================
const EMPTY_SERVICE_CART = {
  bundles: [],
  individual_items: [],
  total: 0,
};
export const getServiceCartItems = async () => {
  const headers = await getAuthHeaders();
  const primaryUrls = [
    `${SERVICE_API_BASE}/service-cart/cart-items`,
    `${SERVICE_API_BASE}/service-cart/cart-items/`,
    `${SERVICE_API_BASE}/service-cart/items`,
  ];

  console.log('📦 Fetching service cart...');
  console.log('📡 API URL candidates:', primaryUrls);
  console.log('🔑 Headers:', { hasAuthorization: !!headers?.Authorization });

  if (!headers.Authorization) {
    console.warn('⚠️ No auth token found, skipping request');
    return EMPTY_SERVICE_CART;
  }

  for (const url of primaryUrls) {
    try {
      const res = await getWithRetry(url, { headers }, 2);
      console.log('✅ Service cart fetched from:', url);
      const data = res.data?.data || res.data || EMPTY_SERVICE_CART;

      return {
        bundles: data.bundles || [],
        individual_items: data.individual_items || [],
        total: data.total || 0,
      };
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);

      if (status === 401) {
        console.debug('Service cart: Unauthorized — clearing token');
        await clearAuthToken();
        return EMPTY_SERVICE_CART;
      }

      if (status === 404) {
        console.warn('⚠️ Cart endpoint returned 404, trying next candidate:', {
          url,
          message: error?.response?.data?.message,
        });
        continue;
      }

      console.error('❌ Get Service Cart Error:', error?.response || error);
      throw error?.response?.data || error;
    }
  }

  // Fallback: derive cart items from checkout-preview if cart endpoint is unavailable.
  try {
    const checkoutUrl = `${SERVICE_API_BASE}/service-checkout/checkout-preview`;
    console.warn('⚠️ All cart endpoints returned 404. Falling back to checkout-preview:', checkoutUrl);
    const checkoutRes = await getWithRetry(checkoutUrl, { headers }, 2);
    const data = checkoutRes.data?.data || checkoutRes.data || EMPTY_SERVICE_CART;

    return {
      bundles: data.bundles || [],
      individual_items: data.individual_items || [],
      total: data.total || 0,
    };
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);
    if (status === 401) {
      await clearAuthToken();
      return EMPTY_SERVICE_CART;
    }
    if (status === 404) {
      console.error('🚨 404 ERROR - Check BASE_API_URL or endpoint path');
      return EMPTY_SERVICE_CART;
    }
    console.error('❌ Get Service Cart Fallback Error:', error?.response || error);
    throw error?.response?.data || error;
  }
};

// ======================================================
// ❌ REMOVE ITEM FROM CART
// ======================================================
export const removeServiceCartItem = async (cartItemId: number) => {
  try {
    const headers = await getAuthHeaders();
    const url = `${SERVICE_API_BASE}/service-cart/item/${cartItemId}`;

    console.log('🗑️ Removing cart item...', {
      url,
      cartItemId,
      hasAuthToken: !!headers?.Authorization,
    });

    const res = await axios.delete(
      url,
      { headers },
    );

    if (res?.data?.success === false) {
      throw new Error(String(res?.data?.message || 'Unable to remove cart item'));
    }

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }
    console.error("❌ Remove Cart Item Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// ======================================================
// 🧹 CLEAR CART
// ======================================================
export const clearServiceCart = async () => {
  try {
    const headers = await getAuthHeaders();
    const url = `${SERVICE_API_BASE}/service-cart/clear`;

    console.log('🧹 Clearing service cart...', {
      url,
      hasAuthToken: !!headers?.Authorization,
    });

    const res = await axios.delete(url, { headers });

    if (res?.data?.success === false) {
      throw new Error(String(res?.data?.message || 'Unable to clear cart'));
    }

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }
    console.error("❌ Clear Cart Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// Checkout

// get Buy now (Single buy now)
export const getBuyNowPreview = async ({ service_id, variant_id }) => {
  if (!service_id || !variant_id) {
    throw new Error("Invalid service_id or variant_id");
  }

  try {
    const headers = await getAuthHeaders();
    const url = `${SERVICE_API_BASE}/service-checkout/buy-now-preview`;

    console.log('🧾 Fetching buy-now preview...', {
      url,
      service_id,
      variant_id,
      hasAuthToken: !!headers?.Authorization,
    });

    const res = await axios.get(
      url,
      {
        headers,
        params: { service_id, variant_id },
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("❌ Buy Now Preview Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};


// get checkout cart items (Cart Buy now Checkout)
export const getCheckoutPreview = async () => {
  try {
    const headers = await getAuthHeaders();
    const url = `${SERVICE_API_BASE}/service-checkout/checkout-preview`;

    console.log('🧾 Fetching service checkout preview...', {
      url,
      hasAuthToken: !!headers?.Authorization,
    });

    const res = await getWithRetry(
      url,
      { headers }
    );

    return res.data;

  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    const status = Number(error?.response?.status || 0);
    const message = String(error?.response?.data?.message || '').toLowerCase();
    if (status === 400 && message.includes('cart is empty')) {
      console.info('ℹ️ Checkout preview reports empty cart');
      return {
        success: true,
        data: {
          type: 'cart',
          items: [],
          summary: {
            item_total: 0,
            discount: 0,
            reward_discount: 0,
            delivery_fee: 0,
            handling_fee: 0,
            total: 0,
          },
        },
      };
    }

    console.error("❌ Checkout Preview Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// place Order
export const placeCartOrder = async ({ address_id }: { address_id: number }) => {
  try {
    const headers = await getAuthHeaders();
    const url = `${SERVICE_API_BASE}/service-checkout/cart`;

    console.log('📦 Placing cart service order...', {
      url,
      address_id,
      hasAuthToken: !!headers?.Authorization,
    });

    const res = await axios.post(
      url,
      { address_id },
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Place Cart Order Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

// Buy Now Order
export const placeBuyNowOrder = async ({
  service_id,
  variant_id,
  address_id,
}: {
  service_id: number;
  variant_id: number;
  address_id: number;
}) => {
  try {
    const headers = await getAuthHeaders();
    const url = `${SERVICE_API_BASE}/service-checkout/buy-now`;

    console.log('⚡ Placing buy-now service order...', {
      url,
      service_id,
      variant_id,
      address_id,
      hasAuthToken: !!headers?.Authorization,
    });

    const res = await axios.post(
      url,
      {
        service_id,
        variant_id,
        address_id,
      },
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("❌ Buy Now Order Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};