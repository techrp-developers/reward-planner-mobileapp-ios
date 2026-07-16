import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";

import { useAuth } from "../../../common/auth/context/AuthContext";
import type { HomeStackParamList } from "../../navigation/type";
import {
  getMyServiceOrders,
  type ServiceOrder,
  type OrdersResponse,
} from "../../api/OrderAPI";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "pending_payment", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const TIME_FILTERS = [
  { key: "", label: "All time" },
  { key: "30days", label: "Last 30 days" },
  { key: "3months", label: "Last 3 months" },
  { key: "6months", label: "Last 6 months" },
];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  in_progress: { color: "#2563EB", bg: "#EFF6FF", label: "In Progress" },
  pending_payment: { color: "#D97706", bg: "#FFFBEB", label: "Pending Payment" },
  completed: { color: "#16A34A", bg: "#F0FDF4", label: "Completed" },
  cancelled: { color: "#DC2626", bg: "#FEF2F2", label: "Cancelled" },
};

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Order Card ───────────────────────────────────────────────────────────────
const OrderCard = ({
  item,
  onPress,
}: {
  item: ServiceOrder;
  onPress: () => void;
}) => {
  const meta = STATUS_META[item.status] || { color: "#6B7280", bg: "#F3F4F6", label: item.status };

  const images: string[] = [];
  item.items.forEach(i => { if (i.image_url) images.push(i.image_url); });
  item.bundles.forEach(b => b.items.forEach(i => { if (i.image_url) images.push(i.image_url); }));

  const previewImages = images.slice(0, 3);
  const extraCount = images.length - previewImages.length;
  const isBundle = item.summary.total_bundles > 0;
  const firstPreview = item.preview[0];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={onPress}>
      {/* Status + date */}
      <View style={styles.cardTopRow}>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {firstPreview ? firstPreview.name : "Service Order"}
        {item.preview.length > 1 ? ` +${item.preview.length - 1} more` : ""}
      </Text>

      {/* Image strip + meta row */}
      <View style={styles.cardBottomRow}>
        {previewImages.length > 0 && (
          <View style={styles.imageStrip}>
            {previewImages.map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={[styles.thumb, idx > 0 && styles.thumbOverlap]}
              />
            ))}
            {extraCount > 0 && (
              <View style={[styles.thumb, styles.extraBubble, styles.thumbOverlap]}>
                <Text style={styles.extraText}>+{extraCount}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.metaChips}>
          <View style={styles.chip}>
            <MaterialCommunityIcons name="briefcase-outline" size={13} color="#6B7280" />
            <Text style={styles.chipText}>
              {item.summary.total_items} service{item.summary.total_items !== 1 ? "s" : ""}
            </Text>
          </View>
          {isBundle && (
            <View style={styles.chip}>
              <MaterialCommunityIcons name="package-variant-closed" size={13} color="#6B7280" />
              <Text style={styles.chipText}>{item.summary.total_bundles} bundle</Text>
            </View>
          )}
        </View>

        <Text style={styles.amountText}>
          ₹{item.total_amount.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.refText}>
          Order #{item.parent_order_id.slice(0, 8).toUpperCase()}
        </Text>
        <View style={styles.viewOrder}>
          <Text style={styles.viewOrderText}>View details</Text>
          <MaterialCommunityIcons name="arrow-top-right" size={14} color={PURPLE} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyOrder() {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [summaryData, setSummaryData] = useState<OrdersResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
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
        } else {
          if (!append) setOrders([]);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load orders");
        if (!append) setOrders([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAuthenticated, searchQuery, statusFilter, timeFilter]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadOrders(1), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadOrders]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) loadOrders(page + 1, true);
  };

  const getSummaryCount = (key: string) => {
    if (!summaryData) return 0;
    if (key === "") return summaryData.all;
    return (summaryData as any)[key] ?? 0;
  };
  const selectedTimeLabel =
    TIME_FILTERS.find(filter => filter.key === timeFilter)?.label || "All time";

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["#30205F", "#5B3CB4", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={21} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>SERVICE HUB</Text>
            <Text style={styles.headerTitle}>My orders</Text>
          </View>
          <View style={styles.orderIcon}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#FFF" />
          </View>
        </View>

        <Text style={styles.heroDescription}>Track, manage and revisit every service request.</Text>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search services, order ref…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.filtersSection}>
        <View style={styles.filterToolbar}>
          <Text style={styles.filterLabel}>ORDER STATUS</Text>
          <TouchableOpacity
            style={[styles.filterButton, timeFilter && styles.filterButtonActive]}
            onPress={() => setIsFilterSheetOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={16}
              color={timeFilter ? "#FFF" : PURPLE}
            />
            <Text style={[styles.filterButtonText, timeFilter && styles.filterButtonTextActive]}>
              {timeFilter ? selectedTimeLabel : "Filter"}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.key;
            const count = getSummaryCount(tab.key);
            const inner = (
              <>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {summaryData !== null && (
                  <View style={[styles.tabCount, active && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </>
            );
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setStatusFilter(tab.key)}
                activeOpacity={0.7}
              >
                {active ? (
                  <LinearGradient
                    colors={["#8B6CFF", "#6545D8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tab}
                  >
                    {inner}
                  </LinearGradient>
                ) : (
                  <View style={styles.tab}>{inner}</View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Modal
        visible={isFilterSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterSheetOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setIsFilterSheetOpen(false)}
          />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeading}>
              <View>
                <Text style={styles.sheetTitle}>Filter orders</Text>
                <Text style={styles.sheetSubtitle}>Choose an order period</Text>
              </View>
              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => setIsFilterSheetOpen(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color="#5F5873" />
              </TouchableOpacity>
            </View>
            <View style={styles.periodOptions}>
              {TIME_FILTERS.map(filter => {
                const active = timeFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.periodOption, active && styles.periodOptionActive]}
                    onPress={() => {
                      setTimeFilter(filter.key);
                      setIsFilterSheetOpen(false);
                    }}
                  >
                    <Text style={[styles.periodOptionText, active && styles.periodOptionTextActive]}>
                      {filter.label}
                    </Text>
                    <MaterialCommunityIcons
                      name={active ? "check-circle" : "circle-outline"}
                      size={21}
                      color={active ? PURPLE : "#B4ADBF"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders(1)}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No orders found</Text>
          {(searchQuery || statusFilter || timeFilter) ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setStatusFilter("");
                setTimeFilter("");
              }}
            >
              <Text style={styles.clearText}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.parent_order_id}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              onPress={() =>
                navigation.navigate("ServiceOrderDetail", {
                  parent_order_id: item.parent_order_id,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color="#7C3AED"
                style={styles.footerLoader}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const PURPLE = "#7C3AED";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F5FB" },
  hero: {

    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  headerCopy: { flex: 1, marginLeft: 12 },
  headerEyebrow: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.4,
    marginTop: 2,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  heroDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    height: 50,
    gap: 8,
    shadowColor: "#1D1240",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1F1738", fontWeight: "500" },

  filtersSection: { paddingTop: 20, paddingBottom: 2 },
  filterToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1, color: "#918AA5" },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: "#F0ECFF",
  },
  filterButtonActive: { backgroundColor: PURPLE },
  filterButtonText: { fontSize: 11, fontWeight: "800", color: PURPLE },
  filterButtonTextActive: { color: "#FFF" },
  tabsRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",

    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E9E5F2",
  },
  tabActive: {},
  tabText: {
    fontSize: 13, fontWeight: "700", color: "#706985", paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tabTextActive: { color: "#FFF" },
  tabCount: {
    backgroundColor: "#E5E7EB",
    borderRadius: 99,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: "center",
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  tabCountTextActive: { color: "#FFF" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(25, 17, 47, 0.46)", justifyContent: "flex-end" },
  modalDismissArea: { flex: 1 },
  filterSheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  sheetHandle: { alignSelf: "center", width: 38, height: 4, borderRadius: 4, backgroundColor: "#DFD9E9", marginTop: 10 },
  sheetHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 18 },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: "#21183A", letterSpacing: -0.3 },
  sheetSubtitle: { fontSize: 13, color: "#817A91", marginTop: 3 },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F2F9", justifyContent: "center", alignItems: "center" },
  periodOptions: { gap: 10 },
  periodOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECE8F2",
    backgroundColor: "#FFF",
  },
  periodOptionActive: { borderColor: "#BDAEFF", backgroundColor: "#F5F2FF" },
  periodOptionText: { fontSize: 14, fontWeight: "700", color: "#5F5873" },
  periodOptionTextActive: { color: PURPLE },

  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, gap: 14 },

  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECE9F4",
    elevation: 3,
    shadowColor: "#35245F",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "800" },
  dateText: { fontSize: 11, color: "#968FA6", fontWeight: "600" },

  cardTitle: { fontSize: 16, fontWeight: "800", color: "#21183A", marginBottom: 14, letterSpacing: -0.2 },

  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  imageStrip: { flexDirection: "row", alignItems: "center" },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFF",
    backgroundColor: "#F1EEFA",
  },
  extraBubble: {
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  extraText: { fontSize: 10, fontWeight: "700", color: PURPLE },

  metaChips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F8F7FC",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#EEEAF5",
  },
  chipText: { fontSize: 11, color: "#746D84", fontWeight: "600" },

  amountText: { fontSize: 16, fontWeight: "800", color: "#33206E" },

  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#F0EDF6", paddingTop: 12 },
  refText: { fontSize: 10, color: "#9A94A8", fontWeight: "700", letterSpacing: 0.3 },
  viewOrder: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewOrderText: { fontSize: 11, color: PURPLE, fontWeight: "800" },

  // States
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6B7280" },
  errorText: { fontSize: 14, color: "#B91C1C", textAlign: "center", marginTop: 10, marginBottom: 14 },
  retryBtn: { backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 12 },
  clearText: { fontSize: 14, color: PURPLE, fontWeight: "600", marginTop: 8 },
  thumbOverlap: { marginLeft: -10 },
  footerLoader: { marginVertical: 16 },
});
