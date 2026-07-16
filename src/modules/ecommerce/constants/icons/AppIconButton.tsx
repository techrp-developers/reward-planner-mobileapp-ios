import React from "react";
import { TouchableOpacity, StyleSheet, View, Text, ViewStyle } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

type IconType = "back" | "cart" | "filter" | "wishlist" | "search";

const ICON_MAP: Record<IconType, { name: any; size: number }> = {
  back: { name: "arrow-back-ios", size: 18 },
  cart: { name: "shopping-cart", size: 20 },
  filter: { name: "tune", size: 20 },
  wishlist: { name: "favorite-border", size: 20 },
  search: { name: "search", size: 18 },
};

type Props = {
  type: IconType;
  onPress?: () => void;

  color?: string;
  size?: number; // override
  style?: ViewStyle;

  variant?: "solid" | "ghost";
  disabled?: boolean;

  // badge support (cart etc.)
  badgeCount?: number; // if > 0 then badge shows
  showDotBadge?: boolean; // just red dot (like your UI)
};

export default function AppIconButton({
  type,
  onPress,
  color = "#222",
  size,
  style,
  variant = "solid",
  disabled = false,
  badgeCount = 0,
  showDotBadge = false,
}: Props) {
  const cfg = ICON_MAP[type];

  const showBadge = showDotBadge || badgeCount > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === "solid" ? styles.solid : styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      <MaterialIcons name={cfg.name} size={size ?? cfg.size} color={color} />

      {showBadge && (
        <View style={styles.badge}>
          {badgeCount > 0 ? (
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? "99+" : String(badgeCount)}
            </Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  solid: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
});
