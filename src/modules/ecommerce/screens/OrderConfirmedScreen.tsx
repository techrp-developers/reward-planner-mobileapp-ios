import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import OrderHeading from "../constants/heading/OrderHeading";
import OrderItemCard from "../../common/order/OrderItemCard";

import Product from "../../../assets/product/product(1).svg";
import { HomeStackParamList } from "../navigation/types";
import OrderStatusJourney, { OrderStatusItem } from "../../common/order/OrderStatusJourney";
import DeliveryDetailsCard from "../../common/order/DeliveryDetailsCard";
import PriceDetailsCard from "../../common/order/PriceDetailsCard";
import InvoiceAndServiceBanner from "../../common/order/InvoiceAndServiceBanner";
import ProductCarousel from "../components/order/ProductCarousel";
import OrderCancelModal from "../../common/order/OrderCancelModal";
import { fetchOrderDetails } from "../api/OrderApi";
import { fetchAllProducts, getProductImageUrl } from "../api/ProductApi";
import { fetchReviewableOrder } from "../api/ReviewApi";
import { useAppTheme } from "../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type OrderConfirmedRoute = RouteProp<HomeStackParamList, "OrderConfirmedScreen">;

type OrderDetailsResponse = {
    success: boolean;
    order?: {
        order_id: number;
        order_ref: string;
        status: string;
        total_amount: string | number;
        created_at: string;
        is_reward_credited?: boolean;
    };
    address?: {
        type?: string;
        name?: string;
        phone?: string;
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        country?: string;
        zipcode?: string;
        landmark?: string;
    };
    items?: Array<{
        order_item_id: number;
        product_id: number;
        variant_id: number;
        product_name: string;
        brand_name?: string;
        image?: string;
        attributes?: Record<string, string>;
        quantity: number;
        price: string | number;
        item_total: number;
        reward_discount?: number;
    }>;
    shipments?: Array<{
        vendor_id?: number;
        courier_name?: string;
        awb_number?: string | null;
        shipping_status?: string;
        shipping_charges?: number;
        label_url?: string | null;
        current_step?: number;
        steps?: Array<{
            key: string;
            label: string;
            completed: boolean;
            current: boolean;
        }>;
        timeline?: any[];
        expected_delivery_date?: string;
        special_state?: {
            type?: string;
            message?: string;
        } | null;
    }>;
    order_progress?: {
        current_step: number;
        steps: Array<{
            key: string;
            label: string;
            completed: boolean;
            current: boolean;
        }>;
    };
    summary?: {
        item_total?: number;
        shipping_total?: number;
        reward_discount?: number;
        reward_coins_used?: number;
        reward_coins_earned?: number;
        bag_discount?: number;
        order_total?: string | number;
    };
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

const toTitleCase = (value?: string) => {
    if (!value) return "Pending";
    return value
        .replace(/[_-]/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};

const isTerminalStatus = (value?: string) => {
    const normalized = value?.toLowerCase();
    return normalized === "cancelled" || normalized === "rejected" || normalized === "delivered";
};

export default function OrderConfirmedScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<OrderConfirmedRoute>();
    const { isDark, theme } = useAppTheme();

    const [isModalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [orderData, setOrderData] = useState<OrderDetailsResponse | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [reviewableVariants, setReviewableVariants] = useState<Record<number, boolean>>({});

    const orderId = route.params?.order_id;

    useEffect(() => {
        const loadOrderDetails = async () => {
            if (!orderId) {
                setError("Order ID not found.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const response = (await fetchOrderDetails(orderId)) as OrderDetailsResponse;
            if (response?.success) {
                setOrderData(response);
            } else {
                setError("Unable to load order details.");
            }

            setLoading(false);
        };

        loadOrderDetails();
    }, [orderId]);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const res = await fetchAllProducts();
                const allProducts = Array.isArray(res?.products) ? res.products : [];
                if (!allProducts.length) {
                    setRelatedProducts([]);
                    return;
                }

                const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
                setRelatedProducts(shuffled.slice(0, 10));
            } catch {
                setRelatedProducts([]);
            }
        };

        loadProducts();
    }, []);

    useEffect(() => {
        const loadReviewableItems = async () => {
            const isDelivered = orderData?.order?.status?.toLowerCase() === "delivered";
            const items = orderData?.items || [];

            if (!isDelivered || !items.length) {
                setReviewableVariants({});
                return;
            }

            const entries = await Promise.all(
                items.map(async (item) => {
                    try {
                        const response = await fetchReviewableOrder(item.variant_id);
                        const payload = response?.data ?? response;
                        return [
                            item.order_item_id,
                            Boolean(payload?.can_review),
                        ] as const;
                    } catch {
                        return [item.order_item_id, false] as const;
                    }
                })
            );

            setReviewableVariants(Object.fromEntries(entries));
        };

        loadReviewableItems();
    }, [orderData?.items, orderData?.order?.status]);

    const firstItem = orderData?.items?.[0];
    const primaryShipment = orderData?.shipments?.[0];

    const productTitle = [firstItem?.brand_name, firstItem?.product_name]
        .filter(Boolean)
        .join(" ") || "Product";

    const weightOrQuantity =
        firstItem?.attributes?.weight ||
        firstItem?.attributes?.size ||
        (firstItem?.quantity ? `Qty: ${firstItem.quantity}` : "-");

    const fullAddress = [
        orderData?.address?.line1,
        orderData?.address?.line2,
        orderData?.address?.city,
        orderData?.address?.state,
        orderData?.address?.country,
        orderData?.address?.zipcode,
        orderData?.address?.landmark,
    ]
        .filter(Boolean)
        .join(", ");

    const orderStatuses: OrderStatusItem[] = useMemo(() => {
        const orderStatus = orderData?.order?.status?.toLowerCase();
        const shipmentSpecialState = orderData?.shipments?.find((shipment) => shipment.special_state)?.special_state;

        if (shipmentSpecialState?.type || orderStatus === "cancelled" || orderStatus === "rejected") {
            return [
                {
                    label: "Order placed",
                    date: formatDisplayDate(orderData?.order?.created_at),
                    completed: true,
                },
                {
                    label: toTitleCase(shipmentSpecialState?.type || orderStatus),
                    completed: true,
                },
            ];
        }

        const progress = orderData?.order_progress;
        if (progress?.steps) {
            return progress.steps.map((step, index) => ({
                label: step.label,
                completed: step.completed,
                current: step.current || index === progress.current_step,
                date: index === 0 ? formatDisplayDate(orderData?.order?.created_at) : undefined,
            }));
        }

        // Fallback to old logic if no progress
        const status = orderData?.order?.status?.toLowerCase() || "pending";
        const completedIndexMap: Record<string, number> = {
            pending: 0,
            processing: 1,
            "in transit": 2,
            "in-transit": 2,
            shipped: 2,
            "out for delivery": 3,
            "out-for-delivery": 3,
            delivered: 4,
        };

        const completedIndex = completedIndexMap[status] ?? 0;
        const createdDate = formatDisplayDate(orderData?.order?.created_at);

        return [
            {
                label: "Order Details",
                date: createdDate,
                completed: completedIndex >= 0,
            },
            {
                label: "Order in Progress",
                completed: completedIndex >= 1,
            },
            {
                label: "In Transit",
                completed: completedIndex >= 2,
            },
            {
                label: "Out for Delivery",
                completed: completedIndex >= 3,
            },
            {
                label: "Order Delivered",
                completed: completedIndex >= 4,
            },
        ];
    }, [orderData?.order?.created_at, orderData?.order?.status, orderData?.order_progress, orderData?.shipments]);

    const isCancelledOrder = useMemo(() => {
        const orderStatus = orderData?.order?.status?.toLowerCase();

        return orderStatus === "cancelled" || orderData?.shipments?.some((shipment) =>
            shipment.shipping_status?.toLowerCase() === "cancelled" ||
            shipment.special_state?.type?.toLowerCase() === "cancelled"
        ) === true;
    }, [orderData?.order?.status, orderData?.shipments]);

    const journeyHeader = useMemo(() => {
        const orderStatus = orderData?.order?.status;
        const shipmentStatus = primaryShipment?.shipping_status || orderStatus;
        const specialMessage = primaryShipment?.special_state?.message;

        if (specialMessage) {
            return specialMessage;
        }

        if (orderStatus?.toLowerCase() === "cancelled") {
            return "Order cancelled";
        }

        if (orderStatus?.toLowerCase() === "rejected") {
            return "Order rejected";
        }

        if (orderStatus?.toLowerCase() === "delivered") {
            return "Order delivered";
        }

        if (primaryShipment?.expected_delivery_date) {
            return `Arriving by ${formatDisplayDate(primaryShipment.expected_delivery_date)}`;
        }

        return `Status: ${toTitleCase(shipmentStatus)}`;
    }, [orderData?.order?.status, primaryShipment]);

    const canCancelOrder = !isTerminalStatus(orderData?.order?.status);
    const isDeliveredOrder = orderData?.order?.status?.toLowerCase() === "delivered";

    const itemTotal = Number(orderData?.summary?.item_total ?? 0);
    const shippingTotal = Number(orderData?.summary?.shipping_total ?? 0);
    const rewardDiscount = Number(orderData?.summary?.reward_discount ?? 0);
    const rewardCoinsUsed = Number(orderData?.summary?.reward_coins_used ?? 0);
    const rewardCoinsEarned = Number(orderData?.summary?.reward_coins_earned ?? 0);
    const bagDiscount = Number(orderData?.summary?.bag_discount ?? 0);
    const orderTotal = Number(orderData?.summary?.order_total ?? orderData?.order?.total_amount ?? 0);

    const openReviewScreen = (item: NonNullable<OrderDetailsResponse["items"]>[number]) => {
        navigation.navigate("ReviewScreen", {
            product_id: Number(item.product_id),
            variant_id: Number(item.variant_id),
            order_id: Number(orderData?.order?.order_id),
            product_name: item.product_name,
            image: item.image ? getProductImageUrl(item.image) : undefined,
            delivered_on: orderData?.order?.created_at,
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
                <OrderHeading
                    title="Order Confirmed"
                    onBackPress={() => navigation.goBack()}
                    isDark={isDark}
                />
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.stateText, { color: theme.secondaryText }]}>Loading order details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !orderData?.order) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
                <OrderHeading
                    title="Order Confirmed"
                    onBackPress={() => navigation.goBack()}
                    isDark={isDark}
                />
                <View style={styles.centeredState}>
                    <Text style={styles.errorText}>{error || "Unable to load order details."}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <OrderHeading
                title="Order Confirmed"
                onBackPress={() => navigation.goBack()}
                isDark={isDark}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Product Card */}
                <OrderItemCard
                    image={
                        firstItem?.image ? (
                            <Image
                                source={{ uri: getProductImageUrl(firstItem.image) }}
                                style={styles.productImage}
                                onError={() => {}}
                                defaultSource={require("../../../assets/product/coming_soon.png")}
                            />
                        ) : (
                            <Product width={48} height={48} />
                        )
                    }
                    title={productTitle}
                    weight={weightOrQuantity}
                    orderId={orderData.order.order_ref || String(orderData.order.order_id)}
                />

                {/* Order Status Timeline */}
                <OrderStatusJourney
                    headerText={journeyHeader}
                    statuses={orderStatuses}
                    tone={isCancelledOrder ? "danger" : "success"}
                    onCancelPress={canCancelOrder ? () => setModalVisible(true) : undefined}
                />

                {isDeliveredOrder && orderData.items?.length ? (
                    <View style={[styles.reviewSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.reviewSectionTitle, { color: theme.text }]}>Review your products</Text>
                        {orderData.items.map((item) => {
                            const canReview = Boolean(reviewableVariants[item.order_item_id]);
                            const title = [item.brand_name, item.product_name].filter(Boolean).join(" ");

                            return (
                                <View key={item.order_item_id} style={[styles.reviewItemRow, { borderTopColor: theme.border }]}>
                                    <View style={styles.reviewItemCopy}>
                                        <Text style={[styles.reviewItemTitle, { color: theme.text }]} numberOfLines={2}>
                                            {title || "Product"}
                                        </Text>
                                        <Text style={[styles.reviewItemMeta, { color: theme.secondaryText }]} numberOfLines={1}>
                                            {item.attributes?.weight || item.attributes?.size || `Qty: ${item.quantity}`}
                                        </Text>
                                    </View>
                                    {canReview ? (
                                        <TouchableOpacity
                                            style={[
                                                styles.reviewButton,
                                                {
                                                    backgroundColor: isDark ? "#2D2148" : "#F5F3FF",
                                                    borderColor: isDark ? "#5B4B86" : "#DDD6FE",
                                                },
                                            ]}
                                            activeOpacity={0.82}
                                            onPress={() => openReviewScreen(item)}
                                        >
                                            <Text style={[styles.reviewButtonText, { color: theme.primary }]}>Write Review</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text style={[styles.reviewDoneText, { color: "#16A34A" }]}>Reviewed</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ) : null}

                <DeliveryDetailsCard
                    addressType={orderData.address?.type?.toUpperCase() || "HOME"}
                    address={fullAddress || "Address unavailable"}
                    name={orderData.address?.name || "-"}
                    phone={orderData.address?.phone || "-"}
                />
                <PriceDetailsCard
                    itemTotal={itemTotal}
                    deliveryFee={shippingTotal}
                    bagDiscount={bagDiscount}
                    rewardDiscount={rewardDiscount}
                    orderTotal={orderTotal}
                    rewardEarned={rewardCoinsEarned}
                    rewardRedeemed={rewardCoinsUsed}
                    paymentMethod="Online"
                />

                <InvoiceAndServiceBanner orderId={orderData.order.order_id} />
                <View>
                    <Text style={[styles.relatedTitle, { color: theme.text }]}>You may also like this</Text>

                    <ProductCarousel products={relatedProducts} />

                </View>
                <OrderCancelModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    orderId={orderData.order.order_id}
                    orderRef={orderData.order.order_ref}
                    productTitle={productTitle}
                    productWeight={weightOrQuantity}
                    onCancelConfirm={() => {
                        setModalVisible(false);
                        __DEV__ && console.log("Order officially cancelled");
                    }}
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

    productImage: {
        width: 48,
        height: 48,
        resizeMode: "contain",
    },
    reviewSection: {
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        padding: 14,
    },
    reviewSectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 10,
    },
    reviewItemRow: {
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingVertical: 10,
        gap: 10,
    },
    reviewItemCopy: {
        flex: 1,
    },
    reviewItemTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
        lineHeight: 18,
    },
    reviewItemMeta: {
        marginTop: 2,
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    reviewButton: {
        borderRadius: 9,
        backgroundColor: "#F5F3FF",
        borderWidth: 1,
        borderColor: "#DDD6FE",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    reviewButtonText: {
        fontSize: 12,
        color: "#7C3AED",
        fontWeight: "800",
    },
    reviewDoneText: {
        fontSize: 12,
        color: "#16A34A",
        fontWeight: "700",
    },

    centeredState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },

    stateText: {
        marginTop: 10,
        color: "#4B5563",
        fontSize: 14,
    },

    errorText: {
        fontSize: 14,
        color: "#DC2626",
        textAlign: "center",
    },
    relatedTitle: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 8,
    },
});
