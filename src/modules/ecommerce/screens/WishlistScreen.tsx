import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { getWishlist, removeWishlist } from "../api/WishlistApi";
import { fetchProductDetailsByID, getProductImageUrl } from "../api/ProductApi";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../navigation/types";
import ProductHeadColor from "../constants/heading/Poduct_Head_Color";
import { useCart } from "../context/CartContext";
import { useAppTheme } from "../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type WishlistItem = any;

const toNumberOrUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const resolveProductId = (item: WishlistItem) =>
  toNumberOrUndefined(
    item?.product_id ??
      item?.productId ??
      item?.product?.product_id ??
      item?.product?.id ??
      item?.product?.productId
  );

const resolveVariantId = (item: WishlistItem) =>
  toNumberOrUndefined(
    item?.variant_id ??
      item?.variantId ??
      item?.variant?.variant_id ??
      item?.variant?.id ??
      item?.variant?.variantId ??
      item?.product?.variant_id ??
      item?.product?.default_variant_id ??
      item?.product?.variants?.[0]?.variant_id ??
      item?.product?.variants?.[0]?.id
  );

const getProductField = (item: WishlistItem, key: string) =>
  item?.[key] ?? item?.product?.[key] ?? item?.variant?.[key];

const uniqueIds = (values: unknown[]) => {
  const seen = new Set<number>();

  return values.reduce<number[]>((ids, value) => {
    const id = toNumberOrUndefined(value);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
    return ids;
  }, []);
};

