import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

const CategoriesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

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
      try {
        setSubLoading(true);
        const subcategoriesData = await fetchCategoriesBySubCategories(selectedCatId);
        const list = Array.isArray(subcategoriesData)
          ? subcategoriesData
          : subcategoriesData?.data || [];
        setSubcategories(list);
      } catch (error) {
        console.error("Error loading subcategories:", error);
        setSubcategories([]);
      } finally {
        setSubLoading(false);
      }
    };

    loadSubcategories();
  }, [selectedCatId]);

  const topCategories = useMemo(() => subcategories.slice(0, 3), [subcategories]);
  const newLaunches = useMemo(() => subcategories.slice(3), [subcategories]);

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

  const renderCategoryIcon = (category: any) => {
    const uri = resolveImageUri(category);
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
  };

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

      <ScrollView style={styles.container}>
        {/* Left Sidebar Categories */}
        <View style={styles.mainContent}>
          <View style={styles.sidebar}>
            {/* All Categories Option */}
            <TouchableOpacity
              style={[
                styles.sidebarItem,
                selectedCatId === null && styles.sidebarItemActive,
              ]}
              onPress={() => {
                setSelectedCatId(null);
                setSubcategories([]);
              }}
            >
              <View style={styles.sidebarIconContainer}>
                <AllIcons width={32} height={32} />
              </View>
              <Text style={styles.sidebarText}>All</Text>
            </TouchableOpacity>

            {/* Dynamic Categories */}
            {categories.map((category) => (
              <TouchableOpacity
                key={String(category.id ?? category.category_id ?? category.name)}
                style={[
                  styles.sidebarItem,
                  selectedCatId === (category.id ?? category.category_id) && styles.sidebarItemActive,
                ]}
                onPress={() => {
                  setSelectedCatId(category.id ?? category.category_id);
                }}
              >
                <View style={styles.sidebarIconContainer}>
                  {renderCategoryIcon(category)}
                </View>
                <Text style={styles.sidebarText} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Right Content Area */}
          <View style={styles.contentArea}>
            {subLoading ? (
              <View style={styles.subLoadingWrap}>
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top Categories For You</Text>
                  <View style={styles.grid}>
                    {topCategories.map((item, index) => (
                      <TouchableOpacity
                        key={String(item.id ?? item.subcategory_id ?? `${item.name}-${index}`)}
                        style={styles.gridItem}
                      >
                        <View style={styles.gridIconContainer}>
                          {renderCategoryIcon(item)}
                        </View>
                        <Text style={styles.gridText} numberOfLines={2}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>New & Upcoming Launches</Text>
                  <View style={styles.grid}>
                    {newLaunches.map((item, index) => (
                      <TouchableOpacity
                        key={String(item.id ?? item.subcategory_id ?? `${item.name}-${index}`)}
                        style={styles.gridItem}
                      >
                        <View style={styles.gridIconContainer}>
                          {renderCategoryIcon(item)}
                        </View>
                        <Text style={styles.gridText} numberOfLines={2}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  subLoadingWrap: {
    paddingTop: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  gridItem: {
    width: "30%",
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

export default CategoriesScreen;