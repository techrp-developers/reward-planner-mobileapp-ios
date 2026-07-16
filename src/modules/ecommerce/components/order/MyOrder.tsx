import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import OrderHeading from "../../constants/heading/OrderHeading";
import { HomeStackParamList } from "../../navigation/types";
import OrderBanner from "../../../../assets/order/order_banner.svg";
import Coin from "../../../../assets/product/rewards.svg";
import OrderItemCard from "./OrderItemCard";
import FilterBottomSheet from "./FilterBottomSheet";
import { fetchHistory } from "../../api/OrderApi";
import { getProductImageUrl } from "../../api/ProductApi";
import { useAuth } from "../../../common/auth/context/AuthContext";


type Nav = NativeStackNavigationProp<HomeStackParamList>;

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

const toTitleCase = (value?: string) => {
    if (!value) return "Pending";
    return value
        .replace(/[_-]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};

export default function MyOrder() {
    const navigation = useNavigation<Nav>();
    const { isAuthenticated } = useAuth();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [timeFilter, setTimeFilter] = useState("30days");
    const [statusFilter, setStatusFilter] = useState("");
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [summary, setSummary] = useState<{ totalCoinsEarned: number; totalSavings: number } | null>(null);
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "#16A34A";
            case "cancelled":
            case "rejected":
                return "#DC2626";
            case "pending":
            case "processing":
                return "#2563EB";
            default:
                return "#6B7280";
        }
    };
    const loadOrders = useCallback(async () => {
        if (!isAuthenticated) {
            setOrders([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const res = await fetchHistory(1, {
            search: searchQuery || undefined,
            time_filter: timeFilter || undefined,
            status: statusFilter || undefined,
        });

        if (res?.success) {
            setOrders(res.orders || []);
            setSummary(res.summary || null);
        } else {
            setOrders([]);
            setSummary(null);
        }

        setLoading(false);
    }, [isAuthenticated, searchQuery, timeFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(loadOrders, 400); // debounce
        return () => clearTimeout(timer);
    }, [loadOrders]);

    return (
        <SafeAreaView style={styles.safe}>
            <OrderHeading
                title="My Orders"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Banner */}
                <View style={styles.bannerWrap}>
                    <OrderBanner width="100%" height={140} />
                </View>

                {/* Search + filter */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#777" />
                        <TextInput
                            placeholder="Search your orders here"
                            placeholderTextColor="#999"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.filterBtn}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <MaterialCommunityIcons name="tune-variant" size={20} color="#555" />
                        <Text style={styles.filterText}>Filters</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <LinearGradient colors={["#EFFFF4", "#DDFFE8"]} style={styles.statCard}>
                        <Text style={styles.statLabel}>Coins Earned Till Date:</Text>
                        <View style={styles.statValueRow}>
                            <Coin width={22} height={22} />
                            <Text style={styles.statValue}>{summary?.totalCoinsEarned || 0}</Text>
                        </View>
                    </LinearGradient>

                    <LinearGradient colors={["#EFFFF4", "#DDFFE8"]} style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Savings Till Date:</Text>
                        <Text style={[styles.statValue, styles.savingsText]}>
                            ₹{summary?.totalSavings || 0}
                        </Text>
                    </LinearGradient>
                </View>

                {/* Orders */}
                {loading ? (
                    <ActivityIndicator size="large" color="#0D862E" style={styles.loadingIndicator} />
                ) : orders.length === 0 ? (
                    <Text style={styles.emptyText}>
                        No orders found
                    </Text>
                ) : (
                    orders.map((order) => (
                        (() => {
                            const statusText = toTitleCase(order?.status);
                            const orderRef = String(order?.order_ref || order?.order_id || "");
                            const itemCount = Number(order?.item_count || 0);

                            return (
                                <OrderItemCard
                                    key={order.order_id}
                                    image={
                                        order.image
                                            ? getProductImageUrl(order.image)
                                            : "https://via.placeholder.com/300x300/F3F4F6/9CA3AF?text=Product"
                                    }
                                    status={statusText}
                                    statusColor={getStatusColor(String(order?.status || statusText))}
                                    brand={order.brand || "Brand"}
                                    title={order.title || "Product"}
                                    rating={0}
                                    price={order.price || 0}
                                    rewardEarned={order.reward?.earned}
                                    orderRef={orderRef}
                                    orderedOn={formatDisplayDate(order.created_at)}
                                    itemCount={itemCount || undefined}
                                    actionText="View Order"
                                    onPress={() =>
                                        navigation.navigate("OrderConfirmedScreen", {
                                            order_id: order.order_id,
                                        })
                                    }
                                />
                            );
                        })()
                    ))
                )}
            </ScrollView>

            <FilterBottomSheet
                visible={isFilterVisible}
                onClose={() => setIsFilterVisible(false)}
                currentTime={timeFilter}
                currentStatus={statusFilter}
                onApply={(time, status) => {
                    setTimeFilter(time);
                    setStatusFilter(status);
                    setIsFilterVisible(false);
                }}
            />

        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 40,
    },
    bannerWrap: {
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
    },

    /* Search */
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
        color: "#333",
    },

    filterBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    filterText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },

    /* Stats */
    statsRow: {
        flexDirection: 'row',

        justifyContent: 'space-between',

        marginBottom: 18,
    },
    statCard: {
        width: '48%',

        // paddingVertical: Platform.OS === 'ios'
        //     ? 18
        //     : 14,

        // paddingHorizontal: 12,

        borderRadius: 12,

        borderWidth: 1,
        borderColor: '#E6E6E6',

        alignItems: 'center',
        justifyContent: 'center',

        minHeight: Platform.OS === 'ios'
            ? 140
            : 96,
    },

    statLabel: {
        fontSize: 12,

        fontWeight: Platform.OS === 'ios'
            ? '700'
            : '600',

        color: '#0D862E',

        marginBottom: 10,

        textAlign: 'center',

        lineHeight: Platform.OS === 'ios'
            ? 18
            : 16,

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
        color: "#0D862E",
    },

    savingsText: {
        borderBottomWidth: 1,
        borderBottomColor: "#0D862E",
    },

    /* Placeholder content */
    fakeContent: {
        marginTop: 40,
        padding: 20,
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
    },

    fakeText: {
        color: "#666",
        textAlign: "center",
    },

    loadingIndicator: {
        marginTop: 40,
    },

    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: "#777",
    },
});
