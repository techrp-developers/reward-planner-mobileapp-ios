import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  FlatList,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { fetchAllCategories, getProductImageUrl } from "../../api/ProductApi";
import HomeSectionSkeleton from "./HomeSectionSkeleton";
import { queryClient } from "../../../../query/queryClient";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const CATEGORIES_QUERY_KEY = ["ecommerce", "home", "categories-section"] as const;
const CATEGORIES_STALE_TIME = 10 * 60 * 1000;

type Category = {
  id: number;
  name: string;
  image: string;
};

type CategoryListItem = Category & {
  __placeholder?: boolean;
  __placeholderKey?: string;
};

const getCategoryList = (payload: any): Category[] => {
  const candidates = [
    payload?.data,
    payload?.categories,
    payload?.items,
    payload?.data?.categories,
    payload?.data?.items,
  ];

  return candidates.find(Array.isArray) ?? [];
};

const fetchCategoriesData = async (): Promise<Category[]> => {
  const response = await fetchAllCategories();
  return getCategoryList(response);
};

export const prefetchCategoriesSection = () =>
  queryClient.prefetchQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategoriesData,
    staleTime: CATEGORIES_STALE_TIME,
  });

export default function CategoriesSection() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  const { isDark, theme } = useAppTheme();

  const { data: categories = [], isLoading: loading } = useQuery<Category[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategoriesData,
    staleTime: CATEGORIES_STALE_TIME,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const layout = React.useMemo(() => {
    const sectionHorizontalMargin = 0;
    const sectionInnerPadding = 16;
    const horizontalPadding = width >= 768 ? 12 : 8;
    const gap = width >= 900 ? 16 : width >= 600 ? 14 : 12;
    const numColumns = width >= 900 ? 6 : width >= 600 ? 5 : width >= 380 ? 4 : 3;
    const availableWidth = width - sectionHorizontalMargin * 2 - sectionInnerPadding * 2;
    const totalPadding = horizontalPadding * 2;
    const totalGap = gap * (numColumns - 1);
    const cardSize = (availableWidth - totalPadding - totalGap) / numColumns;
    const imageSize = cardSize * 0.68;
    const labelFontSize = width >= 900 ? 13 : width >= 600 ? 12 : width >= 380 ? 11 : 10;
    const labelLineHeight = labelFontSize + 4;

    return {
      horizontalPadding,
      gap,
      numColumns,
      cardSize,
      imageSize,
      labelFontSize,
      labelLineHeight,
    };
  }, [width]);

  const onPressCategory = React.useCallback((item: Category) => {
    navigation.navigate("Category", {
      categoryId: item.id,
      title: item.name,
    });
  }, [navigation]);

  const listData = React.useMemo<CategoryListItem[]>(() => {
    const remainder = categories.length % layout.numColumns;
    if (remainder === 0) return categories;

    const placeholdersNeeded = layout.numColumns - remainder;
    const placeholders: CategoryListItem[] = Array.from({ length: placeholdersNeeded }, (_, index) => ({
      id: -100000 - index,
      name: "",
      image: "",
      __placeholder: true,
      __placeholderKey: `category-placeholder-${index}`,
    }));

    return [...categories, ...placeholders];
  }, [categories, layout.numColumns]);

  React.useEffect(() => {
    if (!categories.length) return;

    const id = requestIdleCallback(() => {
      categories.slice(0, layout.numColumns).forEach((item) => {
        const imageUrl = getProductImageUrl(item.image, "thumbnail", 45);
        if (imageUrl) {
          Image.prefetch(imageUrl).catch(() => {});
        }
      });
    });

    return () => cancelIdleCallback(id);
  }, [categories, layout.numColumns]);

  const renderItem = React.useCallback(
    ({ item }: { item: CategoryListItem }) => {
      const cardSizeStyle = {
        width: layout.cardSize,
      };

      if (item.__placeholder) {
        return (
          <View style={[styles.placeholderCard, cardSizeStyle]} />
        );
      }

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.categoryCard,
            cardSizeStyle,
          ]}
          onPress={() => onPressCategory(item)}
        >
          <LinearGradient
            colors={isDark ? ["#FACC15", "#FFFFFF"] : ["#FACC15", "#111827"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradientBorder,
                {
                  width: layout.cardSize,
                  height: layout.cardSize,
                  borderRadius: layout.cardSize * 0.26,
                },
              ]}
          >
            <View
              style={[
                styles.cardInner,
                {
                  borderRadius: layout.cardSize * 0.22,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <Image
                source={{ uri: getProductImageUrl(item.image, "thumbnail", 45) }}
                style={{
                  width: layout.imageSize,
                  height: layout.imageSize,
                }}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>

          <Text
            style={[
              styles.label,
              {
                width: layout.cardSize,
                fontSize: layout.labelFontSize,
                lineHeight: layout.labelLineHeight,
                minHeight: layout.labelLineHeight * 2,
                color: theme.text,
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [isDark, layout, onPressCategory, theme.card, theme.text]
  );

  if (loading) {
    return <HomeSectionSkeleton height={240} backgroundColor={theme.background} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: theme.text }]}>Categories</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("CategoriesScreen")}
          style={styles.exploreBtn}
        >
          <Text style={[styles.exploreText, { color: isDark ? "#FFFFFF" : "#111827" }]}>View All</Text>
          <MaterialIcons name="chevron-right" size={18} color={isDark ? "#FFFFFF" : "#111827"} />
        </TouchableOpacity>
      </View>
      <FlatList
        key={`categories-${layout.numColumns}`}
        data={listData}
        keyExtractor={(item, index) => item.__placeholderKey ?? `${item.id}-${index}`}
        numColumns={layout.numColumns}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: layout.horizontalPadding },
        ]}
        columnWrapperStyle={[styles.columnWrapper, { columnGap: layout.gap }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        removeClippedSubviews={true}
        initialNumToRender={layout.numColumns * 2}
        maxToRenderPerBatch={layout.numColumns}
        windowSize={4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,

  },
  listContent: {
    paddingBottom: 4,
  },
  columnWrapper: {
    marginBottom: 6,
  },
  categoryCard: {
    alignItems: "center",
    flexGrow: 0,
    flexShrink: 0,
    
  },
  placeholderCard: {
    opacity: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  gradientBorder: {
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInner: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFF6FE",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  label: {
    marginTop: 6,
    fontWeight: "600",
    color: "#4A4A4A",
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  loader: {
    paddingVertical: 30,
    alignItems: "center",
  },
  headerRow: {
    paddingHorizontal: 0,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  exploreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3B82F6",
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 999,
  },
});
