import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Animated,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { fetchAllCategories, fetchCategoriesByID, getProductImageUrl } from "../api/ProductApi";
import SkeletonBox from "../../services/component/constant/SkeletonBox";
import ProductGrid from "../components/home/productgrid";
import { normalizeProduct } from "../utils/normalizeProduct";
import { queryClient } from "../../../query/queryClient";
import { useAppTheme } from "../../../theme/ThemeContext";
import type { HomeStackParamList } from "../navigation/types";

type Category = {
  id: number;
  name: string;
  image?: string;
};

type CategoryProduct = {
  id?: number | string;
  [key: string]: any;
};

type CategoryProductsPage = {
  products: CategoryProduct[];
  nextPage?: number;
};

const PAGE_LIMIT = 10;
const GRID_COLUMNS = 2;
const PRODUCT_CATEGORIES_QUERY_KEY = ["ecommerce", "home", "categories"] as const;
const productCategoryProductsQueryKey = (categoryId: number | null) =>
  ["ecommerce", "home", "category-products", categoryId] as const;

const fetchProductCategories = async (): Promise<Category[]> => {
  const res = await fetchAllCategories();
  const fetchedCategories = Array.isArray(res?.data)
    ? res.data
        .map((category: any) => ({
          id: Number(category?.id ?? category?.category_id),
          name: String(category?.name ?? category?.category_name ?? "").trim(),
          image: category?.image ?? category?.icon,
        }))
        .filter((category: Category) => category.id && category.name)
    : [];

  return fetchedCategories;
};

const fetchCategoryProductsPage = async (
  categoryId: number,
  page: number,
): Promise<CategoryProductsPage> => {
  const res = await fetchCategoriesByID(categoryId, {
    page,
    limit: PAGE_LIMIT,
  });

  const rawProducts = Array.isArray(res?.products)
    ? res.products
    : Array.isArray(res?.data?.products)
      ? res.data.products
      : Array.isArray(res?.data)
        ? res.data
        : [];

  const products = rawProducts.map(normalizeProduct);

  const hasMore = Boolean(res?.hasMore ?? res?.data?.hasMore);
  const currentPage = Number(res?.currentPage ?? res?.data?.currentPage ?? page);

  return {
    products,
    nextPage: hasMore ? currentPage + 1 : undefined,
  };
};

// Memoized category item component
type CategoryItemProps = {
  cat: Category;
  isActive: boolean;
  onPress: (id: number) => void;
  theme: ReturnType<typeof useAppTheme>["theme"];
};

const CategoryItem = React.memo(({ cat, isActive, onPress, theme }: CategoryItemProps) => (
  <TouchableOpacity
    style={styles.catItem}
    onPress={() => onPress(cat.id)}
    activeOpacity={0.85}
  >
    {cat.image ? (
      <Image
        source={{ uri: getProductImageUrl(cat.image) }}
        style={styles.categoryImage}
      />
    ) : (
      <View style={[styles.iconWrap, styles.iconInactive]} />
    )}

    <Text
      style={[
        styles.catLabel,
        { color: theme.secondaryText },
        isActive && styles.catLabelActive,
        isActive && { color: theme.text },
      ]}
    >
      {cat.name}
    </Text>

    <View
      style={[
        styles.underline,
        isActive && styles.underlineActive,
        isActive && { backgroundColor: theme.primary },
      ]}
    />
  </TouchableOpacity>
), (prevProps, nextProps) => 
  prevProps.cat.id === nextProps.cat.id &&
  prevProps.isActive === nextProps.isActive &&
  prevProps.onPress === nextProps.onPress &&
  prevProps.theme === nextProps.theme
);

CategoryItem.displayName = "CategoryItem";

