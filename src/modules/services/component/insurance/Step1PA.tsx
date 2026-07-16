import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import GradientButton from "../../constant/GradientButton";

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
  const insets = useSafeAreaInsets();
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
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select your gender</Text>
          <View style={styles.genderContainer}>
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
                  <Text style={[styles.genderText, isActive && styles.textWhite]}>{gender}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Accident covers self only</Text>
            <Text style={styles.sectionSubtitle}>This policy is issued for the insured individual only.</Text>
          </View>

          <View style={styles.singleCardWrap}>
            <View style={[styles.card, styles.cardActive]}>
              <View style={[styles.iconCircle, styles.iconCircleActive]}>
                <Image source={selfIcon} style={styles.iconImage} />
              </View>
              <Text style={[styles.cardLabel, styles.cardLabelActive]}>Self</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
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
    paddingTop: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
});