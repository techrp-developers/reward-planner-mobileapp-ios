import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import GradientButton from "../../constant/GradientButton";
import { useServicesTheme } from "../../utils/useServicesTheme";

// Assuming these are your image imports
import Husband from "../../assete/insurance/Gender (1).png"; 
import Wife from "../../assete/insurance/Gender (2).png"; 
import Son from "../../assete/insurance/Gender (3).png";
import Daughter from "../../assete/insurance/Gender (4).png";

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

const membersList = [
  { key: "self", label: "Self", hasGenderIcon: true },
  { key: "spouse", label: "Spouse", hasGenderIcon: true },
  { key: "son", label: "Son", icon: Son, hasCount: true },
  { key: "daughter", label: "Daughter", icon: Daughter, hasCount: true },
];

export default function Step1({ data, setData, onNext }: Props) {
  const servicesTheme = useServicesTheme();
  // Get appropriate icon based on member type and selected gender
  const getIconForMember = (memberKey: string): any => {
    if (memberKey === 'self') {
      return data.gender === 'Male' ? Husband : Wife;
    }
    if (memberKey === 'spouse') {
      return data.gender === 'Male' ? Wife : Husband;
    }
    if (memberKey === 'son') return Son;
    if (memberKey === 'daughter') return Daughter;
    return Husband;
  };

  const toggleMember = (member: string) => {
    const exists = data.members.includes(member);
    const updated = exists
      ? data.members.filter((m: string) => m !== member)
      : [...data.members, member];

    // Initialize count to 1 if adding a child for the first time
    const newCounts = { ...data.memberCounts };
    if (!exists && (member === 'son' || member === 'daughter')) {
        newCounts[member] = 1;
    }

    setData({ ...data, members: updated, memberCounts: newCounts });
  };

  const updateMemberCount = (member: string, increment: boolean) => {
    const currentCount = data.memberCounts?.[member] || 1;
    const newCount = increment ? currentCount + 1 : Math.max(1, currentCount - 1);

    setData({
      ...data,
      memberCounts: { ...data.memberCounts, [member]: newCount },
    });
  };

  const isNextDisabled = data.members.length === 0 || !data.gender;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: servicesTheme.colors.background }]}>
      <LinearGradient
        colors={servicesTheme.isDark ? ["#09090B", "#111113", "#18181B"] : ["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Modern Gender Selection */}
        <View style={styles.section}>
          <View style={[styles.genderContainer, { backgroundColor: servicesTheme.colors.surfaceAlt }]}>
            {["Male", "Female"].map((g) => {
              const isActive = data.gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setData({ ...data, gender: g })}
                  style={[styles.genderOption, isActive && styles.genderOptionActive]}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <LinearGradient
                      colors={["#8665FF", "#6C4AB6"]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                  <Text style={[styles.genderText, { color: servicesTheme.colors.text }, isActive && styles.textWhite]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Members Selection Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: servicesTheme.colors.textStrong }]}>Insure your family</Text>
            <Text style={[styles.sectionSubtitle, { color: servicesTheme.colors.muted }]}>Select everyone you want to protect</Text>
          </View>

          <View style={styles.grid}>
            {membersList.map((member) => {
              const isSelected = data.members.includes(member.key);
              const count = data.memberCounts?.[member.key] || 1;

              return (
                <View key={member.key} style={styles.cardContainer}>
                  <TouchableOpacity
                    onPress={() => toggleMember(member.key)}
                    activeOpacity={0.9}
                    style={[
                      styles.card,
                      { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border, shadowColor: servicesTheme.colors.shadow },
                      isSelected && styles.cardActive,
                      isSelected && { backgroundColor: servicesTheme.isDark ? "#18112A" : "#F9F8FF", borderColor: servicesTheme.colors.primary },
                    ]}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: servicesTheme.colors.surfaceAlt }, isSelected && styles.iconCircleActive]}>
                      <Image source={getIconForMember(member.key)} style={styles.iconImage} />
                    </View>
                    
                    <Text style={[styles.cardLabel, { color: servicesTheme.colors.text }, isSelected && { color: servicesTheme.colors.textStrong }]}>
                      {member.label}
                    </Text>

                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <MaterialIcons name="check" size={12} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {member.hasCount && isSelected && (
                    <View style={[styles.stepper, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
                      <TouchableOpacity onPress={() => updateMemberCount(member.key, false)} style={styles.stepBtn}>
                        <MaterialIcons name="remove" size={14} color="#6C4AB6" />
                      </TouchableOpacity>
                      <Text style={[styles.stepValue, { color: servicesTheme.colors.textStrong }]}>{count}</Text>
                      <TouchableOpacity onPress={() => updateMemberCount(member.key, true)} style={styles.stepBtn}>
                        <MaterialIcons name="add" size={14} color="#6C4AB6" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Modern Summary Box */}
        {data.members.length > 0 && (
          <LinearGradient
            colors={servicesTheme.isDark ? ["#18112A", "#111113"] : ["#F8F7FF", "#EFECFF"]}
            style={[styles.summaryCard, { borderColor: servicesTheme.colors.border }]}
          >
            <MaterialIcons name="info" size={20} color="#8665FF" />
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryHeadline, { color: servicesTheme.colors.textStrong }]}>Review Coverage</Text>
              <Text style={[styles.summaryDesc, { color: servicesTheme.colors.muted }]} numberOfLines={2}>
                Insuring {data.members.length} {data.members.length > 1 ? 'members' : 'member'}
              </Text>
            </View>
          </LinearGradient>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: servicesTheme.isDark ? "rgba(17,17,19,0.96)" : "rgba(255,255,255,0.95)", borderTopColor: servicesTheme.colors.divider }]}>
        <GradientButton
          title="Continue"
          onPress={onNext}
          disabled={isNextDisabled}
        />
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
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111111", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: "#1F2937", fontWeight: "500" },
  
  // Gender Pill Styling
  genderContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
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
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  genderText: { fontSize: 15, fontWeight: "600", color: "#111111" },
  textWhite: { color: "#FFF" },

  // Grid & Cards
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cardContainer: { width: "47%", marginBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F2F2F7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardActive: {
    borderColor: "#8665FF",
    backgroundColor: "#F9F8FF",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8F9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircleActive: { backgroundColor: "#EEECFF" },
  iconImage: { width: 65, height: 65, resizeMode: "contain" },
  cardLabel: { fontSize: 14, fontWeight: "600", color: "#111111" },
  cardLabelActive: { color: "#000000" },
  selectedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#8665FF",
    borderRadius: 10,
    padding: 2,
  },

  // Stepper
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginTop: -15, // Overlap effect
    alignSelf: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    elevation: 3,
  },
  stepBtn: { padding: 4 },
  stepValue: { fontSize: 14, fontWeight: "bold", color: "#000000", marginHorizontal: 8 },

  // Summary Card
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBE8FF",
  },
  summaryInfo: { marginLeft: 12 },
  summaryHeadline: { fontSize: 14, fontWeight: "700", color: "#111111" },
  summaryDesc: { fontSize: 12, color: "#1F2937", marginTop: 2 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
});
