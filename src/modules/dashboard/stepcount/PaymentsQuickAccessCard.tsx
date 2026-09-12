import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { fs, rs } from "../../../utils/responsive";
import { useAppTheme } from "../../../theme/ThemeContext";

interface PaymentsQuickAccessCardProps {
  onOpenPayments?: () => void;
  onOpenBills?: () => void;
  onOpenHistory?: () => void;
  // Bottom "Make a Payment" CTA — navigates straight to the standalone
  // top-level BBPS stack (no navbar/bottom tabs), distinct from
  // onOpenPayments which opens the BBPS home page nested inside
  // PaymentsModule (keeps the navbar/bottom tabs visible).
  onMakePayment?: () => void;
  cardWidth?: number;
}

type QuickAction = {
  title: string;
  icon: string;
  label?: string;
  onPress?: () => void;
};

const PaymentsQuickAccessCard: React.FC<PaymentsQuickAccessCardProps> = ({
  onOpenPayments,
  onOpenBills,
  onOpenHistory,
  onMakePayment,
}) => {
  const { isDark, theme } = useAppTheme();
  const mountAnim = useRef(new Animated.Value(0)).current;
  const actionIconColor = isDark ? "#FFFFFF" : "#111827";

  useEffect(() => {
    const anim = Animated.timing(mountAnim, {
      toValue: 1,
      duration: 500,
      delay: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [mountAnim]);

  const actions = useMemo<QuickAction[]>(
    () => [
      {
        title: "Recharges",
        icon: "cellphone-charging",
        onPress: onOpenBills,
      },
      {
        title: "Bills & Utilities",
        icon: "receipt-text-outline",
        onPress: onOpenPayments,
      },
      {
        title: "Recent Transaction",
        icon: "clock-time-four-outline",
        onPress: onOpenHistory,
      },
    ],
    [onOpenBills, onOpenPayments, onOpenHistory],
  );

  const t = useMemo(
    () => ({
      card: {
        backgroundColor: isDark ? "#18181B" : "#FFFFFF",
        shadowColor: isDark ? "#000000" : "#64748B",
      } as ViewStyle,
      title: { color: theme.text } as TextStyle,
      subtitle: { color: theme.secondaryText } as TextStyle,
      actionCard: {
        backgroundColor: isDark ? "rgba(99, 102, 241, 0.12)" : "#F8FAFC",
        borderColor: isDark ? "rgba(199, 210, 254, 0.14)" : "rgba(148, 163, 184, 0.18)",
      } as ViewStyle,
      actionTitle: { color: theme.text } as TextStyle,
    }),
    [isDark, theme],
  );

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: mountAnim,
          transform: [
            {
              translateY: mountAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.card, t.card]}>
        <View style={styles.header}>
          <LinearGradient
            colors={["#111827", "#4F46E5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBubble}
          >
            <MaterialCommunityIcons name="wallet-outline" size={rs(19)} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={[styles.title, t.title]} numberOfLines={1}>
              Payments
            </Text>
            <Text style={[styles.subtitle, t.subtitle]} numberOfLines={1}>
              Quick Access
            </Text>
          </View>
        </View>

        <View style={styles.actionList}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={[styles.actionCard, t.actionCard]}
              onPress={action.onPress}
              activeOpacity={0.86}
            >
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, t.actionTitle]} numberOfLines={1}>
                  {action.title}
                </Text>
              </View>
              {action.label ? (
                <Text style={styles.actionLabel}>{action.label}</Text>
              ) : (
                <MaterialCommunityIcons name={action.icon} size={rs(23)} color={actionIconColor} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={onMakePayment} activeOpacity={0.88}>
          <LinearGradient
            colors={["#111827", "#4F46E5"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText} numberOfLines={1}>
              Make a Payment
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={rs(22)} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default React.memo(PaymentsQuickAccessCard);

const styles = StyleSheet.create({
  cardWrapper: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: rs(18),
    padding: rs(10),
    shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: Platform.OS === "ios" ? 0.12 : 0.18,
    shadowRadius: rs(14),
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    marginBottom: rs(8),
  },
  iconBubble: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(9),
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: fs(13),
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: fs(10),
    marginTop: 1,
    letterSpacing: 0,
  },
  actionList: {
    gap: rs(5),
    marginBottom: rs(7),
  },
  actionCard: {
    minHeight: rs(31),
    borderRadius: rs(10),
    borderWidth: 1,
    paddingHorizontal: rs(9),
    paddingVertical: rs(5),
    flexDirection: "row",
    alignItems: "center",
    gap: rs(8),
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fs(11),
    fontWeight: "800",
    letterSpacing: 0,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: fs(15),
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 0,
  },
  cta: {
    minHeight: rs(32),
    borderRadius: rs(16),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: rs(12),
    gap: rs(8),
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: fs(11),
    fontWeight: "800",
    letterSpacing: 0,
  },
});
