import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";

import {
  type AchievementGroup,
  type AchievementMilestone,
} from "../../api/DashboardAPI";
import { useAchievementsQuery } from "../../api/useFitnessQueries";
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from "../../utils/theme";

// UNACHIEVED GRAY SHIELD
import UnAchievedShield from "../../assets/StepCount/UnAchievedShield.svg";

// COLORED SHIELDS
import Walking_Enthusiast from "../../assets/StepCount/Walking_Enthusiast.svg";

// SMALL ICONS INSIDE SHIELD
import icon_Walking_Enthusiast from "../../assets/StepCount/Achivement_icon(2).svg";

const { width } = Dimensions.get("window");

const VD = {
  bg: ["#070A16", "#111735", "#201A3F"],
  ink: "#F6F7FF",
  muted: "#A8AEC8",
  softText: "#979EBC",
  accent: "#8EA2FF",
  accentDark: "#B9C4FF",
  accentFaint: "rgba(142,162,255,0.12)",
  cardBg: "rgba(255,255,255,0.075)",
  cardSoft: "rgba(255,255,255,0.10)",
  cardBorder: "rgba(174,188,255,0.16)",
  shadow: "#02030A",
};

// Streak Keeper / Trailblazer / Sunrise Strider were removed from the
// backend (fitness_achievements.sql) — the unlock logic never tracked
// outdoor walks or pre-7AM steps, and streak milestones are now handled by
// fitness_streak_bonus_config instead. Only the lifetime-steps group remains.
type AchievementCategory = "walking";

type BadgeData = {
  achievement_id: number;
  label: string;
  achieved: boolean;
  stepsLeft?: string;
  reward_coins: number;
  progress?: number;
  progress_percent?: number;
  milestone: AchievementMilestone;
};

type SectionData = {
  groupKey: string;
  category: AchievementCategory;
  title: string;
  description: string;
  badges: BadgeData[];
};

const SECTION_ORDER: Array<{
  groupKey: string;
  category: AchievementCategory;
  title: string;
  description: string;
}> = [
  {
    groupKey: "walking",
    category: "walking",
    title: "Walking Enthusiast",
    description: "You've taken your first step toward a healthier lifestyle!",
  },
];

const formatStepLabel = (value: number) => {
  if (value >= 1000000 && value % 1000000 === 0) {
    return `${value / 1000000}M`;
  }

  if (value >= 1000 && value % 1000 === 0) {
    return `${value / 1000}K`;
  }

  return String(value);
};

const mapMilestoneToBadge = (milestone: AchievementMilestone): BadgeData => {
  const targetValue = Number(milestone.target_value || 0);
  const baseBadge = {
    achievement_id: milestone.achievement_id,
    achieved: Boolean(milestone.achieved),
    reward_coins: Number(milestone.reward_coins || 0),
    progress: milestone.progress,
    progress_percent: milestone.progress_percent,
    milestone,
  };

  if (milestone.type === "steps") {
    return {
      ...baseBadge,
      label: formatStepLabel(targetValue),
    };
  }

  return {
    ...baseBadge,
    label: String(targetValue),
  };
};

/* ---------------- SMALL ICON PICKER ---------------- */
const getSmallIcon = (category: AchievementCategory) => {
  switch (category) {
    case "walking":
      return icon_Walking_Enthusiast;
    default:
      return icon_Walking_Enthusiast;
  }
};

/* ---------------- COLORED SHIELD PICKER ---------------- */
const getColoredShield = (category: AchievementCategory) => {
  switch (category) {
    case "walking":
      return Walking_Enthusiast;
    default:
      return Walking_Enthusiast;
  }
};

/* ---------------- BADGE SHIELD ---------------- */
type BadgeShieldProps = {
  data: BadgeData;
  category: AchievementCategory;
};

