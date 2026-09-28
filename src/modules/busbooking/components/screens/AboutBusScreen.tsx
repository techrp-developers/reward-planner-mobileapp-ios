import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";

export default function AboutBusScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();
  const route = useRoute<RouteProp<BusBookingStackParamList, "AboutBusScreen">>();
  const { bus } = route.params;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#77737B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>About Bus</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.operatorText}>{bus.operator}</Text>
          <Text style={styles.subtitleText}>{bus.subtitle}</Text>

          <View style={styles.routeRow}>
            <Text style={styles.routeText}>{bus.from}</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#3D7CFF" />
            <Text style={styles.routeText}>{bus.to}</Text>
          </View>

          <Text style={styles.aboutText}>{bus.about}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#3B3740",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 38,
  },
  headerSpacer: {
    width: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E2DA",
    padding: 18,
  },
  operatorText: {
    color: "#4A4A50",
    fontSize: 18,
    fontWeight: "700",
  },
  subtitleText: {
    marginTop: 4,
    color: "#8F8F95",
    fontSize: 13,
    fontWeight: "500",
  },
  routeRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeText: {
    flex: 1,
    color: "#3B3740",
    fontSize: 14,
    fontWeight: "600",
  },
  aboutText: {
    marginTop: 18,
    color: "#5B5860",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
});
