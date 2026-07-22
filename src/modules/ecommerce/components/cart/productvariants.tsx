import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { getProductImageUrl } from "../../api/ProductApi";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Props = {
  attributes: Record<string, string[]>;
  selectedAttrs: Record<string, string>;
  variants: any[];
  onChange: (key: string, value: string) => void;
};

export default function ProductVariants({
  attributes,
  selectedAttrs,
  variants,
  onChange,
}: Props) {
  const { isDark, theme } = useAppTheme();
  const variantList = Array.isArray(variants) ? variants : [];
  const attrEntries = Object.entries(attributes || {}).sort(([a], [b]) => {
    const aIsSize = a.toLowerCase().includes("size") ? -1 : 0;
    const bIsSize = b.toLowerCase().includes("size") ? -1 : 0;
    return aIsSize - bIsSize;
  });

  const labelize = (key: string) =>
    key
      .replace(/[_-]+/g, " ")
      .replace(/\d+/g, "")
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const findVariantForOption = (attrKey: string, value: string) => {
    const merged = { ...selectedAttrs, [attrKey]: value };

    return variantList.find((variant) =>
      Object.entries(merged).every(
        ([k, v]) => variant?.variant_attributes?.[k] === v
      )
    );
  };

  return (
    <View style={styles.container}>
      {attrEntries.map(([attrKey, rawValues]) => {
        const values = Array.isArray(rawValues) ? rawValues : [];
        const selectedValue = selectedAttrs[attrKey];
        const sectionTitle = labelize(attrKey);
        const isColorAttr = attrKey.toLowerCase().includes("color");

        return (
          <View key={attrKey} style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>
              {sectionTitle}:
              <Text style={[styles.value, { color: theme.text }]}> {selectedValue || "Select"}</Text>
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.variantRow}
            >
              {values.map((value) => {
                const variant = findVariantForOption(attrKey, value);
                const variantWithImage = variantList.find(
                  (item) =>
                    item?.variant_attributes?.[attrKey] === value &&
                    Array.isArray(item?.images) &&
                    item.images.length > 0
                );
                const isSelected = selectedValue === value;
                const isUnavailable = !variant;
                const isOutOfStock = Boolean(variant && Number(variant.stock) <= 0);
                const disabled = isUnavailable || isOutOfStock;
                const colorImagePath = variantWithImage?.images?.[0];
                const colorImageUrl = colorImagePath
                  ? getProductImageUrl(colorImagePath)
                  : "";

                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => !disabled && onChange(attrKey, value)}
                    style={[
                      isColorAttr ? styles.colorCard : styles.optionChip,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                      isSelected && (isColorAttr ? styles.colorCardActive : styles.optionChipActive),
                      isSelected && {
                        backgroundColor: isDark ? "#111827" : "#F9FAFB",
                        borderColor: theme.text,
                      },
                      disabled && (isColorAttr ? styles.colorCardDisabled : styles.optionChipDisabled),
                      disabled && {
                        backgroundColor: isDark ? "#18181B" : "#F3F4F6",
                        borderColor: theme.border,
                      },
                    ]}
                    activeOpacity={disabled ? 1 : 0.85}
                    disabled={disabled}
                  >
                    {isColorAttr && colorImageUrl ? (
                      <Image source={{ uri: colorImageUrl }} style={styles.colorImage} />
                    ) : null}

                    <Text
                      style={[
                        styles.optionText,
                        { color: theme.text },
                        isSelected && styles.optionTextActive,
                        isSelected && { color: isDark ? "#FACC15" : "#111827" },
                        disabled && styles.optionTextDisabled,
                        disabled && { color: isDark ? "#71717A" : "#9CA3AF" },
                      ]}
                      numberOfLines={1}
                    >
                      {value}
                    </Text>

                    {isOutOfStock ? (
                      <Text style={styles.metaText}>Out of stock</Text>
                    ) : isUnavailable ? (
                      <Text style={styles.metaText}>Unavailable</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },

  section: { marginBottom: 20, paddingHorizontal: 14 },

  label: { fontSize: 12, fontWeight: "700", color: "#111827" },
  value: { fontWeight: "900" },

  variantRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },

  optionChip: {
    minWidth: 82,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },

  optionChipActive: {
    borderColor: "#111827",
    backgroundColor: "#F9FAFB",
  },

  optionChipDisabled: {
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
  },

  colorCard: {
    width: 86,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  colorCardActive: {
    borderColor: "#111827",
    borderWidth: 2,
  },

  colorCardDisabled: {
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
  },

  colorImage: {
    width: 46,
    height: 46,
    borderRadius: 8,
    marginBottom: 6,
    resizeMode: "cover",
  },

  optionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  optionTextActive: {
    color: "#111827",
  },

  optionTextDisabled: {
    color: "#9CA3AF",
  },

  metaText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#EF4444",
  },
});
