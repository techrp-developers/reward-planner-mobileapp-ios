import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchAllStates } from "../../api/AddressApi";
import { useAlert } from "../alerts";
import { useAppTheme } from "../../../../theme/ThemeContext";

type AddressTag = "Home" | "Work" | "Other";

type StateOption = {
  state_id: number;
  state_name: string;
};

export type AddressFormPayload = {
  saveAs: AddressTag;
  flatHouseBuilding: string;
  areaLocality: string;
  fullAddress: string;
  landmark?: string;
  name?: string;
  phone?: string;
  pincode: string;
  city: string;
  state?: string;
  state_id?: number;
  isDefault?: boolean;
};

type Props = {
  visible: boolean;
  fullAddress: string;
  defaultName?: string;
  defaultPhone?: string;
  initialValues?: Partial<AddressFormPayload>;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (payload: AddressFormPayload) => Promise<void> | void;
};

const ADDRESS_TAGS: AddressTag[] = ["Home", "Work", "Other"];

const normalizePhone = (value: string | undefined) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.slice(0, 10);
};

const tagIcon = (tag: AddressTag) => {
  if (tag === "Home") return "⌂";
  if (tag === "Work") return "⌁";
  return "◎";
};

function useStates() {
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = React.useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchAllStates(forceRefresh);
      setStates(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setStates([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { states, loading, error, retry: () => load(true) };
}

type FormFields = {
  saveAs: AddressTag;
  flatHouseBuilding: string;
  areaLocality: string;
  landmark: string;
  name: string;
  phone: string;
  pincode: string;
  city: string;
  stateId: number | null;
  stateName: string;
};

function buildInitialFields(
  initialValues: Partial<AddressFormPayload> | undefined,
  defaultName?: string,
  defaultPhone?: string
): FormFields {
  return {
    saveAs: initialValues?.saveAs ?? "Home",
    flatHouseBuilding: initialValues?.flatHouseBuilding ?? "",
    areaLocality: initialValues?.areaLocality ?? "",
    landmark: initialValues?.landmark ?? "",
    name: initialValues?.name ?? defaultName ?? "",
    phone: normalizePhone(initialValues?.phone ?? defaultPhone),
    pincode: initialValues?.pincode ?? "",
    city: initialValues?.city ?? "",
    stateId: initialValues?.state_id ?? null,
    stateName: initialValues?.state ?? "",
  };
}

function AddressDetailsSheet({
  visible,
  fullAddress,
  defaultName,
  defaultPhone,
  initialValues,
  submitLabel = "Save address",
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { isDark, theme } = useAppTheme();
  const { states, loading: statesLoading, error: statesError, retry: retryStates } = useStates();

  const [fields, setFields] = useState<FormFields>(() =>
    buildInitialFields(initialValues, defaultName, defaultPhone)
  );
  const [isDefault] = useState(initialValues?.isDefault ?? false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Re-sync fields if the record being edited changes while the sheet stays mounted.
  useEffect(() => {
    setFields(buildInitialFields(initialValues, defaultName, defaultPhone));
    setTouched({});
  }, [initialValues, defaultName, defaultPhone]);

  // Backfill pincode from a freeform address string (e.g. picked from the map) if not already set.
  useEffect(() => {
    if (fields.pincode || !fullAddress) return;
    const match = fullAddress.match(/(\d{6})/);
    if (match) {
      setFields(prev => ({ ...prev, pincode: match[1] }));
    }
  }, [fullAddress, fields.pincode]);

  // If only a state name was supplied (no id), resolve it once the states list loads.
  useEffect(() => {
    if (fields.stateId !== null || !fields.stateName || states.length === 0) return;
    const matched = states.find(
      s => s.state_name.toLowerCase() === fields.stateName.toLowerCase()
    );
    if (matched) {
      setFields(prev => ({ ...prev, stateId: matched.state_id }));
    }
  }, [fields.stateId, fields.stateName, states]);

  const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const markTouched = (key: string) => setTouched(prev => ({ ...prev, [key]: true }));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const flatHouseBuilding = fields.flatHouseBuilding.trim();
    const areaLocality = fields.areaLocality.trim();
    const pincode = fields.pincode.trim();
    const city = fields.city.trim();
    const name = fields.name.trim();
    const phone = fields.phone.trim();

    if (!flatHouseBuilding) {
      e.flatHouseBuilding = "Flat, house number or building name is required";
    } else if (flatHouseBuilding.length < 2) {
      e.flatHouseBuilding = "Enter at least 2 characters";
    }

    if (!areaLocality) {
      e.areaLocality = "Area or locality is required";
    } else if (areaLocality.length < 2) {
      e.areaLocality = "Enter at least 2 characters";
    }

    if (!pincode) {
      e.pincode = "Pincode is required";
    } else if (!/^[1-9]\d{5}$/.test(pincode)) {
      e.pincode = "Enter a valid 6-digit pincode";
    }

    if (!city) {
      e.city = "City is required";
    } else if (city.length < 2) {
      e.city = "Enter a valid city name";
    }

    if (fields.stateId === null) e.stateId = "Please select a state";

    if (!name) {
      e.name = "Contact name is required";
    } else if (name.length < 2) {
      e.name = "Enter a valid contact name";
    }

    if (!phone) {
      e.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      e.phone = "Enter a valid 10-digit mobile number";
    }

    return e;
  }, [fields]);

  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  if (!visible) return null;

  const handleSubmit = async () => {
    setTouched({
      flatHouseBuilding: true,
      areaLocality: true,
      pincode: true,
      city: true,
      stateId: true,
      name: true,
      phone: true,
    });

    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit({
        saveAs: fields.saveAs,
        flatHouseBuilding: fields.flatHouseBuilding.trim(),
        areaLocality: fields.areaLocality.trim(),
        fullAddress,
        landmark: fields.landmark.trim() || undefined,
        name: fields.name.trim(),
        phone: fields.phone.trim(),
        pincode: fields.pincode.trim(),
        city: fields.city.trim(),
        state_id: fields.stateId ?? undefined,
        state: fields.stateName.trim() || undefined,
        isDefault,
      });
    } catch (err: any) {
      console.error("Failed to save address:", err);
      alert.error("Error", err?.response?.data?.message || "Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  const statePlaceholder = statesLoading
    ? "Loading states..."
    : statesError
      ? "Couldn't load states - tap to retry"
      : "Select State";

  const themedInputProps = {
    placeholderTextColor: isDark ? "#71717A" : "#9A9AA5",
    selectionColor: theme.primary,
  };

  return (
    <View style={[styles.overlay, isDark && darkStyles.overlay]}>
      <KeyboardAvoidingView
        style={[styles.sheet, isDark && darkStyles.sheet]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, isDark && darkStyles.header]}>
          <View style={[styles.sheetHandle, isDark && darkStyles.sheetHandle]} />
          <Text style={[styles.headerTitle, isDark && darkStyles.primaryText]}>Enter Complete Address</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Text style={[styles.closeText, isDark && darkStyles.primaryText]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.label, isDark && darkStyles.label]}>Save Address as</Text>
          <View style={styles.chipRow}>
            {ADDRESS_TAGS.map(tag => {
              const active = fields.saveAs === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setField("saveAs", tag)}
                  style={[
                    styles.chip,
                    isDark && darkStyles.chip,
                    active && styles.chipActive,
                    active && isDark && darkStyles.chipActive,
                  ]}
                >
                  <Text style={[styles.chipIcon, isDark && darkStyles.primaryText, active && styles.chipTextActive]}>
                    {tagIcon(tag)}
                  </Text>
                  <Text style={[styles.chipText, isDark && darkStyles.primaryText, active && styles.chipTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, isDark && darkStyles.label]}>Flat / House no / Building Name*</Text>
          <TextInput
            {...themedInputProps}
            value={fields.flatHouseBuilding}
            onChangeText={t => setField("flatHouseBuilding", t)}
            placeholder="Enter here"
            maxLength={120}
            style={[
              styles.input,
              isDark && darkStyles.input,
              touched.flatHouseBuilding && errors.flatHouseBuilding ? styles.inputError : null,
            ]}
            onBlur={() => markTouched("flatHouseBuilding")}
          />
          {touched.flatHouseBuilding && errors.flatHouseBuilding ? (
            <Text style={styles.errorText}>{errors.flatHouseBuilding}</Text>
          ) : null}

          <Text style={[styles.label, isDark && darkStyles.label]}>Area / Sector / Locality*</Text>
          <TextInput
            {...themedInputProps}
            value={fields.areaLocality}
            onChangeText={t => setField("areaLocality", t)}
            placeholder="Enter here"
            maxLength={120}
            style={[
              styles.input,
              isDark && darkStyles.input,
              touched.areaLocality && errors.areaLocality ? styles.inputError : null,
            ]}
            onBlur={() => markTouched("areaLocality")}
          />
          {touched.areaLocality && errors.areaLocality ? (
            <Text style={styles.errorText}>{errors.areaLocality}</Text>
          ) : null}

          <Text style={[styles.label, isDark && darkStyles.label]}>Nearby Landmark (Optional)</Text>
          <TextInput
            {...themedInputProps}
            value={fields.landmark}
            onChangeText={t => setField("landmark", t)}
            placeholder="Enter here"
            maxLength={100}
            style={[styles.input, isDark && darkStyles.input]}
          />

          <Text style={[styles.label, isDark && darkStyles.label]}>Pincode*</Text>
          <TextInput
            {...themedInputProps}
            value={fields.pincode}
            onChangeText={t => setField("pincode", t.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter pincode"
            style={[styles.input, isDark && darkStyles.input, touched.pincode && errors.pincode && styles.inputError]}
            onBlur={() => markTouched("pincode")}
          />
          {touched.pincode && errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}

          <Text style={[styles.label, isDark && darkStyles.label]}>City*</Text>
          <TextInput
            {...themedInputProps}
            value={fields.city}
            onChangeText={t => setField("city", t)}
            placeholder="Enter city"
            maxLength={60}
            style={[styles.input, isDark && darkStyles.input, touched.city && errors.city && styles.inputError]}
            onBlur={() => markTouched("city")}
          />
          {touched.city && errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

          <Text style={[styles.label, isDark && darkStyles.label]}>State*</Text>
          <Dropdown
            style={[
              styles.input,
              isDark && darkStyles.input,
              statesLoading && styles.inputDisabled,
              touched.stateId && errors.stateId && styles.inputError,
            ]}
            data={states}
            labelField="state_name"
            valueField="state_id"
            placeholder={statePlaceholder}
            value={fields.stateId}
            disable={statesLoading}
            placeholderStyle={isDark ? darkStyles.dropdownPlaceholder : undefined}
            selectedTextStyle={isDark ? darkStyles.dropdownText : undefined}
            itemTextStyle={isDark ? darkStyles.dropdownText : undefined}
            containerStyle={isDark ? darkStyles.dropdownContainer : undefined}
            activeColor={isDark ? "#27233A" : undefined}
            onChange={item => {
              setField("stateId", item.state_id);
              setField("stateName", item.state_name);
              markTouched("stateId");
            }}
            renderRightIcon={() =>
              statesLoading ? <ActivityIndicator size="small" color={theme.primary} /> : null
            }
          />
          {statesError ? (
            <TouchableOpacity onPress={retryStates}>
              <Text style={styles.retryText}>Couldn't load states. Tap to retry.</Text>
            </TouchableOpacity>
          ) : null}
          {touched.stateId && errors.stateId ? (
            <Text style={styles.errorText}>{errors.stateId}</Text>
          ) : null}

          <Text style={[styles.label, isDark && darkStyles.label]}>Contact Name*</Text>
          <TextInput
            {...themedInputProps}
            value={fields.name}
            onChangeText={t => setField("name", t)}
            placeholder="Enter name"
            maxLength={80}
            style={[styles.input, isDark && darkStyles.input, touched.name && errors.name && styles.inputError]}
            onBlur={() => markTouched("name")}
          />
          {touched.name && errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}

          <Text style={[styles.label, isDark && darkStyles.label]}>Phone Number*</Text>
          <TextInput
            {...themedInputProps}
            value={fields.phone}
            onChangeText={t => setField("phone", t.replace(/[^\d]/g, ""))}
            placeholder="Enter phone"
            keyboardType="number-pad"
            maxLength={10}
            style={[styles.input, isDark && darkStyles.input, touched.phone && errors.phone && styles.inputError]}
            onBlur={() => markTouched("phone")}
          />
          {touched.phone && errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.9}
            style={[styles.ctaWrapper, { marginBottom: insets.bottom + 78 }]}
          >
            <LinearGradient
              colors={["#8665FF", "#5B47A3"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.cta, submitting && styles.ctaDisabled]}
            >
              <Text style={styles.ctaText}>{submitting ? "Saving..." : submitLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default AddressDetailsSheet;

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", backgroundColor: "transparent" },
  sheet: { height: "78%", backgroundColor: "white", borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: "hidden" },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#eee", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetHandle: {
    position: "absolute",
    top: 8,
    left: "50%",
    marginLeft: -24,
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  headerTitle: { fontSize: 14, fontWeight: "800" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 16, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 22 },
  label: { fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 8 },
  chipRow: { flexDirection: "row", gap: 10 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#e6e6e6", backgroundColor: "white" },
  chipActive: { borderColor: "#7c3aed", backgroundColor: "rgba(124,58,237,0.08)" },
  chipIcon: { fontSize: 14, fontWeight: "800" },
  chipText: { fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#7c3aed" },
  input: { borderWidth: 1, borderColor: "#e6e6e6", backgroundColor: "white", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13 },
  inputDisabled: { opacity: 0.6 },
  inputError: { borderColor: "#ef4444" },
  errorText: { marginTop: 6, color: "#ef4444", fontSize: 11, fontWeight: "700" },
  retryText: { marginTop: 6, color: "#7c3aed", fontSize: 11, fontWeight: "700" },
  ctaWrapper: {
    marginTop: 18,
    alignSelf: "center",
  },
  cta: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 238,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
    paddingVertical: 14,

  },
});

const darkStyles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(0,0,0,0.36)" },
  sheet: { backgroundColor: "#18181B" },
  header: { borderBottomColor: "rgba(255,255,255,0.14)" },
  sheetHandle: { backgroundColor: "#52525B" },
  primaryText: { color: "#F4F4F5" },
  label: { color: "#D4D4D8" },
  chip: {
    backgroundColor: "#27272A",
    borderColor: "rgba(255,255,255,0.18)",
  },
  chipActive: {
    backgroundColor: "#27233A",
    borderColor: "#A78BFA",
  },
  input: {
    backgroundColor: "#27272A",
    borderColor: "rgba(255,255,255,0.18)",
    color: "#F4F4F5",
  },
  dropdownPlaceholder: { color: "#71717A", fontSize: 13 },
  dropdownText: { color: "#F4F4F5", fontSize: 13 },
  dropdownContainer: {
    backgroundColor: "#27272A",
    borderColor: "rgba(255,255,255,0.18)",
  },
});
