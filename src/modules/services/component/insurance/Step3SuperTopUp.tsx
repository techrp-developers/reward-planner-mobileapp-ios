import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import GradientButton from "../../constant/GradientButton";
import { 
  saveStep,
  completeInsurance,
  getQuotes,
  getAllSuperTopUpPremiums,
  normalizeQuotesForUi,
  mapBasicDetails,
  mapHealthCoverage,
  mapSuperTopupCoverage,
} from "../../api/InsuranceApi";
import { createFirebaseEnquiry } from "../../api/FirebaseService";
import { SUPER_COVER_AMOUNTS, CITIES, CoverAmount } from "../../constant/InsuranceConstants";
import { fetchUserInfo, getAuthHeaders, isAuthenticated } from "../../../common/auth/api/AuthAPI";
import { buildSuperTopupEnquiryData } from "../../api/enquiryPayloadBuilders";

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
    coverAmount?: string;
    agreeToTerms?: boolean;
    enquiryId?: number;
  };
};

type Props = {
  data: FormData;
  setData: (data: FormData) => void;
  onBack: () => void;
  onShowResults?: (results: { plans: any[]; coverAmount: number; formData: FormData; enquiryId?: number }) => void;
};

export default function Step3SuperTopUp({ data, setData, onBack, onShowResults }: Props) {
  const [dropdownVisibleFor, setDropdownVisibleFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>(CITIES);
  const [checking, setChecking] = useState(true);

  // Fetch user info and check authentication on mount
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        if (!isAuthenticated()) {
          Alert.alert(
            "Login Required",
            "Please log in to get insurance quotes",
            [
              { text: "OK", onPress: () => onBack() }
            ]
          );
          setChecking(false);
          return;
        }

        // Get auth headers (verify authentication)
        await getAuthHeaders();

        // Fetch user info
        const userInfo = await fetchUserInfo();
        console.log("📱 Step3SuperTopUp - User Info Received:", userInfo);
        if (userInfo?.user) {
          const user = userInfo.user;
          console.log("🔍 Step3SuperTopUp - Pre-filling form with extracted user data:", {
            firstName: user.first_name,
            lastName: user.last_name,
            mobileNumber: user.phone,
            city: user.city,
            pincode: user.pincode,
          });
          // Pre-fill form with user data
          setData({
            ...data,
            details: {
              ...data.details,
              firstName: data.details.firstName || user.first_name || "",
              lastName: data.details.lastName || user.last_name || "",
              mobileNumber: data.details.mobileNumber || user.phone || "",
              city: data.details.city || user.city || "",
              pincode: data.details.pincode || user.pincode || "",
            }
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setChecking(false);
      }
    };

    checkAuthAndLoadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logic: Handle Input Changes
  const handleInputChange = (field: string, value: any) => {
    setData({
      ...data,
      details: { ...data.details, [field]: value },
    });
  };

  // Logic: Handle City Input
  const handleCityChange = (value: string) => {
    setData({
      ...data,
      details: { 
        ...data.details, 
        city: value,
      },
    });
    setCitySearchTerm(value);
    
    // Filter cities based on search term
    const filtered = CITIES.filter(city =>
      city.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCities(filtered);
  };

  // Logic: Handle City Selection from Dropdown
  const handleCitySelect = (city: string) => {
    handleCityChange(city);
    setDropdownVisibleFor(null);
  };

  // Form Validation
  const isFormValid =
    data.details.firstName &&
    data.details.lastName &&
    data.details.mobileNumber?.length === 10 &&
    data.details.pincode?.length === 6 &&
    data.details.city &&
    data.details.coverAmount &&
    data.details.agreeToTerms;

  const buildPolicyPlannerPayload = (coverAmount: number) => {
    const toNum = (value: any, fallback: number) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    };

    const spouseAge = data.members.includes("spouse") ? toNum(data.ages?.spouse, 28) : null;
    const childrenAges: number[] = [];

    if (data.members.includes("son")) {
      const count = data.memberCounts?.son || 1;
      for (let i = 1; i <= count; i += 1) {
        const key = count === 1 ? "son" : `son_${i}`;
        childrenAges.push(toNum(data.ages?.[key], 8));
      }
    }

    if (data.members.includes("daughter")) {
      const count = data.memberCounts?.daughter || 1;
      for (let i = 1; i <= count; i += 1) {
        const key = count === 1 ? "daughter" : `daughter_${i}`;
        childrenAges.push(toNum(data.ages?.[key], 8));
      }
    }

    return {
      coverAmount,
      deductible: 500000,
      age: toNum(data.ages?.self, 30),
      sage: spouseAge,
      c1age: childrenAges[0] ?? null,
      c2age: childrenAges[1] ?? null,
      c3age: childrenAges[2] ?? null,
      c4age: childrenAges[3] ?? null,
    };
  };

  // Logic: API Submission - CRM Flow
  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert("Validation", "Please fill all required fields");
      return;
    }

    if (!isAuthenticated()) {
      Alert.alert("Authentication Required", "Please log in to continue");
      return;
    }

    setLoading(true);
    try {
      const selectedCoverLabel = data.details.coverAmount;
      const coverAmountObj = SUPER_COVER_AMOUNTS.find(c => c.label === selectedCoverLabel);
      const coverAmountValue = coverAmountObj?.value || 1000000;

      const enquiryId = data.details.enquiryId;
      if (!enquiryId) {
        Alert.alert("Error", "Session expired. Please go back to Step 1 and restart.");
        return;
      }

      let successfulPlans: any[] = [];

      try {
        // Step 3: Save basic details
        console.log("📝 Step 3: Saving basic details...");
        await saveStep(enquiryId, 3, "basic", mapBasicDetails(data));
        console.log("✅ Basic details saved");

        // Step 4: Save super top-up coverage
        console.log("📝 Step 4: Saving super top-up coverage...");
        try {
          await saveStep(enquiryId, 4, "super_topup", mapSuperTopupCoverage(coverAmountValue));
        } catch (coverageError: any) {
          const coverageMessage = String(
            coverageError?.response?.data?.message || coverageError?.message || ""
          ).toLowerCase();

          const needsFallback =
            coverageMessage.includes("coverage") ||
            coverageMessage.includes("details missing") ||
            coverageMessage.includes("invalid section") ||
            coverageError?.response?.status === 400;

          if (!needsFallback) throw coverageError;

          // Fallback for CRM variants expecting health section + sum_insured.
          await saveStep(enquiryId, 4, "health", mapHealthCoverage(coverAmountValue));
        }
        console.log("✅ Coverage saved");

        // Step 5: Complete enquiry
        console.log("📝 Step 5: Completing enquiry...");
        await completeInsurance(enquiryId);
        console.log("✅ Enquiry completed");

        await new Promise((resolve) => setTimeout(resolve, 800));

        // Step 6: Get quotes from PolicyPlanner as primary source.
        console.log("📝 Step 6: Fetching PolicyPlanner super top-up quotes...");
        const policyPayload = buildPolicyPlannerPayload(coverAmountValue);
        successfulPlans = await getAllSuperTopUpPremiums(policyPayload);

        // CRM fallback if PolicyPlanner gives no success rows.
        if (!successfulPlans.some((p: any) => p.success)) {
          console.log("📝 Step 6 fallback: Fetching CRM quotes...");
          const quotesResponse = await getQuotes(enquiryId);
          successfulPlans = normalizeQuotesForUi(quotesResponse);
        }

        console.log("✅ Quotes fetched successfully:", successfulPlans.length);

      } catch (crmFlowError: any) {
        console.error("❌ CRM flow failed:", crmFlowError.message);
        throw new Error(
          crmFlowError?.response?.data?.message || 
          crmFlowError.message || 
          "Failed to process insurance enquiry"
        );
      }

      if (successfulPlans.some((p) => p.success)) {
        const enquiryData = buildSuperTopupEnquiryData(data, coverAmountValue);
        console.log("[Firebase][SuperTopup] enquiry_data:", enquiryData);

        await createFirebaseEnquiry({
          service_id: 2,
          variant_id: 1,
          name: `${data.details.firstName || ""} ${data.details.lastName || ""}`.trim(),
          city: data.details.city,
          mobile: data.details.mobileNumber || "",
          email: "",
          enquiry_data: enquiryData,
        });

        Alert.alert("Success", `Found ${successfulPlans.filter((p) => p.success).length} quotes for your family!`);
      } else {
        Alert.alert("Error", "No quotes could be fetched. Please try again.");
      }

      if (onShowResults && enquiryId) {
        onShowResults({
          plans: successfulPlans,
          coverAmount: coverAmountValue,
          formData: data,
          enquiryId,
        });
      }
    } catch (error: any) {
      console.error("❌ Submission error:", error);
      Alert.alert(
        "Error", 
        error?.message || "Unable to process your request. Please try again."
      );
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Personal Details</Text>
            <Text style={styles.headerSubtitle}>This information helps us personalize your insurance quotes.</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Name Row */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="John"
                    value={data.details.firstName}
                    onChangeText={(v) => handleInputChange("firstName", v)}
                  />
                </View>
              </View>
              <View style={styles.spacer} />
              <View style={styles.flex1}>
                <Text style={styles.label}>Last Name</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Doe"
                    value={data.details.lastName}
                    onChangeText={(v) => handleInputChange("lastName", v)}
                  />
                </View>
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.textInput, styles.mobileInput]}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={data.details.mobileNumber}
                  onChangeText={(v) => handleInputChange("mobileNumber", v)}
                />
                <MaterialIcons name="phone" size={18} color="#8665FF" />
              </View>
            </View>

            {/* Pincode */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Pincode</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="411004"
                  keyboardType="numeric"
                  maxLength={6}
                  value={data.details.pincode}
                  onChangeText={(v) => handleInputChange("pincode", v)}
                />
              </View>
            </View>

            {/* City - with both input and dropdown */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Search or select city"
                  value={data.details.city || citySearchTerm}
                  onChangeText={handleCityChange}
                  onFocus={() => setDropdownVisibleFor("city")}
                />
                <TouchableOpacity onPress={() => setDropdownVisibleFor("city")}>
                  <MaterialIcons name="location-city" size={18} color="#8665FF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cover Amount */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Required Cover Amount</Text>
              <TouchableOpacity style={styles.dropdownBox} onPress={() => setDropdownVisibleFor("coverAmount")}>
                <Text style={[styles.dropdownText, !data.details.coverAmount && styles.placeholderText]}>
                  {data.details.coverAmount || "Select coverage"}
                </Text>
                <MaterialIcons name="shield" size={18} color="#FF8C42" />
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <TouchableOpacity 
              style={styles.termsRow} 
              onPress={() => handleInputChange("agreeToTerms", !data.details.agreeToTerms)}
            >
              <View style={[styles.customCheckbox, data.details.agreeToTerms && styles.checkboxChecked]}>
                {data.details.agreeToTerms && <MaterialIcons name="check" size={14} color="#FFF" />}
              </View>
              <Text style={styles.termsLabel}>
                I agree to the <Text style={styles.boldLink}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
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
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setDropdownVisibleFor(null)}>
          <View style={styles.modalContent}>
            <View style={styles.modalBar} />
            
            {dropdownVisibleFor === "city" && (
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredCities.map((item, idx) => (
                  <TouchableOpacity 
                    key={`${item}_${idx}`}
                    style={styles.modalItem} 
                    onPress={() => handleCitySelect(item)}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                    {data.details.city === item && <MaterialIcons name="check-circle" size={20} color="#FF8C42" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {dropdownVisibleFor === "coverAmount" && (
              <ScrollView keyboardShouldPersistTaps="handled">
                {SUPER_COVER_AMOUNTS.map((item: CoverAmount, idx: number) => (
                  <TouchableOpacity 
                    key={`${item.label}_${idx}`}
                    style={styles.modalItem} 
                    onPress={() => {
                      handleInputChange("coverAmount", item.label);
                      setDropdownVisibleFor(null);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                    {data.details.coverAmount === item.label && <MaterialIcons name="check-circle" size={20} color="#FF8C42" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFF" },
  backgroundGradient: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  header: { marginBottom: 25 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1A1A2E", marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: "#71717A", lineHeight: 20 },
  
  formContainer: { gap: 18 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  flex1: { flex: 1 },
  fieldWrapper: { width: "100%" },
  spacer: { width: 12 },
  
  label: { fontSize: 13, fontWeight: "700", color: "#4B4B4B", marginBottom: 8, marginLeft: 4 },
  inputBox: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBf5",
    paddingHorizontal: 15,
    height: 52,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: { fontSize: 15, fontWeight: "600", color: "#1A1A2E", flex: 1 },
  mobileInput: { flex: 1 },

  dropdownBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBf5",
    paddingHorizontal: 15,
    height: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownText: { fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  placeholderText: { color: "#999" },

  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  customCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: "#D1D1D6", marginRight: 10, justifyContent: "center", alignItems: "center" },
  checkboxChecked: { backgroundColor: "#FF8C42", borderColor: "#FF8C42" },
  termsLabel: { fontSize: 13, color: "#71717A" },
  boldLink: { color: "#FF8C42", fontWeight: "700" },

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
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBf5",
    justifyContent: "center",
    alignItems: "center",
  },
  footerButtonWrapper: { flex: 1 },
  submitButton: { marginTop: 0, height: 52, justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: "50%", padding: 20 },
  modalBar: { width: 40, height: 4, backgroundColor: "#E5E5EA", borderRadius: 2, alignSelf: "center", marginBottom: 15 },
  modalItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#F2F2F7" },
  modalItemText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    color: "#8665FF",
    fontWeight: "700",
    fontSize: 14,
  },
});
