import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { fetchAllAddress } from "../../api/AddressApi";
import { addressesQueryKey } from "../../navigation/navigationPerformance";
import type { HomeStackParamList } from "../../navigation/types";
import { useAuth } from "../../../common/auth/context/AuthContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

type AddressItem = {
  address_id?: number;
  is_default?: number | boolean;
  contact_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

type DeliverySectionProps = {
  delivery_sla_min_days?: number;
  delivery_sla_max_days?: number;
  is_returnable?: number | boolean;
  is_replaceable?: number | boolean;
  return_window_days?: number;
  shipping_class?: string;
};

export default function DeliverySection(props: DeliverySectionProps) {
  const navigation = useNavigation<Nav>();
  const { isAuthenticated, user } = useAuth();

  const displayName = user?.name || (isAuthenticated ? "User" : "Guest");

  const { data: addressData } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const addresses: AddressItem[] = Array.isArray(addressData?.data) ? addressData.data : [];
  const selected = addresses.find((item) => Number(item?.is_default) === 1) ?? addresses[0];
  const displayAddress = selected
    ? [selected.address1, selected.address2, selected.city, selected.state, selected.zipcode]
        .map((p) => String(p || "").trim())
        .filter(Boolean)
        .join(", ") || "Address not set"
    : "Address not set";

  // ── Computed display values ──────────────────────────────────────────────────
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + (props.delivery_sla_min_days ?? 3));
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + (props.delivery_sla_max_days ?? 7));

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const deliveryText = `${fmt(minDate)} – ${fmt(maxDate)}`;



  const rawShipping = props.shipping_class ?? "standard";
  const shippingText =
    rawShipping.charAt(0).toUpperCase() + rawShipping.slice(1) + " Shipping";

  return (
    <View style={styles.card}>
      {/* Row 1 — Address */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.row}
        onPress={() => navigation.navigate("AddressSelect")}
      >
        <View style={[styles.iconBox, styles.iconBoxIndigo]}>
          <MaterialCommunityIcons name="map-marker-outline" size={22} color="#6366F1" />
        </View>

        <View style={styles.mid}>
          <Text style={styles.label}>Deliver to</Text>
          <Text style={styles.bold} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.sub} numberOfLines={1}>{displayAddress}</Text>
        </View>

        <MaterialIcons name="chevron-right" size={22} color="#BDBDBD" />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Row 2 — Delivery date */}
      <View style={styles.row}>
        <View style={[styles.iconBox, styles.iconBoxGreen]}>
          <MaterialCommunityIcons name="truck-fast-outline" size={22} color="#10B981" />
        </View>

        <View style={styles.mid}>
          <Text style={styles.label}>Estimated Delivery</Text>
          <Text style={styles.bold}>{deliveryText}</Text>
        </View>

        <View style={styles.pill}>
          <Text style={styles.pillText}>{shippingText}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Row 3 — Return | Replacement */}
      {/*  */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginHorizontal: 14,
    marginTop: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 0,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  mid: {
    flex: 1,
  },

  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    marginBottom: 1,
  },

  bold: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  sub: {
    fontSize: 12,
    color: "#666",
    marginTop: 1,
  },

  pill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  pillText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#555",
  },

  halfRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#F0F0F0",
  },

  smallIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  halfLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },

  iconBoxIndigo: { backgroundColor: "#EEF2FF" },
  iconBoxGreen:  { backgroundColor: "#ECFDF5" },
  bgGreen:       { backgroundColor: "#ECFDF5" },
  bgIndigo:      { backgroundColor: "#EEF2FF" },
  bgRed:         { backgroundColor: "#FEF2F2" },
  textGreen:     { color: "#10B981" },
  textIndigo:    { color: "#6366F1" },
  textRed:       { color: "#EF4444" },
});
