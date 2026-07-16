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

function GlobalSearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isDark } = useAppTheme();
  const { isAuthenticated, user } = useAuth();

  const [search, setSearch] = React.useState("");
  const [headerUserName, setHeaderUserName] = useState<string>(user?.name ?? "User");
  const [headerUserImage, setHeaderUserImage] = useState<string | null>(null);
  const [headerCompanyLogo, setHeaderCompanyLogo] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(0)).current;

  const loadHeaderInfo = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const userRes = await axios.get<{ success: boolean; data: any }>(
        "https://rewardplanners.com/api/crm/v1/auth/user-info",
        { headers },
      );

      if (userRes.data?.success) {
        const d = userRes.data.data;
        if (d.name) setHeaderUserName(d.name);
        if (d.userImage) setHeaderUserImage(d.userImage);
        if (d.company?.logo) setHeaderCompanyLogo(d.company.logo);
      }
    } catch {}
  }, [isAuthenticated]);

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
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const handleSelectResult = (item: SearchResultItem) => {
    setSearch("");
    reset();

    if (item.type === "product") {
      navigation.navigate("ProductDescription", { productId: item.id });
    } else {
      navigation.navigate("ServiceStack");
    }
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
                  const badgeLabel = item.type === "product" ? "Product" : "Service";
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
                          <MaterialCommunityIcons name={section.icon} size={20} color={section.badgeColor} />
                        )}
                      </View>
                      <View style={styles.textContainer}>
                        <Text numberOfLines={1} style={[styles.title, { color: tk.titleColor }]}>
                          {item.title}
                        </Text>
                        <View style={[styles.tagPill, { backgroundColor: section.badgeColor + "1A" }]}>
                          <Text style={[styles.categoryTag, { color: section.badgeColor }]}>
                            {badgeLabel}
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