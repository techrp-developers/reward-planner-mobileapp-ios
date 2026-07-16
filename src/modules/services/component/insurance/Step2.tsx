import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import GradientButton from "../../constant/GradientButton";
import LinearGradient from "react-native-linear-gradient";

// Image Imports
import Husband from "../../assete/insurance/Gender (1).png";
import Wife from "../../assete/insurance/Gender (2).png";
import Son from "../../assete/insurance/Gender (3).png";
import Daughter from "../../assete/insurance/Gender (4).png";

const AGE_RANGE = Array.from({ length: 100 }, (_, i) => i + 1);

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
  onBack: () => void;
};

// Professional Age Input Dropdown Component
const AgeInputDropdown: React.FC<{
  memberId: string;
  memberLabel: string;
  memberType: string;
  selectedAge: number | undefined;
  onAgeSelect: (age: number) => void;
  activeDropdown: string | null;
  setActiveDropdown: (id: string | null) => void;
  gender: string;
}> = ({
  memberId,
  memberLabel,
  memberType,
  selectedAge,
  onAgeSelect,
  activeDropdown,
  setActiveDropdown,
  gender,
}) => {
  const isOpen = activeDropdown === memberId;

  const getIconForMember = (memberKey: string): any => {
    if (memberKey === "self") return gender === "Male" ? Husband : Wife;
    if (memberKey === "spouse") return gender === "Male" ? Wife : Husband;
    if (memberKey === "son") return Son;
    if (memberKey === "daughter") return Daughter;
    return Husband;
  };

  return (
    <View style={styles.ageInputWrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setActiveDropdown(isOpen ? null : memberId)}
        style={[styles.ageCard, isOpen && styles.ageCardFocused]}
      >
        <View style={styles.memberLeft}>
          <View
            style={[
              styles.iconCircle,
              selectedAge ? styles.iconCircleActive : null,
            ]}
          >
            <Image source={getIconForMember(memberType)} style={styles.iconImage} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.memberLabel}>{memberLabel}</Text>
            <Text style={styles.memberSubLabel}>Family Member</Text>
          </View>
        </View>

        {/* Age Dropdown Trigger */}
        <View style={[styles.ageInputBox, isOpen && styles.ageInputActive]}>
          <Text
            style={[
              styles.ageInput,
              !selectedAge && styles.ageInputPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selectedAge ? `${selectedAge} years` : "Select Age"}
          </Text>
          <MaterialIcons
            name={isOpen ? "expand-less" : "expand-more"}
            size={18}
            color="#334155"
          />
        </View>
      </TouchableOpacity>

      {/* Dropdown */}
      {isOpen && (
        <View style={styles.dropdownContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {AGE_RANGE.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.ageListItem,
                  selectedAge === item && styles.ageListItemSelected,
                ]}
                onPress={() => {
                  onAgeSelect(item);
                  setActiveDropdown(null);
                }}
              >
                <Text
                  style={[
                    styles.ageListItemText,
                    selectedAge === item && styles.ageListItemTextSelected,
                  ]}
                >
                  {item} years
                </Text>
                {selectedAge === item && (
                  <MaterialIcons name="check" size={18} color="#8665FF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function Step2({ data, setData, onNext, onBack }: Props) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Expand members
  const expandedMembers: { id: string; label: string; type: string }[] = [];
  data.members.forEach((memberType) => {
    const count = data.memberCounts?.[memberType] || 1;
    if (count === 1) {
      expandedMembers.push({
        id: memberType,
        label: memberType.charAt(0).toUpperCase() + memberType.slice(1),
        type: memberType,
      });
    } else {
      for (let i = 1; i <= count; i++) {
        expandedMembers.push({
          id: `${memberType}_${i}`,
          label: `${memberType.charAt(0).toUpperCase() + memberType.slice(1)} ${i}`,
          type: memberType,
        });
      }
    }
  });

  const updateAge = (memberId: string, age: number) => {
    setData({
      ...data,
      ages: { ...data.ages, [memberId]: age },
    });
  };

  const isNextDisabled = expandedMembers.some((m) => !data.ages?.[m.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>How old are they?</Text>
          <Text style={styles.headerSubtitle}>
            Age helps us find the most accurate plans for your family.
          </Text>
        </View>

        <View style={styles.listContainer}>
          {expandedMembers.map((member) => (
            <AgeInputDropdown
              key={member.id}
              memberId={member.id}
              memberLabel={member.label}
              memberType={member.type}
              selectedAge={data.ages?.[member.id] ? Number(data.ages[member.id]) : undefined}
              onAgeSelect={(age) => updateAge(member.id, age)}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              gender={data.gender}
            />
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={20} color="#8665FF" />
          </TouchableOpacity>
          <View style={styles.buttonWrapper}>
            <GradientButton
              title="Next"
              onPress={onNext}
              disabled={isNextDisabled}
              style={styles.nextButton}
            />
          </View>
        </View>
      </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  backgroundGradient: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 128 },

  header: { marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111111", marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: "#1F2937", lineHeight: 20 },

  listContainer: { gap: 12 },
  ageInputWrapper: { marginBottom: 4 },

  dropdownContainer: {
    alignSelf: "flex-end",
    width: 128,
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    marginTop: 8,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },

  ageListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F5",
  },
  ageListItemSelected: { backgroundColor: "#F9F8FF" },
  ageListItemText: { fontSize: 15, fontWeight: "500", color: "#1A1A2E", flex: 1 },
  ageListItemTextSelected: { fontWeight: "700", color: "#8665FF" },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  buttonWrapper: { flex: 1 },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  nextButton: {
    height: 52,
    marginTop: 0,
    justifyContent: "center",
    padding: 0,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBf5",
    justifyContent: "center",
    alignItems: "center",
  },

  ageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  ageCardFocused: {
    borderColor: "#8665FF",
    backgroundColor: "#F9F8FF",
    borderWidth: 1.5,
    shadowOpacity: 0.06,
    elevation: 4,
  },

  memberLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingRight: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8F9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconCircleActive: { backgroundColor: "#EBE5FF" },
  iconImage: { width: 32, height: 32, resizeMode: "contain" },

  textContainer: { flex: 1, justifyContent: "center", minWidth: 0 },
  memberLabel: { fontSize: 16, fontWeight: "700", color: "#111111", letterSpacing: -0.3 },
  memberSubLabel: { fontSize: 12, color: "#1F2937", marginTop: 2 },

  ageInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    paddingHorizontal: 12,
    width: 128,
    height: 44,
    justifyContent: "center",
    gap: 4,
  },
  ageInputActive: { borderColor: "#8665FF", backgroundColor: "#F9F8FF" },
  ageInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
    flex: 1,
    textAlign: "center",
  },
  ageInputPlaceholder: {
    color: "#64748B",
  },
});
