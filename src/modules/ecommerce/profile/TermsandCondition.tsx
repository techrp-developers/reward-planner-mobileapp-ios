import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LinearGradient from "react-native-linear-gradient";
import { TAB_BAR_HEIGHT } from "../../../bottombar/BottomTabs";

import {
  fetchTermsStatus,
  fetchTermsList,
  updateTermsAcceptance,
  type TermItem,
} from "../api/TermsConditionAPI";
import { useAlert } from "../components/alerts";

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────

const T = {
  primary: "#852BAF",
  accent: "#A654CD",
  secondary: "#FC8BAD",
  primaryBg: "rgba(133,43,175,0.08)",
  success: "#16A34A",
  successBg: "#F0FDF4",
  successBd: "#BBF7D0",
  text: "#1E1B2E",
  textMuted: "#6B7280",
  textLight: "#8A8A8A",
  surface: "#FFFFFF",
  surfaceBd: "#EEE7FF",
  gradient: ["#F5F0FF", "#FFF0F7"] as const,
  btnGradient: ["#FC8BAD", "#A654CD"] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// TERM CARD
// ─────────────────────────────────────────────────────────────

type TermCardProps = { title: string; content: string; iconText: string };

const TermCard = ({ title, content, iconText }: TermCardProps) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{iconText}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionContent}>{content}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────

const TermsAndConditionsScreen = () => {
  const alert = useAlert();

  // Whether the user has already accepted (from API)
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  // Checkbox state — only relevant before acceptance
  const [checked, setChecked] = useState(false);

  // Loading = initial page load; saving = acceptance POST in-flight
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dynamic terms from API
  const [termsList, setTermsList] = useState<TermItem[]>([]);

  // Guard against setState after unmount
  const mountedRef = useRef(true);

  // ─────────────────────────────────────────────────────────
  // SINGLE EFFECT — fetch status + terms list in parallel
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    const loadData = async () => {
      try {
        const [statusRes, termsRes] = await Promise.all([
          fetchTermsStatus(),
          fetchTermsList(),
        ]);

        if (!mountedRef.current) return;

        setAlreadyAccepted(!!statusRes.terms_accepted);
        setTermsList(termsRes?.data ?? []);
      } catch (error) {
        console.warn("[Terms] initial load failed", error);

        if (mountedRef.current) {
          alert.error("Error", "Failed to load Terms & Conditions.");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────
  // ACCEPT HANDLER
  // ─────────────────────────────────────────────────────────

  const handleAccept = async () => {
    if (!checked || saving) return;

    setSaving(true);
    try {
      await updateTermsAcceptance({ accepted: true });

      // Immediately hide the agreement section — no refresh needed
      setAlreadyAccepted(true);

      alert.success(
        "Accepted",
        "Terms & Conditions accepted successfully.",
      );
    } catch {
      alert.error(
        "Update Failed",
        "Could not save your preference. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0FF" />

      <LinearGradient
        colors={[...T.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>

          {/* ── HEADER ───────────────────────────────────── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.mainTitle}>Terms &</Text>
              <Text style={styles.mainTitleBold}>Conditions</Text>
            </View>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>v1.2 • MAR 2026</Text>
            </View>
          </View>

          {/* ── BODY ─────────────────────────────────────── */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={T.primary} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: TAB_BAR_HEIGHT + 30 },
              ]}
            >
              {/* INTRO */}
              <View style={styles.introBox}>
                <Text style={styles.introText}>
                  By accessing our services, you agree to be bound by these
                  terms. Please read them carefully to understand your rights
                  and obligations.
                </Text>
              </View>

              {/* DYNAMIC TERM CARDS */}
              {termsList.map(item => (
                <TermCard
                  key={item.id}
                  iconText={item.term_no}
                  title={item.title}
                  content={item.content}
                />
              ))}

              {/* ── ALREADY ACCEPTED ─────────────────────── */}
              {alreadyAccepted ? (
                <View style={styles.acceptedPill}>
                  <View style={styles.acceptedPillIcon}>
                    <Text style={styles.acceptedPillCheck}>
                      ✓
                    </Text>
                  </View>

                  <Text style={styles.acceptedPillText}>
                    Terms & Conditions Accepted
                  </Text>
                </View>
              ) : (
                /* ── AGREEMENT (shown only when NOT yet accepted) ── */
                <View style={styles.agreementSection}>

                  {/* CHECKBOX ROW */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    activeOpacity={0.8}
                    disabled={saving}
                    onPress={() => setChecked(v => !v)}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Text style={styles.checkIcon}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxText}>
                      I have read and agree to the{" "}
                      <Text style={styles.checkboxBold}>Terms & Conditions</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* FOOTER NOTE */}
                  <Text style={styles.footerNote}>
                    By continuing, you confirm that you understand and accept
                    our policies, terms of use, and privacy guidelines.
                  </Text>

                  {/* PRIMARY CTA — disabled until checkbox ticked */}
                  <TouchableOpacity
                    disabled={!checked || saving}
                    activeOpacity={0.85}
                    onPress={handleAccept}
                    style={!checked || saving ? styles.buttonDisabled : undefined}
                  >
                    <LinearGradient
                      colors={[...T.btnGradient]}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 0 }}
                      style={styles.acceptButton}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.acceptButtonText}>
                          I Understand & Agree
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F0FF" },
  gradient: { flex: 1 },
  container: { flex: 1 },

  // ── Header ───────────────────────────────────────────────

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: "300",
    color: T.primary,
  },
  mainTitleBold: {
    fontSize: 30,
    fontWeight: "900",
    color: T.primary,
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
    color: T.primary,
  },

  // ── Loading placeholder ───────────────────────────────────

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: T.textMuted,
    fontWeight: "600",
  },

  // ── Scroll content ────────────────────────────────────────

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

  // ── Term card ─────────────────────────────────────────────

  card: {
    backgroundColor: T.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.surfaceBd,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    backgroundColor: T.accent,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: T.primary,
  },
  sectionContent: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },

  // ── Already-accepted card ─────────────────────────────────

  acceptedPill: {
    marginTop: 22,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    alignSelf: "center",

    backgroundColor: "#F0FDF4",

    borderWidth: 1,
    borderColor: "#BBF7D0",

    borderRadius: 999,

    paddingVertical: 12,
    paddingHorizontal: 18,

    shadowColor: "#16A34A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,

    elevation: 2,
  },

  acceptedPillIcon: {
    width: 24,
    height: 24,

    borderRadius: 12,

    backgroundColor: "#16A34A",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 10,
  },

  acceptedPillCheck: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
  },

  acceptedPillText: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  // ── Agreement section ─────────────────────────────────────

  agreementSection: {
    marginTop: 20,
    gap: 16,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: T.accent,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: T.accent,
  },
  checkIcon: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "900",
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  checkboxBold: {
    color: T.primary,
    fontWeight: "700",
  },

  footerNote: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },

  // ── Accept button ─────────────────────────────────────────

  acceptButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  acceptButtonText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.45,
  },

  bottomSpacer: { height: 80 },
});

export default TermsAndConditionsScreen;
