import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Animated,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";
import ProductHeadColor from "../constants/heading/Poduct_Head_Color";
import AllIcons from "../../../assets/menu/AllCategories.svg";
import { fetchAllCategories, fetchCategoriesBySubCategories, getProductImageUrl } from "../api/ProductApi";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "CategoriesScreen"
>;

const getCategoryId = (item: any) => item?.id ?? item?.category_id;
const getSubcategoryId = (item: any) => item?.id ?? item?.subcategory_id;
const CARD_COLUMNS = 3;

const resolveImageUri = (item: any) => {
  const src =
    item?.image_url ||
    item?.image ||
    item?.icon ||
    item?.category_image ||
    item?.subcategory_image;

  if (!src) return "";
  if (String(src).startsWith("http")) return src;
  return getProductImageUrl(src);
};

const CategoryIcon = React.memo(function CategoryIcon({ item }: { item: any }) {
  const uri = resolveImageUri(item);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.categoryIcon}
        resizeMode="contain"
      />
    );
  }

  return <View style={styles.categoryIconPlaceholder} />;
});

const SidebarCategory = React.memo(function SidebarCategory({
  category,
  selected,
  onPress,
}: {
  category: any;
  selected: boolean;
  onPress: (category: any) => void;
}) {
  const handlePress = useCallback(() => onPress(category), [category, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.sidebarItem,
        selected && styles.sidebarItemActive,
      ]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.sidebarIconContainer}>
        <CategoryIcon item={category} />
      </View>
      <Text style={styles.sidebarText} numberOfLines={2}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
});

