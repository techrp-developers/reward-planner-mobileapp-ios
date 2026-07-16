import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  addressType?: string;
  address: string;
  name: string;
  phone: string;
};

export default function DeliveryDetailsCard({
  addressType = "HOME",
  address,
  name,
  phone,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {/* Section Title */}
      <Text style={styles.sectionTitle}>Delivery Details</Text>

      {/* Card */}
      <View style={styles.card}>
        {/* Address Row */}
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color="#A855F7"
            style={styles.icon}
          />
          <Text style={styles.addressText}>
            <Text style={styles.addressType}>{addressType} – </Text>
            {address}
          </Text>
        </View>

        {/* Name Row */}
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="account-circle"
            size={20}
            color="#A855F7"
            style={styles.icon}
          />
          <Text style={styles.userText}>{name}</Text>
        </View>

        {/* Phone Row */}
        <View style={[styles.row, styles.lastRow]}>
          <MaterialCommunityIcons
            name="phone-outline"
            size={20}
            color="#A855F7"
            style={styles.icon}
          />
          <Text style={styles.userText}>{phone}</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  lastRow: { marginBottom: 0 },

  icon: {
    marginRight: 10,
    marginTop: 2,
  },

  addressText: {
    flex: 1,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },

  addressType: {
    fontWeight: "600",
    color: "#374151",
  },

  userText: {
    fontSize: 13,
    color: "#4B5563",
  },
});
