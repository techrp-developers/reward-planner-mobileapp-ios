import React, { useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import ProductHeadColor from "../heading/Poduct_Head_Color";
import CouponsSection from "./CouponsSection";

const COUPONS = [
    {
        id: 1,
        code: "RPSLAY200",
        title: "Add ₹248 more to avail this offer",
        subtitle: "Get Flat ₹200 off",
        active: true,
    },
    {
        id: 2,
        code: "RUPAYCC50",
        title: "Flat ₹50 Cashback on Rupay Credit Card",
        subtitle: "Add items worth ₹7777 more to avail this offer",
        active: false,
    },
];

function CouponsPage({ navigation }) {
    const [couponCode, setCouponCode] = useState("");

    const isDisabled = couponCode.trim().length === 0;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F6F6" }}>
            <ProductHeadColor
                title="Coupons"
                onBackPress={() => navigation.goBack()}
            />

            {/* Coupon Input */}
            <View style={styles.inputWrapper}>
                <TextInput
                    placeholder="Type coupon code here"
                    placeholderTextColor="#9E9E9E"
                    value={couponCode}
                    onChangeText={setCouponCode}
                    style={styles.input}
                />

                <TouchableOpacity
                    style={[styles.applyBtn, isDisabled && styles.disabledBtn]}
                    disabled={isDisabled}
                >
                    <Text style={styles.applyText}>APPLY</Text>
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
                <CouponsSection coupons={COUPONS} />
            </View>

        </SafeAreaView>
    );
}

export default CouponsPage;

const styles = StyleSheet.create({
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F2",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        paddingHorizontal: 12,
        height: 48,
        marginHorizontal: 16,
        marginTop: 12,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#000",
    },
    applyBtn: {
        backgroundColor: "#16A34A",
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 8,
    },
    disabledBtn: {
        backgroundColor: "#D9D9D9",
    },
    applyText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
    },
});
