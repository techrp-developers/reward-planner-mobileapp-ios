import React from "react";
import { StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import type { SvgProps } from "react-native-svg";
import { useQuery } from "@tanstack/react-query";

import RunnerMale from "../../assets/StepCount/goal_runner_male.svg";
import RunnerFemaleScene from "../../assets/StepCount/goal_runner_female_scene.svg";
import GenderOthers from "../../assets/StepCount/goal_gender_others.svg";
import { fetchUserInfo } from "../../../common/auth/api/AuthAPI";
import { getSelectedGender } from "../../utils/userGender";
import { useProfilePlanQuery } from "../../api/useProfilePlan";

// Gender-based hero artwork shared by the BMI plan and StepGoal screens.

export type HeroKind = "male" | "female" | "other" | "unknown";

type HeroArtSpec = {
  Art: React.FC<SvgProps>;
  size: [number, number];     // intrinsic SVG size
  visible: [number, number];  // part shown; the female scene has crop strips on its right and bottom edges
  widthRatio: number;         // share of the screen width
  scene?: boolean;            // opaque background, so its edges are faded into the panel
};

const HERO_ART: Record<HeroKind, HeroArtSpec> = {
  male:    { Art: RunnerMale, size: [421, 548], visible: [421, 548], widthRatio: 0.5 },
  female:  { Art: RunnerFemaleScene, size: [468, 587], visible: [454, 573], widthRatio: 0.5, scene: true },
  other:   { Art: GenderOthers, size: [252, 296], visible: [252, 296], widthRatio: 0.46 },
  // No gender known: the neutral character rather than assuming one.
  unknown: { Art: GenderOthers, size: [252, 296], visible: [252, 296], widthRatio: 0.46 },
};

const FADE = "#E2EEFD";
const FADE_CLEAR = "rgba(226,238,253,0)";

// Accepts the spellings used by StepForm ("male" / "female" / "other") and
// bus booking ("M" / "F" / "O").
const heroKindOf = (value: unknown): HeroKind | null => {
  const g = String(value ?? "").trim().toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  if (g === "other" || g === "others" || g === "o") return "other";
  return null;
};

/**
 * Order: the gender just saved in StepForm (newest), then the gender persisted
 * in the fitness profile (GET /v1/profile/plan), then user-info. All three are
 * shared cache entries, so this normally makes no request. null while loading.
 */
export function useGoalHeroKind(): HeroKind | null {
  const { data: plan, isPending: planPending } = useProfilePlanQuery();
  const { data: apiKind, isPending } = useQuery({
    queryKey: ["user-info"],
    queryFn: fetchUserInfo,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    select: (data: any) => heroKindOf(data?.user?.gender),
  });
  return heroKindOf(getSelectedGender())
    ?? heroKindOf(plan?.gender)
    ?? apiKind
    ?? (planPending || isPending ? null : "unknown");
}

/** Artwork width for the screen, optionally capped by a maximum height. */
export const goalHeroSize = (kind: HeroKind, screenWidth: number, maxHeight = Infinity) => {
  const art = HERO_ART[kind];
  const aspect = art.visible[1] / art.visible[0];
  const width = Math.min(Math.max(screenWidth * art.widthRatio, 150), 300, maxHeight / aspect);
  return { width, height: width * aspect };
};

/** Positioned bottom-right of its (relative) parent. */
export const GoalHeroArt = React.memo(({ kind, width }: { kind: HeroKind; width: number }) => {
  const art = HERO_ART[kind];
  const scale = width / art.visible[0];
  const height = art.visible[1] * scale;
  return (
    <View pointerEvents="none" style={[styles.art, { width, height }]}>
      {!art.scene && (
        <View style={[styles.glow, { left: width * 0.04, width: width * 0.92, height: width * 0.92, borderRadius: width * 0.46 }]} />
      )}
      <art.Art width={art.size[0] * scale} height={art.size[1] * scale} />
      {art.scene && (
        <>
          <LinearGradient colors={[FADE, FADE_CLEAR]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fadeLeft} />
          <LinearGradient colors={[FADE, FADE_CLEAR]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.fadeTop} />
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  // Anchored top-left so the crop strips fall outside the box on the right and bottom.
  art: { position: "absolute", right: 0, bottom: 0, overflow: "hidden" },
  glow: { position: "absolute", bottom: 0, backgroundColor: "rgba(167,139,250,0.20)" },
  fadeLeft: { position: "absolute", left: 0, top: 0, bottom: 0, width: 32 },
  fadeTop: { position: "absolute", left: 0, right: 0, top: 0, height: 26 },
});
