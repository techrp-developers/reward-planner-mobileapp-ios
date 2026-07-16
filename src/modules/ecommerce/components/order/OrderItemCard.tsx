import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

type Props = {
  image: string | React.ReactNode;
  status: string;
  statusColor: string;
  brand: string;
  title: string;
  rating?: number;
  price: string | number;
  rewardEarned?: number;
  orderRef?: string;
  orderedOn?: string;
  itemCount?: number;
  actionText: string;
  courierName?: string;
  awbNumber?: string;
  logisticsStatus?: string;
  onPress?: () => void;
};

export default function OrderItemCard({
  image,
  status,
  statusColor,
  brand,
  title,
  rating,
  price,
  rewardEarned,
  orderRef,
  orderedOn,
  itemCount,
  actionText,
  courierName,
  awbNumber,
  logisticsStatus,
  onPress,
}: Props) {
  const navigation = useNavigation<Nav>();

  const handleOpenOrders = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("OrderConfirmedScreen");
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleOpenOrders}>
      <View style={styles.card}>
        {/* Left Image */}
        {typeof image === "string" ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          image
        )}

        {/* Center Content */}
        <View style={styles.center}>
          <Text style={[styles.status, { color: statusColor }]}>
            {status.toUpperCase()}
          </Text>

          <View style={styles.textContainer}>
            <Text style={styles.brandText} numberOfLines={1}>
              {brand || "Brand"}
            </Text>
            <Text style={styles.productText} numberOfLines={1}>
              {title || "Product"}
            </Text>
          </View>

          {(orderRef || orderedOn || itemCount) ? (
            <View style={styles.metaWrap}>
              {orderRef ? (
                <Text style={styles.metaText} numberOfLines={1}>
                  Order ID: {orderRef}
                </Text>
              ) : null}
              {(orderedOn || itemCount) ? (
                <Text style={styles.metaText} numberOfLines={1}>
                  {[orderedOn, itemCount ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : ""]
                    .filter(Boolean)
                    .join(" | ")}
                </Text>
              ) : null}
            </View>
          ) : rating ? (
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <MaterialIcons
                  key={i}
                  name={i < rating ? "star" : "star-border"}
                  size={16}
                  color="#EC4899"
                />
              ))}
            </View>
          ) : null}

          <Text style={styles.action}>{actionText}</Text>

          {(courierName || awbNumber || logisticsStatus) ? (
            <View style={styles.logisticsWrap}>
              {logisticsStatus ? (
                <Text style={styles.logisticsText} numberOfLines={1}>
                  Status: {logisticsStatus}
                </Text>
              ) : null}
              {courierName ? (
                <Text style={styles.logisticsText} numberOfLines={1}>
                  Courier: {courierName}
                </Text>
              ) : null}
              {awbNumber ? (
                <Text style={styles.logisticsText} numberOfLines={1}>
                  AWB: {awbNumber}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Right Side */}
        <View style={styles.right}>
          <View style={styles.pointsRow}>
            <Text style={styles.points}>₹{price}</Text>
            {rewardEarned && rewardEarned > 0 ? (
              <Text style={styles.rewardText}>+{rewardEarned} Coins</Text>
            ) : null}
          </View>

          <MaterialIcons name="chevron-right" size={26} color="#9CA3AF" />
        </View>
      </View>

      <View style={styles.divider} />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 14,
    backgroundColor: "#fff",
  },

  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: "contain",
  },

  center: {
    flex: 1,
  },

  status: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  textContainer: {
    marginBottom: 4,
    flexDirection: "row",
    gap: 5

  },
  brandText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  productText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },

  ratingRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  metaWrap: {
    marginBottom: 4,
    gap: 2,
  },

  metaText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  action: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
  },
  logisticsWrap: {
    marginTop: 4,
    gap: 2,
  },
  logisticsText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginLeft: 8,
  },

  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  points: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
  },

  rewardText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EC4899",
    marginLeft: 8,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginLeft: 82,
  },
});
