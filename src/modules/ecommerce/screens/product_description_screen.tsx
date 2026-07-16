import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, InteractionManager, unstable_batchedUpdates } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { HomeStackParamList } from "../navigation/types";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from "@tanstack/react-query";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ProductHero from "../components/cart/product_hero";
// import OffersSection from "../components/cart/offersection";
import DeliverySection from "../components/cart/deliverysections";
import BenefitsRow from "../components/cart/benefitsrow";
import ProductInfoAccordions from "../components/cart/productInioaccordions";
import BuySection from "../components/cart/buysections";
import ProductHead from "../constants/heading/Product_Head_Img";
import { checkStock, fetchProductDetailsByID, getProductImageUrl } from "../api/ProductApi";
import ProductVariants from "../components/cart/productvariants";
import AddToCartSheet from "../components/cart/AddToCartSheet";
import CustomerReviewsView from "../components/product/product_section/CustomerReviewsView";
import ProductGrid from "../components/home/productgrid";
import { setWishlistState } from "../api/WishlistApi";
import { useAuth } from "../../common/auth/context/AuthContext";
import { useAlert } from "../components/alerts";
import { useCart } from "../context/CartContext";
import {
  prefetchCheckoutScreenData,
  productDetailsQueryKey,
} from "../navigation/navigationPerformance";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type RouteT = RouteProp<HomeStackParamList, "ProductDescription">;

const MemoProductHero = React.memo(ProductHero);
const MemoProductVariants = React.memo(ProductVariants);
const MemoBuySection = React.memo(BuySection);

