import { goBackInFitness } from "../../utils/fitnessNavigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "./FitnessGradient";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SvgProps } from "react-native-svg";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import { RESPONSIVE } from "../../utils/theme";
import WeightLoss from "../../assets/StepCount/weaight_loss.svg";
import WeightGain from "../../assets/StepCount/weight_gain.svg";
import StayHealthy from "../../assets/StepCount/stey_healthy.svg";
import GenderMaleArt from "../../assets/StepCount/goal_gender_male.svg";
import GenderFemaleArt from "../../assets/StepCount/goal_gender_female.svg";
import GenderOthersArt from "../../assets/StepCount/goal_gender_others.svg";
import {
  updateBasicProfile,
  updateBodyProfile,
  type GoalType,
} from "../../api/ProfileAPI";
import { useInvalidateFitnessQueries } from "../../api/useFitnessQueries";
import { useProfilePlanCache, useProfilePlanQuery } from "../../api/useProfilePlan";
import { getSelectedGender, rememberSelectedGender } from "../../utils/userGender";
import {
  DEFAULT_HEIGHT_CM,
  DEFAULT_WEIGHT_KG,
  HEIGHT_OPTIONS,
  WEIGHT_OPTIONS,
  nearestOption,
  optionLabel,
} from "../../utils/measurements";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n";
import { translateSourceText } from "../../../../i18n/sourceText";
import { useStepStyles } from "../../utils/useStepTheme";
import StatusBarShield from "./StatusBarShield";

type StepFormNavProp = NativeStackNavigationProp<FitnessStackParamList, "StepForm">;

type FieldKey = "age" | "height" | "weight";
type Gender = "male" | "female" | "other";

const TOTAL_STEPS = 3;
// The server accepts ages 13–120.
const ageList = Array.from({ length: 78 }, (_, i) => `${i + 13} Years`);
const DEFAULT_AGE = "24 Years";
const heightList = HEIGHT_OPTIONS.map((o) => o.label);
const weightList = WEIGHT_OPTIONS.map((o) => o.label);

const goals = [
  { id: 1, label: "Weight Loss", goalType: "weight_loss" as GoalType, Icon: WeightLoss },
  { id: 2, label: "Weight Gain", goalType: "weight_gain" as GoalType, Icon: WeightGain },
  { id: 3, label: "Stay Healthy", goalType: "stay_healthy" as GoalType, Icon: StayHealthy },
];

// Static character art from assets/StepCount (intrinsic sizes keep the aspect ratio).
const GENDERS: { key: Gender; label: string; icon: string; color: string; Art: React.FC<SvgProps>; size: [number, number] }[] = [
  { key: "male", label: "stepCounter:stepForm.male", icon: "gender-male", color: "#2F6BFF", Art: GenderMaleArt, size: [276, 317] },
  { key: "female", label: "stepCounter:stepForm.female", icon: "gender-female", color: "#E8409A", Art: GenderFemaleArt, size: [269, 309] },
  { key: "other", label: "stepCounter:stepForm.others", icon: "dots-grid", color: "#7B3FF2", Art: GenderOthersArt, size: [252, 296] },
];

const genderOf = (value: unknown): Gender | null => {
  const g = String(value ?? "").trim().toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  if (g === "other" || g === "others" || g === "o") return "other";
  return null;
};

const VD_DARK = {
  bg: ["#070A16", "#111735", "#201A3F"],
  accent: "#8EA2FF",
  accentDark: "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg: "#141A33",
  cardBorder: "rgba(174,188,255,0.16)",
  white: "#FFFFFF",
  whiteMid: "#CDD2EA",
  whiteLow: "#979EBC",
  shadow: "#000000",
  elevation: 0,
  cta: ["#8EA2FF", "#B9C4FF"],
  ctaOff: ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.10)"],
  ctaText: "#070A16",
  ctaBase: "#8EA2FF",
  sheet: "#111735",
  pill: "rgba(142,162,255,0.16)",
  pillText: "#C9BBFF",
  dotOn: "#9B7BFF",
  dotOff: "rgba(205,210,234,0.28)",
  backBg: "#1B2240",
  artBg: "rgba(142,162,255,0.10)",
  labelBg: "#1E2546",
  selectedBg: "rgba(142,162,255,0.16)",
  selectedBorder: "#9B7BFF",
  check: "#8E6BFF",
};

