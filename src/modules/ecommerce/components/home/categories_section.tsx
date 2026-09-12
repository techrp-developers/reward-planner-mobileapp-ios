import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  FlatList,
  InteractionManager,
  Animated,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { fetchAllCategories, getProductImageUrl } from "../../api/ProductApi";
import { queryClient } from "../../../../query/queryClient";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { fs, rs } from "../../../../utils/responsive";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const CATEGORIES_QUERY_KEY = ["ecommerce", "home", "categories-section"] as const;
const CATEGORIES_STALE_TIME = 10 * 60 * 1000;

const HORIZONTAL_PADDING = rs(16);
const CARD_GAP = rs(10);
const VISIBLE_CATEGORY_COUNT = 5;
const SKELETON_CARD_COUNT = 5;

type Category = {
  id: number;
  name: string;
  image: string;
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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function CategoryItemSeparator() {
  return <View style={styles.itemSeparator} />;
}

const CategoryTile = React.memo(function CategoryTile({
  item,
  cardWidth,
  imageHeight,
  labelColor,
  cardBackgroundColor,
  shadowColor,
  onPress,
}: {
  item: Category;
  cardWidth: number;
  imageHeight: number;
  labelColor: string;
  cardBackgroundColor: string;
  shadowColor: string;
  onPress: (item: Category) => void;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = React.useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.93,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }),
      Animated.timing(opacity, {
        toValue: 0.86,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  const handlePressOut = React.useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 9,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      style={[styles.categoryTile, { width: cardWidth, opacity, transform: [{ scale }] }]}
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View
        style={[
          styles.imageBox,
          {
            width: cardWidth,
            height: imageHeight,
            backgroundColor: cardBackgroundColor,
            shadowColor,
          },
        ]}
      >
        <Image
          source={{ uri: getProductImageUrl(item.image, "thumbnail", 45) }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={[styles.label, { color: labelColor }]} numberOfLines={2} ellipsizeMode="tail">
        {item.name}
      </Text>
    </AnimatedTouchable>
  );
});

function CategoryCarouselSkeleton({ cardWidth }: { cardWidth: number }) {
  const { isDark } = useAppTheme();
  const opacity = React.useRef(new Animated.Value(0.55)).current;
  const skeletonColor = isDark ? "#27272A" : "#EEF1F5";

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 650, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.skeletonRow, { opacity, paddingHorizontal: HORIZONTAL_PADDING }]}
    >
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <View key={index} style={{ width: cardWidth, marginRight: CARD_GAP }}>
          <View
            style={[
              styles.skeletonImage,
              {
                width: cardWidth,
                height: cardWidth * 1.05,
                backgroundColor: skeletonColor,
              },
            ]}
          />
          <View style={[styles.skeletonLabel, { backgroundColor: skeletonColor }]} />
        </View>
      ))}
    </Animated.View>
  );
}

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
    // Keep exactly five category tiles visible so the row feels balanced
    // across small and large phones.
    const cardWidth =
      (width - HORIZONTAL_PADDING * 2 - CARD_GAP * (VISIBLE_CATEGORY_COUNT - 1)) /
      VISIBLE_CATEGORY_COUNT;

    return {
      cardWidth,
      imageHeight: cardWidth,
      snapInterval: cardWidth + CARD_GAP,
    };
  }, [width]);

  const onPressCategory = React.useCallback(
    (item: Category) => {
      navigation.navigate("Category", {
        categoryId: item.id,
        title: item.name,
      });
    },
    [navigation]
  );

  React.useEffect(() => {
    if (!categories.length) return;

    const visibleCount = Math.ceil(width / layout.snapInterval) + 1;
    const task = InteractionManager.runAfterInteractions(() => {
      categories.slice(0, visibleCount).forEach((item) => {
        const imageUrl = getProductImageUrl(item.image, "thumbnail", 45);
        if (imageUrl) {
          Image.prefetch(imageUrl).catch(() => { });
        }
      });
    });

    return () => task.cancel();
  }, [categories, layout.snapInterval, width]);

  const renderItem = React.useCallback(
    ({ item }: { item: Category }) => (
      <CategoryTile
        item={item}
        cardWidth={layout.cardWidth}
        imageHeight={layout.imageHeight}
        labelColor={theme.text}
        cardBackgroundColor={theme.card}
        shadowColor={isDark ? "#000000" : "#94A3B8"}
        onPress={onPressCategory}
      />
    ),
    [isDark, layout.cardWidth, layout.imageHeight, onPressCategory, theme.card, theme.text]
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.heading, { color: theme.text }]}>Categories</Text>
        </View>
        <CategoryCarouselSkeleton cardWidth={layout.cardWidth} />
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: theme.text }]}>Categories</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("CategoriesScreen")}
          style={styles.exploreBtn}
        >
          <Text style={[styles.exploreText, { color: theme.text }]}>View All</Text>
          <MaterialIcons name="chevron-right" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={layout.snapInterval}
        snapToAlignment="start"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={CategoryItemSeparator}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: rs(12),
    paddingBottom: rs(14),
  },
  headerRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: rs(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    fontSize: fs(16.5),
    fontWeight: "700",
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
  },
  exploreText: {
    fontSize: fs(12),
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  itemSeparator: {
    width: CARD_GAP,
  },
  categoryTile: {
    alignItems: "center",
  },
  imageBox: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: rs(15),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  image: {
    width: "84%",
    height: "84%",
  },
  label: {
    marginTop: rs(6),
    width: "100%",
    fontSize: fs(10),
    fontWeight: "600",
    textAlign: "center",
    lineHeight: fs(13),
    minHeight: rs(26),
  },
  skeletonRow: {
    flexDirection: "row",
  },
  skeletonImage: {
    borderRadius: 16,
  },
  skeletonLabel: {
    marginTop: 8,
    alignSelf: "center",
    width: "60%",
    height: 12,
    borderRadius: 6,
  },
});