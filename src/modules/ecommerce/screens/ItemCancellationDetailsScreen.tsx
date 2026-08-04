import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import OrderHeading from "../constants/heading/OrderHeading";
import CancellationAndRefundCard from "../../common/order/CancellationTimeline";
import { fetchItemCancellationDetails, ItemCancellationDetails } from "../api/OrderApi";
import { HomeStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteProps = RouteProp<HomeStackParamList, "ItemCancellationDetails">;

const EVENT_LABELS: Record<string, string> = {
    cancellation_requested: "Cancellation Requested",
    cancellation_confirmed: "Cancellation Confirmed",
    refund_initiated: "Refund Initiated",
    refund_completed: "Refund Completed",
    cancellation_rejected: "Cancellation Rejected",
};

const REFUND_METHOD_LABELS: Record<string, string> = {
    original: "Refund to Original Payment",
    wallet: "Reward Coins Reversed",
};

const STATUS_TITLES: Record<string, string> = {
    requested: "Cancellation Requested",
    confirmed: "Item Cancelled",
    rejected: "Cancellation Rejected",
};

const formatDisplayDate = (value?: string) => {
    if (!value) return "-";
    const normalized = value.replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
};

export default function ItemCancellationDetailsScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<RouteProps>();
    const { isDark, theme } = useAppTheme();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ItemCancellationDetails["data"] | null>(null);

    const orderItemId = route.params?.orderItemId;

    useEffect(() => {
        const load = async () => {
            if (!orderItemId) {
                setError("Order item not found.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const response = await fetchItemCancellationDetails(orderItemId);
            if (response?.success && response.data) {
                setData(response.data);
            } else {
                setError("Unable to load cancellation details.");
            }

            setLoading(false);
        };

        load();
    }, [orderItemId]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
                <OrderHeading title="Cancellation Status" onBackPress={() => navigation.goBack()} isDark={isDark} />
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.stateText, { color: theme.secondaryText }]}>Loading cancellation details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !data) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
                <OrderHeading title="Cancellation Status" onBackPress={() => navigation.goBack()} isDark={isDark} />
                <View style={styles.centeredState}>
                    <Text style={styles.errorText}>{error || "Unable to load cancellation details."}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const timeline = (data.timeline || []).map((entry) => ({
        label: EVENT_LABELS[entry.event] || entry.event,
        date: formatDisplayDate(entry.created_at),
    }));

    const refunds = (data.refunds || []).map((refund) => ({
        amount: Number(refund.refund_amount || 0),
        label: REFUND_METHOD_LABELS[refund.refund_method] || refund.refund_method,
        status: refund.status,
    }));

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <OrderHeading title="Cancellation Status" onBackPress={() => navigation.goBack()} isDark={isDark} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {data.item?.product_name ? (
                    <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
                            {data.item.product_name}
                        </Text>
                        {data.item.quantity ? (
                            <Text style={[styles.productMeta, { color: theme.secondaryText }]}>Qty: {data.item.quantity}</Text>
                        ) : null}
                    </View>
                ) : null}

                <CancellationAndRefundCard
                    title={STATUS_TITLES[data.item.status] || "Cancellation Requested"}
                    reasonText={
                        [data.item.reason_text, data.item.comment].filter(Boolean).join(" — ") || undefined
                    }
                    timeline={timeline}
                    refunds={refunds}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        padding: 16,
    },
    productCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        marginBottom: 4,
    },
    productTitle: {
        fontSize: 14,
        fontWeight: "700",
    },
    productMeta: {
        fontSize: 12,
        marginTop: 4,
    },
    centeredState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    stateText: {
        marginTop: 10,
        fontSize: 14,
    },
    errorText: {
        fontSize: 14,
        color: "#DC2626",
        textAlign: "center",
    },
});