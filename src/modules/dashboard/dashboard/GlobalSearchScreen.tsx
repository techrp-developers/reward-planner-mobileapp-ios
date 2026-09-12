import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";

import { SearchResultItem } from "../api/GlobalSearchAPI";
import { useAppTheme } from "../../../theme/ThemeContext";
import { useAuth } from "../../common/auth/context/AuthContext";
import { getAuthHeaders } from "../../common/auth/api/AuthAPI";
import SkeletonBox from "../../services/component/constant/SkeletonBox";
import { useGlobalSearch } from "../header/useGlobalSearch";
import HeaderComponent from "../header/HeaderComponent";
import { API_V1_URL, normalizeLocalCmsImageUrl } from '../../../config/apiConfig';

const HEADER_CACHE_TTL_MS = 10 * 60 * 1000;
let globalSearchHeaderCache: {
  userName: string;
  userImage: string | null;
  companyLogo: string | null;
  fetchedAt: number;
} | null = null;

function GlobalSearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isDark } = useAppTheme();
  const { isAuthenticated, user } = useAuth();

  const [search, setSearch] = React.useState("");
  const [headerUserName, setHeaderUserName] = useState<string>(
    () => globalSearchHeaderCache?.userName ?? user?.name ?? "User",
  );
  const [headerUserImage, setHeaderUserImage] = useState<string | null>(
    () => globalSearchHeaderCache?.userImage ?? null,
  );
  const [headerCompanyLogo, setHeaderCompanyLogo] = useState<string | null>(
    () => globalSearchHeaderCache?.companyLogo ?? null,
  );

  const pulse = useRef(new Animated.Value(0)).current;

  const loadHeaderInfo = useCallback(async () => {
    if (!isAuthenticated) return;

    if (
      globalSearchHeaderCache &&
      Date.now() - globalSearchHeaderCache.fetchedAt < HEADER_CACHE_TTL_MS
    ) {
      setHeaderUserName(globalSearchHeaderCache.userName);
      setHeaderUserImage(globalSearchHeaderCache.userImage);
      setHeaderCompanyLogo(globalSearchHeaderCache.companyLogo);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const userRes = await axios.get<{ success: boolean; data: any }>(
        `${API_V1_URL}/auth/user-info`,
        { headers },
      );

      if (userRes.data?.success) {
        const d = userRes.data.data;
        const nextUserName = d.name || headerUserName;
        const nextUserImage = normalizeLocalCmsImageUrl(d.userImage) ?? headerUserImage;
        const nextCompanyLogo = normalizeLocalCmsImageUrl(d.company?.logo) ?? headerCompanyLogo;

        setHeaderUserName((prev) => (prev === nextUserName ? prev : nextUserName));
        setHeaderUserImage((prev) => (prev === nextUserImage ? prev : nextUserImage));
        setHeaderCompanyLogo((prev) => (prev === nextCompanyLogo ? prev : nextCompanyLogo));

        globalSearchHeaderCache = {
          userName: nextUserName,
          userImage: nextUserImage,
          companyLogo: nextCompanyLogo,
          fetchedAt: Date.now(),
        };
      }
    } catch {}
  }, [headerCompanyLogo, headerUserImage, headerUserName, isAuthenticated]);

  useEffect(() => { loadHeaderInfo(); }, [loadHeaderInfo]);
  useFocusEffect(useCallback(() => { loadHeaderInfo(); }, [loadHeaderInfo]));

  const { results, loading, isEmpty, reset } = useGlobalSearch(search);
  const showSuggest = search.trim().length >= 2;

  // ── Theme tokens (mirrors HeaderComponent's `tk`) ──────────────────────────
  const tk = {
    screenBg:          isDark ? "#15131C" : "#F8F7FB",
    cardBg:            isDark ? "#1E1E32" : "#FFFFFF",
    cardBorder:        isDark ? "rgba(255,255,255,0.08)" : "rgba(124,92,252,0.12)",
    titleColor:        isDark ? "#F0EFFF" : "#1F1B24",
    subTextColor:      isDark ? "#9B8FCC" : "#A6A1AE",
    iconAccent:        isDark ? "#A78BFA" : "#7C5CFC",
    iconAccentBg:      isDark ? "rgba(167,139,250,0.14)" : "#F3E9FB",
    thumbBg:           isDark ? "#2A2A3E" : "#F3F0FF",
    badgeProduct:      "#7C5CFC",
    badgeService:      "#0EA5E9",
    skeletonBase:      isDark ? "#2A2A3E" : "#ECE7F5",
    skeletonHighlight: isDark ? "#37374F" : "#F8F6FC",
  };

  // ── Pulse animation for skeletons ──────────────────────────────────────────
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

  const handleSelectResult = (item: SearchResultItem) => {
    setSearch("");
    reset();

    const destination = item.navigation?.destination;

    if (destination === "category_products" || item.type === "category") {
      navigation.navigate("Home", {
        screen: "ProductModule",
        params: {
          screen: "Category",
          params: {
            categoryId: item.navigation?.category_id ?? item.id,
            title: item.title,
          },
        },
      });
    } else if (destination === "subcategory_products" || item.type === "subcategory") {
      navigation.navigate("Home", {
        screen: "ProductModule",
        params: {
          screen: "Category",
          params: {
            categoryId: item.navigation?.category_id,
            title: item.category_name || item.title,
            subcategoryId: item.navigation?.subcategory_id ?? item.id,
            subcategoryTitle: item.title,
          },
        },
      });
    } else if (destination === "service_details" || item.type === "service") {
      navigation.navigate("ServiceStack", {
        screen: "ServiceDescription",
        params: {
          serviceId: item.navigation?.service_id ?? item.id,
          title: item.title,
        },
      });
    } else {
      navigation.navigate("ProductDetails", { productId: item.navigation?.product_id ?? item.id });
    }
  };

  const badgeMeta: Record<string, { label: string; color: string; icon: "shopping-outline" | "briefcase-outline" | "shape-outline" }> = {
    product: { label: "Product", color: tk.badgeProduct, icon: "shopping-outline" },
    category: { label: "Category", color: tk.badgeProduct, icon: "shape-outline" },
    subcategory: { label: "Subcategory", color: tk.badgeProduct, icon: "shape-outline" },
    service: { label: "Service", color: tk.badgeService, icon: "briefcase-outline" },
  };

  const sections = [
    { title: "PRODUCTS", data: results?.products ?? [], badgeColor: tk.badgeProduct, icon: "shopping-outline" as const },
    { title: "SERVICES", data: results?.services ?? [], badgeColor: tk.badgeService, icon: "briefcase-outline" as const },
  ].filter((s) => s.data.length > 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tk.screenBg }]} edges={["left", "right", "bottom"]}>
      <HeaderComponent
        userName={headerUserName}
        userImageUri={headerUserImage ?? undefined}
        companyLogoUri={headerCompanyLogo ?? undefined}
        onSearchSubmit={(q) => setSearch(q)}
      />

      {showSuggest ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={styles.loaderContainer}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={`suggest-skeleton-${index}`} style={styles.skeletonItem}>
                  <SkeletonBox
                    pulse={pulse}
                    width={44}
                    height={44}
                    borderRadius={10}
                    baseColor={tk.skeletonBase}
                    highlightColor={tk.skeletonHighlight}
                  />
                  <View style={styles.skeletonTextWrap}>
                    <SkeletonBox
                      pulse={pulse}
                      width="82%"
                      height={12}
                      borderRadius={999}
                      baseColor={tk.skeletonBase}
                      highlightColor={tk.skeletonHighlight}
                    />
                    <SkeletonBox
                      pulse={pulse}
                      width="42%"
                      height={10}
                      borderRadius={999}
                      baseColor={tk.skeletonBase}
                      highlightColor={tk.skeletonHighlight}
                      style={styles.skeletonTag}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyStateWrap}>
              <View style={[styles.emptyIconCircle, { backgroundColor: tk.iconAccentBg }]}>
                <MaterialCommunityIcons name="text-search" size={26} color={tk.iconAccent} />
              </View>
              <Text style={[styles.noResultText, { color: tk.titleColor }]}>No results found</Text>
              <Text style={[styles.emptySubText, { color: tk.subTextColor }]}>Try a different keyword</Text>
            </View>
          ) : sections.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <View style={[styles.emptyIconCircle, { backgroundColor: tk.iconAccentBg }]}>
                <MaterialCommunityIcons name="magnify" size={26} color={tk.iconAccent} />
              </View>
              <Text style={[styles.emptySubText, { color: tk.subTextColor }]}>
                Type at least 2 characters
              </Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.title} style={styles.sectionBlock}>
                <Text style={[styles.sectionHeader, { color: tk.iconAccent }]}>{section.title}</Text>
                {section.data.map((item, index) => {
                  const isLast = index === section.data.length - 1;
                  const meta = badgeMeta[item.type] ?? badgeMeta.service;
                  return (
                    <TouchableOpacity
                      key={`${item.type}-${item.id}`}
                      activeOpacity={0.75}
                      style={[
                        styles.item,
                        { backgroundColor: tk.cardBg, borderColor: tk.cardBorder },
                        !isLast && styles.itemSpacing,
                      ]}
                      onPress={() => handleSelectResult(item)}
                    >
                      <View style={[styles.imageContainer, { backgroundColor: tk.thumbBg }]}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.img} resizeMode="cover" />
                        ) : (
                          <MaterialCommunityIcons name={meta.icon} size={20} color={meta.color} />
                        )}
                      </View>
                      <View style={styles.textContainer}>
                        <Text numberOfLines={1} style={[styles.title, { color: tk.titleColor }]}>
                          {item.title}
                        </Text>
                        <View style={[styles.tagPill, { backgroundColor: meta.color + "1A" }]}>
                          <Text style={[styles.categoryTag, { color: meta.color }]}>
                            {meta.label}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.arrowCircle, { backgroundColor: tk.iconAccentBg }]}>
                        <MaterialCommunityIcons name="arrow-top-left" size={16} color={tk.iconAccent} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateWrap}>
          <View style={[styles.emptyIconCircle, { backgroundColor: tk.iconAccentBg }]}>
            <MaterialCommunityIcons name="magnify" size={26} color={tk.iconAccent} />
          </View>
          <Text style={[styles.emptySubText, { color: tk.subTextColor }]}>
            Search products or services
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 24 },

  sectionBlock: { marginBottom: 8 },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 8,
    marginLeft: 4,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemSpacing: { marginBottom: 10 },
  imageContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600" },
  tagPill: {
    alignSelf: "flex-start",
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTag: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  loaderContainer: { padding: 10, alignItems: "stretch" },
  skeletonItem: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  skeletonTextWrap: { flex: 1, marginLeft: 15 },
  skeletonTag: { marginTop: 8 },

  emptyStateWrap: { alignItems: "center", paddingVertical: 60, width: "100%" },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  noResultText: { fontSize: 14, fontWeight: "700" },
  emptySubText: { marginTop: 4, fontSize: 12 },
});

export default GlobalSearchScreen;
