import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { fetchOrderReceipt } from "../../ecommerce/api/OrderApi";
import { getProductImageUrl } from "../../ecommerce/api/ProductApi";

interface OrderReceiptProps {
  orderId: number;
}

export default function OrderReceipt({ orderId }: OrderReceiptProps) {
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReceipt = useCallback(async () => {
    try {
      const res = await fetchOrderReceipt(orderId);
      if (res?.success) {
        setReceipt(res.receipt);
      }
    } catch (error) {
      console.error("Failed to load receipt:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#8665FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrap}>
          <Text style={styles.errorText}>Receipt not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    items = [],
    address = {},
    bill = {},
    rewards = {},
    username = "",
    expectedDeliveryDate = "",
    actualDeliveryDate = null,
  } = receipt;

  const rewardsEarned = Number(rewards?.earned || 0);
  const rewardsUsed = Number(rewards?.used || 0);

  const deliveryDate =
    actualDeliveryDate ||
    expectedDeliveryDate ||
    receipt?.deliveryDate ||
    "";
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={["rgba(62,182,85,0.7)", "rgba(255,255,255,0.7)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.container}
      >
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.deliveryDate}>Arriving {deliveryDate}</Text>

            {/* Products */}
            {items?.map((item: any, idx: number) => (
              <ProductRow
                key={`${item.product_name}-${idx}`}
                name={item.product_name}
                image={item.image}
                qty={item.quantity}
                price={item.final_price || item.price}
                originalPrice={item.price}
                rewardDiscount={item.reward_discount}
              />
            ))}

            {/* Address */}
            <View style={styles.addressSection}>
              <MaterialIcons name="location-on" size={22} color="#6B7280" style={styles.locIcon} />
              <View>
                <Text style={styles.addressName}>Delivering to {username}</Text>
                <Text style={styles.addressText}>
                  {[
                    address?.line1,
                    address?.line2,
                    address?.city,
                    address?.state,
                    address?.zipcode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
            </View>

            {/* Bill */}
            <View style={styles.billBox}>
              <View style={styles.rewardBanner}>
                <MaterialCommunityIcons name="star-four-points" size={18} color="#7A63FF" />
                <Text style={styles.rewardBannerText}>You earned {rewardsEarned} reward coins</Text>
                <MaterialCommunityIcons name="star-four-points" size={18} color="#7A63FF" />
              </View>

              <View style={styles.billContent}>
                <Text style={styles.billTitle}>Bill Details</Text>

                <Row label="Item Total" value={`₹${Number(bill.item_total || 0)}`} />
                <Row label="Delivery Fee" value={`₹${Number(bill.delivery_fee || 0)}`} />
                <Row label="Bag Discount" value={`-₹${Number(bill.bag_discount || 0)}`} color="#22C55E" />
                <Row label="Reward Discount" value={`-₹${Number(bill.reward_discount || 0)}`} color="#22C55E" />
                {rewardsUsed > 0 && (
                  <Row label="Rewards Used" value={`${rewardsUsed} coins`} color="#7A63FF" />
                )}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Order Total</Text>
                  <Text style={styles.totalValue}>₹{Number(bill.order_total || 0)}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.noteText}>
              <Text style={styles.noteBold}>Note:</Text> Reward coins will be credited to your wallet
              within 24 hours after your order is delivered.
            </Text>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

interface ProductRowProps {
  name: string;
  image: string;
  qty: number;
  price: number;
  originalPrice?: number;
  rewardDiscount?: number;
}

const ProductRow = ({
  name,
  image,
  qty,
  price,
  originalPrice,
  rewardDiscount,
}: ProductRowProps) => (
  <View style={styles.productCard}>
    <Image
      source={{ uri: getProductImageUrl(image) }}
      style={styles.productImage}
    />

    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>
        {name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.newPrice}>₹{Number(price || 0)}</Text>

        {originalPrice && Number(originalPrice) > Number(price) ? (
          <Text style={styles.oldPrice}>₹{Number(originalPrice)}</Text>
        ) : null}

        <Text style={styles.qty}>× {Number(qty || 1)}</Text>
      </View>

      {rewardDiscount && Number(rewardDiscount) > 0 ? (
        <Text style={styles.rewardSave}>
          Saved ₹{Number(rewardDiscount)} using rewards
        </Text>
      ) : null}
    </View>
  </View>
);

interface RowProps {
  label: string;
  value: string;
  color?: string;
}

const Row = ({ label, value, color = "#333" }: RowProps) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  sheet: {
    flex: 1,
    marginTop: Platform.OS === "ios" ? 70 : 60,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: 14,
  },
  scrollContent: { paddingBottom: 40 },
  deliveryDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
    textAlign: "center",
    marginBottom: 18,
  },
  productCard: {
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F1F1",
    borderRadius: 14,
    marginBottom: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 13, fontWeight: "600", color: "#111", marginBottom: 6 },
  priceRow: { flexDirection: "row", alignItems: "center" },
  newPrice: { fontSize: 13, fontWeight: "700", color: "#111", marginRight: 6 },
  qty: {
    marginLeft: 6,
    fontSize: 12,
    color: "#6B7280",
  },
  addressSection: {
    flexDirection: "row",
    marginVertical: 18,
  },
  locIcon: { marginRight: 8, marginTop: 2 },
  addressName: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 4 },
  addressText: { fontSize: 12, color: "#6B7280", lineHeight: 18 },
  billBox: {
    borderWidth: 1,
    borderColor: "#F1F1F1",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
  },
  rewardBanner: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rewardBannerText: {
    color: "#7A63FF",
    fontWeight: "600",
    fontSize: 13,
    marginHorizontal: 10,
  },
  billContent: { padding: 15 },
  billTitle: { fontSize: 15, fontWeight: "700", marginBottom: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  rowLabel: { fontSize: 13, color: "#6B7280" },
  rowValue: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#F1F1F1", marginVertical: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#111" },
  totalValue: { fontSize: 15, fontWeight: "700", color: "#111" },
  noteText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    paddingHorizontal: 5,
  },
  noteBold: {
    fontWeight: "700",
  },
  oldPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },

  rewardSave: {
    marginTop: 6,
    fontSize: 11,
    color: "#22C55E",
    fontWeight: "600",
  },
});