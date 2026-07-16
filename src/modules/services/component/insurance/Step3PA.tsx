import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import GradientButton from "../../constant/GradientButton";
import { saveStep, completeInsurance, getQuotes } from "../../api/InsuranceCrmApi";
import { getAllPAPremiums } from "../../api/PolicyPlannerApi";
import { createFirebaseEnquiry } from "../../api/FirebaseService";
import { mapBasicDetails, mapPaDetails, normalizeQuotesForUi } from "./insurancePayloadMappers";
import { buildPersonalAccidentEnquiryData } from "../../api/enquiryPayloadBuilders";
import {
  CoverAmount,
  INCOME_RANGES,
  NATURE_OF_WORK,
  OCCUPATIONS,
  PA_COVER_AMOUNTS,
  PA_NATURE_OF_WORK_OPTIONS,
  SelectionOption,
} from "../../constant/InsuranceConstants";
import {
  fetchUserInfo,
  getAuthHeaders,
  isAuthenticated,
} from "../../../common/auth/api/AuthAPI";

type FormData = {
  gender: string;
  members: string[];
  memberCounts: Record<string, number>;
  ages: Record<string, string | number>;
  details: {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    pincode?: string;
    city?: string;
    zone?: string;
    coverAmount?: string;
    agreeToTerms?: boolean;
    occupation?: string;
    annualIncomeRange?: string;
    natureOfWork?: string;
    enquiryId?: number;
  };
};

type Props = {
  data: FormData;
  setData: (data: FormData) => void;
  onBack: () => void;
  onShowResults?: (results: {
    plans: any[];
    coverAmount: number;
    formData: FormData;
    enquiryId?: number;
  }) => void;
};

const getCategoryFromWork = (selectedWork?: string): number | null => {
  if (!selectedWork) return null;

  for (const [category, items] of Object.entries(NATURE_OF_WORK)) {
    if (items.some((item) => item.label === selectedWork)) {
      return Number(category);
    }
  }
  return null;
};