type Palette = typeof VD_DARK;

const VD_LIGHT: Palette = {
  bg: ["#EEF3FF", "#F7F5FF", "#F1ECFF"],
  accent: "#426BFF",
  accentDark: "#5B3FD9",
  accentFaint: "rgba(66,107,255,0.10)",
  cardBg: "#FFFFFF",
  cardBorder: "#E7EAF6",
  white: "#10152D",
  whiteMid: "#4A5275",
  whiteLow: "#777FA5",
  shadow: "#5B3FD9",
  elevation: 3,
  cta: ["#11C5F9", "#426BFF", "#773CFF", "#A334F8"],
  ctaOff: ["#DCE3F5", "#E4E1F5"],
  ctaText: "#FFFFFF",
  ctaBase: "#426BFF",
  sheet: "#FFFFFF",
  pill: "#EDE8FF",
  pillText: "#5B2EFF",
  dotOn: "#6236FF",
  dotOff: "#DDD8F3",
  backBg: "#FFFFFF",
  artBg: "#F1EEFF",
  labelBg: "#FFFFFF",
  selectedBg: "#F3EEFF",
  selectedBorder: "#793FFF",
  check: "#5B2EFF",
};

const parseLeadingNumber = (value: string) => {
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

// Labels are feet + inches (5' 8"); the cm value comes from the same option.
const heightLabelToCm = (label: string) =>
  HEIGHT_OPTIONS.find((o) => o.label === label)?.value ?? DEFAULT_HEIGHT_CM;

// ─── Pieces ───────────────────────────────────────────────────────────────────

const GenderCard = React.memo(({ option, width, selected, onPress }: {
  option: (typeof GENDERS)[number];
  width: number;
  selected: boolean;
  onPress: () => void;
}) => {
  const { palette: VD, styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { t: tx } = useTranslation();
  const artWidth = width - 12;
  const artHeight = artWidth * (option.size[1] / option.size[0]);
  const label = tx(option.label);
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.genderCard, { width }, selected && styles.genderCardSelected]}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <View style={[styles.genderArt, { height: artHeight * 0.86 }]}>
        <option.Art width={artWidth} height={artHeight} />
      </View>
      <View style={styles.genderLabel}>
        <MaterialCommunityIcons name={option.icon} size={width < 104 ? 16 : 20} color={option.color} />
        <Text style={styles.genderText} maxFontSizeMultiplier={1.2}>{label}</Text>
      </View>
      {selected && (
        <View style={styles.genderCheck}>
          <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
        </View>
      )}
      {!selected && <View style={[styles.genderCheckOff, { borderColor: VD.cardBorder }]} />}
    </TouchableOpacity>
  );
});

