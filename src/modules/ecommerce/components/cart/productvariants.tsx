import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { getProductImageUrl } from "../../api/ProductApi";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Props = {
  attributes: Record<string, string[]>;
  selectedAttrs: Record<string, string>;
  variants: any[];
  onChange: (key: string, value: string) => void;
};

const isVisible = (variant: any) =>
  variant?.is_visible === undefined ||
  variant?.is_visible === null ||
  [true, 1, "1", "true"].includes(variant.is_visible);

const isAvailable = (variant: any) =>
  Boolean(variant) && isVisible(variant) && Number(variant?.stock) > 0;

const COLOR_MAP: Record<string, string> = {
  black: "#111111", white: "#FFFFFF", red: "#EF4444", blue: "#3B82F6",
  green: "#22C55E", yellow: "#FACC15", orange: "#F97316", purple: "#8B5CF6",
  pink: "#EC4899", grey: "#9CA3AF", gray: "#9CA3AF", brown: "#92400E",
  navy: "#1E3A8A", beige: "#D6C6A5", gold: "#D4AF37", silver: "#C0C0C0",
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

  const findAvailableVariantForOption = (attrKey: string, value: string) =>
    variantList.find(
      (variant) =>
        variant?.variant_attributes?.[attrKey] === value && isAvailable(variant)
    );

  return (
    <View style={styles.container}>
      {attrEntries.map(([attrKey, rawValues]) => {
        const values = Array.isArray(rawValues) ? rawValues : [];
        const selectedValue = selectedAttrs[attrKey];
        const sectionTitle = labelize(attrKey);
        const isColorAttr = attrKey.toLowerCase().includes("color");

        return (
          <View key={attrKey} style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={[styles.label, { color: theme.text }]}>{sectionTitle}</Text>
              <Text style={[styles.value, { color: theme.secondaryText }]}>{selectedValue || "Select"}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.variantRow}
            >
              {values.map((value) => {
                const variant = findVariantForOption(attrKey, value);
                const availableVariant = findAvailableVariantForOption(attrKey, value);
                const variantsForValue = variantList.filter(
                  (item) => item?.variant_attributes?.[attrKey] === value && isVisible(item)
                );
                const variantWithImage = variantList.find(
                  (item) =>
                    item?.variant_attributes?.[attrKey] === value &&
                    Array.isArray(item?.images) &&
                    item.images.length > 0
                );
                const isSelected = selectedValue === value;
                const isUnavailable = variantsForValue.length === 0;
                const isOutOfStock = !isUnavailable && !availableVariant;
                const disabled = isUnavailable || isOutOfStock;
                const displayVariant =
                  (variant && isAvailable(variant) ? variant : null) ||
                  availableVariant ||
                  variantWithImage;
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
                        backgroundColor: isDark ? "#2E1065" : "#F5F3FF",
                        borderColor: "#7C3AED",
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
                      <View style={styles.imageWrap}>
                        <Image source={{ uri: colorImageUrl }} style={styles.colorImage} />
                        {isSelected ? (
                          <View style={styles.imageCheck}>
                            <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </View>
                    ) : isColorAttr ? (
                      <View style={styles.imageWrap}>
                        <View
                          style={[
                            styles.colorSwatch,
                            {
                              backgroundColor: COLOR_MAP[value.trim().toLowerCase()] || theme.border,
                              borderColor: value.trim().toLowerCase() === "white" ? "#D1D5DB" : "transparent",
                            },
                          ]}
                        />
                        {isSelected ? (
                          <View style={styles.imageCheck}>
                            <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {isColorAttr && displayVariant ? (
                      <View style={styles.variantPriceRow}>
                        <Text style={[styles.variantPrice, { color: theme.text }]}>
                          ₹{Number(displayVariant.sale_price || 0).toLocaleString("en-IN")}
                        </Text>
                        {Number(displayVariant.mrp) > Number(displayVariant.sale_price) ? (
                          <Text style={[styles.variantMrp, { color: theme.secondaryText }]}>
                            ₹{Number(displayVariant.mrp).toLocaleString("en-IN")}
                          </Text>
                        ) : null}
                      </View>
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

                    {!isColorAttr && isSelected ? (
                      <MaterialCommunityIcons name="check-circle" size={16} color="#7C3AED" style={styles.optionCheck} />
                    ) : null}

                    {isOutOfStock ? (
                      <Text style={styles.metaText}>Out of stock</Text>
                    ) : isUnavailable ? (
                      <Text style={styles.metaText}>Unavailable</Text>
                    ) : !variant && !isSelected ? (
                      <Text style={styles.availableMetaText}>Available</Text>
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

  section: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  label: { fontSize: 13, fontWeight: "800", color: "#111827" },
  value: { fontSize: 12, fontWeight: "700" },

  variantRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 13,
    paddingRight: 4,
    paddingBottom: 2,
  },

  optionChip: {
    minWidth: 76,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  optionChipActive: {
    borderColor: "#7C3AED",
    borderWidth: 2,
    backgroundColor: "#F5F3FF",
  },

  optionChipDisabled: {
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
  },

  colorCard: {
    width: 74,
    minHeight: 104,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  colorCardActive: {
    borderColor: "#7C3AED",
    borderWidth: 2,
  },

  colorCardDisabled: {
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    backgroundColor: "#F3F4F6",
  },

  imageWrap: { position: "relative", marginBottom: 5 },

  colorImage: {
    width: 58,
    height: 52,
    borderRadius: 7,
    resizeMode: "cover",
  },
  colorSwatch: {
    width: 58,
    height: 52,
    borderRadius: 7,
    borderWidth: 1,
  },

  imageCheck: {
    position: "absolute",
    right: -5,
    top: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  optionTextActive: {
    color: "#6D28D9",
  },

  variantPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 3,
  },
  variantPrice: {
    fontSize: 11,
    fontWeight: "900",
  },
  variantMrp: {
    fontSize: 9,
    fontWeight: "500",
    textDecorationLine: "line-through",
  },

  optionCheck: { position: "absolute", right: 4, top: 4 },

  optionTextDisabled: {
    color: "#9CA3AF",
  },

  metaText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#EF4444",
  },

  availableMetaText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#16A34A",
  },

});