export default function Step3PA({ data, setData, onBack, onShowResults }: Props) {
  const insets = useSafeAreaInsets();
  const [dropdownVisibleFor, setDropdownVisibleFor] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        if (!isAuthenticated()) {
          Alert.alert(
            "Login Required",
            "Please log in to get insurance quotes",
            [{ text: "OK", onPress: () => onBack() }]
          );
          setChecking(false);
          return;
        }

        await getAuthHeaders();

        const userInfo = await fetchUserInfo();
        if (userInfo?.user) {
          const user = userInfo.user;
          setData({
            ...data,
            details: {
              ...data.details,
              firstName: data.details.firstName || user.first_name || "",
              lastName: data.details.lastName || user.last_name || "",
              mobileNumber: data.details.mobileNumber || user.phone || "",
            },
          });
        }
      } catch (error) {
        console.error("PA auth check error:", error);
      } finally {
        setChecking(false);
      }
    };

    checkAuthAndLoadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCategory = useMemo(
    () => getCategoryFromWork(data.details.natureOfWork),
    [data.details.natureOfWork]
  );

  const updateDetails = (field: string, value: any) => {
    setData({
      ...data,
      details: { ...data.details, [field]: value },
    });
  };

  const handleNatureOfWorkSelect = (nature: string) => {
    updateDetails("natureOfWork", nature);
    setDropdownVisibleFor(null);
  };

  const renderOptionItem = (
    item: SelectionOption,
    selectedValue: string | undefined,
    onSelect: (value: string) => void
  ) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        onSelect(item.label);
        setDropdownVisibleFor(null);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.modalTextContainer}>
        <Text style={styles.modalItemText}>{item.label}</Text>
        {typeof item.category === "number" && (
          <Text style={styles.modalItemMeta}>{`Category ${item.category}`}</Text>
        )}
      </View>
      {selectedValue === item.label && (
        <MaterialIcons name="check-circle" size={20} color="#8665FF" />
      )}
    </TouchableOpacity>
  );

  const isFormValid =
    !!data.details.occupation &&
    !!data.details.annualIncomeRange &&
    !!data.details.natureOfWork &&
    !!data.details.coverAmount &&
    !!data.details.agreeToTerms;

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert("Validation", "Please fill all required fields");
      return;
    }

    const category = getCategoryFromWork(data.details.natureOfWork);
    if (!category) {
      Alert.alert("Validation", "Please select a valid nature of work");
      return;
    }

    if (!isAuthenticated()) {
      Alert.alert("Authentication Required", "Please log in to continue");
      return;
    }

    const enquiryId = data.details.enquiryId;
    if (!enquiryId) {
      Alert.alert("Error", "Session expired. Please go back to Step 1 and restart.");
      return;
    }

    const selectedCover = PA_COVER_AMOUNTS.find(
      (item) => item.label === data.details.coverAmount
    );
    const coverAmountValue = selectedCover?.value || 1000000;

    setLoading(true);
    try {
      // Step 3 – basic details
      await saveStep(enquiryId, 3, "basic", mapBasicDetails(data));

      // Step 4 – PA specific details
      await saveStep(enquiryId, 4, "personal_accident", mapPaDetails(data, coverAmountValue, category));

      // Complete enquiry
      await completeInsurance(enquiryId);

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Fetch quotes from PolicyPlanner as primary source.
      let plans = await getAllPAPremiums({
        coverAmount: coverAmountValue,
        category,
        age: Number(data.ages?.self) || 30,
      });

      // CRM fallback if PolicyPlanner gives no success rows.
      if (!plans.some((p: any) => p.success)) {
        const quotesResponse = await getQuotes(enquiryId);
        plans = normalizeQuotesForUi(quotesResponse);
      }

      console.log(`[PA] ✅ getQuotes returned ${plans.length} plans for enquiry: ${enquiryId}`);

      if (plans.some((p: any) => p.success)) {
        const enquiryData = buildPersonalAccidentEnquiryData(data, coverAmountValue);
        console.log("[Firebase][PersonalAccident] enquiry_data:", enquiryData);

        await createFirebaseEnquiry({
          service_id: 3,
          variant_id: 1,
          name: `${data.details.firstName || ""} ${data.details.lastName || ""}`.trim(),
          city: data.details.city,
          mobile: data.details.mobileNumber || "",
          email: "",
          enquiry_data: enquiryData,
        });

        onShowResults?.({
          plans,
          coverAmount: coverAmountValue,
          formData: data,
          enquiryId,
        });
      } else {
        Alert.alert("Error", "No quotes could be fetched. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backgroundGradient}
        >
        <View style={styles.centerContainer}>
          <MaterialIcons name="lock-outline" size={50} color="#8665FF" />
          <Text style={styles.loadingText}>Verifying authentication...</Text>
        </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Additional Details</Text>
            <Text style={styles.headerSubtitle}>
              Help us classify risk and fetch Personal Accident quotes.
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Occupation */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Occupation of Insured *</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setDropdownVisibleFor("occupation")}
                activeOpacity={0.85}
              >
                <View style={styles.dropdownLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="work-outline" size={20} color="#8665FF" />
                  </View>
                  <Text
                    style={[
                      styles.valueText,
                      !data.details.occupation && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {data.details.occupation || "Select Occupation"}
                  </Text>
                </View>
                <MaterialIcons name="expand-more" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Annual Income */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Annual Income Range *</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setDropdownVisibleFor("income")}
                activeOpacity={0.85}
              >
                <View style={styles.dropdownLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="currency-rupee" size={20} color="#8665FF" />
                  </View>
                  <Text
                    style={[
                      styles.valueText,
                      !data.details.annualIncomeRange && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {data.details.annualIncomeRange || "Select Income Range"}
                  </Text>
                </View>
                <MaterialIcons name="expand-more" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Nature of Work */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Nature of Work / Designation *</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setDropdownVisibleFor("natureOfWork")}
                activeOpacity={0.85}
              >
                <View style={styles.dropdownLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="badge" size={20} color="#8665FF" />
                  </View>
                  <Text
                    style={[
                      styles.valueText,
                      !data.details.natureOfWork && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {data.details.natureOfWork || "Select Nature of Work / Designation"}
                  </Text>
                </View>
                <MaterialIcons name="expand-more" size={22} color="#334155" />
              </TouchableOpacity>

              {!!selectedCategory && (
                <View style={styles.categoryPill}>
                  <MaterialIcons name="verified" size={16} color="#8665FF" />
                  <Text style={styles.categoryPillText}>
                    {`Mapped to Category ${selectedCategory}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Cover Amount */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Cover Amount *</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setDropdownVisibleFor("coverAmount")}
                activeOpacity={0.85}
              >
                <View style={styles.dropdownLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="health-and-safety" size={20} color="#8665FF" />
                  </View>
                  <Text
                    style={[
                      styles.valueText,
                      !data.details.coverAmount && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {data.details.coverAmount || "Select Cover Amount"}
                  </Text>
                </View>
                <MaterialIcons name="expand-more" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() =>
                updateDetails("agreeToTerms", !data.details.agreeToTerms)
              }
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.customCheckbox,
                  data.details.agreeToTerms && styles.checkboxChecked,
                ]}
              >
                {data.details.agreeToTerms && (
                  <MaterialIcons name="check" size={14} color="#FFF" />
                )}
              </View>
              <Text style={styles.termsLabel}>
                I agree to the <Text style={styles.boldLink}>Terms & Conditions</Text>{" "}
                and <Text style={styles.boldLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="keyboard-backspace" size={24} color="#8665FF" />
          </TouchableOpacity>
          <View style={styles.footerButtonWrapper}>
            <GradientButton
              title={loading ? "Searching..." : "Get Free Quotes"}
              onPress={handleSubmit}
              disabled={!isFormValid || loading}
              style={styles.submitButton}
            />
          </View>
        </View>
      </View>

      {/* Dropdown Modal */}
      <Modal visible={dropdownVisibleFor !== null} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setDropdownVisibleFor(null)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalBar} />

            {dropdownVisibleFor === "occupation" && (
              <FlatList
                data={OCCUPATIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) =>
                  renderOptionItem(item, data.details.occupation, (value) =>
                    updateDetails("occupation", value)
                  )
                }
              />
            )}

            {dropdownVisibleFor === "income" && (
              <FlatList
                data={INCOME_RANGES}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) =>
                  renderOptionItem(item, data.details.annualIncomeRange, (value) =>
                    updateDetails("annualIncomeRange", value)
                  )
                }
              />
            )}

            {dropdownVisibleFor === "natureOfWork" && (
              <FlatList
                data={PA_NATURE_OF_WORK_OPTIONS}
                keyExtractor={(item) => `${item.category}-${item.value}`}
                renderItem={({ item }) =>
                  renderOptionItem(item, data.details.natureOfWork, handleNatureOfWorkSelect)
                }
              />
            )}

            {dropdownVisibleFor === "coverAmount" && (
              <FlatList
                data={PA_COVER_AMOUNTS}
                keyExtractor={(item) => item.label}
                renderItem={({ item }: { item: CoverAmount }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      updateDetails("coverAmount", item.label);
                      setDropdownVisibleFor(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                    {data.details.coverAmount === item.label && (
                      <MaterialIcons name="check-circle" size={20} color="#8665FF" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  backgroundGradient: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },

  header: { marginBottom: 18 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: "#64748B", lineHeight: 20 },

  formContainer: { gap: 16 },
  fieldWrapper: { width: "100%" },

  label: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 8, marginLeft: 4 },

  dropdownField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAF5",
    paddingHorizontal: 14,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8F7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  valueText: { fontSize: 15, fontWeight: "700", color: "#0F172A", flex: 1 },
  placeholderText: { color: "#94A3B8" },

  categoryPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8F7FF",
    borderColor: "#EBE8FF",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryPillText: { color: "#6C4AB6", fontSize: 12, fontWeight: "700" },

  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#8665FF", borderColor: "#8665FF" },
  termsLabel: { fontSize: 13, color: "#475569", flex: 1, lineHeight: 18 },
  boldLink: { color: "#8665FF", fontWeight: "800" },

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
  footerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  footerButtonWrapper: { flex: 1 },
  submitButton: { marginTop: 0, height: 56, justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
    padding: 18,
  },
  modalBar: {
    width: 44,
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTextContainer: { flex: 1, marginRight: 10 },
  modalItemText: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  modalItemMeta: { marginTop: 3, fontSize: 12, color: "#64748B" },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 15, color: "#8665FF", fontWeight: "800", fontSize: 14 },
});