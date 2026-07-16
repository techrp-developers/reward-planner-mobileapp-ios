import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { fetchAllCategories, getProductImageUrl } from "../../api/ProductApi";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

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

export default function CategoriesSection() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();

  const { data: categories = [], isLoading: loading } = useQuery<Category[]>({
    queryKey: ["ecommerce", "home", "categories-section"],
    queryFn: async () => {
      const res = await fetchAllCategories();
      return getCategoryList(res);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const layout = React.useMemo(() => {
    const horizontalPadding = width >= 768 ? 20 : 16;
    const gap = width >= 900 ? 16 : width >= 600 ? 14 : 12;
    const numColumns = width >= 900 ? 6 : width >= 600 ? 5 : width >= 380 ? 4 : 3;
    const totalPadding = horizontalPadding * 2;
    const totalGap = gap * (numColumns - 1);
    const cardSize = (width - totalPadding - totalGap) / numColumns;
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
            colors={["#A654CD", "#FC8BAD"]}
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
    [layout, onPressCategory]
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#A654CD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Categories</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("CategoriesScreen")}
          style={styles.exploreBtn}
        >
          <Text style={styles.exploreText}>View All</Text>
          <MaterialIcons name="chevron-right" size={18} color="#3B82F6" />
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
    paddingVertical: 10,
    backgroundColor: "#fff",
        paddingHorizontal:20,

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
    // paddingHorizontal: 16,
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
  },
});
