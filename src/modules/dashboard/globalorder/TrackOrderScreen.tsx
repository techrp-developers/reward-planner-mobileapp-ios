import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../../navigation/RootNavigator";
import { useAppTheme } from "../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<AppStackParamList, "TrackOrders">;

type OrderSectionCardProps = {
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  cardBg: string;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  chevronColor: string;
  onPress: () => void;
};

const OrderSectionCard = ({
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  cardBg,
  borderColor,
  titleColor,
  subtitleColor,
  chevronColor,
  onPress,
}: OrderSectionCardProps) => (
  <TouchableOpacity
    style={[styles.sectionCard, { backgroundColor: cardBg, borderColor }]}
    activeOpacity={0.88}
    onPress={onPress}
  >
    <View style={[styles.sectionIconWrap, { backgroundColor: iconBg }]}>
      <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
    </View>

    <View style={styles.sectionTextWrap}>
      <Text style={[styles.sectionTitle, { color: titleColor }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
    </View>

    <MaterialCommunityIcons name="chevron-right" size={20} color={chevronColor} />
  </TouchableOpacity>
);

export default function TrackOrderScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useAppTheme();

  const colors = {
    rootGradient: isDark
      ? ["#050507", "#09090B", "#050507"]
      : ["#F8FAFC", "#EEF2FF", "#FFFFFF"],
    headerText: isDark ? "#FFFFFF" : "#0F172A",
    backBg: isDark ? "#111113" : "rgba(255,255,255,0.9)",
    backIcon: isDark ? "#FFFFFF" : "#0F172A",
    border: isDark ? "rgba(255,255,255,0.09)" : "rgba(148,163,184,0.14)",
    borderStrong: isDark ? "rgba(255,255,255,0.12)" : "rgba(148,163,184,0.24)",
    card: isDark ? "#111113" : "rgba(255,255,255,0.9)",
    infoCard: isDark ? "#111113" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#A1A1AA" : "#64748B",
    body: isDark ? "#D4D4D8" : "#475569",
    chevron: isDark ? "#71717A" : "#94A3B8",
    iconBlueBg: isDark ? "rgba(99,102,241,0.18)" : "#EEF2FF",
    iconGreenBg: isDark ? "rgba(16,185,129,0.16)" : "#ECFDF5",
    iconOrangeBg: isDark ? "rgba(249,115,22,0.16)" : "#FFF7ED",
  };

  return (
    <LinearGradient
      colors={colors.rootGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: colors.backBg, borderColor: colors.borderStrong },
              ]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.backIcon} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>All Orders</Text>
            <View style={styles.headerSpacer} />
          </View>

          <LinearGradient
            colors={["#111827", "#312E81", "#4F46E5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>One place for every order</Text>
            <Text style={styles.heroSubtitle}>
              View product purchases, service bookings, bill payments, and future order types from one place.
            </Text>
          </LinearGradient>

          <Text style={[styles.sectionLabel, { color: colors.muted }]}>ORDER CATEGORIES</Text>

          <OrderSectionCard
            title="Shopping Orders"
            subtitle="Track your ecommerce product orders"
            icon="shopping-outline"
            iconBg={colors.iconBlueBg}
            iconColor="#4F46E5"
            cardBg={colors.card}
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.muted}
            chevronColor={colors.chevron}
            onPress={() => navigation.navigate("MyOrder")}
          />

          <OrderSectionCard
            title="Service Orders"
            subtitle="View booked services and their progress"
            icon="briefcase-check-outline"
            iconBg={colors.iconGreenBg}
            iconColor="#059669"
            cardBg={colors.card}
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.muted}
            chevronColor={colors.chevron}
            onPress={() => navigation.navigate("ServiceStack", { screen: "MyOrder" } as any)}
          />

          <OrderSectionCard
            title="BBPS Orders"
            subtitle="Open your recharge and bill payment history"
            icon="receipt-text-check-outline"
            iconBg={colors.iconOrangeBg}
            iconColor="#EA580C"
            cardBg={colors.card}
            borderColor={colors.border}
            titleColor={colors.text}
            subtitleColor={colors.muted}
            chevronColor={colors.chevron}
            onPress={() => navigation.navigate("BBPSHomeStack", { screen: "OrderHistory" } as any)}
          />

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.infoCard, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.infoTitle, { color: colors.text }]}>What you can manage here</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#4F46E5" />
              <Text style={[styles.infoText, { color: colors.body }]}>Product orders, service bookings, and BBPS transactions</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#4F46E5" />
              <Text style={[styles.infoText, { color: colors.body }]}>Status, payment details, invoices, and recent updates</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#4F46E5" />
              <Text style={[styles.infoText, { color: colors.body }]}>A quick route to each module's dedicated order list</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.24)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 22,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.82)",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
    marginBottom: 12,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
    gap: 12,
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },
  infoCard: {
    marginTop: 10,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
  },
});
