import React, { useEffect, useMemo, useState } from "react";
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
  Platform,
  Keyboard,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "../../constant/GradientButton";
import { saveStep, completeInsurance, getQuotes, getAllPremiums, mapBasicDetails, mapHealthCoverage, normalizeQuotesForUi } from "../../api/InsuranceApi";
import { createFirebaseEnquiry } from "../../api/FirebaseService";
import { COVER_AMOUNTS, CITIES, CoverAmount } from "../../constant/InsuranceConstants";
import { getZoneFromCity } from "../../utils/InsuranceUtils";
import { fetchUserInfo, getAuthHeaders, isAuthenticated } from "../../../common/auth/api/AuthAPI";
import { buildHealthEnquiryData } from "../../api/enquiryPayloadBuilders";

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

const CityInputDropdown: React.FC<{
  selectedCity: string | undefined;
  onCitySelect: (city: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  cityOptions: string[];
  isOtherCitySelected: boolean;
  customCity: string;
}> = ({
  selectedCity,
  onCitySelect,
  isOpen,
  setIsOpen,
  cityOptions,
  isOtherCitySelected,
  customCity,
}) => {
    const displayCity = isOtherCitySelected ? (customCity || "Other") : selectedCity;

    return (
      <View style={styles.cityInputWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Keyboard.dismiss();
            setIsOpen(!isOpen);
          }}
          style={[styles.cityCard, isOpen && styles.cityCardFocused]}
        >
          <View style={styles.cityLeft}>
            <View style={[styles.cityIconCircle, (displayCity || "") && styles.cityIconCircleActive]}>
              <MaterialIcons name="location-city" size={24} color="#8665FF" />
            </View>
            <View style={styles.cityTextContainer}>
              <Text style={styles.cityLabel}>City</Text>
              <Text style={styles.citySubLabel}>Select your location</Text>
            </View>
          </View>

          <View style={[styles.cityInputBox, isOpen && styles.cityInputActive]}>
            <Text style={styles.cityInputText} numberOfLines={1}>
              {displayCity || "Select City"}
            </Text>
            <MaterialIcons name={isOpen ? "expand-less" : "expand-more"} size={20} color="#334155" />
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.cityDropdownContainer}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.cityDropdownList}
            >
              {cityOptions.map((item) => {
                const isSelected =
                  (item === "Other" && isOtherCitySelected) ||
                  (item !== "Other" && selectedCity === item);

                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.cityListItem, isSelected && styles.cityListItemSelected]}
                    onPress={() => {
                      onCitySelect(item);
                      setIsOpen(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.cityListItemText, isSelected && styles.cityListItemTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && <MaterialIcons name="check" size={18} color="#8665FF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

export default function Step3({ data, setData, onBack, onShowResults }: Props) {
  const insets = useSafeAreaInsets();

  const [customCity, setCustomCity] = useState("");
  const [isOtherCitySelected, setIsOtherCitySelected] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [dropdownVisibleFor, setDropdownVisibleFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const cityOptions = useMemo(() => [...CITIES, "Other"], []);

  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        if (!isAuthenticated()) {
          Alert.alert("Login Required", "Please log in to get insurance quotes", [
            { text: "OK", onPress: () => onBack() },
          ]);
          setChecking(false);
          return;
        }

        await getAuthHeaders();

        const userInfo = await fetchUserInfo();
        if (userInfo?.user) {
          const user = userInfo.user;

          const userCity = user.city || "";

          setData({
            ...data,
            details: {
              ...data.details,
              firstName: data.details.firstName || user.first_name || "",
              lastName: data.details.lastName || user.last_name || "",
              mobileNumber: data.details.mobileNumber || user.phone || "",
              city: data.details.city || userCity || "",
              pincode: data.details.pincode || user.pincode || "",
              zone: data.details.zone || getZoneFromCity(userCity || ""),
            },
          });

          if (userCity && !CITIES.includes(userCity)) {
            setIsOtherCitySelected(true);
            setCustomCity(userCity);
          }
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

  const handleInputChange = (field: string, value: any) => {
    setData({
      ...data,
      details: { ...data.details, [field]: value },
    });
  };

  const handleCityChange = (value: string) => {
    setData({
      ...data,
      details: {
        ...data.details,
        city: value,
        zone: getZoneFromCity(value),
      },
    });
  };

  const handleCitySelect = (city: string) => {
    Keyboard.dismiss();

    if (city === "Other") {
      setIsOtherCitySelected(true);
      setCustomCity("");
      setData({
        ...data,
        details: {
          ...data.details,
          city: "",
          zone: "",
        },
      });
      return;
    }

    setIsOtherCitySelected(false);
    setCustomCity("");
    handleCityChange(city);
  };

  const handleCustomCityChange = (value: string) => {
    setCustomCity(value);
    handleCityChange(value);
  };

  const buildPolicyPlannerPayload = (coverAmount: number) => {
    const toNum = (value: any, fallback: number) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    };

    const zone = Number(String(data.details.zone || "").replace(/\D/g, "")) || 1;
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
      zone,
      age: toNum(data.ages?.self, 30),
      sage: spouseAge,
      c1age: childrenAges[0] ?? null,
      c2age: childrenAges[1] ?? null,
      c3age: childrenAges[2] ?? null,
      c4age: childrenAges[3] ?? null,
    };
  };

  const isFormValid =
    !!data.details.firstName &&
    !!data.details.lastName &&
    (data.details.mobileNumber?.length === 10) &&
    (data.details.pincode?.length === 6) &&
    !!data.details.city &&
    !!data.details.zone &&
    !!data.details.coverAmount &&
    !!data.details.agreeToTerms;

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert("Validation", "Please fill all required fields");
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

    setLoading(true);
    try {
      const coverAmountObj = COVER_AMOUNTS.find((c) => c.label === data.details.coverAmount);
      const coverAmountValue = coverAmountObj?.value || 1000000;

      // Step 3 – basic details
      await saveStep(enquiryId, 3, "basic", mapBasicDetails(data));

      // Step 4 – coverage amount
      await saveStep(enquiryId, 4, "health", mapHealthCoverage(coverAmountValue));

      // Complete enquiry
      await completeInsurance(enquiryId);

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Fetch quotes from PolicyPlanner as primary source.
      const policyPayload = buildPolicyPlannerPayload(coverAmountValue);
      let plans = await getAllPremiums(policyPayload);

      // CRM fallback if PolicyPlanner gives no success rows.
      if (!plans.some((p: any) => p.success)) {
        const quotesResponse = await getQuotes(enquiryId);
        plans = normalizeQuotesForUi(quotesResponse);
      }

      if (plans.some((p: any) => p.success)) {
        const enquiryData = buildHealthEnquiryData(data, coverAmountValue);
        console.log("[Firebase][Health] enquiry_data:", enquiryData);

        await createFirebaseEnquiry({
          service_id: 1,
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
        <KeyboardAwareScrollView
          style={styles.formScroll}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={Platform.OS === "ios" ? 16 : 120}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Personal Details</Text>
            <Text style={styles.headerSubtitle}>
              This information helps us personalize your insurance quotes.
            </Text>
          </View>

          <View style={styles.formContainer}>
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>First Name</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="John"
                        value={data.details.firstName}
                        onChangeText={(v) => handleInputChange("firstName", v)}
                        returnKeyType="next"
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
                        returnKeyType="next"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={[styles.textInput, styles.mobileInput]}
                      placeholder="9876543210"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={data.details.mobileNumber}
                      onChangeText={(v) => handleInputChange("mobileNumber", v.replace(/\D/g, ""))}
                      returnKeyType="next"
                    />
                    <MaterialIcons name="phone" size={18} color="#8665FF" />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Pincode</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="411004"
                        keyboardType="numeric"
                        maxLength={6}
                        value={data.details.pincode}
                        onChangeText={(v) => handleInputChange("pincode", v.replace(/\D/g, ""))}
                        returnKeyType="done"
                      />
                    </View>
                  </View>

                  <View style={styles.spacer} />

                  <View style={styles.flex1}>
                    <Text style={styles.label}>Zone</Text>
                    <View style={[styles.inputBox, styles.disabledBox]}>
                      <Text style={[styles.textInput, styles.disabledText]}>
                        {data.details.zone || "Auto-filled"}
                      </Text>
                    </View>
                  </View>
                </View>

                <CityInputDropdown
                  selectedCity={data.details.city}
                  onCitySelect={handleCitySelect}
                  isOpen={isCityDropdownOpen}
                  setIsOpen={setIsCityDropdownOpen}
                  cityOptions={cityOptions}
                  isOtherCitySelected={isOtherCitySelected}
                  customCity={customCity}
                />

                {isOtherCitySelected && (
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Enter City</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Type your city"
                        value={customCity}
                        onChangeText={handleCustomCityChange}
                        placeholderTextColor="#94A3B8"
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                )}

                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Required Cover Amount</Text>
                  <TouchableOpacity
                    style={styles.dropdownBox}
                    onPress={() => {
                      Keyboard.dismiss();
                      setDropdownVisibleFor("coverAmount");
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[styles.dropdownText, !data.details.coverAmount && styles.placeholderText]}
                      numberOfLines={1}
                    >
                      {data.details.coverAmount || "Select Cover Amount"}
                    </Text>
                    <MaterialIcons name="expand-more" size={20} color="#334155" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() => handleInputChange("agreeToTerms", !data.details.agreeToTerms)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.customCheckbox, data.details.agreeToTerms && styles.checkboxChecked]}>
                    {data.details.agreeToTerms && <MaterialIcons name="check" size={14} color="#FFF" />}
                  </View>
                  <Text style={styles.termsLabel}>
                    I agree to the <Text style={styles.boldLink}>Terms & Conditions</Text>
                  </Text>
                </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>

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
                style={styles.quoteButton}
              />
            </View>
          </View>
        </View>

        {/* Cover Amount Modal */}
        <Modal visible={dropdownVisibleFor !== null} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setDropdownVisibleFor(null)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalBar} />

              {dropdownVisibleFor === "coverAmount" && (
                <ScrollView keyboardShouldPersistTaps="handled">
                  {COVER_AMOUNTS.map((item: CoverAmount, idx: number) => (
                    <TouchableOpacity
                      key={`${item.label}_${idx}`}
                      style={styles.modalItem}
                      onPress={() => {
                        handleInputChange("coverAmount", item.label);
                        setDropdownVisibleFor(null);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.modalItemText}>{item.label}</Text>
                      {data.details.coverAmount === item.label && (
                        <MaterialIcons name="check-circle" size={20} color="#8665FF" />
                      )}
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
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  backgroundGradient: { flex: 1 },
  formScroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#1A1A2E", marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: "#71717A", lineHeight: 20 },

  formContainer: { gap: 18 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  flex1: { flex: 1 },
  spacer: { width: 12 },
  fieldWrapper: { width: "100%" },

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

  disabledBox: { backgroundColor: "#F9F9FB", borderColor: "#D5D5DB" },
  disabledText: { color: "#999999" },

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
  dropdownText: { fontSize: 15, fontWeight: "600", color: "#1A1A2E", flex: 1, marginRight: 8 },
  placeholderText: { color: "#999" },

  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D1D6",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: "#8665FF", borderColor: "#8665FF" },
  termsLabel: { fontSize: 13, color: "#71717A" },
  boldLink: { color: "#8665FF", fontWeight: "700" },

  footer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  quoteButton: {
    height: 52,
    marginTop: 0,
    justifyContent: "center",
    padding: 0,
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

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "55%",
    padding: 20,
  },
  modalBar: { width: 40, height: 4, backgroundColor: "#E5E5EA", borderRadius: 2, alignSelf: "center", marginBottom: 15 },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  modalItemText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 15, color: "#8665FF", fontWeight: "700", fontSize: 14 },

  // City dropdown styles (full width, professional)
  cityInputWrapper: { marginBottom: 4 },
  cityDropdownContainer: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  cityDropdownList: { maxHeight: 260 },
  cityListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F5",
  },
  cityListItemSelected: { backgroundColor: "#F9F8FF" },
  cityListItemText: { fontSize: 15, fontWeight: "500", color: "#1A1A2E", flex: 1 },
  cityListItemTextSelected: { fontWeight: "700", color: "#8665FF" },

  cityCard: {
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
  cityCardFocused: {
    borderColor: "#8665FF",
    backgroundColor: "#F9F8FF",
    borderWidth: 1.5,
    shadowOpacity: 0.06,
    elevation: 4,
  },
  cityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  cityIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8F9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cityIconCircleActive: { backgroundColor: "#EBE5FF" },
  cityTextContainer: { flex: 1, justifyContent: "center", minWidth: 0 },
  cityLabel: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", letterSpacing: -0.3 },
  citySubLabel: { fontSize: 12, color: "#8E8E93", marginTop: 2 },

  cityInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBEBF5",
    paddingHorizontal: 12,
    width: 124,
    height: 44,
    justifyContent: "space-between",
    gap: 4,
  },
  cityInputActive: { borderColor: "#8665FF", backgroundColor: "#F9F8FF" },
  cityInputText: { fontSize: 15, fontWeight: "600", color: "#1A1A2E", flex: 1 },
});
