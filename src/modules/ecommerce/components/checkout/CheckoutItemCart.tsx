import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { getProductImageUrl } from "../../api/ProductApi";

type Props = {
  item: any;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onPress?: () => void;
};

// API fields: price = sale price, mrp = original price
const toNum = (v: any) => Number(String(v ?? "0").replace(/[^\d.]/g, "")) || 0;

const formatDeliveryDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const getFallbackDeliveryDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export default function CheckoutItemCart({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onPress,
}: Props) {
  // Delivery date: use API value if available, fallback to +5 days
  const deliveryText = useMemo(() => {
    const formatted = formatDeliveryDate(item?.estimated_delivery_date);
    return `Delivery by ${formatted ?? getFallbackDeliveryDate()}`;
  }, [item?.estimated_delivery_date]);

  // Return/replace policy from API
  const isReturnable = item?.is_returnable === 1 || item?.is_returnable === true;
  const isReplaceable = item?.is_replaceable === 1 || item?.is_replaceable === true;
  const returnWindow = item?.return_window; // e.g. 7, 10, null

  const returnPolicyText = useMemo(() => {
    if (isReturnable && returnWindow) return `${returnWindow} Days Returnable`;
    if (isReturnable) return "Returnable";
    if (isReplaceable) return "Replacement Only";
    return "Non-Returnable";
  }, [isReturnable, isReplaceable, returnWindow]);

  const returnPolicyColor = useMemo(() => {
    if (isReturnable) return "#3B82F6";   // blue
    if (isReplaceable) return "#F59E0B";  // amber
    return "#EF4444";                     // red
  }, [isReturnable, isReplaceable]);

  // price = discounted sale price, mrp = original price
  const salePrice = toNum(item.price || item.sale_price);
  const mrp = toNum(item.mrp);
  const discountPct =
    mrp > salePrice && mrp > 0
      ? Math.round(((mrp - salePrice) / mrp) * 100)
      : 0;

  const productTitle =
    item?.product_name ||
    item?.title ||
    item?.name ||
    item?.product?.name ||
    item?.product?.title ||
    "Product";

  const productSubtitle =
    item?.variant_name ||
    item?.variant?.name ||
    item?.category_name ||
    "";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>

        {/* Left: image + qty stepper */}
        <TouchableOpacity style={styles.leftCol} activeOpacity={0.85} onPress={onPress}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: getProductImageUrl(item.image) }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
          <View style={styles.qtyPill}>
            <TouchableOpacity onPress={onDecrease} style={styles.qtyBtn}>
              <Text style={styles.qtySymbol}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity || 1}</Text>
            <TouchableOpacity onPress={onIncrease} style={styles.qtyBtn}>
              <Text style={styles.qtySymbol}>+</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Right: product info */}
        <TouchableOpacity style={styles.info} activeOpacity={0.85} onPress={onPress}>
          <Text style={styles.title} numberOfLines={2}>{productTitle}</Text>
          {!!productSubtitle && (
            <Text style={styles.subTitle} numberOfLines={1}>{productSubtitle}</Text>
          )}

          {/* Price — sale price + strikethrough MRP + discount badge */}
          <View style={styles.priceRow}>
            <Text style={styles.salePrice}>₹{salePrice.toLocaleString("en-IN")}</Text>
            {discountPct > 0 && (
              <>
                <Text style={styles.mrpText}>₹{mrp.toLocaleString("en-IN")}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPct}% off</Text>
                </View>
              </>
            )}
          </View>

          {/* Delivery date */}
          <View style={styles.deliveryRow}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={14} color="#16A34A" />
            <Text style={styles.delivery}>{deliveryText}</Text>
          </View>

          {/* Return/Replace policy — dynamic from API */}
          <Text style={[styles.returnText, { color: returnPolicyColor }]}>
            {returnPolicyText}
          </Text>
        </TouchableOpacity>

        {/* Close button */}
        <TouchableOpacity
          onPress={onRemove}
          style={styles.closeBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <MaterialCommunityIcons name="close" size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 0,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#F0F0F5",
    // elevation: 2,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.06,
    // shadowRadius: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftCol: {
    alignItems: "center",
    marginRight: 12,
  },
  imageWrapper: {
    width: 86,
    height: 86,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: 76,
    height: 76,
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  qtySymbol: { fontSize: 17, color: "#374151", fontWeight: "600" },
  qtyValue: {
    width: 28,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  info: {
    flex: 1,
    paddingRight: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  salePrice: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  mrpText: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  delivery: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "500",
  },
  returnText: {
    fontSize: 12,
    fontWeight: "500",
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
});