const BadgeShield = ({ data, category }: BadgeShieldProps) => {
  const { achieved, label, stepsLeft } = data;

  const SmallIcon = getSmallIcon(category);
  const ShieldIcon = achieved ? getColoredShield(category) : UnAchievedShield;

  return (
    <View style={styles.badgeWrapper}>
      <View style={styles.shieldContainer}>
        {/* SHIELD */}
        <ShieldIcon width={74} height={74} />

        {/* LABEL + SMALL ICON */}
        <View style={styles.insideContent}>
          <Text
            style={[
              styles.insideLabel,
              achieved ? styles.textAchieved : styles.textUnachieved,
            ]}
          >
            {label}
          </Text>

          {/* ICON BELOW LABEL */}
          <SmallIcon
            width={18}
            height={18}
            style={styles.smallIcon}
            opacity={achieved ? 1 : 0.4}
          />
        </View>
      </View>

      {/* STEPS LEFT TAG */}
      {Boolean(stepsLeft) && (
        <View style={styles.stepsLeftBubble}>
          <Text style={styles.stepsLeftText}>{stepsLeft}</Text>
        </View>
      )}
    </View>
  );
};

/* ---------------- ACHIEVEMENT CARD ---------------- */
type AchievementCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const AchievementCard = ({ title, description, children }: AchievementCardProps) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionDesc}>{description}</Text>
    <View style={styles.badgeGrid}>{children}</View>
  </View>
);

/* ---------------- MAIN SCREEN ---------------- */
export default function AchievementsScreen() {
  const navigation = useNavigation();
  const achievementsQuery = useAchievementsQuery();
  const loading = achievementsQuery.isLoading;
  const errorMessage =
    achievementsQuery.data?.message ||
    (achievementsQuery.error ? "Failed to fetch achievements" : "");

  const achievementSections = useMemo<SectionData[]>(() => {
    const achievementGroups = achievementsQuery.data?.data || [];

    const groupsByKey = achievementGroups.reduce<Record<string, AchievementGroup>>(
      (acc, group) => {
        acc[group.group_key] = group;
        return acc;
      },
      {}
    );

    return SECTION_ORDER.map((section) => {
      const group = groupsByKey[section.groupKey];

      return {
        groupKey: section.groupKey,
        category: section.category,
        title: group?.title || section.title,
        description: group?.description || section.description,
        badges: (group?.milestones || []).map(mapMilestoneToBadge),
      };
    });
  }, [achievementsQuery.data]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={VD.bg} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.82}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={25}
                color={VD.accentDark}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Achievements</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* SECTIONS */}
          {loading ? (
            <View style={[styles.card, styles.stateCard]}>
              <ActivityIndicator color={VD.accent} />
              <Text style={styles.stateText}>Loading achievements...</Text>
            </View>
          ) : errorMessage ? (
            <View style={[styles.card, styles.stateCard]}>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => achievementsQuery.refetch()}
                activeOpacity={0.84}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            achievementSections.map((section) => (
              <AchievementCard
                key={section.groupKey}
                title={section.title}
                description={section.description}
              >
                {section.badges.map((badge) => (
                  <BadgeShield
                    key={badge.achievement_id}
                    data={badge}
                    category={section.category}
                  />
                ))}
              </AchievementCard>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VD.bg[0],
  },
  gradient: {
    flex: 1,
  },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VD.cardSoft,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  headerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: VD.ink,
    textAlign: "center",
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },

  card: {
    backgroundColor: VD.cardBg,
    margin: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VD.cardBorder,
    shadowColor: VD.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: VD.ink,
  },
  sectionDesc: {
    marginTop: 4,
    color: VD.muted,
    marginBottom: 14,
  },

  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  badgeWrapper: {
    width: width / 5 - 8,
    alignItems: "center",
    margin: 4,
    position: "relative",
  },

  shieldContainer: {
    width: 74,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
  },

  insideContent: {
    position: "absolute",
    top: 13,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  insideLabel: {
    fontSize: 16,
    fontWeight: "700",
  },

  textAchieved: {
    color: "#fff",
  },
  textUnachieved: {
    color: "#aaa",
  },

  stepsLeftBubble: {
    position: "absolute",
    bottom: -10,
    right: -5,
    backgroundColor: VD.cardSoft,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    elevation: 2,
  },
  stepsLeftText: {
    fontSize: 10,
    color: VD.ink,
    fontWeight: "600",
  },
  stateCard: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: VD.muted,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: VD.accentFaint,
    borderWidth: 1,
    borderColor: VD.cardBorder,
  },
  retryText: {
    ...TYPOGRAPHY.caption,
    color: VD.accentDark,
  },
  smallIcon: {
    marginTop: 2,
  },
});