const WishlistScreen = () => {
  const navigation = useNavigation<Nav>();
  const { addItem, items: cartItems } = useCart();
  const { isDark, theme } = useAppTheme();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartLoadingKey, setCartLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await getWishlist();

      const list =
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.wishlist) && res.wishlist) ||
        (Array.isArray(res?.items) && res.items) ||
        [];

      if (list.length > 0) {
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const calculateDiscount = (mrp: number, sale: number) => {
    if (!mrp || !sale || mrp <= sale) return 0;
    const discount = ((mrp - sale) / mrp) * 100;
    return Math.round(discount);
  };

  const normalizeImage = (item: WishlistItem) => {
    const firstImage =
      item?.images?.[0]?.image_url ||
      item?.images?.[0] ||
      item?.product?.images?.[0]?.image_url ||
      item?.product?.images?.[0] ||
      item?.variant?.images?.[0]?.image_url ||
      item?.variant?.images?.[0] ||
      item?.image ||
      item?.product_image ||
      item?.product?.image ||
      item?.product?.product_image;

    if (!firstImage) return "";
    return String(firstImage).startsWith("http")
      ? firstImage
      : getProductImageUrl(firstImage);
  };

  const handleRemoveWishlist = async (item: WishlistItem) => {
    const productId = resolveProductId(item);
    const variantId = resolveVariantId(item);

    try {
      if (!productId) {
        throw new Error("Product id is required");
      }

      const candidateVariantIds = uniqueIds([
        variantId,
        item?.default_variant_id,
        item?.product?.default_variant_id,
        item?.variant?.variant_id,
        item?.variant?.id,
        ...(Array.isArray(item?.variants)
          ? item.variants.map((variant: any) => variant?.variant_id ?? variant?.id)
          : []),
        ...(Array.isArray(item?.product?.variants)
          ? item.product.variants.map((variant: any) => variant?.variant_id ?? variant?.id)
          : []),
      ]);

      if (candidateVariantIds.length === 0) {
        const productDetails = await fetchProductDetailsByID(productId);
        const variants = Array.isArray(productDetails?.variants) ? productDetails.variants : [];
        candidateVariantIds.push(
          ...uniqueIds([
            productDetails?.default_variant_id,
            productDetails?.variant_id,
            ...variants.map((variant: any) => variant?.variant_id ?? variant?.id),
          ])
        );
      }

      if (candidateVariantIds.length === 0) {
        throw new Error("Variant id is required");
      }

      let lastError: any = null;

      for (const candidateVariantId of candidateVariantIds) {
        try {
          await removeWishlist({
            productId,
            variantId: candidateVariantId,
            strict: true,
          });
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        throw lastError;
      }

      setItems((prev) =>
        prev.filter((x) => Number(x?.wishlist_id ?? x?.id) !== Number(item?.wishlist_id ?? item?.id))
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to remove from wishlist";
      __DEV__ && console.log("Wishlist remove failed", message);
      Alert.alert("Wishlist", String(message));
    }
  };

  const isItemInCart = (productId?: number, variantId?: number) => {
    if (!productId) return false;

    return cartItems.some(
      (cartItem) =>
        Number(cartItem.product_id) === Number(productId) &&
        (!variantId || Number(cartItem.variant_id) === Number(variantId))
    );
  };

  const resolveCartVariantId = async (item: WishlistItem, productId: number) => {
    const directVariantId = resolveVariantId(item);
    if (directVariantId) return directVariantId;

    const productDetails = await fetchProductDetailsByID(productId);
    const variants = Array.isArray(productDetails?.variants) ? productDetails.variants : [];

    return toNumberOrUndefined(
      productDetails?.default_variant_id ??
        productDetails?.variant_id ??
        variants[0]?.variant_id ??
        variants[0]?.id
    );
  };

  const handleCartAction = async (item: WishlistItem) => {
    const productId = resolveProductId(item);
    const itemKey = String(item?.wishlist_id ?? item?.id ?? productId ?? "");

    if (!productId) {
      Alert.alert("Cart", "Product information is incomplete.");
      return;
    }

    try {
      setCartLoadingKey(itemKey);
      const variantId = await resolveCartVariantId(item, productId);

      if (!variantId) {
        Alert.alert("Cart", "Product variant is missing.");
        return;
      }

      if (isItemInCart(productId, variantId)) {
        navigation.navigate("Cart");
        return;
      }

      await addItem(productId, variantId, 1);
      Alert.alert("Cart", "Item added to cart.");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to add item to cart.";
      Alert.alert("Cart", String(message));
    } finally {
      setCartLoadingKey(null);
    }
  };

  const renderProduct = ({ item }: { item: WishlistItem }) => {
    const productId = resolveProductId(item);
    const variantId = resolveVariantId(item);
    const itemKey = String(item?.wishlist_id ?? item?.id ?? productId ?? "");
    const inCart = isItemInCart(productId, variantId);
    const cartBusy = cartLoadingKey === itemKey;
    const salePrice = Number(
      getProductField(item, "sale_price") ??
        getProductField(item, "price") ??
        item?.product?.variants?.[0]?.sale_price ??
        0
    );
    const mrp = Number(
      getProductField(item, "mrp") ??
        getProductField(item, "original_price") ??
        item?.product?.variants?.[0]?.mrp ??
        0
    );
    const discount = calculateDiscount(mrp, salePrice);
    const imageUrl = normalizeImage(item);
    const brand = getProductField(item, "brand_name") || item?.brand || item?.product?.brand || "BRAND";
    const name = getProductField(item, "product_name") || item?.title || item?.product?.title || "Product";
    const rawRating =
      getProductField(item, "rating") ??
      getProductField(item, "avg_rating") ??
      0;
    const parsedRating = Number(rawRating);
    const rating = Number.isFinite(parsedRating)
      ? Math.min(5, Math.max(0, parsedRating))
      : 0;
    const reviewCount = Number(
      getProductField(item, "reviews") ??
      getProductField(item, "total_reviews") ??
      0
    );
    const reviewText = `(${Number.isFinite(reviewCount) ? reviewCount : 0})`;

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} 
        activeOpacity={0.9}
        onPress={() => {
          if (productId) {
            navigation.navigate("ProductDescription", { productId });
          }
        }}
      >
        <View style={[styles.imageWrapper, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
          />
          <TouchableOpacity
            style={styles.removeBtn}
            activeOpacity={0.8}
            onPress={() => handleRemoveWishlist(item)}
          >
            <MaterialCommunityIcons name="heart" size={20} color="#E53935" />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <Text style={[styles.brand, { color: theme.text }]} numberOfLines={1}>{String(brand).toUpperCase()}</Text>
          <Text style={[styles.name, { color: theme.secondaryText }]} numberOfLines={2}>{name}</Text>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialCommunityIcons
                key={star}
                name="star"
                size={12}
                color={star <= Math.round(rating) ? "#F5B400" : "#E5E7EB"}
              />
            ))}
            <Text style={[styles.reviewText, { color: theme.secondaryText }]}>{reviewText}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={[styles.salePrice, { color: theme.text }]}>₹{salePrice || 0}</Text>
            <Text style={[styles.mrp, { color: theme.secondaryText }]}>₹{mrp || 0}</Text>
            {discount > 0 && <Text style={styles.discountText}>{discount}% OFF</Text>}
          </View>

          <TouchableOpacity
            style={[
              styles.productNavBtn,
              { backgroundColor: inCart ? "#111827" : "#F6D58B" },
              inCart && styles.goToCartBtn,
            ]}
            activeOpacity={0.85}
            onPress={() => handleCartAction(item)}
            disabled={cartBusy}
          >
            {cartBusy ? (
              <ActivityIndicator size="small" color={inCart ? "#FACC15" : "#111827"} />
            ) : (
              <Text style={[styles.btnText, inCart && styles.goToCartText]}>
                {inCart ? "GO TO CART" : "ADD TO CART"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ProductHeadColor
        title="My Wishlist"
        onBackPress={() => navigation.goBack()}
        showSearch={false}
        isDark={isDark}
      />

      <View style={styles.countRow}>
        <Text style={[styles.itemCount, { color: theme.secondaryText }]}>{items.length} items</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderProduct}
        keyExtractor={(item, index) => String(item?.wishlist_id ?? item?.id ?? index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadWishlist(true)}
            tintColor="#D69A33"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="heart-outline" size={80} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.text }]}>Your wishlist is empty</Text>
                <Text style={[styles.emptySubText, { color: theme.secondaryText }]}>Save products you love to find them quickly.</Text>
            </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  countRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  itemCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEFF3",
    padding: 10,
  },

  imageWrapper: {
    width: 104,
    height: 104,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },

  brand: {
    fontSize: 12,
    fontWeight: "800",
    color: "#333",
    textTransform: "uppercase",
  },

  name: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 1,
  },

  reviewText: {
    marginLeft: 4,
    color: "#6B7280",
    fontSize: 11,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: 'wrap',
  },

  salePrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
  },

  mrp: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  discountText: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700",
    marginLeft: 6,
  },

  productNavBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },

  goToCartBtn: {
    backgroundColor: "#111827",
    borderColor: "#FACC15",
  },

  btnText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 12,
  },
  goToCartText: {
    color: "#FACC15",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: '#94A3B8',
  },

  emptySubText: {
    marginTop: 6,
    fontSize: 13,
    color: "#A0AEC0",
    textAlign: "center",
  },
});

export default WishlistScreen;
