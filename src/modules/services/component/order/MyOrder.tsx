import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import Coin from "../../../../assets/product/rewards.svg";
import { useAuth } from "../../../common/auth/context/AuthContext";
import type { HomeStackParamList } from "../../navigation/type";
import {
  getMyServiceOrders,
  type OrdersResponse,
  type ServiceOrder,
} from "../../api/OrderAPI";
import { useServicesTheme } from "../../utils/useServicesTheme";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const PLACEHOLDER_IMAGE = require("../../assete/gov_documet/rent_agrement.png");
const DASHBOARD_BANNERS = [
  require("../../assete/home/banner1.png"),
  require("../../assete/home/banner2.png"),
];
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DASHBOARD_BANNER_WIDTH = SCREEN_WIDTH - 32;

const TIME_FILTERS = [
  { key: "", label: "All time" },
  { key: "30days", label: "Last 30 days" },
  { key: "3months", label: "Last 3 months" },
  { key: "6months", label: "Last 6 months" },
];

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending_payment", label: "Pending" },
  { key: "completed", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_META: Record<string, { color: string; label: string }> = {
  in_progress: { color: "#2563EB", label: "Order In Progress" },
  pending_payment: { color: "#D97706", label: "Order Confirmed" },
  completed: { color: "#16A34A", label: "Order Delivered" },
  cancelled: { color: "#DC2626", label: "Order Cancelled" },
};

const PURPLE = "#8665FF";
const GREEN = "#0D862E";
type ServicesTheme = ReturnType<typeof useServicesTheme>;

const toTitleCase = (value?: string) => {
  if (!value) return "Order Confirmed";
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatDisplayDate = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

function getServiceImage(order: ServiceOrder) {
  const direct = order.items.find(item => item.image_url)?.image_url;
  if (direct) return direct;

  for (const bundle of order.bundles) {
    const image = bundle.items.find(item => item.image_url)?.image_url;
    if (image) return image;
  }

  return "";
}

function getServiceTitle(order: ServiceOrder) {
  const previewName = order.preview?.[0]?.name;
  if (previewName) return previewName;

  const firstItem = order.items?.[0] || order.bundles?.[0]?.items?.[0];
  return firstItem?.service_name || "Service Order";
}

function getServiceSubtitle(order: ServiceOrder) {
  const totalItems = Number(order.summary?.total_items || 0);
  const totalBundles = Number(order.summary?.total_bundles || 0);
  const parts: string[] = [];

  if (totalItems > 0) {
    parts.push(`${totalItems} ${totalItems === 1 ? "service" : "services"}`);
  }
  if (totalBundles > 0) {
    parts.push(`${totalBundles} ${totalBundles === 1 ? "bundle" : "bundles"}`);
  }

  return parts.join(" | ");
}

function getOrderCoins(order: ServiceOrder) {
  const raw =
    (order as any).reward_coins_earned ??
    (order as any).reward_points ??
    (order as any).coins ??
    0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function getSummaryValue(summary: OrdersResponse["summary"] | null, keys: string[]) {
  if (!summary) return 0;

  for (const key of keys) {
    const value = Number((summary as any)[key]);
    if (Number.isFinite(value)) return value;
  }

  return 0;
}

function ServiceDashboardBanner() {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (index + 1) % DASHBOARD_BANNERS.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * DASHBOARD_BANNER_WIDTH,
        animated: true,
      });
      setIndex(nextIndex);
    }, 3000);

    return () => clearInterval(timer);
  }, [index]);

  return (
    <View style={styles.dashboardBannerWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / DASHBOARD_BANNER_WIDTH,
          );
          setIndex(nextIndex);
        }}
      >
        {DASHBOARD_BANNERS.map((source, bannerIndex) => (
          <View key={bannerIndex} style={styles.dashboardBannerSlide}>
            <Image source={source} style={styles.dashboardBannerImage} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dashboardBannerDots}>
        {DASHBOARD_BANNERS.map((_, dotIndex) => (
          <View
            key={dotIndex}
            style={[
              styles.dashboardBannerDot,
              index === dotIndex && styles.dashboardBannerActiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function ServiceOrderRow({
  order,
  onPress,
  servicesTheme,
}: {
  order: ServiceOrder;
  onPress: () => void;
  servicesTheme: ServicesTheme;
}) {
  const meta = STATUS_META[order.status] || {
    color: "#6B7280",
    label: toTitleCase(order.status),
  };
  const image = getServiceImage(order);
  const title = getServiceTitle(order);
  const subtitle = getServiceSubtitle(order);
  const coins = getOrderCoins(order);
  const extraCount = Math.max(0, (order.preview?.length || 1) - 1);

  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
      <View style={[styles.orderCard, { backgroundColor: servicesTheme.colors.surface }]}>
        <View style={[styles.imageWrap, { backgroundColor: servicesTheme.colors.surfaceAlt }]}>
          {image ? (
            <Image source={{ uri: image }} style={styles.orderImage} />
          ) : (
            <Image source={PLACEHOLDER_IMAGE} style={styles.orderImage} />
          )}
          {extraCount > 0 ? (
            <View style={styles.extraBadge}>
              <Text style={styles.extraBadgeText}>+{extraCount}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.orderCenter}>
          <Text style={[styles.statusText, { color: meta.color }]} numberOfLines={1}>
            {meta.label.toUpperCase()}
          </Text>
          <View style={styles.titleRow}>
            <Text style={[styles.brandText, { color: servicesTheme.colors.textStrong }]} numberOfLines={1}>
              Service
            </Text>
            <Text style={[styles.productText, { color: servicesTheme.colors.muted }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View style={styles.metaWrap}>
            <Text style={[styles.metaText, { color: servicesTheme.colors.muted }]} numberOfLines={1}>
              Order ID: {order.parent_order_id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={[styles.metaText, { color: servicesTheme.colors.muted }]} numberOfLines={1}>
              {[formatDisplayDate(order.created_at), subtitle].filter(Boolean).join(" | ")}
            </Text>
          </View>
          <Text style={styles.actionText}>
            View Order
          </Text>
        </View>

        <View style={styles.orderRight}>
          <Text style={styles.priceText}>
            {"\u20B9"}{Number(order.total_amount || 0).toLocaleString("en-IN")}
          </Text>
          {coins > 0 ? (
            <View style={styles.coinRow}>
              <Coin width={13} height={13} />
              <Text style={styles.coinText}>+{coins}</Text>
            </View>
          ) : null}
          <MaterialCommunityIcons name="chevron-right" size={24} color={servicesTheme.colors.subtle} />
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: servicesTheme.colors.divider }]} />
    </TouchableOpacity>
  );
}

function FilterBottomSheet({
  visible,
  currentTime,
  currentStatus,
  onClose,
  onApply,
  servicesTheme,
}: {
  visible: boolean;
  currentTime: string;
  currentStatus: string;
  onClose: () => void;
  onApply: (time: string, status: string) => void;
  servicesTheme: ServicesTheme;
}) {
  const [selectedTime, setSelectedTime] = useState(currentTime);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    if (visible) {
      setSelectedTime(currentTime);
      setSelectedStatus(currentStatus);
    }
  }, [currentStatus, currentTime, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: servicesTheme.colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: servicesTheme.colors.divider }]} />

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: servicesTheme.colors.textStrong }]}>Filter Orders</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedTime("");
              setSelectedStatus("");
            }}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: servicesTheme.colors.muted }]}>Order Time</Text>
        <View style={styles.chipGrid}>
          {TIME_FILTERS.map(item => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setSelectedTime(item.key)}
              activeOpacity={0.8}
            >
              {selectedTime === item.key ? (
                <LinearGradient
                  colors={servicesTheme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeSheetChip}
                >
                  <Text style={styles.activeSheetChipText}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.sheetChip, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border }]}>
                  <Text style={[styles.sheetChipText, { color: servicesTheme.colors.text }]}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: servicesTheme.colors.muted }]}>Order Status</Text>
        <View style={styles.chipGrid}>
          {STATUS_FILTERS.map(item => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setSelectedStatus(item.key)}
              activeOpacity={0.8}
            >
              {selectedStatus === item.key ? (
                <LinearGradient
                  colors={servicesTheme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeSheetChip}
                >
                  <Text style={styles.activeSheetChipText}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.sheetChip, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border }]}>
                  <Text style={[styles.sheetChipText, { color: servicesTheme.colors.text }]}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => onApply(selectedTime, selectedStatus)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={servicesTheme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.applyBtn}
          >
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function MyOrder() {
  const navigation = useNavigation<Nav>();
  const servicesTheme = useServicesTheme();
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [summaryData, setSummaryData] = useState<OrdersResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOrders = useCallback(
    async (pageNum = 1, append = false) => {
      if (!isAuthenticated) {
        setOrders([]);
        setLoading(false);
        return;
      }

      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      setError("");

      try {
        const res = await getMyServiceOrders({
          page: pageNum,
          limit: 10,
          search: searchQuery,
          status: statusFilter,
          timeFilter,
        });

        if (res.success) {
          const fetched = res.orders || [];
          setOrders(prev => (append ? [...prev, ...fetched] : fetched));
          setSummaryData(res.summary || null);
          setTotalPages(res.totalPages || 1);
          setPage(pageNum);
        } else if (!append) {
          setOrders([]);
          setSummaryData(null);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
        if (!append) setOrders([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAuthenticated, searchQuery, statusFilter, timeFilter],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadOrders(1), 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadOrders]);

  const summary = useMemo(() => {
    const coinsFromSummary = getSummaryValue(summaryData, [
      "totalCoinsEarned",
      "total_reward_coins",
      "reward_coins_earned",
      "coins_earned",
      "total_coins",
    ]);
    const savingsFromSummary = getSummaryValue(summaryData, [
      "totalSavings",
      "total_savings",
      "savings",
      "reward_discount",
      "total_reward_discount",
    ]);
    const visibleCoins = orders.reduce((sum, order) => sum + getOrderCoins(order), 0);

    return {
      totalCoinsEarned: coinsFromSummary || visibleCoins,
      totalSavings: savingsFromSummary,
    };
  }, [orders, summaryData]);

  const loadMore = () => {
    if (!loadingMore && page < totalPages) {
      loadOrders(page + 1, true);
    }
  };

  const renderHeader = () => (
    <View style={[styles.headerContent, { backgroundColor: servicesTheme.colors.background }]}>
      <ServiceDashboardBanner />

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={servicesTheme.colors.muted} />
          <TextInput
            placeholder="Search your orders here"
            placeholderTextColor={servicesTheme.colors.subtle}
            style={[styles.searchInput, { color: servicesTheme.colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color={servicesTheme.colors.subtle} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setIsFilterVisible(true)}
          activeOpacity={0.78}
        >
          <MaterialCommunityIcons name="tune-variant" size={20} color={servicesTheme.colors.muted} />
          <Text style={[styles.filterText, { color: servicesTheme.colors.muted }]}>Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <LinearGradient colors={servicesTheme.isDark ? ["#132016", "#111113"] : ["#EFFFF4", "#DDFFE8"]} style={[styles.statCard, { borderColor: servicesTheme.colors.border }]}>
          <Text style={styles.statLabel}>Coins Earned Till Date:</Text>
          <View style={styles.statValueRow}>
            <Coin width={22} height={22} />
            <Text style={styles.statValue}>
              {summary.totalCoinsEarned.toLocaleString("en-IN")}
            </Text>
          </View>
        </LinearGradient>

        <LinearGradient colors={servicesTheme.isDark ? ["#132016", "#111113"] : ["#EFFFF4", "#DDFFE8"]} style={[styles.statCard, { borderColor: servicesTheme.colors.border }]}>
          <Text style={styles.statLabel}>Total Savings Till Date:</Text>
          <Text style={[styles.statValue, styles.savingsText]}>
            {"\u20B9"}{summary.totalSavings.toLocaleString("en-IN")}
          </Text>
        </LinearGradient>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <ActivityIndicator size="large" color={GREEN} style={styles.loadingIndicator} />
      );
    }

    if (error) {
      return (
        <View style={styles.stateWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders(1)}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <Text style={[styles.emptyText, { color: servicesTheme.colors.muted }]}>No orders found</Text>;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
      <View style={[styles.heading, { backgroundColor: servicesTheme.colors.surface, borderBottomColor: servicesTheme.colors.divider }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={servicesTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headingTitle, { color: servicesTheme.colors.textStrong }]}>My Orders</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.helpBtn, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}
          onPress={() => navigation.navigate("HelpForm")}
        >
          <MaterialCommunityIcons
            name="chat-outline"
            size={16}
            color="#EC4899"
            style={styles.helpIcon}
          />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading || error ? [] : orders}
        keyExtractor={item => item.parent_order_id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <ServiceOrderRow
            order={item}
            servicesTheme={servicesTheme}
            onPress={() =>
              navigation.navigate("ServiceOrderDetail", {
                parent_order_id: item.parent_order_id,
              })
            }
          />
        )}
        contentContainerStyle={[styles.listContent, { backgroundColor: servicesTheme.colors.background }]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color={GREEN} style={styles.footerLoader} />
          ) : orders.length > 0 && page >= totalPages ? (
            <Text style={[styles.noMoreText, { color: servicesTheme.colors.muted }]}>No More Orders</Text>
          ) : null
        }
      />

      <FilterBottomSheet
        visible={isFilterVisible}
        currentTime={timeFilter}
        currentStatus={statusFilter}
        onClose={() => setIsFilterVisible(false)}
        onApply={(time, status) => {
          setTimeFilter(time);
          setStatusFilter(status);
          setIsFilterVisible(false);
        }}
        servicesTheme={servicesTheme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heading: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headingTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  helpIcon: {
    marginRight: 4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EC4899",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
  },
  headerContent: {
    backgroundColor: "#FFFFFF",
  },
  dashboardBannerWrap: {
    marginBottom: 14,
  },
  dashboardBannerSlide: {
    width: DASHBOARD_BANNER_WIDTH,
    alignItems: "center",
  },
  dashboardBannerImage: {
    width: "100%",
    height: 100,
    borderRadius: 12,
  },
  dashboardBannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  dashboardBannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  dashboardBannerActiveDot: {
    width: 16,
    backgroundColor: "#111827",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1E5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Platform.OS === "ios" ? 140 : 96,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: Platform.OS === "ios" ? "700" : "600",
    color: GREEN,
    marginBottom: 10,
    textAlign: "center",
    lineHeight: Platform.OS === "ios" ? 18 : 16,
    includeFontPadding: false,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: GREEN,
  },
  savingsText: {
    borderBottomWidth: 1,
    borderBottomColor: GREEN,
  },
  orderCard: {
    flexDirection: "row",
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  orderImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    resizeMode: "contain",
  },
  extraBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PURPLE,
    paddingHorizontal: 4,
  },
  extraBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  orderCenter: {
    flex: 1,
    minWidth: 0,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  titleRow: {
    marginBottom: 4,
    flexDirection: "row",
    gap: 5,
  },
  brandText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  productText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },
  metaWrap: {
    marginBottom: 4,
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  actionText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
  },
  orderRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginLeft: 8,
  },
  priceText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coinText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EC4899",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 82,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  footerLoader: {
    marginVertical: 18,
  },
  noMoreText: {
    textAlign: "center",
    marginTop: 18,
    color: "#777777",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#777777",
  },
  stateWrap: {
    alignItems: "center",
    marginTop: 40,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  resetText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 12,
    marginTop: 10,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  sheetChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  activeSheetChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  sheetChipText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },
  activeSheetChipText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  applyBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#5B47A3",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
});
