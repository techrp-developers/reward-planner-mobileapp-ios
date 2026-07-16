
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";


import Product from "../../../../assets/product/product(1).svg";

import { Text } from "react-native";
import OrderItemCard from "./OrderItemCard";
import DeliveryDetailsCard from "./DeliveryDetailsCard";
import PriceDetailsCard from "./PriceDetailsCard";
import InvoiceAndServiceBanner from "./InvoiceAndServiceBanner";
import OrderCancelModal from "./OrderCancelModal";
import LinearGradient from "react-native-linear-gradient";
import CancellationAndRefundCard from "./CancellationTimeline";
import { HomeStackParamList } from "@/modules/ecommerce/navigation/types";
import OrderHeading from "@/modules/ecommerce/constants/heading/OrderHeading";
import ProductCarousel from "@/modules/ecommerce/components/order/ProductCarousel";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function CancellationConfirmed() {
    const navigation = useNavigation<Nav>();

    const [isModalVisible, setModalVisible] = useState(false);


 

    return (
        <SafeAreaView style={styles.safe}>
            <OrderHeading
                title="Order Confirmed"
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Product Card */}
                <OrderItemCard
                    image={<Product width={48} height={48} />}
                    title="The Tribe Concept Face Brightening Daily Face Pack"
                    weight="300g"
                    orderId="65327VH"
                />
                <LinearGradient
                    colors={["#8665FF", "#5B47A3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBorder}
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.innerButton}
                    >
                        <Text style={styles.text}>Reorder</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Order Status Timeline */}
                <CancellationAndRefundCard
                    timeline={[
                        { label: "Cancellation Requested", date: "Sun, 4 Nov 2026" },
                        { label: "Cancellation Confirmed", date: "Fri, 5 Nov 2026" },
                        { label: "Refund Initiated", date: "Sat, 6 Nov 2026" },
                        { label: "Refund Completed", date: "Sun, 7 Nov 2026" },
                    ]}
                />


                <DeliveryDetailsCard
                    address="B-25, KPCT Mall, 16/1/1 Wanworie Road, Fatima Nagar, Wanwadi, Pune, 411040"
                    name="Samiksha Shetty"
                    phone="9283827382"
                />
                <PriceDetailsCard
                    itemTotal={1500}
                    deliveryFee={50}
                    bagDiscount={100}
                    rewardDiscount={500}
                    orderTotal={950}
                    rewardEarned={462}
                    rewardRedeemed={500}
                    paymentMethod="Credit Card"
                />

                <InvoiceAndServiceBanner orderId="65327VH" />
                <View>
                    <Text>You may also like this</Text>

                    <ProductCarousel products={[]} />
                </View>
                <OrderCancelModal
                    visible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    orderId={65327}
                    orderRef="65327VH"
                    productTitle="The Tribe Concept Face Brightening Daily Face Pack"
                    productWeight="300g"
                    savings={450}
                    onCancelConfirm={() => {
                        setModalVisible(false);
                        console.log("Order officially cancelled");
                        // You can navigate to a success screen or call API here
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
    gradientBorder: {
        borderRadius: 10,
        padding: 1.5, // 👈 border thickness
    },

    innerButton: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },

    text: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6D5AE6",
    },
});
