import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";
import {
  getBusOrdersApi,
  type BusOrderSummary,
} from "../../services/busBookingApi";
import {
  BUS_STATUS_COLORS,
  formatBusAmount,
  formatBusDate,
  formatBusTime,
  getBusOrderStatus,
} from "../../utils/busOrderFormat";

const PAGE_SIZE = 20;

export default function BusOrdersScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();

  const [orders, setOrders] = React.useState<BusOrderSummary[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadFirstPage = React.useCallback(async () => {
    try {
      const result = await getBusOrdersApi(1, PAGE_SIZE);
      setOrders(result.data);
      setPage(1);
      setHasMore(result.hasMore);
      setError(null);
    } catch (loadError: any) {
      setError(loadError?.message || "Unable to load your bus bookings");
    }
  }, []);

  // Reload on focus so a booking that was just cancelled or confirmed from
  // the detail screen shows its new status.
  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      loadFirstPage().finally(() => {
        if (active) {
          setLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, [loadFirstPage])
  );

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const handleLoadMore = React.useCallback(async () => {
    if (!hasMore || loadingMore || loading || refreshing) {
      return;
    }

    setLoadingMore(true);

    try {
      const result = await getBusOrdersApi(page + 1, PAGE_SIZE);
      setOrders((current) => [...current, ...result.data]);
      setPage(page + 1);
      setHasMore(result.hasMore);
    } catch {
      // Keep what is already listed; the next scroll retries this page.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, page, refreshing]);

  const renderOrder = ({ item }: { item: BusOrderSummary }) => {
    const status = getBusOrderStatus(item.status, item.paymentStatus);
    const colors = BUS_STATUS_COLORS[status.tone];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() =>
          navigation.navigate("BusOrderDetailScreen", {
            orderRef: item.orderRef,
          })
        }
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.routeText} numberOfLines={1}>
            {item.sourceCity || "-"}{" "}
            <Text style={styles.routeArrow}>{"->"}</Text>{" "}
            {item.destinationCity || "-"}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: colors.background }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {item.operatorName ? (
          <Text style={styles.operatorText} numberOfLines={1}>
            {item.operatorName}
            {item.busType ? ` - ${item.busType}` : ""}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={15} color="#8A848A" />
          <Text style={styles.metaText}>
            {formatBusDate(item.departureTime || item.journeyDate)}
            {item.departureTime ? `, ${formatBusTime(item.departureTime)}` : ""}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="seat-passenger" size={15} color="#8A848A" />
          <Text style={styles.metaText}>
            {item.seats.length > 0
              ? `Seat ${item.seats.join(", ")}`
              : `${item.seatCount} ${item.seatCount === 1 ? "seat" : "seats"}`}
          </Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottomRow}>
          <View style={styles.ticketWrap}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={14}
              color="#9CA3AF"
            />
            <Text style={styles.ticketText} numberOfLines={1}>
              {item.ticketNo ? `Ticket: ${item.ticketNo}` : item.orderRef}
            </Text>
          </View>
          <Text style={styles.amountText}>{formatBusAmount(item.amountPaid)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#77737B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bus Bookings</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#D31637" />
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centerState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={34} color="#C81E3A" />
          <Text style={styles.stateTitle}>Could not load bookings</Text>
          <Text style={styles.stateMessage}>{error}</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderRef}
          renderItem={renderOrder}
          contentContainerStyle={
            orders.length === 0 ? styles.emptyContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#D31637"]}
              tintColor="#D31637"
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <MaterialCommunityIcons name="bus-clock" size={36} color="#D31637" />
              <Text style={styles.stateTitle}>No bus bookings yet</Text>
              <Text style={styles.stateMessage}>
                Tickets you book will appear here.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} color="#D31637" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#3B3740",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 38,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContent: {
    flexGrow: 1,
    padding: 16,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  stateTitle: {
    marginTop: 12,
    color: "#3B3740",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  stateMessage: {
    marginTop: 6,
    color: "#8F8F95",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 18,
    minHeight: 42,
    paddingHorizontal: 26,
    borderRadius: 21,
    backgroundColor: "#D31637",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E2DA",
    padding: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeText: {
    flex: 1,
    color: "#3B3740",
    fontSize: 16,
    fontWeight: "700",
  },
  routeArrow: {
    color: "#D31637",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  operatorText: {
    marginTop: 4,
    color: "#8F8F95",
    fontSize: 13,
    fontWeight: "500",
  },
  metaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    flex: 1,
    color: "#5B5860",
    fontSize: 13,
    fontWeight: "500",
  },
  cardDivider: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    backgroundColor: "#F0EBE4",
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ticketWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ticketText: {
    flex: 1,
    color: "#8F8F95",
    fontSize: 12,
    fontWeight: "600",
  },
  amountText: {
    color: "#3B3740",
    fontSize: 15,
    fontWeight: "700",
  },
  footerLoader: {
    marginVertical: 16,
  },
});
