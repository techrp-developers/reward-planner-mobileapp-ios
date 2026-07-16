import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  Pressable,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ProductGrid from "../home/productgrid";
import {
  getCustomersAlsoBought,
  getSimilarProducts,
} from "../../api/PromotionalApi";

const { height } = Dimensions.get("window");
const SHEET_HEIGHT = height * 0.62;
const OPEN_DURATION = 300;

type Source = "also-bought" | "similar";

type Props = {
  visible: boolean;
  onClose: () => void;
  productId?: string | number;
};

/**
 * Normalize a raw product from any promotional endpoint so ProductGrid's
 * visibility tracker (uses item.id) and ProductCard (price, images) always work.
 */
function normalizeProduct(raw: any): any {
  return {
    ...raw,
    // Ensure `id` is present so ProductGrid's itemKey resolves correctly
    id: raw.id ?? raw.product_id ?? raw.productId ?? raw._id,
    // Ensure price fields that ProductCard reads
    price: raw.price ?? raw.sale_price ?? raw.selling_price ?? raw.mrp,
    selling_price: raw.selling_price ?? raw.sale_price ?? raw.price,
    original_price: raw.original_price ?? raw.mrp ?? raw.originalPrice,
    // Ensure image field candidates that ProductCard reads
    image_url: raw.image_url ?? raw.thumbnail_url ?? raw.thumbnail ?? raw.image,
  };
}

function resolveNumericProductId(value: unknown): number {
  const direct = Number(value);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const fromString = String(value ?? "").match(/\d+/)?.[0];
  const parsed = Number(fromString);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function AddToCartSheet({ visible, onClose, productId }: Props) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [products, setProducts] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [source, setSource] = useState<Source>("also-bought");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [canCloseByBackdrop, setCanCloseByBackdrop] = useState(false);
  // Defer the grid render until the slide animation finishes to avoid jank
  const [gridReady, setGridReady] = useState(false);
  const initialized = useRef(false);

  // Slide animation; enable grid AFTER animation completes
  useEffect(() => {
    if (visible) {
      setGridReady(false);
      Animated.timing(translateY, {
        toValue: 0,
        duration: OPEN_DURATION,
        useNativeDriver: true,
      }).start(() => setGridReady(true));
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: OPEN_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // Initial fetch — runs both requests in PARALLEL, picks also-bought if it has results
  useEffect(() => {
    if (!visible || initialized.current) return;
    initialized.current = true;

    const pid = resolveNumericProductId(productId);
    if (!pid) return;

    setInitialLoading(true);

    (async () => {
      try {
        // 🚀 Parallel fetch: don't wait for also-bought to finish before starting similar
        const [alsoBoughtRes, similarRes] = await Promise.allSettled([
          getCustomersAlsoBought(pid, 0),
          getSimilarProducts(pid, 0),
        ]);

        const alsoBought =
          alsoBoughtRes.status === "fulfilled"
            ? (alsoBoughtRes.value?.products ?? []).map(normalizeProduct)
            : [];

        if (alsoBought.length > 0) {
          setProducts(alsoBought);
          setOffset(alsoBought.length);
          setHasMore(
            alsoBoughtRes.status === "fulfilled"
              ? (alsoBoughtRes.value?.hasMore ?? false)
              : false
          );
          setSource("also-bought");
        } else {
          // Seamlessly fall back to similar products (already fetched in parallel)
          const similar =
            similarRes.status === "fulfilled"
              ? (similarRes.value?.products ?? []).map(normalizeProduct)
              : [];
          setProducts(similar);
          setOffset(similar.length);
          setHasMore(
            similarRes.status === "fulfilled"
              ? (similarRes.value?.hasMore ?? false)
              : false
          );
          setSource("similar");
        }
      } catch {
        // fail silently
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [visible, productId]);

  // Reset when sheet closes
  useEffect(() => {
    if (!visible) {
      initialized.current = false;
      setProducts([]);
      setOffset(0);
      setHasMore(false);
      setSource("also-bought");
      setGridReady(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setCanCloseByBackdrop(false);
      return;
    }

    setCanCloseByBackdrop(false);
    const timer = setTimeout(() => {
      setCanCloseByBackdrop(true);
    }, OPEN_DURATION + 80);

    return () => clearTimeout(timer);
  }, [visible]);

  // Load next page on scroll-to-end
  const handleEndReached = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const pid = resolveNumericProductId(productId);
    if (!pid) return;

    setLoadingMore(true);
    try {
      const res =
        source === "also-bought"
          ? await getCustomersAlsoBought(pid, offset)
          : await getSimilarProducts(pid, offset);

      const next = (res?.products ?? []).map(normalizeProduct);
      setProducts((prev) => [...prev, ...next]);
      setOffset((prev) => prev + next.length);
      setHasMore(res?.hasMore ?? false);
    } catch {
      // fail silently
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, productId, source, offset]);

  const sectionTitle =
    source === "also-bought" ? "Customers Also Bought" : "Similar Products";

  const footerComponent = useMemo(
    () =>
      hasMore || loadingMore ? (
        <View style={styles.loadMoreFooter}>
          <ActivityIndicator size="small" color="#888" />
        </View>
      ) : null,
    [hasMore, loadingMore]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop layer */}
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (canCloseByBackdrop) onClose();
          }}
        />

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Capture touches inside sheet so backdrop onPress never fires */}
          <View style={styles.sheetInner}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.successText}>
                ✔ Product Added to Cart Successfully
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <MaterialIcons name="close" size={22} color="#444" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{sectionTitle}</Text>

            {initialLoading || !gridReady ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#888" />
              </View>
            ) : (
              <ProductGrid
                products={products}
                useFlatList={true}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                hasNextPage={hasMore}
                loadingMore={loadingMore}
                ListFooterComponent={footerComponent}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
  },
  sheetInner: {
    flex: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successText: {
    color: "#16A34A",
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 1,
    marginRight: 8,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    color: "#111",
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadMoreFooter: {
    paddingVertical: 16,
    alignItems: "center",
  },
});