import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";

const OFFERS = [
  {
    code: "RPSLAY200",
    title: "Add ₹248 more to avail this offer",
    subtitle: "Get Flat ₹200 off",
  },
  {
    code: "RPCC200",
    title: "Buy for ₹7777 to avail",
    subtitle: "BOB Credit Card",
  },
  {
    code: "HDFC150",
    title: "Shop ₹1500 & save more",
    subtitle: "HDFC Bank Offer",
  },
];

export default function OffersSection() {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {OFFERS.map((offer, index) => (
          <View key={index} style={styles.offerCard}>
            <LinearGradient
              colors={["#FEF0FF", "#FFFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.pageBg}
            >
              <View style={styles.offerTop}>
                <MaterialCommunityIcons name="tag-outline" size={18} color="#A654CD" />
                <Text style={styles.offerCode}>{offer.code}</Text>
                <Text style={styles.applyText}>APPLY</Text>
              </View>

              <View style={styles.dashedLine} />

              <Text style={styles.offerMain}>{offer.title}</Text>
              <Text style={styles.offerSub}>{offer.subtitle}</Text>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* See all offers */}
      <TouchableOpacity style={styles.seeAllRow} activeOpacity={0.85}>
        <View style={styles.seeAllLeft}>
          <View style={styles.percentIcon}>
            <Text style={styles.percentIconText}>%</Text>
          </View>
          <Text style={styles.seeAllText}>See all offers & discounts</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color="#444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    marginTop: 18,
  },

  carousel: {
    paddingRight: 14,
    alignItems: "center",
  },

  offerCard: {
    width: 240,
    marginRight: 12,
  },

  pageBg: {
    borderWidth: 1,
    borderColor: "#F7AAFF",
    borderRadius: 12,
    padding: 12,
    height: 120,
  },

  offerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  offerCode: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    color: "#6B21A8",
  },

  applyText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#16A34A",
  },

  dashedLine: {
    marginTop: 10,
    marginBottom: 10,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
  },

  offerMain: {
    fontSize: 12,
    fontWeight: "800",
    color: "#444",
  },

  offerSub: {
    marginTop: 4,
    fontSize: 11,
    color: "#777",
  },

  seeAllRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  seeAllLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  percentIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFE7D6",
    justifyContent: "center",
    alignItems: "center",
  },

  percentIconText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#F97316",
    marginTop: -1,
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333",
  },
});
