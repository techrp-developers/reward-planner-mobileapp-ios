import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import EmptyCartImage from "../../../../assets/product/EmptyCart.svg";
import { useAppTheme } from "../../../../theme/ThemeContext";

const { width } = Dimensions.get("window");

type EmptyCartProps = {
  onBrowse?: () => void;
  message?: string;
};

export default function EmptyCart({ onBrowse, message }: EmptyCartProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <EmptyCartImage width={180} height={180} />

      <Text style={[styles.title, { color: theme.text }]}>Your cart looks a little lonely 🛒</Text>

      <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
        {message ?? "Add a few favourites and watch this space glow up. ✨"}
      </Text>

      <TouchableOpacity activeOpacity={0.9} onPress={onBrowse}>
        <View style={styles.buttonShadow}>
        <LinearGradient
          colors={["#8665FF", "#5B47A3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Browse products</Text>
        </LinearGradient>
        </View>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFF",
  },

  title: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  buttonShadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
      borderRadius: 14,
    },

  button: {
    marginTop: 24,
    height: 48,
    minWidth: width * 0.6,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
