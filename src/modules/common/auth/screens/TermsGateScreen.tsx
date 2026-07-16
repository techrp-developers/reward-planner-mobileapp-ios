import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import {
  fetchTermsList,
  updateTermsAcceptance,
  type TermItem,
} from "../../../ecommerce/api/TermsConditionAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// THEME  (same palette as TermsAndConditionsScreen)
// ─────────────────────────────────────────────────────────────

const T = {
  primary: "#852BAF",
  accent: "#A654CD",
  text: "#1E1B2E",
  textMuted: "#6B7280",
  surface: "#FFFFFF",
  surfaceBd: "#EEE7FF",
  gradient: ["#F5F0FF", "#FFF0F7"] as const,
  btnGradient: ["#FC8BAD", "#A654CD"] as const,
  btnDisabled: ["#D1D5DB", "#E5E7EB"] as const,
} as const;

// ─────────────────────────────────────────────────────────────
// TERM CARD
// ─────────────────────────────────────────────────────────────

type TermCardProps = { title: string; content: string; iconText: string };

const TermCard = memo(({ title, content, iconText }: TermCardProps) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{iconText}</Text>
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardContent}>{content}</Text>
  </View>
));

// ─────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────

function TermsGateScreenComponent() {
  const { setTermsAccepted } = useAuth();
  const alert = useAlert();

  const [termsList, setTermsList] = useState<TermItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const mountedRef = useRef(true);

  // ── Block Android hardware back — user must accept before entering app ──

  useEffect(() => {
    const handler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true, // return true = event handled, do NOT go back
    );
    return () => handler.remove();
  }, []);

  // ── Load dynamic terms list ─────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    fetchTermsList()
      .then(res => {
        if (mountedRef.current) {
          setTermsList(res?.data ?? []);
        }
      })
      .catch(e => console.warn("[TermsGate] fetch failed", e))
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Accept handler ──────────────────────────────────────────────────────

  const handleAccept = useCallback(async () => {
    if (!checked || saving) return;

    setSaving(true);
    try {
      await updateTermsAcceptance({ accepted: true });

      // Tell AuthContext → RootNavigator swaps TermsGate → App automatically.
      // No navigation.navigate() needed — the conditional stack handles it.
      setTermsAccepted(true);
    } catch {
      if (mountedRef.current) {
        alert.error(
          "Update Failed",
          "Could not save your preference. Please try again.",
        );
        setSaving(false);
      }
    }
  }, [checked, saving, setTermsAccepted, alert]);

  const handleToggleChecked = useCallback(() => {
    setChecked(v => !v);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

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

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>BEFORE YOU START</Text>
            </View>
            <Text style={styles.mainTitle}>Terms &</Text>
            <Text style={styles.mainTitleBold}>Conditions</Text>
            <Text style={styles.subtitle}>
              Please read and accept our terms to continue using the app.
            </Text>
          </View>

          {/* ── BODY ────────────────────────────────────────────────── */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={T.primary} />
              <Text style={styles.loadingText}>Loading terms…</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Dynamic terms from API */}
              {termsList.map(item => (
                <TermCard
                  key={item.id}
                  iconText={item.term_no}
                  title={item.title}
                  content={item.content}
                />
              ))}

              {/* ── AGREEMENT FOOTER ──────────────────────────────── */}
              <View style={styles.agreementSection}>
                <View style={styles.divider} />

                {/* Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  activeOpacity={0.8}
                  disabled={saving}
                  onPress={handleToggleChecked}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxText}>
                    I have read and agree to the{" "}
                    <Text style={styles.checkboxBold}>Terms & Conditions</Text>
                    {" "}and{" "}
                    <Text style={styles.checkboxBold}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                {/* Helper text */}
                <Text style={styles.helperText}>
                  By continuing, you confirm that you understand and accept
                  our policies and terms of use.
                </Text>

                {/* CTA */}
                <TouchableOpacity
                  disabled={!checked || saving}
                  activeOpacity={0.88}
                  onPress={handleAccept}
                  style={(!checked || saving) ? styles.btnDisabledWrapper : undefined}
                >
                  <LinearGradient
                    colors={
                      checked && !saving
                        ? [...T.btnGradient]
                        : [...T.btnDisabled]
                    }
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0 }}
                    style={styles.acceptButton}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={[
                        styles.acceptButtonText,
                        (!checked) && styles.acceptButtonTextDisabled,
                      ]}>
                        I Understand & Agree
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const TermsGateScreen = memo(TermsGateScreenComponent);
export default TermsGateScreen;

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F0FF" },
  gradient: { flex: 1 },
  container: { flex: 1 },

  // ── Header ───────────────────────────────────────────────────

  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  stepBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(133,43,175,0.10)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: T.primary,
    letterSpacing: 1.2,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "300",
    color: T.primary,
    lineHeight: 38,
  },
  mainTitleBold: {
    fontSize: 32,
    fontWeight: "900",
    color: T.primary,
    marginTop: -4,
  },
  subtitle: {
    fontSize: 14,
    color: T.textMuted,
    marginTop: 8,
    lineHeight: 20,
    fontWeight: "500",
  },

  // ── Loading ───────────────────────────────────────────────────

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

  // ── Scroll / cards ────────────────────────────────────────────

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  card: {
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: T.surfaceBd,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    backgroundColor: T.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: T.primary,
    flex: 1,
  },
  cardContent: {
    fontSize: 13,
    color: "#555",
    lineHeight: 21,
  },

  // ── Agreement section ─────────────────────────────────────────

  agreementSection: {
    marginTop: 8,
    gap: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(133,43,175,0.12)",
    marginBottom: 4,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: T.accent,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: T.accent,
    borderColor: T.accent,
  },
  checkIcon: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    lineHeight: 21,
  },
  checkboxBold: {
    color: T.primary,
    fontWeight: "700",
  },

  helperText: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
    fontWeight: "500",
  },

  // ── Accept button ─────────────────────────────────────────────

  btnDisabledWrapper: {
    opacity: 0.5,
  },
  acceptButton: {
    width: "100%",
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
    paddingVertical: 17,
  },
  acceptButtonTextDisabled: {
    color: "#9CA3AF",
  },

  bottomSpacer: { height: 40 },
});
