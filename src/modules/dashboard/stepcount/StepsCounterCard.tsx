import React, { useMemo, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Dimensions,
    Animated,
    Easing,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { rs, fs } from "../../../utils/responsive";
import { useAppTheme } from "../../../theme/ThemeContext";

// ── Types ──────────────────────────────────────────────────────────────────
interface StepsCounterCardProps {
    steps?: number;
    goalSteps?: number;
    progressPercent?: number;
    stepsToday?: number;
    onPress?: () => void;
    loading?: boolean;
    cardWidth?: number;
}

// ── Daily activity sparkline ───────────────────────────────────────────────
const DAILY_BARS = [0.3, 0.5, 0.4, 0.7, 0.6, 0.9, 0.5, 0.8, 0.65, 0.4, 0.75, 0.55];
const ACTIVE_BAR_INDEX = DAILY_BARS.length - 3;
const BAR_MAX = rs(22);

const BAR_HEIGHTS = DAILY_BARS.map((h, i) => ({
    height: h * BAR_MAX,
    opacity: i === ACTIVE_BAR_INDEX ? 1 : 0.5 + h * 0.35,
    active: i === ACTIVE_BAR_INDEX,
}));

// ── Component ──────────────────────────────────────────────────────────────
const StepsCounterCard: React.FC<StepsCounterCardProps> = ({
    steps = 4820,
    goalSteps = 5000,
    progressPercent,
    stepsToday = 320,
    onPress,
    loading: _loading = false,
    cardWidth,
}) => {
    const { isDark, theme } = useAppTheme();

    const screenWidth = Dimensions.get("window").width;
    const cWidth = cardWidth ?? (screenWidth - rs(32)) / 2;

    const progress = useMemo(() => {
        if (progressPercent !== undefined) return Math.max(0, Math.min(progressPercent, 100));
        return goalSteps > 0 ? Math.max(0, Math.min((steps / goalSteps) * 100, 100)) : 0;
    }, [steps, goalSteps, progressPercent]);

    // Ring geometry
    const ringSize = Math.min(cWidth * 0.6, rs(68));
    const strokeWidth = ringSize * 0.1;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const center = ringSize / 2;
    const goalPercent = Math.round(progress);

    // Entrance animation
    const mountAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const anim = Animated.timing(mountAnim, {
            toValue: 1,
            duration: 500,
            delay: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        });
        anim.start();
        return () => anim.stop();
    }, [mountAnim]);

    const ringTrackColor   = isDark ? "#334155"               : "#E2E8F0";
    const bubbleBg         = isDark ? "rgba(236,72,153,0.14)" : "#FDF2F8";
    const goalBadgeBg      = isDark ? "rgba(99,102,241,0.16)" : "#EEF2FF";

    const t = useMemo(() => ({
        card:       { backgroundColor: isDark ? "#18181B" : "#FFFFFF", shadowColor: isDark ? "#000000" : "#64748B" } as ViewStyle,
        title:      { color: theme.text } as TextStyle,
        subtitle:   { color: theme.secondaryText } as TextStyle,
        stepsValue: { color: theme.text } as TextStyle,
        goalLabel:  { color: theme.secondaryText } as TextStyle,
        stepsUpSub: { color: theme.secondaryText } as TextStyle,
        barsLabel:  { color: theme.secondaryText } as TextStyle,
        iconBubble: { backgroundColor: bubbleBg } as ViewStyle,
        arrowBubble:{ backgroundColor: bubbleBg } as ViewStyle,
        goalBadge:  { backgroundColor: goalBadgeBg } as ViewStyle,
    }), [isDark, theme, bubbleBg, goalBadgeBg]);

    return (
        <Animated.View
            style={[
                styles.touchable,
                {
                    opacity: mountAnim,
                    transform: [{
                        translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
                    }],
                },
            ]}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.92 : 1} style={styles.touchableInner}>
                <View style={[styles.card, t.card]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconBubble, t.iconBubble]}>
                            <Text style={styles.iconEmoji}>👣</Text>
                        </View>
                        <View style={styles.headerText}>
                            <Text style={[styles.title, t.title]} numberOfLines={1}>Steps Counter</Text>
                            <Text style={[styles.subtitle, t.subtitle]}>Today's Progress</Text>
                        </View>
                    </View>

                    {/* Body: ring, stats, activity */}
                    <View style={styles.body}>
                        <View style={[styles.ringWrapper, { width: ringSize, height: ringSize }]}>
                            <Svg width={ringSize} height={ringSize}>
                                <Defs>
                                    <SvgGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <Stop offset="0%" stopColor="#EC4899" />
                                        <Stop offset="100%" stopColor="#4F46E5" />
                                    </SvgGradient>
                                </Defs>
                                <Circle cx={center} cy={center} r={radius} stroke={ringTrackColor} strokeWidth={strokeWidth} fill="none" />
                                <Circle
                                    cx={center} cy={center} r={radius}
                                    stroke="url(#progressGrad)"
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${circumference} ${circumference}`}
                                    strokeDashoffset={strokeDashoffset}
                                    transform={`rotate(-90, ${center}, ${center})`}
                                />
                            </Svg>
                            <View style={styles.ringCenter}>
                                <Text style={[styles.stepsValue, t.stepsValue, { fontSize: ringSize * 0.18 }]}>
                                    {steps.toLocaleString("en-IN")}
                                </Text>
                                <Text style={[styles.goalLabel, t.goalLabel]}>/ {goalSteps.toLocaleString("en-IN")}</Text>
                                <Text style={styles.stepsWord}>Steps</Text>
                            </View>
                        </View>

                        <View style={styles.statsColumn}>
                            <View style={styles.statItem}>
                                <View style={[styles.arrowBubble, t.arrowBubble]}>
                                    <Text style={styles.arrowText}>↑</Text>
                                </View>
                                <View>
                                    <Text style={styles.stepsUpValue}>+{stepsToday}</Text>
                                    <Text style={[styles.stepsUpSub, t.stepsUpSub]}>steps today</Text>
                                </View>
                            </View>
                            <View style={[styles.statItem, styles.goalStatItem]}>
                                <View style={[styles.goalBubble, t.goalBadge]}>
                                    <Text style={styles.goalBubbleText}>%</Text>
                                </View>
                                <View>
                                    <Text style={styles.goalValue}>{goalPercent}%</Text>
                                    <Text style={[styles.stepsUpSub, t.stepsUpSub]}>of goal</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Sparkline */}
                    <View style={styles.barsWrapper}>
                        {BAR_HEIGHTS.map((bar, i) => (
                            <LinearGradient
                                key={i}
                                colors={bar.active ? ["#EC4899", "#6366F1"] : ["#CBD5E1", "#E2E8F0"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={[styles.bar, { height: bar.height, opacity: bar.opacity }]}
                            />
                        ))}
                    </View>
                    <Text style={[styles.barsLabel, t.barsLabel]}>Daily Activity</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default React.memo(StepsCounterCard);

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    touchable: { flex: 1 },
    touchableInner: { flex: 1 },

    card: {
        flex: 1,
        // backgroundColor & shadowColor via t.card
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
        marginBottom: rs(10),
        gap: rs(6),
    },
    iconBubble: {
        width: rs(34),
        height: rs(34),
        borderRadius: rs(10),
        // backgroundColor via t.iconBubble
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(240, 66, 159, 0.1)",
    },
    iconEmoji: { fontSize: fs(17) },
    headerText: { flex: 1 },
    title: {
        fontSize: fs(13),
        fontWeight: "700",
        // color via t.title
        letterSpacing: -0.2,
    },
    subtitle: { fontSize: fs(10), marginTop: 1 },  // color via t.subtitle
    body: {
        alignItems: "center",
        gap: rs(6),
    },

    ringWrapper: {
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    ringCenter: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    stepsValue: {
        fontWeight: "800",
        // color via t.stepsValue
        includeFontPadding: false,
        letterSpacing: -0.5,
    },
    goalLabel: { fontSize: fs(10), marginTop: 1 },   // color via t.goalLabel
    stepsWord: { fontSize: fs(10), color: "#6366F1", fontWeight: "700", marginTop: 1 },

    statsColumn: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: rs(6),
    },
    statItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: rs(5),
        flexShrink: 1,
    },
    goalStatItem: {
        justifyContent: "flex-end",
    },
    arrowBubble: {
        width: rs(20),
        height: rs(20),
        borderRadius: rs(10),
        // backgroundColor via t.arrowBubble
        alignItems: "center",
        justifyContent: "center",
    },
    arrowText:    { fontSize: fs(12), color: "#EC4899", fontWeight: "700" },
    stepsUpValue: { fontSize: fs(12), fontWeight: "800", color: "#EC4899" },
    stepsUpSub:   { fontSize: fs(9) },  // color via t.stepsUpSub

    goalBubble: {
        width: rs(20),
        height: rs(20),
        borderRadius: rs(9),
        borderWidth: 1,
        borderColor: "rgba(99, 102, 241, 0.18)",
        alignItems: "center",
        justifyContent: "center",
    },
    goalBubbleText: { fontSize: fs(10), fontWeight: "800", color: "#4F46E5" },
    goalValue: { fontSize: fs(12), fontWeight: "800", color: "#4F46E5" },

    barsWrapper: {
        flexDirection: "row",
        alignItems: "flex-end",
        alignSelf: "center",
        height: rs(30),
        marginTop: rs(7),
        marginBottom: rs(3),
        gap: rs(3),
    },
    bar: {
        width: rs(5),
        borderRadius: rs(20),
        minHeight: rs(4),
    },
    barsLabel: {
        textAlign: "center",
        fontSize: fs(10),
        fontWeight: "600",
        // color via t.barsLabel
    },
});
