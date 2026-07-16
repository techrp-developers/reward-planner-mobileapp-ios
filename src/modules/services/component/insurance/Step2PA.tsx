import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import GradientButton from "../../constant/GradientButton";
import { CITIES } from "../../constant/InsuranceConstants";
import { getZoneFromCity, filterCities } from "../../utils/InsuranceUtils";
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
    dob?: string; // ✅ standardized storage: ISO "YYYY-MM-DD"
    mobileNumber?: string;
    pincode?: string;
    city?: string;
    zone?: string;
    coverAmount?: string;
    agreeToTerms?: boolean;
  };
};

type Props = {
  data: FormData;
  setData: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
};

/** ===== DOB helpers (standardized, professional) ===== **/

// If backend gives ISO like "1997-02-23", show "23/02/1997"
function isoToDdmmyyyy(iso?: string) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return ""; // unknown format
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

// Convert "23/02/1997" -> "1997-02-23"
function ddmmyyyyToIso(ddmmyyyy: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

// Light validation (day/month/year ranges + real date check)
function isValidDdmmyyyy(ddmmyyyy: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy);
  if (!m) return false;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;

  const d = new Date(yyyy, mm - 1, dd);
  return (
    d.getFullYear() === yyyy &&
    d.getMonth() === mm - 1 &&
    d.getDate() === dd
  );
}

// Auto-format as user types: "23021997" -> "23/02/1997"
function formatDobInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}

