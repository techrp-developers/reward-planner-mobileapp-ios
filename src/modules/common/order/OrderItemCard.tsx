import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  image: React.ReactNode; // SVG or Image
  title: string;
  weight: string;
  orderId: string;
};

export default function OrderItemCard({
  image,
  title,
  weight,
  orderId,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.imageWrap}>{image}</View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.weight}>{weight}</Text>

        <View style={styles.orderRow}>
          <Text style={styles.orderText}>Order ID - #{orderId}</Text>

          {/* UI-only copy icon */}
          <TouchableOpacity style={styles.copyBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="content-copy"
              size={16}
              color="#4F46E5"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  imageWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  info: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 18,
  },

  weight: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    marginBottom: 6,
  },

  orderRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  orderText: {
    fontSize: 12,
    color: "#6B7280",
    marginRight: 6,
  },

  copyBtn: {
    padding: 4,
  },
});
