import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";

import OrderHeading from "../../constants/heading/OrderHeading";
import OrderItemCard from "../../../common/order/OrderItemCard";
import Product from "../../../../assets/product/product(1).svg";
import { HomeStackParamList } from "../../navigation/types";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cancelOrder, CancellationReason, fetchCancellationReasons } from "../../api/OrderApi";

type RouteProps = RouteProp<
    HomeStackParamList,
    "SelectCancellationReason"
>;


type Nav = NativeStackNavigationProp<HomeStackParamList>;


export default function SelectCancellationReason() {
    const navigation = useNavigation<Nav>();
    const [comment, setComment] = useState("");
    const route = useRoute<RouteProps>();
    const [reasons, setReasons] = useState<CancellationReason[]>([]);
    const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
    const [loadingReasons, setLoadingReasons] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { orderId, orderRef, productTitle, productWeight } = route.params;
    const isOtherReason = /isn['’]t listed here/i.test(selectedReason?.reason || "");

    const isSubmitDisabled =
        !selectedReason || (isOtherReason && comment.trim().length === 0) || submitting;

    useEffect(() => {
        loadReasons();
    }, []);

    const loadReasons = async () => {
        try {
            setLoadingReasons(true);
            const data = await fetchCancellationReasons();
            setReasons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log("Failed to load cancellation reasons", error);
            setReasons([]);
        } finally {
            setLoadingReasons(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedReason) {
            Alert.alert("Reason required", "Please select cancellation reason");
            return;
        }

        try {
            setSubmitting(true);
            const res = await cancelOrder(
                Number(orderId),
                selectedReason.id,
                selectedReason.reasonType,
                comment.trim()
            );

            if (res?.success) {
                Alert.alert("Success", "Order cancelled successfully", [
                    { text: "OK", onPress: () => navigation.goBack() },
                ]);
                return;
            }

            Alert.alert("Cancellation failed", res?.message || "Unable to cancel order");
        } catch (error) {
            console.log("Cancel order failed", error);
            Alert.alert("Error", "Unable to cancel order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <OrderHeading
                title="Request Cancellation"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Product Card */}
                <OrderItemCard
                    image={<Product width={48} height={48} />}
                    title={productTitle || "Product"}
                    weight={productWeight || "-"}
                    orderId={String(orderRef || orderId)}
                />


                {/* Reason Section */}
                {/* Reason Section */}
                <View style={styles.reasonCard}>
                    <Text style={styles.reasonTitle}>Reason For Cancellation</Text>

                    {/* WHEN NO REASON SELECTED → SHOW ALL */}
                    {!selectedReason &&
                        reasons.map((reason) => (
                            <TouchableOpacity
                                key={String(reason.id)}
                                style={styles.reasonRow}
                                activeOpacity={0.7}
                                onPress={() => setSelectedReason(reason)}
                            >
                                <View style={styles.radioOuter} />
                                <Text style={styles.reasonText}>{reason.reason}</Text>
                            </TouchableOpacity>
                        ))}

                    {!selectedReason && !loadingReasons && reasons.length === 0 && (
                        <Text style={styles.emptyReasonText}>No cancellation reasons available.</Text>
                    )}

                    {/* WHEN REASON SELECTED → SHOW ONLY SELECTED */}
                    {selectedReason && (
                        <>
                            <View style={styles.reasonRow}>
                                <View style={[styles.radioOuter, styles.radioOuterActive]}>
                                    <View style={styles.radioInner} />
                                </View>
                                <Text style={styles.reasonText}>{selectedReason.reason}</Text>
                            </View>

                            {/* Comments Input */}
                            <View style={styles.commentBox}>
                                <Text style={styles.commentLabel}>Comments*</Text>
                                <TextInput
                                    placeholder="Enter any specific questions or requirements you'd like to share"
                                    placeholderTextColor="#9CA3AF"
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                    style={styles.commentInput}
                                />
                            </View>
                        </>
                    )}
                </View>


                {/* Submit Button */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={isSubmitDisabled}
                    onPress={handleCancelOrder}
                >
                    <LinearGradient
                        colors={["#8665FF", "#5B47A3"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                            styles.submitButton,
                            isSubmitDisabled && styles.disabledButton,
                        ]}
                    >
                        <Text style={styles.submitText}>{submitting ? "Submitting..." : "Submit Request"}</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
        paddingBottom: 32,
    },

    reasonCard: {
        marginTop: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 16,
    },

    reasonTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },

    reasonRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
    },

    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#CBD5E1",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    radioOuterActive: {
        borderColor: "#6D5AE6",
    },

    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#6D5AE6",
    },

    reasonText: {
        fontSize: 13,
        color: "#374151",
        flex: 1,
    },

    emptyReasonText: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 4,
    },

    submitButton: {
        height: 52,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
    },

    submitText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
    },

    disabledButton: {
        opacity: 0.5,
    },
    commentBox: {
        marginTop: 16,
    },

    commentLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
    },

    commentInput: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        color: "#111827",
        minHeight: 80,
        textAlignVertical: "top",
    },

});
