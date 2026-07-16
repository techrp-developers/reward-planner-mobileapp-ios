import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  LayoutAnimation,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";
import AllIcons from "../../../assets/menu/AllCategories.svg";
import ProductHeadColor from "../constants/heading/Poduct_Head_Color";
import {
  fetchCategoriesScreenAll,
  getProductImageUrl,
} from "../api/ProductApi";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type NavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "CategoriesScreen"
>;

interface Category {
  id: string | number;
  name: string;
  image: string;
  icon?: string;
}

interface SubCategory {
  id: string | number;
  name: string;
  image?: string;
  categoryId?: string | number;
}

interface CategoryWithSubcategories extends Category {
  subcategories: SubCategory[];
}

const CategoriesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string | number | null>(null);
  const [isAllMode, setIsAllMode] = useState(true);
  const [allData, setAllData] = useState<CategoryWithSubcategories[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showTabBar, setShowTabBar] = useState(true);
  const lastScrollYRef = useRef(0);
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

  const onToggleExpanded = useCallback((categoryId: string | number) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [String(categoryId)]: !prev[String(categoryId)],
    }));
  }, []);

  // Handle scroll and hide bottom tab when reaching bottom
  const handleContentScroll = useCallback((event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const isAtBottom = scrollY + layoutMeasurement.height >= contentSize.height - 100;

    if (isAtBottom && showTabBar) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowTabBar(false);
    } else if (!isAtBottom && !showTabBar) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowTabBar(true);
    }

    lastScrollYRef.current = scrollY;
  }, [showTabBar]);

  // Update tab bar visibility
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: {
        display: showTabBar ? 'flex' : 'none',
      },
    } as any);
  }, [showTabBar, navigation]);
  

  const loadAllCategories = async () => {
    try {
      setLoading(true);
      setIsAllMode(true);
      setSelectedCatId(null);

      const res = await fetchCategoriesScreenAll();
      setAllData(res?.data || []);

    } catch (e) {
      console.log("ALL load error", e);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const allCategoriesData = await fetchCategoriesScreenAll();
      setAllData(allCategoriesData?.data || []);
      setIsAllMode(true);
      setSelectedCatId(null);
    } catch (error) {
      console.error("Error loading categories data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const resolveImageUri = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return getProductImageUrl(path);
  };

  const handleCategoryPress = (categoryId: string | number) => {
    setIsAllMode(false);
    setSelectedCatId(categoryId);
  };

  const handleSubcategoryPress = (
    category: CategoryWithSubcategories,
    subcategory: SubCategory
  ) => {
    navigation.navigate("Category", {
      categoryId: category.id,
      title: category.name,
      subcategoryId: subcategory.id,
      subcategoryTitle: subcategory.name,
    });
  };
  if (loading) {
    return (
      <View style={styles.screen}>
        <ProductHeadColor title="All Categories" onBackPress={() => navigation.goBack()} />
        <View style={styles.mainContainer}>
          <View style={styles.sidebar}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={`sidebar-skeleton-${index}`} style={styles.sidebarSkeletonItem}>
                <SkeletonBox pulse={pulse} width={56} height={56} borderRadius={12} />
                <SkeletonBox pulse={pulse} width={58} height={10} borderRadius={999} style={styles.sidebarSkeletonText} />
              </View>
            ))}
          </View>
          <View style={styles.contentArea}>
            <SkeletonBox pulse={pulse} width="46%" height={18} borderRadius={999} />
            <View style={styles.contentSkeletonGrid}>
              {Array.from({ length: 6 }).map((_, index) => (
                <View key={`category-skeleton-${index}`} style={styles.contentSkeletonItem}>
                  <SkeletonBox pulse={pulse} width="100%" height={92} borderRadius={16} />
                  <SkeletonBox pulse={pulse} width="82%" height={12} borderRadius={999} style={styles.contentSkeletonText} />
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  const selectedCategoryData =
    !isAllMode && selectedCatId !== null
      ? allData.filter((cat) => String(cat.id) === String(selectedCatId))
      : [];

  const categoriesToRender = isAllMode ? allData : selectedCategoryData;
  const sidebarCategories = allData;

  return (
    <View style={styles.screen}>
      <ProductHeadColor
        title="All Categories"
        onBackPress={() => navigation.goBack()}
      />

      {/* Left Sidebar Categories + Right Content */}
      <View style={styles.mainContainer}>
        <View style={styles.sidebar}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarScrollContent}
          >
            {/* All Categories Option */}
            <TouchableOpacity
              style={[styles.sidebarItem, isAllMode && styles.sidebarItemActive]}
              onPress={loadAllCategories}
            >
              <View style={styles.iconContainer}>
                <AllIcons width={32} height={32} />
              </View>
              <Text style={styles.sidebarText}>All</Text>
            </TouchableOpacity>      

            {/* Dynamic Categories */}
            {sidebarCategories.map((category) => (
              <TouchableOpacity
                key={String(category.id)}
                style={[
                  styles.sidebarItem,
                  !isAllMode && selectedCatId === category.id && styles.sidebarItemActive,
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={styles.iconContainer}>
                  {category.image ? (
                    <Image
                      source={{ uri: resolveImageUri(category.image) }}
                      style={styles.categoryIcon}
                    />
                  ) : (
                    <View style={styles.placeholderIcon} />
                  )}
                </View>
                <Text style={styles.sidebarText} numberOfLines={2}>
                  {category.name?.trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right Content Area */}
        <ScrollView
          style={styles.contentArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentScrollContent}
          onScroll={handleContentScroll}
          scrollEventThrottle={16}
        >
          
          {categoriesToRender.length > 0 ? (
            <AllCategoriesView
              data={categoriesToRender}
              expanded={expandedCategories}
              onToggle={onToggleExpanded}
              resolveImageUri={resolveImageUri}
              showViewMore={isAllMode}
              onSubcategoryPress={handleSubcategoryPress}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No subcategories available</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};
const AllCategoriesView = ({ data, expanded, onToggle, resolveImageUri, showViewMore, onSubcategoryPress }: {
  data: CategoryWithSubcategories[];
  expanded: Record<string, boolean>;
  onToggle: (categoryId: string | number) => void;
  resolveImageUri: (path?: string) => string;
  showViewMore: boolean;
  onSubcategoryPress: (category: CategoryWithSubcategories, subcategory: SubCategory) => void;
}) => {
  return (
    <View>
      {data.map((category: any) => {
        const isExpanded = showViewMore ? expanded[String(category.id)] : true;
        const visibleSubs = isExpanded
          ? (category.subcategories || [])
          : (category.subcategories || []).slice(0, 3);

        return (
          <View key={category.id} style={styles.allCategoryBlock}>
            <Text style={styles.allCategoryTitle}>{category.name}</Text>

            <View style={styles.allGrid}>
              {visibleSubs.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.allItem}
                  onPress={() => onSubcategoryPress(category, sub)}
                  activeOpacity={0.85}
                >
                  <View style={styles.allImageWrap}>
                    {sub.image ? (
                      <Image
                        source={{ uri: resolveImageUri(sub.image) }}
                        style={styles.allImage}
                      />
                    ) : (
                      <View style={styles.placeholderImage} />
                    )}
                  </View>
                  <Text numberOfLines={2} style={styles.allLabel}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {showViewMore && (category.subcategories || []).length > 3 && (
              <TouchableOpacity onPress={() => onToggle(category.id)}>
                <Text style={styles.viewMore}>
                  {isExpanded ? "View Less" : "View More"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  sidebarSkeletonItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sidebarSkeletonText: {
    marginTop: 8,
  },
  contentSkeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  contentSkeletonItem: {
    width: "48%",
    marginBottom: 16,
  },
  contentSkeletonText: {
    marginTop: 10,
  },
  mainContainer: {
    flexDirection: "row",
    flex: 1,
  },
  // Left Sidebar Styles
  sidebar: {
    width: 100,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  sidebarScrollContent: {
    paddingBottom:100 ,
  },
  sidebarItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sidebarItemActive: {
    backgroundColor: "#F3E8FF",
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  placeholderIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  sidebarText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  // Right Content Area Styles
  contentArea: {
    flex: 1,
    padding: 16,
  },
  contentScrollContent: {
    paddingBottom: 100, // Extra bottom padding to prevent content from hiding behind bottom tab
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  subLoadingWrap: {
    paddingVertical: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  // Top Categories Grid
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    alignItems: "center",
    width: "48%",
  },
  categoryImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  categoryImage: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  categoryCardText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  // Subcategories Grid
  subcategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    
  },
  subcategoryCard: {
    alignItems: "center",
    width: "30%",
  },
  subcategoryImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 8,
  },
  subcategoryImage: {
    width: "90%",
    height: "90%",
    resizeMode: "contain",
  },
  subcategoryCardText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  placeholderImage: {
    width: "80%",
    height: "80%",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  allCategoryTitle: {
  fontSize: 16,
  fontWeight: "700",
  marginBottom: 12,
  color: "#111827",

},

allCategoryBlock: {
  marginBottom: 28,
},

allGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
},

allItem: {
  width: "30%",
  alignItems: "center",
},

allImageWrap: {
  width: "100%",
  aspectRatio: 1,
  backgroundColor: "#FFF",
  borderRadius: 14,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 6,
  elevation: 2,
},

allImage: {
  width: "80%",
  height: "80%",
  resizeMode: "contain",
},

allLabel: {
  fontSize: 12,
  textAlign: "center",
  fontWeight: "500",
},

viewMore: {
  color: "#7C3AED",
  fontWeight: "600",
  marginTop: 10,
},
});

export default CategoriesScreen;