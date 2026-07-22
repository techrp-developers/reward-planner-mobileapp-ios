import axios from "axios";
import { getAuthHeaders } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm";

const normalizeId = (value: unknown, label: string) => {
  const parsed = Number(value);

  if (!parsed || Number.isNaN(parsed)) {
    throw new Error(`${label} is required`);
  }

  return parsed;
};

export const addWishlist = async (productId: number, variantId?: number) => {
  const headers = await getAuthHeaders();
  const parsedProductId = normalizeId(productId, "Product id");
  const parsedVariantId = normalizeId(variantId, "Variant id");

  const res = await axios.post(
    `${API_BASE_URL}/v1/wishlist/add-wishlist`,
    {
      product_id: parsedProductId,
      variant_id: parsedVariantId,
    },
    { headers }
  );

  return res.data;
};

export const checkWishlist = async (productId: number, variantId?: number) => {
  const headers = await getAuthHeaders();
  const parsedProductId = normalizeId(productId, "Product id");
  const parsedVariantId = normalizeId(variantId, "Variant id");

  const res = await axios.get(
    `${API_BASE_URL}/v1/wishlist/check/${parsedProductId}/${parsedVariantId}`,
    { headers }
  );

  return res.data;
};

export const isWishlistPresent = (response: any) => {
  const present =
    response?.isPresent ??
    response?.exists ??
    response?.inWishlist ??
    response?.in_wishlist ??
    response?.is_wishlist ??
    response?.is_wishlisted ??
    response?.data?.isPresent ??
    response?.data?.exists ??
    response?.data?.inWishlist ??
    response?.data?.in_wishlist ??
    response?.data?.is_wishlist ??
    response?.data?.is_wishlisted ??
    false;

  return Boolean(present);
};

export const getWishlist = async () => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE_URL}/v1/wishlist/get-wishlist`, { headers });
  return res.data;
};

export const removeWishlist = async (payload: {
  productId?: number;
  variantId?: number;
  strict?: boolean;
}) => {
  const headers = await getAuthHeaders();
  const parsedProductId = normalizeId(payload.productId, "Product id");
  const parsedVariantId = normalizeId(payload.variantId, "Variant id");

  try {
    const res = await axios.delete(
      `${API_BASE_URL}/v1/wishlist/remove/${parsedProductId}/${parsedVariantId}`,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);
    const message = String(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        ""
    ).toLowerCase();

    if (!payload.strict && status === 404 && message.includes("not found")) {
      const state = await checkWishlist(parsedProductId, parsedVariantId);
      if (!isWishlistPresent(state)) {
        return { success: true, alreadyRemoved: true };
      }
    }

    throw error;
  }
};

export const toggleWishlist = async (productId: number, variantId?: number) => {
  const parsedProductId = normalizeId(productId, "Product id");
  const parsedVariantId = normalizeId(variantId, "Variant id");
  let checkRes: any;

  try {
    checkRes = await checkWishlist(parsedProductId, parsedVariantId);
  } catch (err: any) {
    throw new Error(
      `Failed to check wishlist status: ${err?.message || "Unknown error"}`
    );
  }

  const present = isWishlistPresent(checkRes);

  if (present) {
    try {
      await removeWishlist({
        productId: parsedProductId,
        variantId: parsedVariantId,
      });
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      if (status !== 404) throw error;
    }

    return {
      wishlisted: false,
      action: "removed" as const,
    };
  }

  const addRes = await addWishlist(parsedProductId, parsedVariantId);

  return {
    wishlisted: addRes?.action !== "removed",
    action: (addRes?.action || "added") as "added" | "removed",
  };
};

export const setWishlistState = async (
  productId: number,
  variantId: number | undefined,
  shouldWishlist: boolean
) => {
  const parsedProductId = normalizeId(productId, "Product id");
  const parsedVariantId = normalizeId(variantId, "Variant id");

  if (shouldWishlist) {
    const current = await checkWishlist(parsedProductId, parsedVariantId);

    if (isWishlistPresent(current)) {
      return {
        wishlisted: true,
        action: "added" as const,
      };
    }

    const addRes = await addWishlist(parsedProductId, parsedVariantId);

    return {
      wishlisted: addRes?.action !== "removed",
      action: (addRes?.action || "added") as "added" | "removed",
    };
  }

  await removeWishlist({
    productId: parsedProductId,
    variantId: parsedVariantId,
  });

  return {
    wishlisted: false,
    action: "removed" as const,
  };
};
