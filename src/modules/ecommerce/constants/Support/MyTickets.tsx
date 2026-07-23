import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  fetchSupportTickets,
  type SupportTicket,
} from "../../api/SupportApi";
import { useAppTheme } from "../../../../theme/ThemeContext";

type TicketFilter = "all" | "open" | "in_progress" | "closed";

const formatTicketDate = (value: string) => {
  if (!value) {
    return "Recently updated";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "closed":
      return "Closed";
    case "resolved":
      return "Resolved";
    case "pending":
      return "Pending";
    default:
      return "Open";
  }
};

const normalizeFilterStatus = (status: string): Exclude<TicketFilter, "all"> => {
  if (status === "closed" || status === "resolved") {
    return "closed";
  }

  if (status === "in_progress") {
    return "in_progress";
  }

  return "open";
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "in_progress":
      return {
        backgroundColor: "#FEF3C7",
        textColor: "#B45309",
      };
    case "closed":
    case "resolved":
      return {
        backgroundColor: "#DCFCE7",
        textColor: "#15803D",
      };
    default:
      return {
        backgroundColor: "#EDE9FE",
        textColor: "#6D28D9",
      };
  }
};

const TicketCard = ({ item, isDark }: { item: SupportTicket; isDark: boolean }) => {
  const statusStyle = getStatusStyle(item.status);

  return (
    <View style={[styles.ticketCard, isDark && darkStyles.ticketCard]}>
      <View style={styles.ticketTopRow}>
        <View style={styles.ticketTitleWrap}>
          <Text
            style={[styles.ticketSubject, isDark && darkStyles.primaryText]}
            numberOfLines={1}
          >
            {item.subject}
          </Text>
          <Text
            style={[styles.ticketCategory, isDark && darkStyles.accentText]}
            numberOfLines={1}
          >
            {item.category_name || "General"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusStyle.backgroundColor },
          ]}
        >
          <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.ticketDescription, isDark && darkStyles.secondaryText]}
        numberOfLines={2}
      >
        {item.description || "No description added for this ticket."}
      </Text>

      <View style={styles.ticketMetaRow}>
        <View style={styles.metaGroup}>
          <MaterialCommunityIcons
            name="ticket-confirmation-outline"
            size={15}
            color="#8B5CF6"
          />
          <Text style={[styles.metaText, isDark && darkStyles.mutedText]}>
            #{item.ticket_id}
          </Text>
        </View>

        <View style={styles.metaGroup}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={15}
            color="#8B5CF6"
          />
          <Text style={[styles.metaText, isDark && darkStyles.mutedText]}>
            {formatTicketDate(item.created_at || item.updated_at)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const FilterCard = ({
  label,
  count,
  active,
  isDark,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  isDark: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={[
      styles.filterCard,
      isDark && darkStyles.filterCard,
      active && styles.filterCardActive,
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.filterCardCount,
        isDark && darkStyles.filterCardCount,
        active && styles.filterCardCountActive,
      ]}
    >
      {count}
    </Text>
    <Text
      style={[
        styles.filterCardLabel,
        isDark && darkStyles.filterCardLabel,
        active && styles.filterCardLabelActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function MyTickets({ navigation }: any) {
  const { isDark } = useAppTheme();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TicketFilter>("all");

  const loadTickets = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const res = await fetchSupportTickets();
      setTickets(res.data || []);
    } catch (error) {
      __DEV__ && console.log("Support ticket history error", error);
      setTickets([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadTickets(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadTickets]);

  const ticketCounts = tickets.reduce(
    (acc, ticket) => {
      const status = normalizeFilterStatus(ticket.status);

      acc.all += 1;
      acc[status] += 1;
      return acc;
    },
    {
      all: 0,
      open: 0,
      in_progress: 0,
      closed: 0,
    } as Record<TicketFilter, number>
  );

  const filteredTickets = tickets.filter((ticket) => {
    if (activeFilter === "all") {
      return true;
    }

    return normalizeFilterStatus(ticket.status) === activeFilter;
  });

  return (
    <SafeAreaView style={[styles.screen, isDark && darkStyles.screen]} edges={["top"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#09090B" : "#F7F3FF"}
      />
      <View style={[styles.headerWrap, isDark && darkStyles.headerWrap]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.backButton, isDark && darkStyles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={isDark ? "#F4F4F5" : "#852BAF"}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, isDark && darkStyles.primaryText]}>
          My Tickets
        </Text>
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => String(item.ticket_id)}
        renderItem={({ item }) => <TicketCard item={item} isDark={isDark} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#C4B5FD" : "#A654CD"}
            colors={["#A654CD"]}
            progressBackgroundColor={isDark ? "#27272A" : "#FFFFFF"}
          />
        }
        ListHeaderComponent={
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              <FilterCard
                label="All Tickets"
                count={ticketCounts.all}
                active={activeFilter === "all"}
                isDark={isDark}
                onPress={() => setActiveFilter("all")}
              />
              <FilterCard
                label="Open"
                count={ticketCounts.open}
                active={activeFilter === "open"}
                isDark={isDark}
                onPress={() => setActiveFilter("open")}
              />
              <FilterCard
                label="In Progress"
                count={ticketCounts.in_progress}
                active={activeFilter === "in_progress"}
                isDark={isDark}
                onPress={() => setActiveFilter("in_progress")}
              />
              <FilterCard
                label="Closed"
                count={ticketCounts.closed}
                active={activeFilter === "closed"}
                isDark={isDark}
                onPress={() => setActiveFilter("closed")}
              />
            </ScrollView>

            <Text style={[styles.sectionTitle, isDark && darkStyles.primaryText]}>
              Available Tickets
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#A654CD" />
              <Text style={[styles.loaderText, isDark && darkStyles.mutedText]}>
                Loading your tickets...
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="ticket-outline"
                size={54}
                color="#C4B5FD"
              />
              <Text style={[styles.emptyTitle, isDark && darkStyles.primaryText]}>
                No tickets found
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  isDark && darkStyles.secondaryText,
                ]}
              >
                Once a user raises a support request, it will appear here.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F3FF",
  },

  headerWrap: {
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 10,
    minHeight: 48,
  },

  backButton: {
    position: "absolute",
    left: 16,
    top: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#852BAF",
    textAlign: "center",
  },

  listContent: {
    padding: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },

  filtersRow: {
    paddingBottom: 16,
    paddingRight: 6,
  },

  filterCard: {
    minWidth: 92,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#F1E8FF",
  },

  filterCardActive: {
    backgroundColor: "#A654CD",
    borderColor: "#A654CD",
  },

  filterCardCount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#852BAF",
  },

  filterCardCountActive: {
    color: "#FFFFFF",
  },

  filterCardLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#7B728B",
  },

  filterCardLabelActive: {
    color: "rgba(255,255,255,0.92)",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2F1847",
    marginBottom: 12,
  },

  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1E8FF",
    shadowColor: "#2F1847",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  ticketTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  ticketTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },

  ticketSubject: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2F1847",
  },

  ticketCategory: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#9A64B6",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  ticketDescription: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: "#5B5567",
  },

  ticketMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },

  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 6,
  },

  metaText: {
    marginLeft: 6,
    color: "#7B728B",
    fontSize: 12,
    fontWeight: "600",
  },

  loaderWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },

  loaderText: {
    marginTop: 12,
    color: "#7B728B",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 44,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#2F1847",
  },

  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    color: "#7B728B",
  },
});

const darkStyles = StyleSheet.create({
  screen: {
    backgroundColor: "#09090B",
  },

  headerWrap: {
    backgroundColor: "#09090B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  backButton: {
    backgroundColor: "#18181B",
    borderRadius: 18,
  },

  primaryText: {
    color: "#F4F4F5",
  },

  secondaryText: {
    color: "#D4D4D8",
  },

  mutedText: {
    color: "#A1A1AA",
  },

  accentText: {
    color: "#C4B5FD",
  },

  filterCard: {
    backgroundColor: "#18181B",
    borderColor: "rgba(255,255,255,0.12)",
  },

  filterCardCount: {
    color: "#C4B5FD",
  },

  filterCardLabel: {
    color: "#A1A1AA",
  },

  ticketCard: {
    backgroundColor: "#18181B",
    borderColor: "rgba(255,255,255,0.12)",
    shadowOpacity: 0,
    elevation: 0,
  },
});
