import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
// import RewardIcon from "../../../../assets/product/rewards.svg";
import { prefetchCartScreenData } from "../../navigation/navigationPerformance";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;

type Props = {
  offPercent: string;
  price: string;          // sale price
  mrp: string;
  pointsPrice?: string | number;
  points: number;
  qty: number;
  stock: number | null;
  inStock: boolean;
  onQtyChange: (v: number) => void;
  onAddToCart: () => void;
  onBuyNow?: () => void;
  isAdding?: boolean;
  isInCart?: boolean;
};

export default function BuySection({
  offPercent,
  price,
  mrp,
  points,
  qty,
  stock,
  inStock,
  onQtyChange,
  onAddToCart,
  onBuyNow,
  isAdding = false,
  isInCart = false,
}: Props) {
  const navigation = useNavigation<Nav>();
  const { isDark, theme } = useAppTheme();
  const [open, setOpen] = React.useState(false);

  const maxQty =
    stock !== null && Number.isFinite(stock)
      ? Math.max(0, Math.min(stock, 10))
      : 10;
  const quantities = Array.from({ length: maxQty }, (_, i) => i + 1);
  const cartButtonTextColor = isDark ? "#FACC15" : "#111827";

  const handleGoToCart = () => {
    if (!inStock) return;
    setOpen(false);
    // If an onBuyNow callback is provided (product page), prefer buy-now flow
    if (onBuyNow) {
      onBuyNow();
    } else {
      prefetchCartScreenData().catch(() => {
        // Ignore prefetch errors and continue navigation.
      });
      navigation.navigate("Cart");
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.dividerFull, { backgroundColor: theme.border }]} />

      <View style={styles.buyWrap}>
        {/* Secure pill */}
        <LinearGradient
          colors={["#A654CD", "#FC8BAD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.securePill}
        >
          <MaterialCommunityIcons name="shield-check" size={14} color="#4CAF50"
            style={styles.secureIcon} />
          <Text style={styles.secureText}>RP Secure Delivery</Text>
        </LinearGradient>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.offText}>{offPercent}</Text>
          <Text style={[styles.priceText, { color: theme.text }]}>{price}</Text>
        </View>

        <Text style={[styles.mrpText, { color: theme.secondaryText }]}>
          MRP: <Text style={styles.mrpStrike}>{mrp}</Text>
        </Text>

        {/* Quantity */}
        <View style={styles.qtyWrap}>
          <TouchableOpacity
            style={[styles.qtyBox, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.85}
            disabled={!inStock}
            onPress={() => setOpen(o => !o)}
          >
            <Text style={[styles.qtyText, { color: theme.text }]}>Qty: {qty}</Text>
            <MaterialIcons
              name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={22}
              color={theme.secondaryText}
            />
          </TouchableOpacity>

          {open && inStock && (
            <View style={[styles.qtyDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {quantities.map(n => (
                <TouchableOpacity
                  key={n}
                  onPress={() => {
                    onQtyChange(n);
                    setOpen(false);
                  }}
                  style={styles.qtyItem}
                >
                  <Text style={[
                    styles.qtyItemText,
                    { color: theme.text },
                    n === qty && styles.qtyItemTextActive,
                  ]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {stock !== null && stock > 0 && stock <= 5 && inStock && (
          <Text style={styles.lowStockText}>Only {stock} left in stock!</Text>
        )}

        {!inStock && <Text style={styles.outStockText}>Out of stock</Text>}

        {/* Add to Cart / Go to Cart */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!inStock || isAdding}
          onPress={onAddToCart}
          style={(!inStock || isAdding) && styles.disabledInner}
        >
          <LinearGradient
            colors={["#FACC15", "#111827"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.outlineButtonBorder}
          >
            <View style={[styles.outlineButtonInner, { backgroundColor: theme.card }]}>
              {isAdding ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color={cartButtonTextColor} />
                  <Text style={[styles.addToCartText, { color: cartButtonTextColor }]}>Adding...</Text>
                </View>
              ) : (
                <Text style={[styles.addToCartText, { color: cartButtonTextColor }]}>
                  {isInCart ? "Go to Cart" : "Add to Cart"}
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Buy Now */}


        {/* Go to Cart */}
        <TouchableOpacity activeOpacity={0.9} style={styles.wrapper} onPress={handleGoToCart}>
          <LinearGradient
            colors={["#8665FF", "#5B47A3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.container}
          >
            <View style={styles.row}>
              <Text style={styles.buyNowText}>Buy Now</Text>
              {points > 0 ? <Text style={styles.pointsText}>+{points}</Text> : null}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  dividerFull: { height: 1, backgroundColor: "rgba(0,0,0,0.12)" },
  buyWrap: { paddingHorizontal: 14, paddingTop: 12 },

  securePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
  },
  secureIcon: { marginLeft: 4 },
  secureText: {
    fontSize: 12, fontWeight: "700", color: "#FFFFFF", paddingHorizontal: 10,
    paddingVertical: 6,
  },

  priceRow: { marginTop: 12, flexDirection: "row", alignItems: "flex-end", gap: 10 },
  offText: { fontSize: 16, fontWeight: "800", color: "#E11D48" },
  priceText: { fontSize: 26, fontWeight: "900", color: "#111" },

  mrpText: { marginTop: 4, fontSize: 12, color: "#666" },
  mrpStrike: { textDecorationLine: "line-through", color: "#666" },

  qtyWrap: { position: "relative", alignSelf: "flex-start" },

  qtyBox: {
    marginTop: 12,
    height: 36,
    minWidth: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "flex-start",
  },

  qtyDropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    width: 90,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 50,
  },

  qtyItem: { height: 34, justifyContent: "center", alignItems: "center" },

  qtyItemText: { fontSize: 13, fontWeight: "700", color: "#333" },
  qtyItemTextActive: { color: "#7B3FF2", fontWeight: "900" },

  outlineButtonBorder: { marginTop: 12, marginBottom: 12, height: 48, borderRadius: 10, padding: 1.5, alignSelf: "stretch" },
  outlineButtonInner: { flex: 1, borderRadius: 8.5, justifyContent: "center", alignItems: "center" },

  addToCartText: { fontSize: 14, fontWeight: "800", color: "#7B3FF2" },
  disabledInner: { opacity: 0.5 },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buyNowMargin: { marginTop: 10 },
  buyNowText: { color: '#FFF', fontSize: 14, fontWeight: "800" },
  qtyText: { fontSize: 13, fontWeight: "700", color: "#333" },

  lowStockText: { marginTop: 6, fontSize: 12, color: "#E11D48", fontWeight: "700" },
  outStockText: { marginTop: 6, fontSize: 12, color: "#E11D48", fontWeight: "800" },

  wrapper: { marginTop: 0 },

  container: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  row: { flexDirection: "row", alignItems: "center", gap: 6 },

  buttonPriceText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  pointsText: { fontSize: 14, fontWeight: "800", color: "#FFD966" },
});
