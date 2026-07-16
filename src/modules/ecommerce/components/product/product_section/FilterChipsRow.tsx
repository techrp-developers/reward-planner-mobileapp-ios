import React, { useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

type Chip = {
  id: string;
  label: string;
  icon?: string;
  query?: string;
};

export default function FilterChipsRow({
  onSelect,
}: {
  onSelect?: (chip: Chip) => void;
}) {

  const chips = useMemo<Chip[]>(() => [
    { id: "filter", label: "", icon: "tune" },

    { id: "rating", label: "4+ Stars", icon: "star", query: "ratingMin=4" },

    { id: "new", label: "New Arrivals", query: "sortBy=created_at&sortOrder=DESC" },

    { id: "under499", label: "Under ₹499", query: "priceMax=499" },

    { id: "499-1000", label: "₹499 - ₹1000", query: "priceMin=499&priceMax=1000" },

    { id: "1000-1500", label: "₹1000 - ₹1500", query: "priceMin=1000&priceMax=1500" },

    { id: "1500-2000", label: "₹1500 - ₹2000", query: "priceMin=1500&priceMax=2000" },

    { id: "2000-3000", label: "₹2000 - ₹3000", query: "priceMin=2000&priceMax=3000" },

    { id: "over3000", label: "Over ₹3000", query: "priceMin=3000" },
  ], []);

  const [activeId, setActiveId] = useState<string>("");

  return (
    <View style={styles.wrap}>
      <FlatList
        data={chips}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {

          const active = item.id === activeId;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setActiveId(item.id);
                onSelect?.(item);
              }}
            >

              {item.icon && (
                <MaterialIcons name={item.icon as any} size={18} color="#111827" />
              )}

              {item.label !== "" && (
                <Text style={styles.chipText}>{item.label}</Text>
              )}

              {item.id === "rating" && (
                <MaterialIcons name="star" size={18} color="#F59E0B" />
              )}

            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "#fff" },

  list: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
    backgroundColor: "#fff",
    marginRight: 10,
  },

  chipActive: {
    borderColor: "#000",
  },

  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
});