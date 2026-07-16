import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import CoinIcon from "../../../assets/product/rewards.svg";
import ProductImg from "../../../assets/product/product(2).svg";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../ecommerce/navigation/types";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

interface OrderCancelModalProps {
    visible: boolean;
    onClose: () => void;
    onCancelConfirm: () => void;
    orderId: number;
    orderRef?: string;
    savings?: number;
    productTitle?: string;
    productWeight?: string;
}

export default function OrderCancelModal({
    visible,
    onClose,
    onCancelConfirm,
    orderId,
    orderRef,
    savings,
    productTitle,
    productWeight,
}: OrderCancelModalProps) {
    const navigation = useNavigation<Nav>();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Clickable background to close */}
                <TouchableOpacity
                    style={styles.dismissArea}
                    onPress={onClose}
                    activeOpacity={1}
                />

                <View style={styles.sheetContainer}>
                    <View style={styles.dragHandle} />

                    {/* RP Coins Savings Banner */}
                    <View style={styles.savingsBanner}>
                        <View style={styles.savingsLeft}>
                            {/* Render SVG as a component */}
                            <CoinIcon width={32} height={32} style={styles.coinIcon} />
                            <Text style={styles.savingsText}>
                                You saved <Text style={styles.boldText}>450 RP coins</Text> on this product!
                            </Text>
                        </View>

                        <View style={styles.productImageContainer}>
                            {/* Render Product SVG or Image */}
                            <ProductImg width={60} height={60} />
                        </View>
                    </View>

                    {/* Warning Text */}
                    <View style={styles.textContainer}>
                        <Text style={styles.warningText}>
                            If you cancel now, these savings will be lost and may not be available again.
                        </Text>
                        <Text style={styles.confirmText}>Do you still want to cancel?</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.keepButton} onPress={onClose}>
                            <Text style={styles.keepButtonText}>Keep Order</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                onCancelConfirm();
                                onClose();

                                navigation.navigate("SelectCancellationReason", {
                                    orderId,
                                    orderRef,
                                    savings,
                                    productTitle,
                                    productWeight,
                                });
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel Order</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)", // Lighter overlay
        justifyContent: "flex-end", // Align modal at the bottom
    },

    dismissArea: {
        flex: 1,
    },

    sheetContainer: {
        backgroundColor: "#FFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 0, // Adjust for the button height
    },

    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#D1D5DB",
        borderRadius: 2,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 16,
    },

    savingsBanner: {
        marginHorizontal: 20,
        backgroundColor: "#FFF5F5",
        borderWidth: 1.2,
        borderColor: "#FFB4B4", // Red border for caution
        borderRadius: 12,
        flexDirection: "row",
        padding: 14,
        alignItems: "center",
        justifyContent: "space-between",
    },

    savingsLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },

    coinIcon: {
        marginRight: 10,
    },

    savingsText: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
        flexShrink: 1,
    },

    boldText: {
        fontWeight: "700",
        color: "#111827",
    },

    productImageContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        padding: 6,
        marginLeft: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    textContainer: {
        paddingVertical: 28,
        alignItems: "center",
        paddingHorizontal: 32,
    },

    warningText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 20,
    },

    confirmText: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "600",
        marginTop: 10,
    },

    buttonRow: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: "#E5E7EB",
    },

    keepButton: {
        flex: 1,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
    },

    keepButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
    },

    divider: {
        width: 1,
        height: "100%",
        backgroundColor: "#E5E7EB",
    },

    cancelButton: {
        flex: 1,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
    },

    cancelButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF3B30", // iOS red style for cancel
    },
});
