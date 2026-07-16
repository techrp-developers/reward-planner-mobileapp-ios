import { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import StepsCounterCard from "./StepsCounterCard";
import PaymentsQuickAccessCard from "./PaymentsQuickAccessCard";
import { rs} from "../../../utils/responsive";
import { useStepTracker, StepDataState } from "../../step_counter/component/StepCode/useStepTracker";

// ── Constants ──────────────────────────────────────────────────────────────
const GOAL_STEPS = 7000;

// ── StepStatusBanner ───────────────────────────────────────────────────────
type BannerProps = {
  state: StepDataState;
  onConnectSource: () => void;
  onRefresh: () => void;
  onGrantPermission: () => void;
};

function StepStatusBanner({ state }: BannerProps) {
  if (state === 'ok' || state === 'loading') return null;

  // if (state === 'no_permission') {
  //   return (
  //     <TouchableOpacity style={[bannerStyles.banner, bannerStyles.red]} onPress={onGrantPermission} activeOpacity={0.8}>
  //       <Text style={bannerStyles.icon}>🔒</Text>
  //       <Text style={[bannerStyles.text, bannerStyles.textRed]}>
  //         Steps permission not granted — tap to fix
  //       </Text>
  //     </TouchableOpacity>
  //   );
  // }

  // if (state === 'no_source') {
  //   return (
  //     <TouchableOpacity style={[bannerStyles.banner, bannerStyles.amber]} onPress={onConnectSource} activeOpacity={0.8}>
  //       <Text style={bannerStyles.icon}>🔗</Text>
  //       <Text style={[bannerStyles.text, bannerStyles.textAmber]}>
  //         No fitness app connected — tap to open Health Connect
  //       </Text>
  //     </TouchableOpacity>
  //   );
  // }

  // no_steps_today
  // return (
  //   <TouchableOpacity style={[bannerStyles.banner, bannerStyles.grey]} onPress={onRefresh} activeOpacity={0.8}>
  //     <Text style={bannerStyles.icon}>🔄</Text>
  //     <Text style={[bannerStyles.text, bannerStyles.textGrey]}>
  //       No steps recorded today — make sure your fitness app is syncing
  //     </Text>
  //   </TouchableOpacity>
  // );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Home_Chart() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();

  const {
    totalSteps,
    stepDataState,
    openHealthConnect,
    refreshSteps,
    requestStepsPermission,
  } = useStepTracker();

  const layout = useMemo(() => {
    const horizontalPadding = rs(width >= 768 ? 20 : 16);
    const gap = rs(12);
    const maxContentWidth = rs(540);
    const contentWidth = Math.min(width - horizontalPadding * 2, maxContentWidth);
    const cardWidth = Math.floor((contentWidth - gap) / 2);
    return { cardWidth, containerPadding: horizontalPadding, contentWidth, gap };
  }, [width]);

  const progressPercent = useMemo(
    () => Math.min((totalSteps / GOAL_STEPS) * 100, 100),
    [totalSteps],
  );

  const goToRewards = useCallback(() => {
    const parent = navigation.getParent?.();
    parent?.navigate("RewardStack", { moduleName: "Step Counter" });
  }, [navigation]);

  // Recharges, Bills & Utilities, Recent Transaction, and Make a Payment all
  // land on the same PaymentsModule entry point (BBPSHomeStack's "Home").
  const goToPayments = useCallback(() => {
    navigation.navigate("Home", {
      screen: "PaymentsModule",
      params: {
        screen: "Home",
        params: { moduleName: "Payments" },
        moduleName: "Payments",
      },
      moduleName: "Payments",
    });
  }, [navigation]);
  return (
    <View style={[styles.container, { paddingHorizontal: layout.containerPadding }]}>
      <View style={[styles.row, { maxWidth: layout.contentWidth, gap: layout.gap }]}>
        <StepsCounterCard
          steps={totalSteps}
          goalSteps={GOAL_STEPS}
          progressPercent={progressPercent}
          stepsToday={totalSteps}
          onPress={goToRewards}
          loading={stepDataState === 'loading'}
          cardWidth={layout.cardWidth}
        />
        <PaymentsQuickAccessCard
          onOpenPayments={goToPayments}
          onOpenBills={goToPayments}
          onOpenHistory={goToPayments}
          onMakePayment={goToPayments}
          cardWidth={layout.cardWidth}
        />
      </View>
      <StepStatusBanner
        state={stepDataState}
        onConnectSource={openHealthConnect}
        onRefresh={refreshSteps}
        onGrantPermission={requestStepsPermission}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: rs(14),
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignSelf: "center",
    width: "100%",
    alignItems: "stretch",
  },
});

// const bannerStyles = StyleSheet.create({
//   banner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: rs(10),
//     paddingHorizontal: rs(12),
//     paddingVertical: rs(8),
//     marginTop: rs(8),
//     gap: rs(8),
//   },
//   red:       { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
//   amber:     { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
//   grey:      { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
//   icon:      { fontSize: fs(14) },
//   text:      { flex: 1, fontSize: fs(11), fontWeight: '500', lineHeight: rs(16) },
//   textRed:   { color: '#991B1B' },
//   textAmber: { color: '#92400E' },
//   textGrey:  { color: '#374151' },
// });
