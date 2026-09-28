import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import BusBookingStatusPopup, {
  useBusBookingPopup,
} from "../BusBookingStatusPopup";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";
import { blockSeatApi } from "../../services/busBookingApi";
import type { BlockPassenger } from "../../services/busBookingApi";
import {
  deletePassengerProfile,
  loadPassengerProfiles,
  upsertPassengerProfiles,
  type StoredPassengerProfile,
} from "../../utils/busBookingStorage";

type Gender = "M" | "F" | "O";

type PassengerForm = {
  sourceProfileId: string;
  title: string;
  fullName: string;
  age: string;
  gender: Gender;
  email: string;
  phone: string;
  idNumber: string;
  idType: string;
  address: string;
  whatsappUpdates: boolean;
};

const getFareValue = (price: string) => Number(price.replace(/[^\d]/g, "")) || 0;

const createPassengerForm = (): PassengerForm => ({
  sourceProfileId: "",
  title: "Mr",
  fullName: "",
  age: "",
  gender: "M",
  email: "",
  phone: "",
  idNumber: "",
  idType: "",
  address: "",
  whatsappUpdates: true,
});

const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const normalizeAge = (value: string) => value.replace(/\D/g, "").slice(0, 3);

const splitPassengerName = (fullName: string) => {
  const parts = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const mapGenderToProvider = (gender: Gender) => {
  switch (gender) {
    case "M":
      return "1";
    case "F":
      return "2";
    case "O":
      return "3";
    default:
      return "1";
  }
};

const getInitials = (fullName: string) =>
  String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "P";

const mapProfileToForm = (profile: StoredPassengerProfile): PassengerForm => ({
  sourceProfileId: profile.id || "",
  title: profile.title || "Mr",
  fullName: profile.fullName || "",
  age: profile.age || "",
  gender: profile.gender || "M",
  email: profile.email || "",
  phone: profile.phone || "",
  idNumber: profile.idNumber || "",
  idType: profile.idType || "",
  address: profile.address || "",
  whatsappUpdates: true,
});

const getQuickSelectKey = (
  profile: Pick<StoredPassengerProfile, "id" | "fullName" | "phone" | "email">
) => {
  const normalizedId = String(profile.id || "").trim();
  if (normalizedId) {
    return `id:${normalizedId}`;
  }

  const normalizedPhone = String(profile.phone || "").replace(/\D/g, "");
  if (normalizedPhone) {
    return `phone:${normalizedPhone}`;
  }

  const normalizedName = String(profile.fullName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const normalizedEmail = String(profile.email || "").trim().toLowerCase();

  if (normalizedName || normalizedEmail) {
    return `profile:${normalizedName}:${normalizedEmail}`;
  }

  return "";
};

const BLOCK_TEST_REF_ID = "35";

export default function PassengerDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();
  const route = useRoute<RouteProp<BusBookingStackParamList, "PassengerDetailsScreen">>();
  const { popup, showPopup, hidePopup } = useBusBookingPopup();
  const {
    bus,
    selectedSeats,
    boardingPoint,
    droppingPoint,
    traceId,
    srdvIndex,
    resultIndex,
    isWomenBooking,
  } = route.params;

  const [passengers, setPassengers] = React.useState<PassengerForm[]>(
    () => selectedSeats.map(() => ({
      ...createPassengerForm(),
      gender: isWomenBooking ? "F" : "M",
      title: isWomenBooking ? "Miss" : "Mr"
    }))
  );
  const [savedProfiles, setSavedProfiles] = React.useState<StoredPassengerProfile[]>([]);
  const [activePassengerIndex, setActivePassengerIndex] = React.useState(0);
  const [blockingSeat, setBlockingSeat] = React.useState(false);
  const [selectedQuickSelectId, setSelectedQuickSelectId] = React.useState("");
  const [deletedQuickSelectIds, setDeletedQuickSelectIds] = React.useState<string[]>([]);

  const totalFare = getFareValue(bus.price) * selectedSeats.length;
  const idProofRequired =
    String(bus?.raw?.IdProofRequired ?? bus?.IdProofRequired ?? "").toLowerCase() === "true";

  const quickSelectProfiles = React.useMemo(() => {
    const liveProfiles: StoredPassengerProfile[] = passengers
      .map((passenger, index) => ({
        id: passenger.sourceProfileId || `live-passenger-${index}`,
        title: passenger.title,
        fullName: passenger.fullName.trim(),
        age: passenger.age.trim(),
        gender: passenger.gender,
        email: passenger.email.trim(),
        phone: passenger.phone.trim(),
        idNumber: passenger.idNumber.trim(),
        idType: passenger.idType.trim(),
        address: passenger.address.trim(),
        updatedAt: new Date().toISOString(),
      }))
      .filter((profile) => profile.fullName || profile.phone || profile.email);

    const mergedProfiles: StoredPassengerProfile[] = [];
    const seenKeys = new Set<string>();

    [...liveProfiles, ...savedProfiles].forEach((profile, index) => {
      if (profile.id && deletedQuickSelectIds.includes(profile.id)) {
        return;
      }

      const dedupeKey = getQuickSelectKey(profile) || `fallback:${profile.id}:${index}`;
      if (seenKeys.has(dedupeKey)) {
        return;
      }

      seenKeys.add(dedupeKey);
      mergedProfiles.push(profile);
    });

    return mergedProfiles;
  }, [deletedQuickSelectIds, passengers, savedProfiles]);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      const hydrateProfiles = async () => {
        try {
          const profiles = await loadPassengerProfiles();
          if (mounted) {
            setSavedProfiles(profiles);
          }
        } catch (error) {
          console.log("[BusBooking][PassengerDetails] Failed to load saved profiles", error);
        }
      };

      hydrateProfiles();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const updatePassenger = React.useCallback(
    (index: number, key: keyof PassengerForm, value: string | boolean) => {
      setPassengers((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [key]: value } : item
        )
      );
    },
    []
  );

  const applyQuickSelect = React.useCallback(
    (profile: StoredPassengerProfile) => {
      setSelectedQuickSelectId(profile.id || "");
      setPassengers((current) =>
        current.map((item, itemIndex) =>
          itemIndex === activePassengerIndex
            ? {
                ...item,
                ...mapProfileToForm(profile),
              }
            : item
        )
      );
    },
    [activePassengerIndex]
  );

  const removeQuickSelect = React.useCallback(
    async (profile: StoredPassengerProfile) => {
      if (!profile.id) {
        return;
      }

      try {
        setDeletedQuickSelectIds((current) =>
          current.includes(profile.id) ? current : [...current, profile.id]
        );
        setSelectedQuickSelectId((current) => (current === profile.id ? "" : current));
        setSavedProfiles((current) => current.filter((item) => item.id !== profile.id));
        await deletePassengerProfile(profile.id);
        showPopup({
          title: "Quick Select",
          message: "Passenger removed from quick select.",
          variant: "success",
        });
      } catch (error) {
        setDeletedQuickSelectIds((current) => current.filter((id) => id !== profile.id));
        showPopup({
          title: "Quick Select",
          message: "Unable to delete this passenger right now.",
          variant: "error",
        });
      }
    },
    [showPopup]
  );

  const validatePassengers = React.useCallback(() => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let index = 0; index < passengers.length; index++) {
      const passenger = passengers[index];

      if (isWomenBooking && passenger.gender !== "F") {
        showPopup({
          title: "Ladies Booking Preference",
          message: `Passenger ${index + 1} must be Female when Ladies Booking is active.`,
          variant: "warning",
        });
        return false;
      }

      if (!passenger.fullName.trim()) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter full name for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      const nameParts = passenger.fullName.trim().split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter first name and last name for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      if (!passenger.age.trim()) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter age for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      const ageValue = Number(passenger.age.trim());
      if (!Number.isFinite(ageValue) || ageValue < 1 || ageValue > 120) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter a valid age for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      if (passenger.email.trim() && !emailPattern.test(passenger.email.trim())) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter a valid email address for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      if (!passenger.phone.trim()) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter phone number for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      if (!/^\d{10}$/.test(passenger.phone.trim())) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter a valid 10 digit phone number for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      if (!passenger.address.trim()) {
        showPopup({
          title: "Passenger Details",
          message: `Please enter address for Passenger ${index + 1}.`,
          variant: "warning",
        });
        return false;
      }

      if (idProofRequired) {
        if (!passenger.idType.trim()) {
          showPopup({
            title: "Passenger Details",
            message: `Please enter ID type for Passenger ${index + 1}.`,
            variant: "warning",
          });
          return false;
        }

        if (!passenger.idNumber.trim()) {
          showPopup({
            title: "Passenger Details",
            message: `Please enter ID number for Passenger ${index + 1}.`,
            variant: "warning",
          });
          return false;
        }
      }
    }

    return true;
  }, [idProofRequired, passengers, isWomenBooking, showPopup]);

  const buildBlockPassengers = React.useCallback((): BlockPassenger[] => {
    return selectedSeats.map((seat, index) => {
      const passenger = passengers[index];
      const { firstName, lastName } = splitPassengerName(passenger?.fullName || "");

      return {
        Title: passenger?.title || "Mr",
        FirstName: firstName,
        LastName: lastName,
        Gender: mapGenderToProvider(passenger?.gender || "M"),
        Age: Number(passenger?.age),
        Email: String(passenger?.email || ""),
        PhoneNo: String(passenger?.phone || ""),
        LeadPassenger: index === 0,
        IdNumber: String(passenger?.idNumber || ""),
        IdType: String(passenger?.idType || ""),
        Address: String(passenger?.address || ""),
        SeatName: String(seat),
        Seat: bus.selectedSeatDetails?.find((item: any) => String(item.SeatName) === String(seat)),
      };
    });
  }, [bus, passengers, selectedSeats]);

  const handleContinueToSummary = React.useCallback(async () => {
    if (blockingSeat) {
      return;
    }

    if (!validatePassengers()) {
      return;
    }

    if (!traceId || !srdvIndex || !resultIndex) {
      showPopup({
        title: "Booking Error",
        message: "Booking information is missing. Please search for the bus again.",
        variant: "error",
      });
      return;
    }

    if (!boardingPoint?.Id) {
      showPopup({
        title: "Booking Error",
        message: "Please select a boarding point.",
        variant: "warning",
      });
      return;
    }

    if (!droppingPoint?.Id) {
      showPopup({
        title: "Booking Error",
        message: "Please select a dropping point.",
        variant: "warning",
      });
      return;
    }

    const blockPassengers = buildBlockPassengers();
    const sourceCity = String(bus?.from || "").split(",")[0].trim();
    const destinationCity = String(bus?.to || "").split(",")[0].trim();

    const payload = {
      traceId: String(traceId),
      srdvIndex: String(srdvIndex),
      resultIndex: String(resultIndex),
      boardingPointId: String(boardingPoint.Id),
      droppingPointId: String(droppingPoint.Id),
      refId: BLOCK_TEST_REF_ID,
      passengers: blockPassengers,
      email: blockPassengers[0]?.Email,
      sourceCity,
      destinationCity,
    };

    try {
      setBlockingSeat(true);

      const blockResponse = await blockSeatApi(payload);

      const mappedPassengers = selectedSeats.map((seat, index) => ({
        seat: String(seat),
        fullName: passengers[index]?.fullName || `Passenger ${index + 1}`,
        age: passengers[index]?.age || "",
        gender: passengers[index]?.gender || "M",
        email: passengers[index]?.email || "",
        phone: passengers[index]?.phone || "",
      }));

      const profilesToSave: StoredPassengerProfile[] = passengers.map((passenger, index) => ({
        id: passenger.phone.trim() || `${passenger.fullName.trim().toLowerCase()}-${index}`,
        title: passenger.title,
        fullName: passenger.fullName.trim(),
        age: passenger.age.trim(),
        gender: passenger.gender,
        email: passenger.email.trim(),
        phone: passenger.phone.trim(),
        idNumber: passenger.idNumber.trim(),
        idType: passenger.idType.trim(),
        address: passenger.address.trim(),
        updatedAt: new Date().toISOString(),
      }));

      await upsertPassengerProfiles(profilesToSave);
      setSavedProfiles(await loadPassengerProfiles());

      navigation.navigate("BusSummaryScreen", {
        bus,
        selectedSeats,
        passengers: mappedPassengers,
        boardingPoint,
        droppingPoint,
        blockResponse,
      });
    } catch (error: any) {
      const message = String(error?.message || "");
      showPopup({
        title: message.toLowerCase().includes("token") ? "Session Expired" : "Unable to Continue",
        message: message || "Unable to block selected seat.",
        variant: "error",
      });
    } finally {
      setBlockingSeat(false);
    }
  }, [
    blockingSeat,
    boardingPoint,
    buildBlockPassengers,
    bus,
    droppingPoint,
    navigation,
    passengers,
    resultIndex,
    selectedSeats,
    srdvIndex,
    traceId,
    validatePassengers,
  ]);

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

        <Text style={styles.headerTitle}>Passenger Details</Text>

        <View style={styles.headerActions} />
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.quickHeaderRow}>
          <Text style={styles.quickHeaderTitle}>Quick Select</Text>
          <Text style={styles.quickHeaderMeta}>Recent travellers</Text>
        </View>

        {quickSelectProfiles.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickSelectRow}
          >
            {quickSelectProfiles.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.quickSelectItem}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => applyQuickSelect(item)}
                  style={[
                    styles.quickSelectChip,
                    selectedQuickSelectId === item.id ? styles.quickSelectChipActive : null,
                  ]}
                >
                  <View style={styles.quickAvatar}>
                    <Text style={styles.quickAvatarText}>{getInitials(item.fullName)}</Text>
                  </View>
                  <View style={styles.quickSelectBody}>
                    <Text style={styles.quickSelectText} numberOfLines={1}>
                      {item.fullName}
                    </Text>
                    <Text style={styles.quickSelectMeta} numberOfLines={1}>
                      {[item.phone, item.email].filter(Boolean).join(" | ")}
                    </Text>
                  </View>
                </TouchableOpacity>
                {selectedQuickSelectId === item.id ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => removeQuickSelect(item)}
                    style={styles.quickSelectDeleteButton}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={14} color="#D31637" />
                    <Text style={styles.quickSelectDeleteText}>Delete</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.quickSelectEmptyCard}>
            <MaterialCommunityIcons name="account-clock-outline" size={18} color="#B45362" />
            <Text style={styles.quickSelectEmptyText}>
              Travellers you enter in this booking will appear here for quick reuse.
            </Text>
          </View>
        )}

        {selectedSeats.map((seat, index) => {
          const passenger = passengers[index];
          const isActivePassenger = activePassengerIndex === index;

          return (
            <TouchableOpacity
              key={seat}
              activeOpacity={1}
              onPress={() => setActivePassengerIndex(index)}
              style={styles.passengerBlock}
            >
              <View style={styles.passengerHeaderRow}>
                <Text style={styles.passengerTitle}>Passenger {index + 1}</Text>
                <View style={styles.passengerSeatWrap}>
                  <Text style={styles.passengerSeatText}>Seat {seat}</Text>
                </View>
              </View>

              <View style={[styles.formCard, isActivePassenger ? styles.formCardActive : null]}>
                <View style={styles.formSectionHeader}>
                  <View style={styles.formSectionTextWrap}>
                    <Text style={styles.formSectionTitle}>
                      {index === 0 ? "Lead passenger" : "Passenger information"}
                    </Text>
                    <Text style={styles.formSectionSubtitle}>
                      {isActivePassenger
                        ? "Quick Select will update this traveller."
                        : "Tap this card to use Quick Select here."}
                    </Text>
                  </View>
                  {isActivePassenger ? (
                    <View style={styles.activeFormBadge}>
                      <Text style={styles.activeFormBadgeText}>Active</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.fieldLabel}>*Full Name</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={passenger.fullName}
                    onChangeText={(value) => updatePassenger(index, "fullName", value)}
                    placeholder="Enter your name here"
                    placeholderTextColor="#B7B0B8"
                    style={styles.input}
                  />
                  <MaterialCommunityIcons name="account-outline" size={18} color="#A7A0A8" />
                </View>

                <View style={styles.rowFields}>
                  <View style={styles.ageField}>
                    <Text style={styles.fieldLabel}>*Age</Text>
                    <TextInput
                      value={passenger.age}
                      onChangeText={(value) => updatePassenger(index, "age", normalizeAge(value))}
                      placeholder="Enter your age"
                      placeholderTextColor="#B7B0B8"
                      keyboardType="number-pad"
                      maxLength={3}
                      style={styles.inputSolo}
                    />
                  </View>

                  <View style={styles.genderField}>
                    <Text style={styles.fieldLabel}>*Gender</Text>
                    <View style={styles.genderRow}>
                      {(["M", "F", "O"] as Gender[]).map((gender) => {
                        const isActive = passenger.gender === gender;

                        return (
                          <TouchableOpacity
                            key={gender}
                            activeOpacity={0.88}
                            onPress={() => updatePassenger(index, "gender", gender)}
                            style={[styles.genderChip, isActive ? styles.genderChipActive : null]}
                          >
                            <Text
                              style={[
                                styles.genderChipText,
                                isActive ? styles.genderChipTextActive : null,
                              ]}
                            >
                              {gender}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>Email ID</Text>
                  <Text style={styles.optionalLabel}>Optional</Text>
                </View>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={passenger.email}
                    onChangeText={(value) => updatePassenger(index, "email", value)}
                    placeholder="Enter your Email ID here"
                    placeholderTextColor="#B7B0B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <MaterialCommunityIcons name="email-outline" size={18} color="#A7A0A8" />
                </View>

                <Text style={styles.fieldLabel}>*Phone number</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={passenger.phone}
                    onChangeText={(value) =>
                      updatePassenger(index, "phone", normalizePhoneNumber(value))
                    }
                    placeholder="Enter your phone number"
                    placeholderTextColor="#B7B0B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.input}
                  />

                  <MaterialCommunityIcons name="phone-outline" size={18} color="#A7A0A8" />
                </View>

                <Text style={styles.fieldLabel}>*Address</Text>
                <View style={[styles.inputWrap, styles.inputWrapMultiline]}>
                  <TextInput
                    value={passenger.address}
                    onChangeText={(value) => updatePassenger(index, "address", value)}
                    placeholder="Enter your address"
                    placeholderTextColor="#B7B0B8"
                    multiline
                    style={[styles.input, styles.inputMultiline]}
                  />

                  <MaterialCommunityIcons name="map-marker-outline" size={18} color="#A7A0A8" />
                </View>

                {idProofRequired ? (
                  <>
                    <Text style={styles.fieldLabel}>*ID Type</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        value={passenger.idType}
                        onChangeText={(value) => updatePassenger(index, "idType", value)}
                        placeholder="Enter ID type"
                        placeholderTextColor="#B7B0B8"
                        style={styles.input}
                      />

                      <MaterialCommunityIcons
                        name="card-account-details-outline"
                        size={18}
                        color="#A7A0A8"
                      />
                    </View>

                    <Text style={styles.fieldLabel}>*ID Number</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        value={passenger.idNumber}
                        onChangeText={(value) => updatePassenger(index, "idNumber", value)}
                        placeholder="Enter ID number"
                        placeholderTextColor="#B7B0B8"
                        style={styles.input}
                      />

                      <MaterialCommunityIcons name="identifier" size={18} color="#A7A0A8" />
                    </View>
                  </>
                ) : null}

                <View style={styles.checkboxRow}>
                  <Switch
                    value={passenger.whatsappUpdates}
                    onValueChange={(value) => updatePassenger(index, "whatsappUpdates", value)}
                    trackColor={{ false: "#E4DADF", true: "#F2A0AD" }}
                    thumbColor={passenger.whatsappUpdates ? "#BE1028" : "#FFFFFF"}
                    ios_backgroundColor="#E4DADF"
                  />
                  <Text style={styles.checkboxText}>
                    Send booking confirmation and trip updates via WhatsApp and Email.
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </KeyboardAwareScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomSummaryRow}>
          <Text style={styles.bottomSeatCount}>
            {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
          </Text>

          <View style={styles.bottomFareWrap}>
            <Text style={styles.bottomFare}>Rs {totalFare.toLocaleString("en-IN")}</Text>
            <View style={styles.addIconBox}>
              <MaterialCommunityIcons name="plus" size={14} color="#6D6A72" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={blockingSeat ? 1 : 0.9}
          disabled={blockingSeat}
          onPress={handleContinueToSummary}
          style={[styles.continueButtonWrap, blockingSeat ? { opacity: 0.7 } : null]}
        >
          <LinearGradient
            colors={["#D31637", "#B20C28"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            {blockingSeat ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={[styles.continueButtonText, { marginLeft: 8 }]}>Blocking seat...</Text>
              </>
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <BusBookingStatusPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        buttonText={popup.buttonText}
        onClose={hidePopup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F5",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
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
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: "#3B3740",
    fontSize: 17,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#556A7A",
    alignItems: "center",
    justifyContent: "center",
  },
  pageIntroCard: {
    marginTop: 16,
    marginHorizontal: 12,
    backgroundColor: "#FFF7F8",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3D7DC",
    padding: 14,
  },
  pageIntroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  pageIntroTextWrap: {
    flex: 1,
  },
  pageIntroTitle: {
    color: "#332D33",
    fontSize: 17,
    fontWeight: "800",
  },
  pageIntroSubtitle: {
    marginTop: 4,
    color: "#7B6670",
    fontSize: 13,
    lineHeight: 19,
  },
  pageIntroHint: {
    marginTop: 12,
    color: "#A04A5B",
    fontSize: 12,
    fontWeight: "600",
  },
  seatBadge: {
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  seatBadgeText: {
    color: "#BF1431",
    fontSize: 12,
    fontWeight: "800",
  },
  quickHeaderRow: {
    marginTop: 16,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickHeaderTitle: {
    color: "#4B4650",
    fontSize: 16,
    fontWeight: "700",
  },
  quickHeaderMeta: {
    color: "#8C5B66",
    fontSize: 13,
    fontWeight: "600",
  },
  quickSelectRow: {
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 12,
  },
  quickSelectItem: {
    gap: 8,
  },
  quickSelectChip: {
    minWidth: 188,
    minHeight: 58,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#F6D1D8",
    flexDirection: "row",
    alignItems: "center",
  },
  quickSelectChipActive: {
    borderColor: "#D31637",
    backgroundColor: "#FFE9EE",
  },
  quickAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#C81835",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  quickAvatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  quickSelectBody: {
    flex: 1,
  },
  quickSelectText: {
    color: "#CB1733",
    fontSize: 14,
    fontWeight: "700",
  },
  quickSelectMeta: {
    marginTop: 2,
    color: "#8A6A74",
    fontSize: 11,
    fontWeight: "500",
  },
  quickSelectDeleteButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF1F4",
    borderWidth: 1,
    borderColor: "#F4C8D0",
  },
  quickSelectDeleteText: {
    color: "#D31637",
    fontSize: 11,
    fontWeight: "700",
  },
  quickSelectEmptyCard: {
    marginHorizontal: 12,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1DADF",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  quickSelectEmptyText: {
    flex: 1,
    marginLeft: 10,
    color: "#8A6D75",
    fontSize: 12,
    lineHeight: 18,
  },
  passengerBlock: {
    marginTop: 22,
    marginHorizontal: 12,
  },
  passengerHeaderRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passengerTitle: {
    color: "#4A4650",
    fontSize: 16,
    fontWeight: "700",
  },
  passengerSeatWrap: {
    borderRadius: 999,
    backgroundColor: "#FCEBED",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  passengerSeatText: {
    color: "#C21331",
    fontSize: 11,
    fontWeight: "800",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DFD9",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  formCardActive: {
    borderColor: "#D31637",
    shadowOpacity: 0.09,
  },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  formSectionTextWrap: {
    flex: 1,
  },
  formSectionTitle: {
    color: "#35303A",
    fontSize: 15,
    fontWeight: "800",
  },
  formSectionSubtitle: {
    marginTop: 2,
    color: "#8A8590",
    fontSize: 12,
    lineHeight: 17,
  },
  activeFormBadge: {
    borderRadius: 999,
    backgroundColor: "#FFF1F3",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeFormBadgeText: {
    color: "#C40F2A",
    fontSize: 11,
    fontWeight: "800",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldLabel: {
    color: "#59535D",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  optionalLabel: {
    color: "#9C95A0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: "#EFE6E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputWrapMultiline: {
    alignItems: "flex-start",
    paddingTop: 10,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    color: "#3D3840",
    fontSize: 13,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 58,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  rowFields: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ageField: {
    flex: 1,
    marginRight: 10,
  },
  genderField: {
    flex: 1,
  },
  inputSolo: {
    height: 42,
    borderWidth: 1,
    borderColor: "#EFE6E0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: "#3D3840",
    fontSize: 13,
  },
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  genderChip: {
    width: 42,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CEC5C8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  genderChipActive: {
    backgroundColor: "#C40F2A",
    borderColor: "#C40F2A",
  },
  genderChipText: {
    color: "#8D8690",
    fontSize: 13,
    fontWeight: "700",
  },
  genderChipTextActive: {
    color: "#FFFFFF",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  checkboxText: {
    flex: 1,
    marginLeft: 8,
    color: "#B1AAB3",
    fontSize: 10,
    lineHeight: 14,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: "#EEE7E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  bottomSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bottomSeatCount: {
    color: "#3F3A43",
    fontSize: 13,
    fontWeight: "500",
  },
  bottomFareWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  bottomFare: {
    color: "#3C3740",
    fontSize: 18,
    fontWeight: "800",
  },
  addIconBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#A7A1AA",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  continueButtonWrap: {
    width: "100%",
  },
  continueButton: {
    height: 42,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
