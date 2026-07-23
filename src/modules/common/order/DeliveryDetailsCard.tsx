import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../../../theme/ThemeContext";

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
  const { theme } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      {/* Section Title */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Details</Text>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Address Row */}
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={theme.primary}
            style={styles.icon}
          />
          <Text style={[styles.addressText, { color: theme.secondaryText }]}>
            <Text style={[styles.addressType, { color: theme.text }]}>{addressType} – </Text>
            {address}
          </Text>
        </View>

        {/* Name Row */}
        <View style={styles.row}>
          <MaterialCommunityIcons
            name="account-circle"
            size={20}
            color={theme.primary}
            style={styles.icon}
          />
          <Text style={[styles.userText, { color: theme.secondaryText }]}>{name}</Text>
        </View>

        {/* Phone Row */}
        <View style={[styles.row, styles.lastRow]}>
          <MaterialCommunityIcons
            name="phone-outline"
            size={20}
            color={theme.primary}
            style={styles.icon}
          />
          <Text style={[styles.userText, { color: theme.secondaryText }]}>{phone}</Text>
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
