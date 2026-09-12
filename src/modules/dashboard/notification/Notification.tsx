import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import { useAppTheme } from "../../../theme/ThemeContext";

import OrderHeading from "../../ecommerce/constants/heading/OrderHeading";
import {
  deleteNotification,
  getNotificationBadge,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "./NotificationAPI";

type Nav = NativeStackNavigationProp<any>;

const ICON_MAP: Record<string, string> = {
  "shopping-bag": "shopping-outline",
  "map-pin": "map-marker-outline",
  support: "lifebuoy",
  wallet: "wallet-outline",
  target: "target",
  "x-circle": "close-circle-outline",
  clock: "clock-outline",
  briefcase: "briefcase-outline",
  "file-check": "file-check-outline",
};

function getIconName(icon?: string | null, module?: string) {
  if (icon && ICON_MAP[icon]) return ICON_MAP[icon];
  if (module === "ecommerce") return "shopping-outline";
  if (module === "service") return "briefcase-outline";
  if (module === "wallet") return "wallet-outline";
  if (module === "fitness") return "target";
  if (module === "bbps") return "receipt-text-outline";
  return "bell-outline";
}

function getModuleMeta(module?: string, highPriority = false) {
  if (highPriority) {
    return {
      label: "Urgent",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
    };
  }

  switch (module) {
    case "ecommerce":
      return { label: "Order", color: "#7C3AED", bg: "#F4F0FF", border: "#DDD6FE" };
    case "service":
      return { label: "Service", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" };
    case "wallet":
      return { label: "Wallet", color: "#0F766E", bg: "#ECFDF5", border: "#99F6E4" };
    case "fitness":
      return { label: "Fitness", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" };
    case "bbps":
      return { label: "Payment", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
    default:
      return { label: "Update", color: "#6D5AE6", bg: "#F4F0FF", border: "#E9D5FF" };
  }
}

function formatNotificationTime(value: string) {
  const normalized = value?.includes("T") ? value : value?.replace(" ", "T");
  const date = new Date(normalized);
  const time = date.getTime();

  if (!Number.isFinite(time)) return value;

  const diffMs = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 2 * day) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function isUnread(item: NotificationItem) {
  return item.is_read === false || Number(item.is_read) === 0;
}

function Notification() {
  const navigation = useNavigation<Nav>();
  const { isDark, theme } = useAppTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [badgeCount, setBadgeCount] = useState(0);
  const themed = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: isDark ? "#09090B" : "#F5F3FA" },
        card: {
          backgroundColor: isDark ? "#18181B" : "#FFFFFF",
          borderColor: isDark ? "rgba(255,255,255,0.24)" : "#ECE8F4",
        },
        unreadCard: {
          backgroundColor: isDark ? "#1E1B2E" : "#FFFEFF",
          borderColor: isDark ? "#FFFFFF" : "#CFC5FF",
        },
        text: { color: theme.text },
        mutedText: { color: theme.secondaryText },
        softButton: { backgroundColor: isDark ? "#27233A" : "#F2EDFF" },
        disabledButton: { backgroundColor: isDark ? "#202024" : "#ECE8F4" },
        emptyIcon: { backgroundColor: isDark ? "#27233A" : "#F1ECFF" },
        actionText: { color: isDark ? "#FFFFFF" : "#6D5AE6" },
        disabledText: { color: isDark ? "#71717A" : "#A19AAD" },
      }),
    [isDark, theme.secondaryText, theme.text],
  );

  const loadNotifications = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [notificationsRes, badgeRes] = await Promise.all([
        getMyNotifications(),
        getNotificationBadge(),
      ]);
      const fetched = notificationsRes.success ? notificationsRes.data : [];

      setNotifications(fetched);
      setBadgeCount(
        badgeRes.success ? badgeRes.count : fetched.filter(isUnread).length
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
      setNotifications([]);
      setBadgeCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = (item: NotificationItem) => {
    const actionUrl = String(item.action_url || "").trim();
    const referenceId = String(item.reference_id || "").trim();

    if (isUnread(item)) {
      setNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === item.notification_id
            ? { ...notification, is_read: 1 }
            : notification
        )
      );
      setBadgeCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(item.notification_id).catch(() => loadNotifications(true));
    }

    if (actionUrl === "/wallet") {
      navigation.navigate("WalletHistory");
      return;
    }

    const ecommerceOrderMatch = actionUrl.match(/\/orders\/order-details\/(\d+)/);
    if (ecommerceOrderMatch?.[1]) {
      navigation.navigate("OrderConfirmedScreen", {
        order_id: Number(ecommerceOrderMatch[1]),
      });
      return;
    }

    const serviceOrderMatch = actionUrl.match(/\/service-orders\/([^/]+)/);
    const serviceDocsMatch = actionUrl.match(
      /\/service-order-documents\/parent-documents\/([^/]+)/
    );
    const parentOrderId = serviceOrderMatch?.[1] || serviceDocsMatch?.[1];

    if (parentOrderId || item.reference_type === "service_order") {
      navigation.navigate("ServiceStack", {
        screen: "ServiceOrderDetail",
        params: { parent_order_id: parentOrderId || referenceId },
      });
      return;
    }

    if (actionUrl === "/fitness") {
      navigation.navigate("RewardStack");
    }
  };

  const handleMarkAllRead = async () => {
    if (badgeCount <= 0) return;

    const previousNotifications = notifications;
    const previousBadgeCount = badgeCount;

    setNotifications(prev =>
      prev.map(notification => ({ ...notification, is_read: 1 }))
    );
    setBadgeCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch {
      setNotifications(previousNotifications);
      setBadgeCount(previousBadgeCount);
    }
  };

  const handleDeleteNotification = (item: NotificationItem) => {
    Alert.alert(
      "Delete notification",
      "Remove this notification from your list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const previousNotifications = notifications;
            const previousBadgeCount = badgeCount;

            setNotifications(prev =>
              prev.filter(
                notification =>
                  notification.notification_id !== item.notification_id
              )
            );
            if (isUnread(item)) setBadgeCount(prev => Math.max(0, prev - 1));

            try {
              await deleteNotification(item.notification_id);
            } catch {
              setNotifications(previousNotifications);
              setBadgeCount(previousBadgeCount);
            }
          },
        },
      ]
    );
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const unread = isUnread(item);
    const highPriority = item.priority === "high";
    const meta = getModuleMeta(item.module, highPriority);
    const metaBackground = isDark ? `${meta.color}20` : meta.bg;
    const metaBorder = isDark ? `${meta.color}55` : meta.border;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.card,
          themed.card,
          unread && styles.cardUnread,
          unread && themed.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDeleteNotification(item)}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: metaBackground, borderColor: metaBorder },
          ]}
        >
          <MaterialCommunityIcons
            name={getIconName(item.icon, item.module)}
            size={21}
            color={meta.color}
          />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.metaRow}>
            <View style={[styles.modulePill, { backgroundColor: metaBackground }]}>
              <Text style={[styles.moduleText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
            <Text style={[styles.time, themed.mutedText]}>{formatNotificationTime(item.created_at)}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={[styles.title, themed.text]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Text style={[styles.message, themed.mutedText]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        <View style={styles.cardAction}>
          {unread ? <View style={styles.unreadDot} /> : null}
          {item.action_url ? (
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={isDark ? "#818CF8" : "#C4B5FD"}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, themed.screen]}>
      <OrderHeading
        title="Notifications"
        onBackPress={() => navigation.goBack()}
        showHelp={false}
        isDark={isDark}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6D5AE6" />
          <Text style={[styles.loadingText, themed.mutedText]}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={42} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notification_id)}
          renderItem={renderNotification}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor={isDark ? "#A5B4FC" : "#6D5AE6"}
              colors={[isDark ? "#A5B4FC" : "#6D5AE6"]}
            />
          }
          ListHeaderComponent={
            <View>
              <LinearGradient
                colors={isDark
                  ? ["#18181B", "#27233A", "#4338CA"]
                  : ["#2F225F", "#6D5AE6", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <View style={styles.summaryIcon}>
                  <MaterialCommunityIcons
                    name={badgeCount > 0 ? "bell-ring-outline" : "bell-check-outline"}
                    size={23}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryKicker}>NOTIFICATION CENTER</Text>
                  <Text style={styles.summaryText}>
                    {badgeCount > 0
                      ? `${badgeCount} new notification${badgeCount > 1 ? "s" : ""}`
                      : "You are all caught up"}
                  </Text>
                </View>
              </LinearGradient>
              {notifications.length > 0 ? (
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, themed.mutedText]}>Recent updates</Text>
                  <TouchableOpacity
                    activeOpacity={0.78}
                    disabled={badgeCount <= 0}
                    style={[
                      styles.markAllButton,
                      themed.softButton,
                      badgeCount <= 0 && styles.markAllButtonDisabled,
                      badgeCount <= 0 && themed.disabledButton,
                    ]}
                    onPress={handleMarkAllRead}
                  >
                    <Text
                      style={[
                        styles.markAllText,
                        themed.actionText,
                        badgeCount <= 0 && styles.markAllTextDisabled,
                        badgeCount <= 0 && themed.disabledText,
                      ]}
                    >
                      Mark all read
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconWrap, themed.emptyIcon]}>
                <MaterialCommunityIcons name="bell-sleep-outline" size={34} color="#7C3AED" />
              </View>
              <Text style={[styles.emptyTitle, themed.text]}>No notifications yet</Text>
              <Text style={[styles.emptyText, themed.mutedText]}>
                Important order, wallet, and service updates will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

export default Notification;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F3FA",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 30,
  },
  summaryCard: {
    minHeight: 82,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#2F225F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.17)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryKicker: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0,
  },
  sectionHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  markAllButton: {
    borderRadius: 999,
    backgroundColor: "#F2EDFF",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  markAllButtonDisabled: {
    backgroundColor: "#ECE8F4",
  },
  markAllText: {
    fontSize: 11,
    color: "#6D5AE6",
    fontWeight: "700",
  },
  markAllTextDisabled: {
    color: "#A19AAD",
  },
  sectionTitle: {
    marginLeft: 2,
    fontSize: 12,
    color: "#7C728B",
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECE8F4",
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#2F225F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardUnread: {
    borderColor: "#CFC5FF",
    backgroundColor: "#FFFEFF",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  modulePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  moduleText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 15,
    color: "#1F1738",
    fontWeight: "800",
    flex: 1,
    letterSpacing: 0,
  },
  time: {
    fontSize: 11,
    color: "#9B92A9",
    fontWeight: "700",
  },
  message: {
    fontSize: 13,
    color: "#6F667D",
    lineHeight: 19,
    fontWeight: "500",
  },
  cardAction: {
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6D5AE6",
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 58,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 25,
    backgroundColor: "#F1ECFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#1F1738",
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#7C728B",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 19,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7C728B",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 10,
    marginBottom: 14,
    fontSize: 14,
    color: "#B91C1C",
    textAlign: "center",
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: "#6D5AE6",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
