import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PanResponder,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const PRIMARY = '#3545A3';
const PRIMARY_DARK = '#080B26';
const TEXT_DARK = '#1F2937';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const INPUT_BG = '#FFFFFF';
const BORDER = 'rgba(134,101,255,0.22)';
const BORDER_LIGHT = '#F0F0F0';
const ACCENT_LIGHT = 'rgba(134,101,255,0.15)';
const TRACK_H = 5;
const THUMB_SIZE = 22;
const HIT = THUMB_SIZE + 18;

// ─── Value formatters ─────────────────────────────────────────────

function fmtSlider(v: number, prefix: string, suffix: string): string {
  if (prefix === '₹') {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${Math.round(v)}`;
  }
  const n = Number.isInteger(v) ? v.toString() : v.toFixed(1);
  return `${prefix}${n}${suffix}`;
}

function fmtRange(v: number, prefix: string, suffix: string): string {
  if (prefix === '₹') {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(0)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  }
  const n = Number.isInteger(v) ? v.toString() : v.toFixed(0);
  return `${prefix}${n}${suffix}`;
}

const BTN_SHADOW = Platform.select({
  ios: {
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
}) as ViewStyle;

// ─── Gradient Button ──────────────────────────────────────────────
interface GradientButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}
export const GradientButton: React.FC<GradientButtonProps> = ({ label, onPress, style }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.gradientBtn, BTN_SHADOW, style]}>
    <LinearGradient
      colors={[PRIMARY, PRIMARY_DARK]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientBtnInner}
    >
      <Text style={styles.gradientBtnText}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Input Field ──────────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  prefix?: string;
  suffix?: string;
  keyboardType?: 'numeric' | 'default';
  placeholder?: string;
}
export const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, prefix, suffix, keyboardType = 'numeric', placeholder = '0',
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputRow}>
      {prefix ? <Text style={styles.inputAddon}>{prefix}</Text> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={TEXT_MUTED}
      />
      {suffix ? <Text style={styles.inputAddon}>{suffix}</Text> : null}
    </View>
  </View>
);

// ─── Premium Draggable Slider Row ─────────────────────────────────
interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
}
export const SliderRow: React.FC<SliderRowProps> = ({
  label, value, min, max, step, onChange, prefix = '', suffix = '',
}) => {
  const trackWidthRef = useRef(0);
  const startPxRef = useRef(0);
  // always-fresh ref so PanResponder closure sees current value
  const valueRef = useRef(value);
  valueRef.current = value;

  const [dragging, setDragging] = useState(false);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startPxRef.current =
          ((valueRef.current - min) / (max - min)) * trackWidthRef.current;
        setDragging(true);
      },
      onPanResponderMove: (_, g) => {
        const tw = trackWidthRef.current;
        if (!tw) return;
        const px = Math.max(0, Math.min(tw, startPxRef.current + g.dx));
        const raw = min + (px / tw) * (max - min);
        const snapped = Math.round(raw / step) * step;
        const clamped = parseFloat(
          Math.max(min, Math.min(max, snapped)).toFixed(2),
        );
        onChange(clamped);
      },
      onPanResponderRelease: () => setDragging(false),
      onPanResponderTerminate: () => setDragging(false),
    }),
  ).current;

  const handleMinus = () =>
    onChange(Math.max(min, parseFloat((value - step).toFixed(2))));
  const handlePlus = () =>
    onChange(Math.min(max, parseFloat((value + step).toFixed(2))));

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.sliderContainer}>
      {/* Label + current value pill */}
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <LinearGradient
          colors={[PRIMARY, PRIMARY_DARK]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.valuePill}
        >
          <Text style={styles.valuePillText}>{fmtSlider(value, prefix, suffix)}</Text>
        </LinearGradient>
      </View>

      {/* Track area */}
      <View
        style={styles.trackArea}
        onLayout={e => {
          trackWidthRef.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Background track */}
        <View style={styles.trackBg} />

        {/* Gradient fill */}
        <LinearGradient
          colors={[PRIMARY, PRIMARY_DARK]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.trackFill, { width: `${pct}%` as any }]}
        />

        {/* Draggable thumb */}
        <View
          style={[styles.thumbHitArea, { left: `${pct}%` as any }]}
          {...pan.panHandlers}
        >
          {dragging && (
            <View style={styles.valueBubble}>
              <Text style={styles.valueBubbleText}>
                {fmtSlider(value, prefix, suffix)}
              </Text>
            </View>
          )}
          <View style={[styles.thumb, dragging && styles.thumbActive]} />
        </View>
      </View>

      {/* Min · step controls · Max */}
      <View style={styles.sliderFooter}>
        <Text style={styles.rangeText}>{fmtRange(min, prefix, suffix)}</Text>
        <View style={styles.stepRow}>
          <TouchableOpacity
            onPress={handleMinus}
            style={styles.stepBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePlus}
            style={styles.stepBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rangeText}>{fmtRange(max, prefix, suffix)}</Text>
      </View>
    </View>
  );
};

// ─── Result Card ──────────────────────────────────────────────────
interface ResultItem {
  label: string;
  value: string;
  highlight?: boolean;
}
interface ResultCardProps {
  items: ResultItem[];
}
export const ResultCard: React.FC<ResultCardProps> = ({ items }) => (
  <View style={styles.resultCard}>
    {items.map((item, i) =>
      item.highlight ? (
        <LinearGradient
          key={i}
          colors={['rgba(134,101,255,0.10)', 'rgba(91,71,163,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.resultRow}
        >
          <Text style={styles.resultLabel}>{item.label}</Text>
          <Text style={[styles.resultValue, styles.resultValueHighlight]}>
            {item.value}
          </Text>
        </LinearGradient>
      ) : (
        <View
          key={i}
          style={[
            styles.resultRow,
            i < items.length - 1 && styles.resultRowBorder,
          ]}
        >
          <Text style={styles.resultLabel}>{item.label}</Text>
          <Text style={styles.resultValue}>{item.value}</Text>
        </View>
      ),
    )}
  </View>
);

// ─── Section Header ───────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <LinearGradient
      colors={[PRIMARY, PRIMARY_DARK]}
      style={styles.sectionAccent}
    />
    <View style={styles.sectionTextWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

// ─── Donut Summary ────────────────────────────────────────────────
interface DonutProps {
  invested: number;
  returns: number;
  size?: number;
}
export const DonutSummary: React.FC<DonutProps> = ({
  invested,
  returns,
  size = 120,
}) => {
  const total = invested + returns;
  const returnsPct = total > 0 ? ((returns / total) * 100).toFixed(0) : '50';

  return (
    <View style={[styles.donutContainer, { width: size, height: size }]}>
      <View style={styles.donutOuter}>
        <View style={styles.donutInner}>
          <Text style={styles.donutPct}>{returnsPct}%</Text>
          <Text style={styles.donutLabel}>Returns</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Gradient Button
  gradientBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 14 },
  gradientBtnInner: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 18,
  },
  gradientBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Input
  inputContainer: { marginBottom: 14 },
  inputLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 52,
  },
  inputAddon: { fontSize: 16, color: PRIMARY, fontWeight: '700', marginRight: 4 },
  input: { flex: 1, fontSize: 16, color: TEXT_DARK, fontWeight: '600', height: '100%' },

  // ── Slider
  sliderContainer: { marginBottom: 22 },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
    paddingRight: 8,
  },
  valuePill: {
    borderRadius: 999,

    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_DARK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  valuePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },

  // Track
  trackArea: { height: HIT, justifyContent: 'center' },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_H,
    backgroundColor: '#E6DDFC',
    borderRadius: 999,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_H,
    borderRadius: 999,
  },

  // Thumb
  thumbHitArea: {
    position: 'absolute',
    width: HIT,
    height: HIT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -(HIT / 2),
  },
  valueBubble: {
    position: 'absolute',
    bottom: HIT / 2 + THUMB_SIZE / 2 + 6,
    backgroundColor: PRIMARY_DARK,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_DARK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: { elevation: 5 },
    }),
  },
  valueBubbleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: PRIMARY,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 5 },
    }),
  },
  thumbActive: {
    transform: [{ scale: 1.25 }],
    borderColor: PRIMARY_DARK,
    ...Platform.select({ android: { elevation: 9 } }),
  },

  // Footer row
  sliderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: { fontSize: 10, color: TEXT_MUTED, fontWeight: '500' },
  stepRow: { flexDirection: 'row', gap: 8 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepBtnText: { fontSize: 17, color: PRIMARY, fontWeight: '700', lineHeight: 19 },

  // ── Result Card
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    marginTop: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4C2F91',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: { elevation: 2 },
    }),
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

  },
  resultRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER_LIGHT },
  resultLabel: {
    fontSize: 13, color: TEXT_SECONDARY, fontWeight: '500', paddingVertical: 14,
    paddingHorizontal: 14,
  },
  resultValue: { fontSize: 15, color: TEXT_DARK, fontWeight: '700', paddingRight: 14, paddingVertical: 14 },
  resultValueHighlight: { fontSize: 17, color: PRIMARY, fontWeight: '800' },

  // ── Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  sectionAccent: { width: 5, height: 38, borderRadius: 999 },
  sectionTextWrap: { flex: 1 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#241C3B',
    letterSpacing: -0.3,
  },
  sectionSubtitle: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 },

  // ── Donut
  donutContainer: { alignItems: 'center', justifyContent: 'center' },
  donutOuter: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 12,
    borderColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  donutInner: {
    width: '70%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPct: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  donutLabel: { fontSize: 9, color: TEXT_SECONDARY, fontWeight: '600' },
});