const ProductCategory = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const { theme } = useAppTheme();

  const handleProductPress = useCallback((productId: string | number) => {
    if (!productId) return;
    navigation.navigate("ProductDescription", { productId });
  }, [navigation]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: PRODUCT_CATEGORIES_QUERY_KEY,
    queryFn: fetchProductCategories,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [activeCategoryId, categories]);

  const {
    data: paginatedProducts,
    isLoading: isProductsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error: productsError,
  } = useInfiniteQuery<CategoryProductsPage>({
    queryKey: productCategoryProductsQueryKey(activeCategoryId),
    enabled: Boolean(activeCategoryId),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam) || 1;
      return fetchCategoryProductsPage(activeCategoryId as number, page);
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const products = useMemo(
    () => (paginatedProducts?.pages ?? []).flatMap((page) => page.products),
    [paginatedProducts?.pages]
  );

  const loading = isCategoriesLoading || (Boolean(activeCategoryId) && isProductsLoading);
  const errorMsg = (() => {
    if (categoriesError) return "Unable to load categories. Please try again.";
    const productErr: any = productsError;
    if (!productErr) return "";
    if (productErr?.response?.status === 522) {
      return "Server is busy. Please try again shortly.";
    }
    return "Unable to load products right now.";
  })();

  const onCategoryPress = useCallback((categoryId: number) => {
    if (categoryId === activeCategoryId) return;
    setActiveCategoryId(categoryId);
  }, [activeCategoryId]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.categoryBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CategoryItem
              cat={item}
              isActive={activeCategoryId === item.id}
              onPress={onCategoryPress}
              theme={theme}
            />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={12}
          windowSize={5}
          ListEmptyComponent={
            loading ? (
              <View style={styles.categorySkeletonRow}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <View key={`cat-skeleton-${index}`} style={styles.categorySkeletonItem}>
                    <SkeletonBox pulse={pulse} width={34} height={34} borderRadius={17} />
                    <SkeletonBox pulse={pulse} width={52} height={10} borderRadius={999} style={styles.categorySkeletonText} />
                  </View>
                ))}
              </View>
            ) : null
          }
        />
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <View style={styles.productSkeletonGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={`product-skeleton-${index}`} style={[styles.productSkeletonCard, { backgroundColor: theme.card }]}>
                <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={12} />
                <SkeletonBox pulse={pulse} width="88%" height={12} borderRadius={999} style={styles.productSkeletonText} />
                <SkeletonBox pulse={pulse} width="54%" height={10} borderRadius={999} style={styles.productSkeletonTextSmall} />
              </View>
            ))}
          </View>
        </View>
      ) : errorMsg ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{errorMsg}</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No products found in this category.</Text>
        </View>
      ) : (
        <ProductGrid
          products={products}
          columns={GRID_COLUMNS}
          useFlatList={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          loadingMore={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onProductPress={handleProductPress}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoaderWrap}>
                <ActivityIndicator size="small" color="#1D4ED8" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

export default ProductCategory;

export const prefetchProductCategoriesSection = () =>
  queryClient
    .fetchQuery({
      queryKey: PRODUCT_CATEGORIES_QUERY_KEY,
      queryFn: fetchProductCategories,
      staleTime: 10 * 60 * 1000,
    })
    .then((categories) => {
      const firstCategoryId = categories[0]?.id;
      if (!firstCategoryId) return;

      return queryClient.prefetchInfiniteQuery({
        queryKey: productCategoryProductsQueryKey(firstCategoryId),
        queryFn: ({ pageParam }) => fetchCategoryProductsPage(firstCategoryId, Number(pageParam) || 1),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        staleTime: 5 * 60 * 1000,
      });
    });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },

  categoryBar: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    paddingTop: 10,
  },

  categoryRow: {
    paddingHorizontal: 14,
    alignItems: "flex-end",
  },

  catItem: {
    alignItems: "center",
    paddingBottom: 10,
    minWidth: 64,
    marginRight: 22,
  },

  iconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  iconInactive: {
    opacity: 0.65,
  },

  categoryImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginBottom: 2,
  },

  catLabel: {
    marginTop: 6,
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  catLabelActive: {
    color: "#111827",
    fontWeight: "700",
  },

  underline: {
    marginTop: 8,
    height: 3,
    width: 44,
    borderRadius: 99,
    backgroundColor: "transparent",
  },

  underlineActive: {
    backgroundColor: "#1D4ED8",
  },

  emptyWrap: {
    alignItems: "center",
    marginTop: 20,
  },

  emptyText: {
    color: "#888",
    fontSize: 13,
  },
  categorySkeletonRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
  },
  categorySkeletonItem: {
    alignItems: "center",
    marginRight: 22,
    paddingBottom: 10,
  },
  categorySkeletonText: {
    marginTop: 8,
  },
  productSkeletonGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  productSkeletonCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 6,
    marginBottom: 12,
  },
  productSkeletonText: {
    marginTop: 8,
  },
  productSkeletonTextSmall: {
    marginTop: 6,
  },
  footerLoaderWrap: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