const Field = React.memo(({ label, icon, value, onPress }: {
  label: string; icon: string; value: string; onPress: () => void;
}) => {
  const { palette: VD, styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel} maxFontSizeMultiplier={1.3}>{label}</Text>
      <TouchableOpacity activeOpacity={0.85} style={styles.field} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
        <MaterialCommunityIcons name={icon} size={22} color={VD.accentDark} />
        <Text style={styles.fieldValue} maxFontSizeMultiplier={1.2}>{value}</Text>
        <MaterialCommunityIcons name="chevron-down" size={22} color={VD.whiteMid} />
      </TouchableOpacity>
    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const StepForm = () => {
  const { palette: VD, styles, isDark } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  const { t: tx } = useTranslation();
  const navigation = useNavigation<StepFormNavProp>();
  const route = useRoute<RouteProp<FitnessStackParamList, "StepForm">>();
  const invalidateFitnessQueries = useInvalidateFitnessQueries();
  const { invalidate: invalidateProfilePlan } = useProfilePlanCache();
  const { data: savedPlan } = useProfilePlanQuery();
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Users whose basic details are already saved resume on measurements.
  const [step, setStep] = useState(route.params?.startAt === "body" ? 3 : 1);
  const [gender, setGender] = useState<Gender | null>(() => genderOf(getSelectedGender()));
  const [age, setAge] = useState(DEFAULT_AGE);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [heightValue, setHeightValue] = useState(() => optionLabel(HEIGHT_OPTIONS, DEFAULT_HEIGHT_CM));
  const [weight, setWeight] = useState(() => optionLabel(WEIGHT_OPTIONS, DEFAULT_WEIGHT_KG));
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<FieldKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Show the user's latest saved details instead of blank defaults — once,
  // so a refetch never overwrites what they are changing now.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !savedPlan) return;
    prefilled.current = true;
    const savedGender = genderOf(getSelectedGender()) ?? genderOf(savedPlan.gender);
    if (savedGender) setGender(savedGender);
    const savedAge = Number(savedPlan.age);
    if (savedAge >= 13 && savedAge <= 90) setAge(`${savedAge} Years`);
    const savedGoal = goals.find((g) => g.goalType === savedPlan.goal_type || g.label === savedPlan.goal);
    if (savedGoal) setSelectedGoal(savedGoal.id);
    const h = nearestOption(HEIGHT_OPTIONS, savedPlan.height_cm);
    if (h) setHeightValue(h.label);
    const w = nearestOption(WEIGHT_OPTIONS, savedPlan.weight_kg);
    if (w) setWeight(w.label);
  }, [savedPlan]);

  const pad = RESPONSIVE.horizontalPadding;
  const contentWidth = Math.min(width - pad * 2, 520);
  const genderColumns = width < 360 || fontScale > 1.2 ? 2 : 3;
  const cardWidth = Math.floor((contentWidth - 12 * (genderColumns - 1)) / genderColumns);
  const goalIconSize = width < 360 || height < 700 ? 42 : 52;

  const dropdownItems = useMemo(() => {
    if (currentField === "age") return ageList;
    if (currentField === "height") return heightList;
    if (currentField === "weight") return weightList;
    return [];
  }, [currentField]);
  const currentValue = currentField === "age" ? age : currentField === "height" ? heightValue : weight;

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      return true;
    }
    goBackInFitness(navigation, "StepWelcome");
    return true;
  }, [navigation, step]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", handleBack);
      return () => subscription.remove();
    }, [handleBack])
  );

  const openDropdown = useCallback((field: FieldKey) => {
    setCurrentField(field);
    setModalVisible(true);
  }, []);

  const handleSelect = useCallback((value: string) => {
    if (currentField === "age") setAge(value);
    if (currentField === "height") setHeightValue(value);
    if (currentField === "weight") setWeight(value);
    setModalVisible(false);
  }, [currentField]);

  const selectedGoalType = useMemo(
    () => goals.find((goal) => goal.id === selectedGoal)?.goalType,
    [selectedGoal]
  );

  const handleNext = useCallback(async () => {
    if (step === 1) {
      if (!gender) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!gender) {
        setStep(1);
        return;
      }
      if (!selectedGoalType) {
        Alert.alert(i18n.t("stepCounter:stepForm.selectGoal"), i18n.t("stepCounter:stepForm.pleaseSelectYourGoalFirst"));
        return;
      }
      try {
        setSubmitting(true);
        const res = await updateBasicProfile({
          gender,
          age: Math.round(parseLeadingNumber(age)),
          goal_type: selectedGoalType,
        });

        if (!res.success) {
          Alert.alert(i18n.t("stepCounter:stepForm.profileUpdateFailed"), res.message);
          return;
        }

        rememberSelectedGender(gender);
        invalidateFitnessQueries();
        invalidateProfilePlan();
        setStep(3);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateBodyProfile({
        height_cm: heightLabelToCm(heightValue),
        weight_kg: Math.round(parseLeadingNumber(weight)),
      });

      if (!res.success) {
        Alert.alert(i18n.t("stepCounter:stepForm.bodyProfileUpdateFailed"), res.message);
        return;
      }

      invalidateFitnessQueries();
      invalidateProfilePlan();
      navigation.navigate("BMICart");
    } finally {
      setSubmitting(false);
    }
  }, [
    age,
    gender,
    heightValue,
    invalidateFitnessQueries,
    invalidateProfilePlan,
    navigation,
    selectedGoalType,
    step,
    weight,
  ]);

  const copy = step === 1
    ? { eyebrow: tx("stepCounter:stepForm.aboutYou"), title: tx("stepCounter:stepForm.tellUsAboutYourself"), sub: tx("stepCounter:stepForm.selectGenderSub") }
    : step === 2
      ? { eyebrow: tx("stepCounter:stepForm.personalPlan"), title: tx("stepCounter:stepForm.whatSYourGoal"), sub: tx("stepCounter:stepForm.chooseWhatYouWantRp") }
      : { eyebrow: tx("stepCounter:stepForm.finalCheck"), title: tx("stepCounter:stepForm.almostThere"), sub: tx("stepCounter:stepForm.addYourBodyMetricsTo") };

  const canContinue = step === 1 ? !!gender : step === 2 ? !!selectedGoal : true;

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient colors={VD.bg} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: pad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inner, { width: contentWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={tx("common:actions.back")}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={VD.white} />
            </TouchableOpacity>
            <View style={styles.progress}>
              <View style={styles.progressPill}>
                <Text style={styles.progressText} maxFontSizeMultiplier={1.3}>
                  {tx("stepCounter:stepForm.stepOf", { step, total: TOTAL_STEPS })}
                </Text>
              </View>
              <View style={styles.dots}>
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                  <View key={i} style={[styles.dot, i + 1 === step && styles.dotNow, i + 1 < step && styles.dotDone]} />
                ))}
              </View>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.headingBlock}>
          <Text style={styles.eyebrow} maxFontSizeMultiplier={1.3}>{copy.eyebrow}</Text>
          <Text style={[styles.title, width < 360 && styles.titleSmall]} maxFontSizeMultiplier={1.2}>{copy.title}</Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>{copy.sub}</Text>
          </View>

          {step === 1 ? (
            <>
              <View style={styles.genderRow}>
                {GENDERS.map((option) => (
                  <GenderCard
                    key={option.key}
                    option={option}
                    width={cardWidth}
                    selected={gender === option.key}
                    onPress={() => setGender(option.key)}
                  />
                ))}
              </View>
              <Field
                label={tx("stepCounter:stepForm.age")}
                icon="cake-variant-outline"
                value={translateSourceText("stepCounter", age)}
                onPress={() => openDropdown("age")}
              />
            </>
          ) : null}

          {step === 2 ? (
            <View style={styles.goalRow}>
              {goals.map(({ id, label, Icon }) => {
                const selected = selectedGoal === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.goalBox, selected && styles.goalSelected]}
                    activeOpacity={0.86}
                    onPress={() => setSelectedGoal(id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={styles.goalArt}>
                      <Icon width={goalIconSize} height={goalIconSize} />
                    </View>
                    <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
                      {translateSourceText("stepCounter", label)}
                    </Text>
                    <View style={[styles.goalRadio, selected && styles.goalRadioSelected]}>
                      {selected && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {step === 3 ? (
            <View style={[styles.measureRow, (width < 360 || fontScale > 1.2) && styles.measureStack]}>
              <View style={styles.measureCol}>
                <Field
                  label={tx("stepCounter:bMIScreen.height")}
                  icon="human-male-height"
                  value={heightValue}
                  onPress={() => openDropdown("height")}
                />
              </View>
              <View style={styles.measureCol}>
                <Field
                  label={tx("stepCounter:bMIScreen.weight")}
                  icon="weight-kilogram"
                  value={weight}
                  onPress={() => openDropdown("weight")}
                />
              </View>
            </View>
          ) : null}

          <GradientButton
            label={step === 3 ? tx("stepCounter:stepForm.submit") : tx("stepCounter:stepForm.continue")}
            disabled={!canContinue || submitting}
            loading={submitting}
            onPress={handleNext}
          />
        </View>
      </ScrollView>
      <StatusBarShield color={VD.bg[0]} />

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        useNativeDriver
        hideModalContentWhileAnimating
        style={styles.modalWrap}
      >
        <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.modalHandle} />
          {dropdownItems.length === 0 ? (
            <ActivityIndicator color={VD.accentDark} />
          ) : (
            <FlatList
              data={dropdownItems}
              keyExtractor={(item) => item}
              initialNumToRender={18}
              maxToRenderPerBatch={18}
              windowSize={7}
              initialScrollIndex={Math.max(0, dropdownItems.indexOf(currentValue) - 2)}
              getItemLayout={(_, index) => ({ length: MODAL_ROW, offset: MODAL_ROW * index, index })}
              renderItem={({ item }) => {
                const active = item === currentValue;
                return (
                  <TouchableOpacity style={styles.modalItem} activeOpacity={0.8} onPress={() => handleSelect(item)}>
                    <Text style={[styles.modalText, active && styles.modalTextActive]}>
                      {currentField === "age" ? translateSourceText("stepCounter", item) : item}
                    </Text>
                    {active && <MaterialCommunityIcons name="check" size={18} color={VD.accent} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const GradientButton = React.memo(({
  label,
  disabled,
  loading,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) => {
  const { palette: VD, styles } = useStepStyles(VD_LIGHT, VD_DARK, createStyles);
  return (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    disabled={disabled}
    style={[styles.buttonWrap, !disabled && styles.buttonShadow]}
    accessibilityRole="button"
    accessibilityState={{ disabled, busy: loading }}
  >
    <LinearGradient
      colors={disabled ? VD.ctaOff : VD.cta}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.button}
    >
      {loading ? (
        <ActivityIndicator color={disabled ? VD.whiteLow : VD.ctaText} />
      ) : (
        <>
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]} maxFontSizeMultiplier={1.2}>{label}</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color={disabled ? VD.whiteLow : VD.ctaText} />
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
  );
});

export default React.memo(StepForm);

const MODAL_ROW = 52;

const createStyles = (VD: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: VD.bg[0] },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  inner: { flexGrow: 1, paddingBottom: 4 },
  headingBlock: { marginTop: 8, marginBottom: 24 },

  // Header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: VD.backBg,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#2B2F6B", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerSpacer: { width: 44 },
  progress: { flex: 1, alignItems: "center", paddingTop: 4 },
  progressPill: { backgroundColor: VD.pill, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 6 },
  progressText: { lineHeight: 20, fontSize: 13, fontWeight: "700", color: VD.pillText },
  dots: { flexDirection: "row", gap: 5, marginTop: 10 },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: VD.dotOff },
  dotDone: { backgroundColor: VD.dotOn, opacity: 0.55 },
  dotNow: { width: 28, backgroundColor: VD.dotOn },

  eyebrow: {
    fontSize: 11, lineHeight: 18, paddingVertical: 2, fontWeight: "700", letterSpacing: 1.8,
    textTransform: "uppercase", color: VD.whiteMid, textAlign: "center", marginBottom: 6,
  },
  title: { paddingVertical: 3, fontSize: 30, lineHeight: 38, fontWeight: "800", color: VD.white, textAlign: "center", marginBottom: 6 },
  titleSmall: { fontSize: 24, lineHeight: 30 },
  subtitle: { fontSize: 15, lineHeight: 21, color: VD.whiteLow, textAlign: "center", marginBottom: 0 },

  // Gender cards
  genderRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "stretch", marginBottom: 20 },
  genderCard: {
    borderRadius: 22,
    backgroundColor: VD.cardBg,
    borderWidth: 2, borderColor: VD.cardBorder,
    alignItems: "center",
    paddingBottom: 8,
    shadowColor: VD.shadow, shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: VD.elevation,
  },
  genderCardSelected: { borderColor: VD.selectedBorder, backgroundColor: VD.selectedBg },
  // Keep decorative artwork clipped independently from the wrapping label.
  genderArt: {
    alignSelf: "stretch",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: VD.artBg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 6,
  },
  genderLabel: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
    marginTop: 8,
    marginHorizontal: 6,
    alignSelf: "stretch",
    minHeight: 38,
    paddingVertical: 6,
    borderRadius: 19,
    backgroundColor: VD.labelBg,
    paddingHorizontal: 6,
    shadowColor: VD.shadow, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  genderText: { flexShrink: 1, lineHeight: 20, paddingVertical: 2, textAlign: "center", fontSize: 14, fontWeight: "800", color: VD.white },
  genderCheck: {
    position: "absolute", top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: VD.check,
    borderWidth: 2, borderColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  genderCheckOff: {
    position: "absolute", top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  // Fields
  fieldWrap: { marginBottom: 16, padding: 16, backgroundColor: VD.cardBg, borderRadius: 22, borderWidth: 1, borderColor: VD.cardBorder },
  measureCol: { flex: 1, minWidth: 0 },
  fieldLabel: { lineHeight: 22, paddingVertical: 2, fontSize: 14, fontWeight: "700", color: VD.white, marginBottom: 8 },
  field: {
    flexDirection: "row", alignItems: "center", gap: 8,
    minHeight: 58,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: VD.selectedBorder,
    backgroundColor: VD.selectedBg,
  },
  fieldValue: { flex: 1, minWidth: 0, lineHeight: 26, paddingVertical: 2, fontSize: 18, fontWeight: "700", color: VD.white },
  measureRow: { flexDirection: "row", gap: 12 },
  measureStack: { flexDirection: "column", gap: 0 },

  // Goal type
  goalRow: { gap: 12, marginBottom: 20 },
  goalBox: {
    flexDirection: "row",
    gap: 14,
    minHeight: 96,
    backgroundColor: VD.cardBg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: VD.cardBorder,
    alignItems: "center",
    padding: 16,
    shadowColor: VD.shadow, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
    elevation: VD.elevation,
  },
  goalSelected: { borderColor: VD.selectedBorder, backgroundColor: VD.selectedBg },
  goalLabel: { flex: 1, minWidth: 0, fontSize: 17, lineHeight: 24, paddingVertical: 3, fontWeight: "700", color: VD.whiteMid },
  goalArt: { width: 60, height: 60, borderRadius: 18, backgroundColor: VD.artBg, alignItems: "center", justifyContent: "center" },
  goalRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: VD.cardBorder, alignItems: "center", justifyContent: "center" },
  goalRadioSelected: { backgroundColor: VD.check, borderColor: VD.check },
  goalLabelSelected: { color: VD.accentDark },

  // CTA
  buttonWrap: { width: "100%", marginTop: 24, marginBottom: 8, borderRadius: 28 },
  buttonShadow: {
    backgroundColor: VD.ctaBase,
    shadowColor: VD.ctaBase, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  button: { minHeight: 56, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 28, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  buttonText: { flexShrink: 1, textAlign: "center", lineHeight: 26, paddingVertical: 2, fontSize: 18, fontWeight: "800", color: VD.ctaText },
  buttonTextDisabled: { color: VD.whiteLow },

  // Picker
  modalWrap: { justifyContent: "flex-end", margin: 0 },
  modalBox: {
    backgroundColor: VD.sheet,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: VD.cardBorder,
    maxHeight: "60%",
    padding: 14, paddingBottom: 28,
  },
  modalHandle: {
    width: 44, height: 4, borderRadius: 2,
    backgroundColor: VD.cardBorder, alignSelf: "center", marginBottom: 10,
  },
  modalItem: {
    height: MODAL_ROW,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: VD.cardBorder,
  },
  modalText: { fontSize: 15, fontWeight: "600", color: VD.white },
  modalTextActive: { color: VD.accent, fontWeight: "800" },
});