export default function Step2PA({ data, setData, onNext, onBack }: Props) {  const insets = useSafeAreaInsets();  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>(CITIES);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // UI state for DOB shown as DD/MM/YYYY (while stored as ISO)
  const [dobDisplay, setDobDisplay] = useState<string>("");

  // Prefill DOB display whenever stored DOB changes (e.g., from API prefill)
  useEffect(() => {
    const display = isoToDdmmyyyy(data.details.dob);
    if (display && display !== dobDisplay) setDobDisplay(display);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.details.dob]);

  // Fetch user info and check authentication on mount
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
        console.log("📱 Step2PA - User Info Received:", userInfo);

        if (userInfo?.user) {
          const user = userInfo.user;

          // ✅ Assuming backend returns ISO "YYYY-MM-DD" in user.date_of_birth
          const userDobIso =
            user.date_of_birth || user.dob || user.birth_date || "";

          setData({
            ...data,
            details: {
              ...data.details,
              firstName: data.details.firstName || user.first_name || "",
              lastName: data.details.lastName || user.last_name || "",
              mobileNumber: data.details.mobileNumber || user.phone || "",
              city: data.details.city || user.city || "",
              pincode: data.details.pincode || user.pincode || "",
              zone: data.details.zone || getZoneFromCity(user.city || ""),
              dob: data.details.dob || userDobIso || "",
            },
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

  // Handle Input Changes
  const handleInputChange = (field: string, value: any) => {
    setData({
      ...data,
      details: { ...data.details, [field]: value },
    });
  };

  // DOB change: update display + store ISO when valid
  const handleDobChange = (raw: string) => {
    const formatted = formatDobInput(raw);
    setDobDisplay(formatted);

    if (isValidDdmmyyyy(formatted)) {
      const iso = ddmmyyyyToIso(formatted);
      handleInputChange("dob", iso);
    } else {
      // keep stored dob empty until valid (so validation works correctly)
      handleInputChange("dob", "");
    }
  };

  // Handle City Input with Auto-Zone Update
  const handleCityChange = (value: string) => {
    setData({
      ...data,
      details: {
        ...data.details,
        city: value,
        zone: getZoneFromCity(value),
      },
    });
    setCitySearchTerm(value);

    const filtered = filterCities(value, CITIES);
    setFilteredCities(filtered);
  };

  // Handle City Selection
  const handleCitySelect = (city: string) => {
    handleCityChange(city);
    setCitySearchTerm("");
    setIsCityDropdownOpen(false);
  };

  const isDobValid = useMemo(() => {
    // since we store ISO only when valid, this is enough:
    return !!data.details.dob;
  }, [data.details.dob]);

  const isFormValid =
    !!data.details.firstName &&
    !!data.details.lastName &&
    isDobValid &&
    (data.details.mobileNumber?.length === 10) &&
    (data.details.pincode?.length === 6) &&
    !!data.details.city &&
    !!data.details.zone;

  const handleContinue = () => {
    if (!isFormValid) {
      Alert.alert(
        "Validation",
        "Please complete all personal details to continue"
      );
      return;
    }
    onNext();
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="lock-outline" size={50} color="#8665FF" />
          <Text style={styles.loadingText}>Verifying authentication...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const FOOTER_HEIGHT = 84; // back button (52) + padding (20) + gap (12)
  const SCREEN_HEIGHT = Dimensions.get("window").height;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#F7F3FF", "#EFE7FF", "#EDE9FE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
      <KeyboardAwareScrollView
        style={styles.keyboardAvoidingView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: SCREEN_HEIGHT + FOOTER_HEIGHT + insets.bottom,
            paddingBottom: FOOTER_HEIGHT + insets.bottom + 24,
          },
        ]}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 16 : 120}
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
                <Text style={styles.label}>First Name *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter first name"
                    value={data.details.firstName}
                    onChangeText={(v) => handleInputChange("firstName", v)}
                  />
                </View>
              </View>

              <View style={styles.spacer} />

              <View style={styles.flex1}>
                <Text style={styles.label}>Last Name *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter last name"
                    value={data.details.lastName}
                    onChangeText={(v) => handleInputChange("lastName", v)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Date of Birth *</Text>
                <View
                  style={[
                    styles.inputBox,
                    !isDobValid && dobDisplay.length > 0 ? styles.inputErrorBox : null,
                  ]}
                >
                  <TextInput
                    style={styles.textInput}
                    placeholder="DD/MM/YYYY"
                    keyboardType="number-pad"
                    value={dobDisplay}
                    onChangeText={handleDobChange}
                    maxLength={10}
                  />
                  <MaterialIcons
                    name="calendar-today"
                    size={18}
                    color="#8665FF"
                  />
                </View>
                {!isDobValid && dobDisplay.length > 0 && (
                  <Text style={styles.errorText}>Enter a valid date (DD/MM/YYYY)</Text>
                )}
              </View>

              <View style={styles.spacer} />

              <View style={styles.flex1}>
                <Text style={styles.label}>Mobile Number *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[styles.textInput, styles.mobileInput]}
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={data.details.mobileNumber}
                    onChangeText={(v) =>
                      handleInputChange("mobileNumber", v.replace(/\D/g, ""))
                    }
                  />
                  <MaterialIcons name="phone" size={18} color="#8665FF" />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Pincode *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter pincode"
                    keyboardType="numeric"
                    maxLength={6}
                    value={data.details.pincode}
                    onChangeText={(v) =>
                      handleInputChange("pincode", v.replace(/\D/g, ""))
                    }
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

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>City *</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Search or select city"
                  value={data.details.city || citySearchTerm}
                  onChangeText={handleCityChange}
                  onFocus={() => setIsCityDropdownOpen(true)}
                />
                <TouchableOpacity onPress={() => setIsCityDropdownOpen(true)}>
                  <MaterialIcons name="location-city" size={18} color="#8665FF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="keyboard-backspace" size={24} color="#8665FF" />
          </TouchableOpacity>
          <View style={styles.footerButtonWrapper}>
            <GradientButton
              title="Continue"
              onPress={handleContinue}
              disabled={!isFormValid}
              style={styles.continueButton}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={isCityDropdownOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCityDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCityDropdownOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalBar} />
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleCitySelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {data.details.city === item && (
                    <MaterialIcons name="check-circle" size={20} color="#8665FF" />
                  )}
                </TouchableOpacity>
              )}
            />
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
  scrollContent: { padding: 20 },
  header: { marginBottom: 25 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 14, color: "#71717A", lineHeight: 20 },

  formContainer: { gap: 18 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  flex1: { flex: 1 },
  fieldWrapper: { width: "100%" },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B4B4B",
    marginBottom: 8,
    marginLeft: 4,
  },
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
  textInput: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
    flex: 1,
  },

  inputErrorBox: {
    borderColor: "#E11D48",
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
    color: "#E11D48",
    fontSize: 12,
    fontWeight: "600",
  },

  disabledBox: {
    backgroundColor: "#F9F9FB",
    borderColor: "#D5D5DB",
  },
  disabledText: {
    color: "#999999",
  },

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

  keyboardAvoidingView: { flex: 1 },
  spacer: { width: 12 },
  mobileInput: { flex: 1 },
  footerButtonWrapper: { flex: 1 },
  continueButton: { marginTop: 0, height: 52, justifyContent: "center" },
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

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 25, borderTopRightRadius: 25, maxHeight: "50%", padding: 20 },
  modalBar: { width: 40, height: 4, backgroundColor: "#E5E5EA", borderRadius: 2, alignSelf: "center", marginBottom: 15 },
  modalItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#F2F2F7" },
  modalItemText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
});