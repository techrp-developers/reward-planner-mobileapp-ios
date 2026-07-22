import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import GradientButton from "../../constant/GradientButton";
import { useServicesTheme } from "../../utils/useServicesTheme";

import Husband from "../../assete/insurance/Gender (1).png";
import Wife from "../../assete/insurance/Gender (2).png";

type FormData = {
  gender: string;
  members: string[];
  memberCounts: Record<string, number>;
  ages: Record<string, string | number>;
  details: Record<string, any>;
};

type Props = {
  data: FormData;
  setData: (data: FormData) => void;
  onNext: () => void;
};

export default function Step1PA({ data, setData, onNext }: Props) {
  const servicesTheme = useServicesTheme();
  const selectedGender = data.gender || "Male";
  const selfIcon = selectedGender === "Male" ? Husband : Wife;

  const handleGenderChange = (gender: string) => {
    setData({
      ...data,
      gender,
      members: ["self"],
      memberCounts: {},
    });
  };

  const handleContinue = () => {
    if (!data.members.includes("self")) {
      setData({
        ...data,
        gender: selectedGender,
        members: ["self"],
        memberCounts: {},
      });
    }

    onNext();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: servicesTheme.colors.background }]}>
      <LinearGradient
        colors={servicesTheme.isDark ? ["#09090B", "#111113", "#18181B"] : ["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: servicesTheme.colors.textStrong }]}>Select your gender</Text>
          <View style={[styles.genderContainer, { backgroundColor: servicesTheme.colors.surfaceAlt }]}>
            {["Male", "Female"].map((gender) => {
              const isActive = selectedGender === gender;

              return (
                <TouchableOpacity
                  key={gender}
                  onPress={() => handleGenderChange(gender)}
                  style={[styles.genderOption, isActive && styles.genderOptionActive]}
                  activeOpacity={0.85}
                >
                  {isActive && (
                    <LinearGradient
                      colors={["#8665FF", "#6C4AB6"]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                  <Text style={[styles.genderText, { color: servicesTheme.colors.text }, isActive && styles.textWhite]}>{gender}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: servicesTheme.colors.textStrong }]}>Personal Accident covers self only</Text>
            <Text style={[styles.sectionSubtitle, { color: servicesTheme.colors.muted }]}>This policy is issued for the insured individual only.</Text>
          </View>

          <View style={styles.singleCardWrap}>
            <View style={[
              styles.card,
              styles.cardActive,
              {
                backgroundColor: servicesTheme.isDark ? "#18112A" : "#FFFFFF",
                borderColor: servicesTheme.colors.primary,
                shadowColor: servicesTheme.colors.shadow,
              },
            ]}>
              <View style={[styles.iconCircle, styles.iconCircleActive, { backgroundColor: servicesTheme.isDark ? "#27272A" : "#EEECFF" }]}>
                <Image source={selfIcon} style={styles.iconImage} />
              </View>
              <Text style={[styles.cardLabel, { color: servicesTheme.colors.textStrong }]}>Self</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[
        styles.footer,
        {
          backgroundColor: servicesTheme.isDark ? "rgba(17,17,19,0.96)" : "rgba(255,255,255,0.95)",
          borderTopColor: servicesTheme.colors.divider,
        },
      ]}>
        <GradientButton title="Continue" onPress={handleContinue} />
      </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  backgroundGradient: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 32 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  genderContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginTop: 12,
  },
  genderOption: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  genderOptionActive: {
    elevation: 4,
    shadowColor: "#8665FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  genderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  textWhite: { color: "#FFFFFF" },
  singleCardWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  card: {
    width: "60%",
    minWidth: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E6EAF3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardActive: {
    borderColor: "#8665FF",
    backgroundColor: "#FFFF",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircleActive: {
    backgroundColor: "#EEECFF",
  },
  iconImage: { width: 65, height: 65, resizeMode: "contain" },
  cardLabel: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  cardLabelActive: { color: "#0F172A" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
});