const SubcategoryCard = React.memo(function SubcategoryCard({
  item,
  onPress,
}: {
  item: any;
  onPress: (item: any) => void;
}) {
  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  return (
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={0.86}
      onPress={handlePress}
    >
      <View style={styles.gridIconContainer}>
        <CategoryIcon item={item} />
      </View>
      <Text style={styles.gridText} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
});

type ContentRow =
  | { type: "header"; key: string; title: string }
  | { type: "items"; key: string; items: any[] };

const chunkItems = (items: any[], size: number) => {
  const rows: any[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
};

const AllCategories = () => {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const subcategoryRequestId = useRef(0);

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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await fetchAllCategories();
      const list = Array.isArray(categoriesData)
        ? categoriesData
        : categoriesData?.data || [];

      setCategories(list);

      if (list.length > 0) {
        const firstCategoryId = list[0]?.id ?? list[0]?.category_id;
        setSelectedCatId(firstCategoryId);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCatId === null || selectedCatId === undefined) return;

    const loadSubcategories = async () => {
      const requestId = subcategoryRequestId.current + 1;
      subcategoryRequestId.current = requestId;

      try {
        setSubLoading(true);
        const subcategoriesData = await fetchCategoriesBySubCategories(selectedCatId);
        if (subcategoryRequestId.current !== requestId) return;

        const list = Array.isArray(subcategoriesData)
          ? subcategoriesData
          : subcategoriesData?.data || [];
        setSubcategories(list);
      } catch (error) {
        if (subcategoryRequestId.current !== requestId) return;
        console.error("Error loading subcategories:", error);
        setSubcategories([]);
      } finally {
        if (subcategoryRequestId.current === requestId) {
          setSubLoading(false);
        }
      }
    };

    loadSubcategories();
  }, [selectedCatId]);

  const topCategories = useMemo(() => subcategories.slice(0, 3), [subcategories]);
  const newLaunches = useMemo(() => subcategories.slice(3), [subcategories]);
  const contentRows = useMemo<ContentRow[]>(() => {
    const rows: ContentRow[] = [];

    rows.push({ type: "header", key: "top-header", title: "Top Categories For You" });
    chunkItems(topCategories, CARD_COLUMNS).forEach((items, index) => {
      rows.push({ type: "items", key: `top-${index}`, items });
    });

    if (newLaunches.length > 0) {
      rows.push({ type: "header", key: "launches-header", title: "New & Upcoming Launches" });
      chunkItems(newLaunches, CARD_COLUMNS).forEach((items, index) => {
        rows.push({ type: "items", key: `launches-${index}`, items });
      });
    }

    return rows;
  }, [newLaunches, topCategories]);

  const openSubcategory = useCallback((item: any) => {
    const categoryId = selectedCatId ?? item?.category_id;
    const subcategoryId = getSubcategoryId(item);
    if (categoryId === null || categoryId === undefined || subcategoryId === undefined) return;

    const categoryTitle = categories.find(
      (category) => getCategoryId(category) === categoryId,
    )?.name ?? 'Products';

    navigation.navigate('Category', {
      categoryId,
      title: categoryTitle,
      subcategoryId,
      subcategoryTitle: item?.name,
    });
  }, [categories, navigation, selectedCatId]);

  const selectAllCategories = useCallback(() => {
    subcategoryRequestId.current += 1;
    setSelectedCatId(null);
    setSubLoading(false);
    setSubcategories([]);
  }, []);

  const selectCategory = useCallback((category: any) => {
    const nextId = getCategoryId(category);
    if (nextId === selectedCatId) return;
    setSelectedCatId(nextId);
  }, [selectedCatId]);

  const renderSidebarCategory = useCallback(({ item }: { item: any }) => (
    <SidebarCategory
      category={item}
      selected={selectedCatId === getCategoryId(item)}
      onPress={selectCategory}
    />
  ), [selectCategory, selectedCatId]);

  const renderContentRow = useCallback(({ item }: { item: ContentRow }) => {
    if (item.type === "header") {
      return <Text style={styles.sectionTitle}>{item.title}</Text>;
    }

    return (
      <View style={styles.gridRow}>
        {item.items.map((subcategory, index) => (
          <SubcategoryCard
            key={String(getSubcategoryId(subcategory) ?? `${subcategory?.name}-${index}`)}
            item={subcategory}
            onPress={openSubcategory}
          />
        ))}
        {Array.from({ length: CARD_COLUMNS - item.items.length }).map((_, index) => (
          <View key={`placeholder-${index}`} style={styles.gridItemPlaceholder} />
        ))}
      </View>
    );
  }, [openSubcategory]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ProductHeadColor
          title="Categories"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingSkeletonWrap}>
          <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={16} />
          <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={16} style={styles.loadingSkeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={112} borderRadius={16} style={styles.loadingSkeletonGap} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ProductHeadColor
        title="All Categories"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* Left Sidebar Categories */}
        <View style={styles.mainContent}>
          <View style={styles.sidebar}>
            {/* All Categories Option */}
            <TouchableOpacity
              style={[
                styles.sidebarItem,
                selectedCatId === null && styles.sidebarItemActive,
              ]}
              activeOpacity={0.8}
              onPress={selectAllCategories}
            >
              <View style={styles.sidebarIconContainer}>
                <AllIcons width={32} height={32} />
              </View>
              <Text style={styles.sidebarText}>All</Text>
            </TouchableOpacity>

            {/* Dynamic Categories */}
            <FlatList
              data={categories}
              renderItem={renderSidebarCategory}
              keyExtractor={(item, index) => String(getCategoryId(item) ?? `${item?.name}-${index}`)}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={8}
              maxToRenderPerBatch={6}
              updateCellsBatchingPeriod={50}
              windowSize={7}
            />
          </View>

          {/* Right Content Area */}
          <View style={styles.contentArea}>
            {subLoading ? (
              <View style={styles.subLoadingWrap}>
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : (
              <FlatList
                data={contentRows}
                renderItem={renderContentRow}
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentList}
                removeClippedSubviews={true}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                updateCellsBatchingPeriod={40}
                windowSize={7}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingSkeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingSkeletonGap: {
    marginTop: 14,
  },
  mainContent: {
    flexDirection: "row",
    flex: 1,
  },
  sidebar: {
    width: 100,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  sidebarItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  sidebarItemActive: {
    backgroundColor: "#F3E8FF",
    borderLeftWidth: 3,
    borderLeftColor: "#8B5CF6",
  },
  sidebarIconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  sidebarText: {
    fontSize: 11,
    textAlign: "center",
    color: "#374151",
    fontWeight: "500",
  },
  contentArea: {
    flex: 1,
    padding: 16,
  },
  subLoadingWrap: {
    paddingTop: 20,
    alignItems: "center",
  },
  contentList: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  gridItem: {
    width: "31%",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  gridItemPlaceholder: {
    width: "31%",
  },
  gridIconContainer: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  gridText: {
    fontSize: 12,
    textAlign: "center",
    color: "#374151",
    fontWeight: "500",
  },
  categoryIcon: {
    width: 40,
    height: 40,
  },
  categoryIconPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
});

export default AllCategories;
