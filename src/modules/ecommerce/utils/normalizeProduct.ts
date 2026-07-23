const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringValue = (value: unknown, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const toBooleanValue = (value: unknown, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
};

export const normalizeProduct = (item: any) => {
  const hasWishlistFlag =
    item?.is_wishlist !== undefined || item?.is_wishlisted !== undefined;

  const normalizedVariants = Array.isArray(item?.variants)
    ? item.variants.map((variant: any) => {
      const hasVariantWishlistFlag =
        variant?.is_wishlist !== undefined || variant?.is_wishlisted !== undefined;

      return {
        ...variant,
        ...(hasVariantWishlistFlag
          ? {
            is_wishlist: toBooleanValue(variant?.is_wishlist ?? variant?.is_wishlisted, false),
            is_wishlisted: toBooleanValue(variant?.is_wishlisted ?? variant?.is_wishlist, false),
          }
          : {}),
      };
    })
    : item?.variants;

  const rewardCoins = toNumber(
    item?.rewardCoins ??
      item?.reward_coins ??
      item?.reward?.coins ??
      item?.points ??
      item?.reward_points,
    0
  );

  const redeemCoins = toNumber(
    item?.redeem_coins ??
      item?.redeemCoins ??
      item?.redeem_points ??
      item?.reward?.redeem,
    0
  );

  return {
    ...item,
    ...(hasWishlistFlag
      ? {
        is_wishlist: toBooleanValue(item?.is_wishlist ?? item?.is_wishlisted, false),
        is_wishlisted: toBooleanValue(item?.is_wishlisted ?? item?.is_wishlist, false),
      }
      : {}),
    variants: normalizedVariants,
    rewardCoins,
    redeem_coins: redeemCoins,
    price: toStringValue(
      item?.price ??
        item?.selling_price ??
        item?.sale_price ??
        item?.final_price ??
        item?.variant_price,
      ""
    ),
    originalPrice: toStringValue(
      item?.originalPrice ??
        item?.original_price ??
        item?.mrp ??
        item?.compare_at_price ??
        item?.regular_price,
      ""
    ),
    discount: toStringValue(
      item?.discount ??
        item?.off_percent ??
        item?.discount_percent ??
        item?.discountPercentage,
      ""
    ),
    rp_price: toStringValue(item?.rp_price ?? item?.rpPrice, ""),
    rewardLabel:
      item?.reward?.label ??
      item?.rewardLabel ??
      null,
    // Different product list endpoints (most-viewed, new-arrivals, search, etc.)
    // name these fields differently — fall back through the known variants so
    // ProductCard's rating/review display works regardless of which API fed it.
    rating:
      item?.rating ??
      item?.avg_rating ??
      item?.average_rating ??
      item?.rating_avg ??
      item?.ratings,
    reviews:
      item?.reviews ??
      item?.review_count ??
      item?.reviewCount ??
      item?.total_reviews ??
      item?.reviews_count,
  };
};