export default function
  ProductDescriptionScreen() {
  const route = useRoute<RouteT>();
  const { productId } = route.params;
  const { isAuthenticated } = useAuth();
  const alert = useAlert();
  const { addItem, totalQuantity } = useCart();
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDot, setActiveDot] = useState(0);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [stock, setStock] = useState<number | null>(null);
  const [inStock, setInStock] = useState<boolean>(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [allowHeroImageLoad, setAllowHeroImageLoad] = useState(false);
  const pulse = React.useRef(new Animated.Value(0)).current;

  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    setAllowHeroImageLoad(false);
    const task = InteractionManager.runAfterInteractions(() => {
      setAllowHeroImageLoad(true);
    });

    return () => task.cancel();
  }, [productId]);

  const toFullImageUrl = useCallback((path: string) => {
    return getProductImageUrl(path, "full");
  }, []);

  const handleBuyNow = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to buy products.");
      const parent = (navigation as any)?.getParent?.();
      if (parent && typeof parent.navigate === "function") {
        parent.navigate("AuthStack");
      }
      return;
    }

    if (!product?.product_id || !selectedVariant?.variant_id) {
      Alert.alert("Buy Now", "Product data is not available. Please try again.");
      return;
    }

    const buyNowParams = {
      mode: "buy_now" as const,
      product_id: Number(product.product_id),
      variant_id: Number(selectedVariant.variant_id),
      qty: Math.max(1, Number(qty) || 1),
    };

    console.log("➡️ Buy Now params:", buyNowParams);

    prefetchCheckoutScreenData({
      mode: "buy_now",
      product_id: buyNowParams.product_id,
      variant_id: buyNowParams.variant_id,
      qty: buyNowParams.qty,
    }).catch(() => {
      // Ignore prefetch errors and continue navigation.
    });

    navigation.navigate("OrderStepUI", buyNowParams);
  }, [isAuthenticated, navigation, product?.product_id, qty, selectedVariant?.variant_id]);



  useEffect(() => {
    let isMounted = true;

    const applyProductState = (p: any) => {
      const variants = Array.isArray(p?.variants) ? p.variants : [];
      const defaultVariant =
        variants.find(
          (v: any) => v.is_visible === 1 && v.sale_price && v.stock > 0
        ) || variants[0] || null;

      unstable_batchedUpdates(() => {
        setProduct({ ...p, variants });
        setSelectedVariant(defaultVariant);
        setSelectedAttrs(defaultVariant?.variant_attributes ?? {});
        setWishlisted(Boolean(p?.is_wishlisted));
      });
    };

    const cachedProduct = queryClient.getQueryData<any>(productDetailsQueryKey(productId));
    if (cachedProduct) {
      applyProductState(cachedProduct);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const interactionTask = InteractionManager.runAfterInteractions(async () => {
      try {
        const raw = await fetchProductDetailsByID(productId);

        if (!raw || typeof raw !== "object") {
          throw new Error("Product details response is empty");
        }

        const normalizeVariant = (v: any) => ({
          ...v,
          rewardCoins:
            v?.reward?.enabled && Number(v?.reward?.coins) > 0
              ? Number(v.reward.coins)
              : 0,
          rewardLabel: v?.reward?.label ?? null,
        });

        const p = {
          ...raw,
          variants: Array.isArray(raw?.variants) ? raw.variants.map(normalizeVariant) : [],
        };
        queryClient.setQueryData(productDetailsQueryKey(productId), p);

        if (!isMounted) return;
        applyProductState(p);
      } catch (error) {
        console.log("Failed to load product details", error);
        if (!cachedProduct && isMounted) {
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      interactionTask.cancel();
    };
  }, [productId, queryClient]);




  // 🔹 Resolve variant from attributes
  const resolvedVariant = useMemo(() => {
    if (!product) return null;

    const variants = Array.isArray(product?.variants) ? product.variants : [];

    return variants.find((v: any) =>
      Object.entries(selectedAttrs).every(
        ([key, val]) => v?.variant_attributes?.[key] === val
      )
    );
  }, [product, selectedAttrs]);

  useEffect(() => {
    if (resolvedVariant) setSelectedVariant(resolvedVariant);
  }, [resolvedVariant]);

  const images = useMemo(() => {
    if (!product) return [];

    if (selectedVariant?.images?.length) {
      return selectedVariant.images.map(toFullImageUrl);
    }

    return (product.images ?? []).map(toFullImageUrl);
  }, [product, selectedVariant, toFullImageUrl]);

  useEffect(() => {
    setActiveDot(0);
  }, [selectedVariant]);

  useEffect(() => {
    setWishlisted(Boolean(product?.is_wishlisted));
  }, [product?.is_wishlisted, productId]);

  useEffect(() => {
    if (!selectedVariant?.variant_id) return;

    (async () => {
      try {
        const res = await checkStock(selectedVariant.variant_id);
        const numericStock = Number(res?.stock);
        const safeStock = Number.isFinite(numericStock) ? numericStock : null;

        setStock(safeStock);
        if (safeStock !== null) {
          setInStock(safeStock > 0);
        } else {
          setInStock(Boolean(res?.inStock));
        }
        setQty(1);
      } catch {
        setStock(null);
        setInStock(true);
      }
    })();
  }, [selectedVariant]);

  const handleAddToCart = useCallback(async () => {
    if (adding) return;

    if (!isAuthenticated) {
      Alert.alert("Login Required", "Please login to add products to cart.");
      return;
    }

    if (!product?.product_id || !selectedVariant?.variant_id) return;

    try {
      setAdding(true);

      await addItem(product.product_id, selectedVariant.variant_id, qty);

      // Open sheet first so it isn't blocked by alert overlays.
      setSheetVisible(true);

      InteractionManager.runAfterInteractions(() => {
        alert.success(
          "Added to Cart",
          `${product.product_name} added to cart successfully!`,
          2500
        );
      });
    } catch (err: any) {
      console.error("Add to cart failed", err?.response?.data || err.message);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to add item to cart";
      alert.error("Add to Cart Failed", String(message), 3500);
    } finally {
      setAdding(false);
    }
  }, [adding, isAuthenticated, product?.product_id, selectedVariant?.variant_id, qty, addItem, alert, product?.product_name]);

  const handleWishlist = useCallback(async () => {
    if (wishLoading) return;

    const parsedProductId = Number(product?.product_id ?? productId);
    const rawVariantId = selectedVariant?.variant_id ?? product?.default_variant_id;
    const parsedVariantId =
      rawVariantId !== undefined && rawVariantId !== null ? Number(rawVariantId) : undefined;

    console.log('[Wishlist:PDS] product fields', {
      product_id: product?.product_id,
      default_variant_id: product?.default_variant_id,
      selectedVariant_variant_id: selectedVariant?.variant_id,
      is_wishlisted: product?.is_wishlisted,
    });
    console.log('[Wishlist:PDS] resolved', {
      parsedProductId,
      parsedVariantId,
      currentWishlisted: wishlisted,
    });

    if (!parsedProductId || Number.isNaN(parsedProductId)) {
      Alert.alert("Wishlist", "Invalid product");
      return;
    }

    if (!parsedVariantId) {
      Alert.alert("Wishlist", "Please select a variant before adding to wishlist.");
      return;
    }

    try {
      setWishLoading(true);
      console.log('[Wishlist:PDS] calling setWishlistState', { parsedProductId, parsedVariantId, shouldWishlist: !wishlisted });
      const result = await setWishlistState(parsedProductId, parsedVariantId, !wishlisted);
      console.log('[Wishlist:PDS] result', result);
      setWishlisted(result.wishlisted);
    } catch (error: any) {
      console.log('[Wishlist:PDS] error', {
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
  }, [wishLoading, product?.product_id, productId, selectedVariant?.variant_id, product?.default_variant_id, wishlisted]);

  const handleWriteReview = useCallback((orderId: number) => {
    const resolvedProductId = Number(product?.product_id ?? productId ?? 0);
    const resolvedVariantId = Number(
      selectedVariant?.variant_id ?? product?.default_variant_id ?? 0
    );

    if (!resolvedProductId || !resolvedVariantId) {
      Alert.alert("Write Review", "Product details are not ready yet.");
      return;
    }

    const rawVariantImage = selectedVariant?.images?.[0];
    const imagePath =
      (typeof rawVariantImage === "string" && rawVariantImage) ||
      rawVariantImage?.image_url ||
      rawVariantImage?.url ||
      product?.images?.[0] ||
      "";

    const reviewImage = /^(https?:)?\/\//i.test(String(imagePath))
      ? String(imagePath)
      : getProductImageUrl(String(imagePath));

    navigation.navigate("ReviewScreen", {
      product_id: resolvedProductId,
      variant_id: resolvedVariantId,
      order_id: orderId,
      product_name: product?.product_name,
      image: reviewImage,
      delivered_on: product?.delivered_on,
    });
  }, [navigation, product?.default_variant_id, product?.delivered_on, product?.images, product?.product_id, product?.product_name, productId, selectedVariant?.images, selectedVariant?.variant_id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ProductHead cartCount={totalQuantity} />
        <ScrollView contentContainerStyle={styles.skeletonContent}>
          <SkeletonBox pulse={pulse} width="100%" height={320} borderRadius={18} />
          <SkeletonBox pulse={pulse} width="58%" height={20} borderRadius={10} style={styles.skeletonGap} />
          <SkeletonBox pulse={pulse} width="82%" height={14} borderRadius={999} style={styles.skeletonTextGap} />
          <SkeletonBox pulse={pulse} width="100%" height={96} borderRadius={16} style={styles.skeletonGapLg} />
          <SkeletonBox pulse={pulse} width="100%" height={140} borderRadius={16} style={styles.skeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={120} borderRadius={16} style={styles.skeletonGap} />
        </ScrollView>
      </View>
    );
  }
  if (!product) return <Text style={styles.notFoundText}>Product not found</Text>;
  const variant = selectedVariant;

  const salePrice = variant ? `₹${variant.sale_price}` : "₹0";
  const mrp = variant ? `₹${variant.mrp}` : "";

  const offPercent =
    variant && +variant.mrp > +variant.sale_price
      ? `${Math.round(((+variant.mrp - +variant.sale_price) / +variant.mrp) * 100)}%`
      : "";

  const normalizeDescription = (value: unknown) => {
    if (!value) return "";
    return String(value)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const productDescription =
    normalizeDescription(product?.description) ||
    normalizeDescription(product?.short_description);

  const brandDescription = normalizeDescription(product?.brand_description);

  const relatedProductId = Number(product?.product_id ?? productId ?? 0);



  return (
    <View style={styles.container}>
      <ProductHead cartCount={totalQuantity} />

      <ScrollView contentContainerStyle={styles.content}>

        <View>
          <MemoProductHero
            images={images}
            activeDot={activeDot}
            onDotPress={setActiveDot}
            loadImages={allowHeroImageLoad}
          />
          <TouchableOpacity
            style={styles.heartIcon}
            activeOpacity={0.8}
            onPress={handleWishlist}
            disabled={wishLoading}
          >
            <MaterialCommunityIcons
              name={wishlisted ? "heart" : "heart-outline"}
              size={18}
              color={wishlisted ? "#E53935" : "#4A4A4A"}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.descriptionWrap}>
          {/* Brand + Product in one row */}
          <View style={styles.titleRow}>
            <Text style={styles.productTitle}>
              {product.brand_name}
            </Text>

            <Text style={styles.productName}>
              {product.product_name}
            </Text>
          </View>

          <Text style={styles.productSubdescription}>
            {product?.short_description || productDescription || "No description available"}
          </Text>
        </View>


        <MemoProductVariants
          attributes={product.attributes ?? {}}
          variants={Array.isArray(product.variants) ? product.variants : []}
          selectedAttrs={selectedAttrs}
          onChange={(key, value) =>
            setSelectedAttrs(prev => ({ ...prev, [key]: value }))
          }
        />


        <MemoBuySection
          offPercent={offPercent}
          price={salePrice}
          mrp={mrp}
          pointsPrice={selectedVariant?.rewardCoins ?? 0}
          points={selectedVariant?.rewardCoins ?? 0}
          qty={qty}
          stock={stock}
          inStock={inStock}
          onQtyChange={setQty}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isAdding={adding}
        />

        {/* <OffersSection /> */}
        <DeliverySection
          delivery_sla_min_days={product?.delivery_sla_min_days}
          delivery_sla_max_days={product?.delivery_sla_max_days}
          shipping_class={product?.shipping_class}
        />
        <BenefitsRow
          is_returnable={product?.is_returnable}
          is_replaceable={product?.is_replaceable}
          return_window_days={product?.return_window_days}
        />
        <ProductInfoAccordions
          productDescription={productDescription}
          brandDescription={brandDescription}
          product={product}
          selectedVariant={selectedVariant}
        />

        <View style={styles.descriptionWrap}>
          <CustomerReviewsView
            productId={product?.product_id ?? productId}
            variantId={selectedVariant?.variant_id}
            onWriteReview={handleWriteReview}
          />
        </View>

        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Products</Text>
          <ProductGrid
            key={`related-${relatedProductId}`}
            useFlatList={false}
            relatedProductId={relatedProductId}
            take={8}
          />
        </View>

      </ScrollView>
      <AddToCartSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        productId={product?.product_id ?? productId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 18,
    marginBottom: 170,

  },

  content: { backgroundColor: "#FFFFFF" },
  skeletonContent: { paddingHorizontal: 14, paddingBottom: 24, backgroundColor: "#FFFFFF" },
  skeletonGap: { marginTop: 14 },
  skeletonTextGap: { marginTop: 10 },
  skeletonGapLg: { marginTop: 20 },
  descriptionWrap: {
    paddingHorizontal: 14,
  },

  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  productTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111",
  },

  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  productSubdescription: {
    marginTop: 8,
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },

  pageLoading: { marginTop: 50 },
  notFoundText: { padding: 20 },
  heartIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  relatedSection: {
    marginTop: 10,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
});
