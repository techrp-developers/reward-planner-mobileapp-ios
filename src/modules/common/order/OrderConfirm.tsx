import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import OrderReceipt from "./OrderReceipt";
import { fetchOrderReceipt } from "../../ecommerce/api/OrderApi";

const { height } = Dimensions.get("window");

export default function OrderConfirmScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { order_id } = route.params;

  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);

  const slideAnim = useRef(new Animated.Value(height)).current;

  /* ---------------- LOAD RECEIPT ---------------- */
  const loadReceipt = useCallback(async () => {
    try {
      const res = await fetchOrderReceipt(order_id);
      if (res?.success) {
        setReceipt(res.receipt);
      }
    } catch (e) {
      console.log("Receipt load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [order_id]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  /* ---------------- RECEIPT SLIDE ANIMATION ---------------- */
  useEffect(() => {
    if (!receipt) return;

    const timer = setTimeout(() => {
      setShowReceipt(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }, 1200);

    return () => clearTimeout(timer);
  }, [receipt, slideAnim]);

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#8665FF" />
      </SafeAreaView>
    );
  }

  /* ---------------- NO RECEIPT CASE ---------------- */
  if (!receipt) {
    return (
      <SafeAreaView style={styles.loaderWrap}>
        <Text style={styles.errorText}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const formattedDate = receipt.orderDate;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={["rgba(62, 182, 85, 0.2)", "rgba(255, 255, 255, 0.2)"]}
        style={styles.bg}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Green check badge */}
            <View style={styles.checkWrap}>
              <LinearGradient
                colors={["#52FF6A", "#0A8F19"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkCircle}
              >
                <MaterialIcons name="check" size={50} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>Order Placed Successfully!</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>Your package is on its way</Text>
            <Text style={styles.subtitle}>
              Sit back and relax we'll update you as it gets {"\n"}
              closer to your doorstep!
            </Text>

            {/* Reward Section */}
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardHeader}>🎉 You earned Reward Coins</Text>

              <Pressable
                onPress={() => navigation.navigate("Home" as never)}
                style={styles.rewardBtnOuter}
              >
                <LinearGradient
                  colors={["#8665FF", "#5B47A3"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.rewardBtn}
                >
                  <Text style={styles.coinIcon}>🪙</Text>
                  <Text style={styles.rewardBtnText}>
                    +{Number(receipt?.rewards?.earned || 462)} Coins added to your wallet
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Order Summary Card */}
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialCommunityIcons
                name="shopping-outline"
                size={20}
                color="#7E69FF"
              />
              <Text style={styles.orderText}>
                Order ID #{receipt.orderId}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  receipt.status === "pending"
                    ? styles.pending
                    : styles.paid,
                ]}
              >
                <Text style={styles.statusText}>
                  {receipt.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </View>

        {/* Slide-up Receipt */}
        {showReceipt && (
          <Animated.View
            style={[
              styles.receiptWrap,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <OrderReceipt orderId={order_id} />
          </Animated.View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#E8F5E9" },
  bg: { flex: 1 },
  container: { flex: 1, justifyContent: "space-between" },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: height * 0.25,
  },
  checkWrap: { marginBottom: 30 },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7E69FF",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 5,
  },
  rewardContainer: {
    marginTop: 60,
    alignItems: "center",
    width: "100%",
  },
  rewardHeader: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    marginBottom: 12,
  },
  rewardBtnOuter: {
    width: "90%",
    borderRadius: 12,
    overflow: "hidden",
  },
  rewardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  coinIcon: { fontSize: 16, marginRight: 8 },
  rewardBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  receiptWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height,
  },
  card: {
    backgroundColor: "#F7F7F7",
    padding: 16,
    borderRadius: 14,
    margin: 20,
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center" },
  orderText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    color: "#333",
  },
  dateText: { fontSize: 12, color: "#666", marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pending: { backgroundColor: "#FFF3CD" },
  paid: { backgroundColor: "#D4EDDA" },
  statusText: { fontSize: 10, fontWeight: "700" },
});