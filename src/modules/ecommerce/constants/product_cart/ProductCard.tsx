import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  GestureResponderEvent,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { HomeStackParamList } from "../../navigation/types";
import PointsButton from "./PointsButton";
import { setWishlistState } from "../../api/WishlistApi";
import { fetchProductDetailsByID } from "../../api/ProductApi";
import OptimizedImage from "../../components/common/OptimizedImage";
import RPpriceBadge from "./RPpriceBadge";
import { normalizeProduct } from "../../utils/normalizeProduct";

const { width: screenWidth } = Dimensions.get("window");

const PADDING = screenWidth * 0.03;
const GAP = screenWidth * 0.02;
const CARD_WIDTH = (screenWidth - PADDING * 2 - GAP * 2) / 3;
const STAR_ARRAY = [1, 2, 3, 4, 5];

type Nav = NativeStackNavigationProp<HomeStackParamList>;

type Props = {
  item: any;
  cardWidth?: number;
  shouldLoadImage?: boolean;
};

const ProductCardComponent = ({ item, cardWidth, shouldLoadImage = true }: Props) => {
  const navigation = useNavigation<Nav>();
  const [wishLoading, setWishLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(Boolean(item?.is_wishlisted));
  // Caches the variant_id resolved from a detail-fetch so repeat taps don't re-fetch.
  // Stored as number when found, 0 when the detail API confirmed no variants exist.
  const fetchedVariantIdRef = useRef<number | undefined>(undefined);

  const usedCardWidth = cardWidth ?? CARD_WIDTH;
  const normalizedProduct = useMemo(() => normalizeProduct(item), [item]);

  const productId = item?.id ?? item?.product_id ?? item?.productId;
  const variantId =
    item?.variant_id ??
    item?.variantId ??
    item?.default_variant_id ??
    item?.variants?.[0]?.variant_id;

  // Responsive size calculations based on actual card width
  const calculations = useMemo(() => ({
    imageDynamicSize: Math.round(Math.min(Math.max(usedCardWidth * 0.88, 56), 104)),
    borderRadius: Math.round(usedCardWidth * 0.06),
    imageWrapHeight: Math.round(Math.min(Math.max(usedCardWidth * 1.02, 104), 132)),
    cardMinHeight: Math.round(Math.min(Math.max(usedCardWidth * 2.18, 238), 286)),
    fontSizeLabel: Math.max(11, Math.round(usedCardWidth * 0.07)),
    fontSizeReview: Math.max(9, Math.round(usedCardWidth * 0.066)),
    fontSizePrice: Math.max(12, Math.round(usedCardWidth * 0.096)),
    fontSizeOriginal: Math.max(9, Math.round(usedCardWidth * 0.065)),
    fontSizeDiscount: Math.max(9, Math.round(usedCardWidth * 0.07)),
  }), [usedCardWidth]);

  const goToDetails = useCallback(() => {
    if (!productId) return;
    navigation.navigate("ProductDescription", { productId });
  }, [productId, navigation]);

  const firstImage = useMemo(() => {
    const candidates = [
      ...(Array.isArray(item?.images) ? item.images : []),
      item?.image,
      item?.image_url,
      item?.thumbnail,
    ];
    return candidates.find((candidate) => String(candidate || "").trim()) || "";
  }, [item?.image, item?.image_url, item?.images, item?.thumbnail]);

  useEffect(() => {
    setWishlisted(Boolean(item?.is_wishlisted));
  }, [item?.is_wishlisted, productId, variantId]);

  const handleWishlist = useCallback(async () => {
    if (wishLoading) return;

    const parsedProductId = Number(productId);
    if (!parsedProductId || Number.isNaN(parsedProductId)) {
      Alert.alert("Wishlist", "Invalid product");
      return;
    }

    setWishLoading(true);
    try {
      // ── Step 1: resolve variant_id ──────────────────────────────────────────
      // The list API returns products with only `id` and display fields — no
      // variant information. We first try all known field names on the item, then
      // fall back to a detail fetch (result is cached in fetchedVariantIdRef so
      // subsequent taps on the same card don't trigger another request).
      let resolvedVariantId: number | undefined =
        variantId !== undefined && variantId !== null ? Number(variantId) : undefined;

      console.log('[Wishlist:ProductCard] item fields', {
        id: item?.id,
        product_id: item?.product_id,
        variant_id: item?.variant_id,
        variantId: item?.variantId,
        default_variant_id: item?.default_variant_id,
        variants_0_variant_id: item?.variants?.[0]?.variant_id,
      });
      console.log('[Wishlist:ProductCard] from item props', { parsedProductId, resolvedVariantId });

      if (!resolvedVariantId) {
        // fetchedVariantIdRef stores the result of a previous detail fetch:
        //   undefined  → never fetched yet
        //   0          → fetched, but product has no variants
        //   >0         → fetched, this is the real variant_id
        if (fetchedVariantIdRef.current !== undefined) {
          resolvedVariantId = fetchedVariantIdRef.current || undefined;
          console.log('[Wishlist:ProductCard] using cached detail-fetch result', fetchedVariantIdRef.current);
        } else {
          console.log('[Wishlist:ProductCard] fetching product details to resolve variant', parsedProductId);
          const details = await fetchProductDetailsByID(parsedProductId);
          console.log('[Wishlist:ProductCard] raw product details', JSON.stringify(details));

          const fromDetails =
            details?.variant_id ??
            details?.default_variant_id ??
            details?.variants?.[0]?.variant_id ??
            details?.variants?.[0]?.id ??
            details?.variants?.[0]?.sku_id;

          console.log('[Wishlist:ProductCard] variant extracted from details', fromDetails);

          if (fromDetails) {
            resolvedVariantId = Number(fromDetails);
            fetchedVariantIdRef.current = resolvedVariantId;
          } else {
            fetchedVariantIdRef.current = 0; // confirmed: no variants
          }
        }
      }

      console.log('[Wishlist:ProductCard] final resolved', { parsedProductId, resolvedVariantId, shouldWishlist: !wishlisted });

      if (!resolvedVariantId) {
        // Product genuinely has no variants even after fetching details.
        // The wishlist backend requires variant_id, so we can't proceed silently.
        Alert.alert(
          "Wishlist",
          "This product has no variant information. Open the product page to wishlist it."
        );
        return;
      }

      // ── Step 2: toggle wishlist ──────────────────────────────────────────────
      const result = await setWishlistState(parsedProductId, resolvedVariantId, !wishlisted);
      console.log('[Wishlist:ProductCard] setWishlistState result', result);
      setWishlisted(result.wishlisted);
    } catch (error: any) {
      console.log('[Wishlist:ProductCard] error', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update wishlist";
      Alert.alert("Wishlist", String(message));
    } finally {
      setWishLoading(false);
    }
  }, [productId, variantId, wishLoading, wishlisted, item]);

  const handleWishlistPress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      handleWishlist();
    },
    [handleWishlist]
  );

  const {
    starCount,
    reviewText,
    productTitle,
    priceText,
    originalPriceText,
    discount,
    rewardCoins,
    redeemCoins,
    rp_price
  } = useMemo(() => {
    const ratingValue = Number(normalizedProduct.rating ?? 4.5);
    const safeRating = Number.isFinite(ratingValue)
      ? Math.max(0, Math.min(5, ratingValue))
      : 4.5;

    return {
      starCount: Math.round(safeRating),
      reviewText: normalizedProduct.reviews ? `(${normalizedProduct.reviews})` : "",
      productTitle: [item?.product_name || item?.title, item?.brand || item?.brand_name]
        .filter(Boolean)
        .join(" "),
      priceText: String(normalizedProduct.price ?? ""),
      originalPriceText: String(normalizedProduct.originalPrice ?? ""),
      rewardCoins: normalizedProduct.rewardCoins,
      redeemCoins: normalizedProduct.redeem_coins,
      rp_price: normalizedProduct.rp_price ?? "",
      discount: normalizedProduct.discount ?? "",
    };
  }, [item, normalizedProduct]);

  return (
    <View
      style={[
        styles.card,
        {
          width: usedCardWidth,
          minHeight: calculations.cardMinHeight,
          borderRadius: calculations.borderRadius,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={goToDetails}>
        <View style={[styles.imageWrap, { height: calculations.imageWrapHeight, borderRadius: calculations.borderRadius, paddingTop: Math.round(usedCardWidth * 0.1) }]}>
          {!!rp_price && (
            <View style={styles.discountWrap}>
              <RPpriceBadge value={rp_price} />
            </View>
          )}

          <TouchableOpacity
            style={styles.heartIcon}
            activeOpacity={0.85}
            onPress={handleWishlistPress}
            disabled={wishLoading}
          >
            <FontAwesome
              name={wishlisted ? "heart" : "heart-o"}
              size={14}
              color={wishlisted ? "#E53935" : "#4A4A4A"}
            />
          </TouchableOpacity>

          <OptimizedImage
            path={firstImage}
            width={calculations.imageDynamicSize}
            height={calculations.imageDynamicSize}
            resizeMode="contain"
            sizePreset="thumbnail"
            priority="high"
            quality={40}
            loadEnabled={shouldLoadImage}
            style={styles.productImage}
            fallbackBackgroundColor="transparent"
          />
        </View>
      </TouchableOpacity>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.productTitle,
              { fontSize: calculations.fontSizeLabel },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {productTitle}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          {STAR_ARRAY.map((star) => (
            <FontAwesome
              key={star}
              name="star"
              size={10}
              color={star <= starCount ? "#FFC514" : "#E5E7EB"}
              style={styles.starIcon}
            />
          ))}
          <Text style={[styles.reviews, { fontSize: calculations.fontSizeReview }]}>
            {reviewText}
          </Text>
        </View>

        {/* ========== RESPONSIVE PRICE ROW ========== */}
        <View style={styles.priceRow}>
          {/* Discount indicator (arrow + text) */}
          {!!discount && (
            <View style={styles.discountInline}>
              <Text style={[styles.discountArrow, { fontSize: calculations.fontSizeDiscount }]}>
                ↓
              </Text>
              <Text 
                numberOfLines={1} 
                style={[styles.discountText, { fontSize: calculations.fontSizeDiscount }]}
              >
                {discount}
              </Text>
            </View>
          )}

          {/* Original price (strikethrough) */}
          {!!originalPriceText && (
            <Text 
              numberOfLines={1} 
              style={[styles.original, { fontSize: calculations.fontSizeOriginal }]}
            >
              {originalPriceText}
            </Text>
          )}

          {/* Final price */}
          <Text 
            numberOfLines={1} 
            style={[styles.price, { fontSize: calculations.fontSizePrice }]}
          >
            {priceText}
          </Text>
        </View>

        <View style={styles.pointsWrap}>
          <PointsButton rewardCoins={rewardCoins} redeemCoins={redeemCoins} onPress={goToDetails} />
        </View>
      </View>
    </View>
  );
};

// Memoized export
const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  const prevNormalized = normalizeProduct(prevProps.item);
  const nextNormalized = normalizeProduct(nextProps.item);

  return (
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.is_wishlisted === nextProps.item?.is_wishlisted &&
    prevProps.cardWidth === nextProps.cardWidth &&
    prevProps.item?.discount === nextProps.item?.discount &&
    prevProps.item?.rp_price === nextProps.item?.rp_price &&
    prevProps.item?.price === nextProps.item?.price &&
    prevProps.item?.originalPrice === nextProps.item?.originalPrice &&
    prevNormalized.rewardCoins === nextNormalized.rewardCoins &&
    prevNormalized.redeem_coins === nextNormalized.redeem_coins &&
    prevProps.item?.image === nextProps.item?.image &&
    prevProps.item?.product_name === nextProps.item?.product_name &&
    prevProps.shouldLoadImage === nextProps.shouldLoadImage
  );
});

export default ProductCard;

// ======================= STYLES =======================
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    padding: 6,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  imageWrap: {
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  discountWrap: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 10,
  },
  heartIcon: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    alignSelf: "center",
  },
  details: {
    marginTop: 8,
    flex: 1,
    justifyContent: "space-between",
  },
  titleRow: {
    marginTop: 4,
  },
  productTitle: {
    color: "#374151",
    fontWeight: "400",
    lineHeight: 17,
    minHeight: 34,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  starIcon: {
    marginRight: 1,
  },
  reviews: {
    color: "#9CA3AF",
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",      
    marginTop: 6,
    columnGap: 6,
    rowGap: 4,
  },
  discountInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountArrow: {
    color: "#16A34A",
    fontWeight: "900",
    marginRight: 1,
  },
  discountText: {
    color: "#16A34A",
    fontWeight: "700",
  },
  original: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  price: {
    fontWeight: "900",
    color: "#111827",
  },
  pointsWrap: {
    marginTop: 8,
    width: "100%",
  },
});
