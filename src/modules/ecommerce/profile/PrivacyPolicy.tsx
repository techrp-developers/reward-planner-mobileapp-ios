import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LinearGradient from "react-native-linear-gradient";

import { TAB_BAR_HEIGHT } from "../../../bottombar/BottomTabs";
import { useAppTheme } from "../../../theme/ThemeContext";

import {
  fetchPrivacyPolicy,
  PrivacyPolicyItem,
} from "../api/TermsConditionAPI";

import { useAlert } from "../components/alerts";

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────

const T = {
  primary: "#852BAF",

  gradient: [
    "#F5F0FF",
    "#FFF0F7",
  ] as const,
};

// ─────────────────────────────────────────────────────────────
// POLICY CARD
// ─────────────────────────────────────────────────────────────

type PolicyCardProps = {
  title: string;
  content: string;
  number: string;
  isDark: boolean;
};

const PolicyCard = ({
  title,
  content,
  number,
  isDark,
}: PolicyCardProps) => (
  <View style={[styles.card, isDark && darkStyles.card]}>
    <View style={styles.cardHeader}>
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>
          {number}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, isDark && darkStyles.primaryText]}>
        {title}
      </Text>
    </View>

    <Text style={[styles.sectionContent, isDark && darkStyles.bodyText]}>
      {content}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────

const PrivacyPolicyScreen = () => {
  const alert = useAlert();
  const { isDark, theme } = useAppTheme();

  const [loading, setLoading] =
    useState(true);

  const [policyList, setPolicyList] =
    useState<PrivacyPolicyItem[]>(
      [],
    );

  // ───────────────────────────────────────────────────────────
  // FETCH POLICY
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const loadPolicy = async () => {
      try {
        setLoading(true);

        const response =
          await fetchPrivacyPolicy();

        if (!mounted) {
          return;
        }

        setPolicyList(
          response?.data || [],
        );
      } catch (error) {
        console.warn(
          "[Privacy] fetch failed",
          error,
        );

        if (mounted) {
          alert.error(
            "Error",
            "Failed to load Privacy Policy.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPolicy();

    return () => {
      mounted = false;
    };
  }, [alert]);

  // ───────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, isDark && darkStyles.root]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#09090B" : "#F5F0FF"}
      />

      <LinearGradient
        colors={isDark ? ["#09090B", "#18181B"] : [...T.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView
          style={styles.container}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text
                style={[styles.mainTitle, isDark && darkStyles.primaryText]}
              >
                Privacy
              </Text>

              <Text
                style={[styles.mainTitleBold, isDark && darkStyles.primaryText]}
              >
                Policy
              </Text>
            </View>

            <View
              style={[styles.dateBadge, isDark && darkStyles.badge]}
            >
              <Text
                style={[styles.dateText, isDark && darkStyles.primaryText]}
              >
                v1.2 • MAR 2026
              </Text>
            </View>
          </View>

          {/* CONTENT */}

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom:
                  TAB_BAR_HEIGHT + 24,
              },
            ]}
          >
            {/* INTRO */}

            <View
              style={styles.introBox}
            >
              <Text
                style={[styles.introText, isDark && darkStyles.mutedText]}
              >
                Your privacy is our
                priority. This policy
                explains how we
                collect, use, and
                protect your personal
                information.
              </Text>
            </View>

            {/* LOADING */}

            {loading ? (
              <View
                style={
                  styles.loadingWrap
                }
              >
                <ActivityIndicator
                  size="large"
                  color={theme.primary}
                />
              </View>
            ) : (
              <>
                {/* DYNAMIC POLICY CARDS */}

                {policyList.map(item => (
                  <PolicyCard
                    key={item.id}
                    number={
                      item.policy_no
                    }
                    title={item.title}
                    content={
                      item.content
                    }
                    isDark={isDark}
                  />
                ))}
              </>
            )}

            <View
              style={styles.bottomSpacer}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F0FF",
  },

  gradient: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",

    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
  },

  mainTitle: {
    fontSize: 30,
    fontWeight: "300",
    color: "#852BAF",
  },

  mainTitleBold: {
    fontSize: 30,
    fontWeight: "900",
    color: "#852BAF",
    marginTop: -5,
  },

  dateBadge: {
    backgroundColor: "#F8E9FF",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  dateText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#852BAF",
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  introBox: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  introText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 23,
    fontWeight: "500",
  },

  loadingWrap: {
    marginTop: 50,
    alignItems: "center",
  },

  // CARD

  card: {
    backgroundColor: "#FFFFFF",

    borderRadius: 22,

    padding: 20,

    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#EEE7FF",

    shadowColor: "#A654CD",

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.08,
    shadowRadius: 14,

    elevation: 4,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  numberBadge: {
    backgroundColor: "#A654CD",

    width: 34,
    height: 34,
    borderRadius: 17,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,
  },

  numberText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#852BAF",
  },

  sectionContent: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },

  bottomSpacer: {
    height: 80,
  },
});

const darkStyles = StyleSheet.create({
  root: { backgroundColor: "#09090B" },
  card: {
    backgroundColor: "#18181B",
    borderColor: "rgba(255,255,255,0.20)",
    shadowColor: "#000000",
  },
  primaryText: { color: "#C4B5FD" },
  bodyText: { color: "#E4E4E7" },
  mutedText: { color: "#A1A1AA" },
  badge: { backgroundColor: "#27233A" },
});

export default PrivacyPolicyScreen;
