import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

import Product from "../../../assets/sampleImages/Product.svg";
import Service from "../../../assets/sampleImages/Service.svg";
import Payment from "../../../assets/sampleImages/Payment.svg";
import DineOut from "../../../assets/sampleImages/DineOut.svg";
import Bus_Booking from "../../../assets/sampleImages/Bus_Booking.svg";
import Expence_Tracking from "../../../assets/sampleImages/Expence_Tracking.svg";
import Community from "../../../assets/sampleImages/Community.svg";
import OrderHeading from "../constants/heading/OrderHeading";

export default function Explore() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const numColumns = 3;
  const gap = 14;
  const padding = 16;

  const cardSize =
    (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  const navigateToModule = useCallback((moduleName: string) => {
    // Use a small delay to ensure smooth navigation
    const timer = setTimeout(() => {
      try {
        if (moduleName === "Product") {
          // Navigate to Home explicitly
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        } else if (moduleName === "StepCount") {
          const parentNavigation = navigation.getParent?.();
          parentNavigation?.navigate?.("StepCount");
        } else if (moduleName === "Services") {
          // Navigate to ComingSoon with Services module
          navigation.navigate("ComingSoon", { moduleName: "Services" });
        } else {
          // All other modules go to ComingSoon
          navigation.navigate("ComingSoon", { moduleName });
        }
      } catch (error) {
        console.warn("Navigation error:", error);
        // Fallback: try parent navigation
        try {
          const parentNav = navigation.getParent?.();
          if (moduleName === "Product") {
            parentNav?.reset?.({
              index: 0,
              routes: [{ name: "Home" }],
            });
          } else if (moduleName === "StepCount") {
            parentNav?.navigate?.("StepCount");
          } else {
            parentNav?.navigate?.("ComingSoon", { moduleName });
          }
        } catch (fallbackError) {
          console.warn("Fallback navigation error:", fallbackError);
        }
      }
    }, 50); // 50ms delay for smooth transition

    return () => clearTimeout(timer);
  }, [navigation]);

  const DATA = [
    { title: "Product", Icon: Product, module: "Product" },
    { title: "Services", Icon: Service, module: "Services" },
    { title: "Payments", Icon: Payment, module: "Payments" },
    { title: "Dine Out", Icon: DineOut, module: "DineOut" },
    { title: "Bus Booking", Icon: Bus_Booking, module: "Bus Booking" },
    { title: "Expense Track", Icon: Expence_Tracking, module: "Expense Tracking" },
    { title: "Community", Icon: Community, module: "Community" },
  ];

  return (
    <View style={styles.container}>
      <OrderHeading
        title="Explore"
        onBackPress={() => navigation.goBack()}
      />

      <View style={[styles.grid, { paddingHorizontal: padding }]}>
        {DATA.map((item, index) => {
          const isLastColumn = (index + 1) % numColumns === 0;
          const marginRight = isLastColumn ? 0 : gap;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              onPress={() => navigateToModule(item.module)}
              style={[
                styles.card,
                {
                  width: cardSize,
                  marginRight,
                  marginBottom: gap,
                },
              ]}
            >
              <item.Icon width={36} height={36} />

              <Text style={styles.label}>{item.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

  
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },

  card: {
    height: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  label: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },


  //button 
  healthButton: {
    marginTop: 16,
  },

  healthButtonContent: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#8665FF",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 20,
  },

  healthButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

});
