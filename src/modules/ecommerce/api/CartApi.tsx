// src/api/CartApi.ts
import api from "../../common/auth/api/axios";

export type AddToCartPayload = {
  product_id: number;
  variant_id: number;
  quantity: number;
};

export const addToCart = async (payload: AddToCartPayload) => {
  console.log("📦 Sending AddToCart payload:", payload);

  const candidates: Array<{ endpoint: string; body: Record<string, number> }> = [
    {
      endpoint: "/v1/cart/cart-item",
      body: payload,
    },
    {
      endpoint: "/v1/cart/cart-items",
      body: payload,
    },
    {
      endpoint: "/v1/cart/cart-item",
      body: {
        product_id: payload.product_id,
        variant_id: payload.variant_id,
        qty: payload.quantity,
      },
    },
    {
      endpoint: "/v1/cart/cart-items",
      body: {
        product_id: payload.product_id,
        variant_id: payload.variant_id,
        qty: payload.quantity,
      },
    },
  ];

  let lastError: any;

  for (const candidate of candidates) {
    try {
      const res = await api.post(candidate.endpoint, candidate.body);

      const data = res?.data;
      if (data?.success === false) {
        const apiError = new Error(
          String(data?.message || data?.error || "Add to cart failed")
        );
        (apiError as any).response = { data, status: res?.status };
        lastError = apiError;
        continue;
      }

      console.log("✅ AddToCart response:", data);
      return data;
    } catch (error: any) {
      lastError = error;
      const status = Number(error?.response?.status || 0);

      if ([404, 405, 422].includes(status)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

export const deleteAllCartItems = async () => {
  try {
    const res = await api.put("/v1/cart/cart-items");
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 404) {
      return { success: true, alreadyCleared: true };
    }

    throw error;
  }
};

export const fetchCartItems = async () => {
  try {
    const res = await api.get("/v1/cart/cart-items");
    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);
    if (status === 503) {
      console.log("Cart API unavailable (503), returning empty cart fallback");
      return { items: [] };
    }
    throw error;
  }
};

export const updateCartQty = async (cart_item_id: number, quantity: number) => {
  const candidates: Array<() => Promise<any>> = [
    () => api.put(`/v1/cart/cart-items/${cart_item_id}`, { quantity }),
    () => api.put(`/v1/cart/cart-item/${cart_item_id}`, { quantity }),
    () => api.put(`/v1/cart/cart-item`, { cart_item_id, quantity }),
    () => api.patch(`/v1/cart/cart-items/${cart_item_id}`, { quantity }),
  ];

  let lastError: any;

  for (const request of candidates) {
    try {
      const res = await request();
      return res.data;
    } catch (err: any) {
      lastError = err;
      const status = Number(err?.response?.status || 0);
      if (![404, 405].includes(status)) {
        throw err;
      }
    }
  }

  throw lastError;
};

export const deleteCartItem = async (cart_item_id: number) => {
  const candidates: Array<() => Promise<any>> = [
    () => api.delete(`/v1/cart/cart-items/${cart_item_id}`),
    () => api.delete(`/v1/cart/check-cart-items/${cart_item_id}`),
    () => api.post(`/v1/cart/cart-items/${cart_item_id}`, { _method: 'DELETE' }),
  ];

  let lastError: any;

  for (const request of candidates) {
    try {
      const res = await request();
      const data = res?.data;
      console.log("✅ Item deleted from cart:", cart_item_id);
      return data;
    } catch (err: any) {
      lastError = err;
      const status = Number(err?.response?.status || 0);
      if (![404, 405, 422].includes(status)) {
        throw err;
      }
    }
  }

  throw lastError;
};




export const fetchCartSummary = async (useRewards = true) => {
  const res = await api.get(`/v1/cart/cart-summary`, {
    params: { use_rewards: useRewards },
  });
  return res.data?.data;
};