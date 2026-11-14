import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { OB_DARK, OB_LAYOUT, OB_LIGHT, softShadow, type ObPalette } from './theme';
import { useStepStyles } from '../../../utils/useStepTheme';
import type { OnboardingSvg } from './assets';

// ─── Layout ───────────────────────────────────────────────────────────────────

type StepOnboardingScreenProps = {
  progress: { index: number; total: number } | null;
  onBack: () => void;
  backLabel: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
};

/**
 * Shared page shell: fixed header (back + progress), scrollable content and a
 * footer pinned above the system navigation inset so the CTA is always visible.
 */
export const StepOnboardingScreen = ({
  progress, onBack, backLabel, title, subtitle, children, footer,
}: StepOnboardingScreenProps) => {
  const { palette: OB, styles, isDark } = useObStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient colors={[OB.bg, OB.bgAlt]} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.glow, styles.glowTop]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottom]} />

      <View style={{ paddingTop: insets.top + 8 }}>
        <OnboardingHeader progress={progress} onBack={onBack} backLabel={backLabel} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {!!title && (
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
        )}
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
        {footer}
      </View>
    </View>
  );
};

// ─── Header + progress ────────────────────────────────────────────────────────

export const OnboardingHeader = ({
  progress, onBack, backLabel,
}: Pick<StepOnboardingScreenProps, 'progress' | 'onBack' | 'backLabel'>) => {
  const { palette: OB, styles } = useObStyles();
  return (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.backBtn}
      onPress={onBack}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={backLabel}
      hitSlop={8}
    >
      <MaterialCommunityIcons name="chevron-left" size={24} color={OB.text} />
    </TouchableOpacity>
    {progress && (
      <View style={styles.progressWrap} pointerEvents="none">
        <OnboardingProgress index={progress.index} total={progress.total} />
      </View>
    )}
  </View>
  );
};

export const OnboardingProgress = ({ index, total }: { index: number; total: number }) => {
  const { styles } = useObStyles();
  return (
  <View
    style={styles.progress}
    accessible
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 1, max: total, now: index + 1 }}
  >
    {Array.from({ length: total }).map((_, i) => {
      const done = i < index;
      const current = i === index;
      return (
        <React.Fragment key={i}>
          {i > 0 && (
            <View style={[styles.progressLine, (done || current) && styles.progressLineActive]} />
          )}
          <View
            style={[
              styles.progressDot,
              done && styles.progressDotDone,
              current && styles.progressDotCurrent,
            ]}
          />
        </React.Fragment>
      );
    })}
  </View>
  );
};

// ─── Platform selection ───────────────────────────────────────────────────────

type PlatformSelectionCardProps = {
  label: string;
  hint?: string;
  icon: React.ReactNode;
  iconBg: string;
  selected: boolean;
  onPress: () => void;
};

export const PlatformSelectionCard = ({
  label, hint, icon, iconBg, selected, onPress,
}: PlatformSelectionCardProps) => {
  const { palette: OB, styles } = useObStyles();
  return (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    accessibilityLabel={hint ? `${label}, ${hint}` : label}
    style={[styles.platformCard, selected ? styles.platformCardSelected : softShadow(1, 0.04)]}
  >
    <View style={[styles.platformIcon, { backgroundColor: iconBg }]}>{icon}</View>
    <View style={styles.flex}>
      <Text style={styles.platformLabel}>{label}</Text>
      {!!hint && <Text style={styles.platformHint}>{hint}</Text>}
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color={OB.text} />
  </TouchableOpacity>
  );
};

// ─── Illustrations ────────────────────────────────────────────────────────────

/** Renders an SVG asset fitted inside `width` × `height`, keeping its aspect ratio. */
export const SvgAsset = ({ asset, width, height }: { asset: OnboardingSvg; width: number; height: number }) => {
  const fitWidth = Math.min(width, height * asset.aspect);
  return <asset.Component width={fitWidth} height={fitWidth / asset.aspect} />;
};

/**
 * Large rounded-square app icon tile (Health Connect, Apple Health).
 * `fill` is for icons that already include their own tile background.
 */
export const AppIconTile = ({
  source, fallback, size = 132, fill, accessibilityLabel,
}: {
  source: OnboardingSvg | null;
  fallback: React.ReactNode;
  size?: number;
  fill?: boolean;
  accessibilityLabel: string;
}) => {
  const { styles } = useObStyles();
  const inner = fill ? size : size * 0.62;
  return (
    <View
      style={[
        styles.iconTile,
        softShadow(4, 0.1),
        { width: size, height: size, borderRadius: size * 0.24 },
        fill && styles.clip,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {source ? <SvgAsset asset={source} width={inner} height={inner} /> : fallback}
    </View>
  );
};

/**
 * Centered illustration area. The supplied screenshot SVGs already include
 * their own phone bezel, so they render unframed (aspect ratio preserved);
 * the native mock fallback is drawn inside a phone frame.
 */
export const OnboardingIllustration = ({
  source, fallback, accessibilityLabel, frame = 'android',
}: {
  source: OnboardingSvg | null;
  fallback: React.ReactNode;
  accessibilityLabel: string;
  frame?: 'android' | 'ios';
}) => {
  const { styles } = useObStyles();
  const { width, height } = useWindowDimensions();
  const frameWidth = Math.min(width - OB_LAYOUT.padding * 2, 320);
  const frameHeight = Math.max(220, Math.min(300, height * 0.36));

  if (source) {
    return (
      <View
        style={styles.illustration}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        <SvgAsset asset={source} width={frameWidth} height={frameHeight} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.phone,
        frame === 'ios' && styles.phoneIos,
        { width: frameWidth, height: frameHeight },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.phoneScreen, frame === 'ios' && styles.phoneScreenIos]}>
        {fallback}
      </View>
    </View>
  );
};

// ─── Info card ────────────────────────────────────────────────────────────────

type Tone = 'info' | 'warning' | 'error';
const tones = (OB: ObPalette): Record<Tone, { bg: string; fg: string; icon: string }> => ({
  info: { bg: OB.lavender, fg: OB.lavenderText, icon: 'lightbulb-on-outline' },
  warning: { bg: OB.warningBg, fg: OB.warning, icon: 'alert-circle-outline' },
  error: { bg: OB.errorBg, fg: OB.error, icon: 'close-circle-outline' },
});

export const InstructionInfoCard = ({
  title, body, tone = 'info', action,
}: {
  title?: string;
  body: string;
  tone?: Tone;
  action?: { label: string; onPress: () => void };
}) => {
  const { palette: OB, styles } = useObStyles();
  const t = tones(OB)[tone];
  return (
    <View
      style={[styles.info, { backgroundColor: t.bg }]}
      accessibilityLiveRegion={tone === 'info' ? 'none' : 'polite'}
    >
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={t.icon} size={20} color={t.fg} />
      </View>
      <View style={styles.flex}>
        {!!title && <Text style={[styles.infoTitle, { color: t.fg }]}>{title}</Text>}
        <Text style={styles.infoBody}>{body}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.infoAction, { color: t.fg }]}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Buttons ──────────────────────────────────────────────────────────────────

export const GradientPrimaryButton = ({
  label, onPress, loading, disabled, leftIcon, rightIcon = 'arrow-right',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: string | null;
}) => {
  const { palette: OB, styles } = useObStyles();
  return (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={onPress}
    disabled={disabled || loading}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
    style={[styles.primaryWrap, softShadow(4, 0.18), (disabled && !loading) && styles.disabled]}
  >
    <LinearGradient
      colors={OB.gradient as unknown as string[]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.primary}
    >
      {loading ? (
        <ActivityIndicator color={OB.white} />
      ) : (
        <>
          {leftIcon}
          <Text style={styles.primaryText} numberOfLines={1}>{label}</Text>
          {!!rightIcon && <MaterialCommunityIcons name={rightIcon} size={20} color={OB.white} />}
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
  );
};

export const SecondaryLink = ({
  label, onPress, disabled,
}: { label: string; onPress: () => void; disabled?: boolean }) => {
  const { styles } = useObStyles();
  return (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    style={styles.secondary}
    hitSlop={6}
  >
    <Text style={[styles.secondaryText, disabled && styles.disabled]}>{label}</Text>
  </TouchableOpacity>
  );
};

// ─── Success ──────────────────────────────────────────────────────────────────

const CONFETTI = [
  { top: 22, left: '14%', w: 12, h: 6, color: '#3BC46F', rotate: '-35deg' },
  { top: 70, left: '8%', w: 6, h: 6, color: '#F58FB0', rotate: '0deg' },
  { top: 118, left: '16%', w: 12, h: 6, color: '#F6C343', rotate: '50deg' },
  { top: 16, right: '18%', w: 6, h: 6, color: '#F58FB0', rotate: '0deg' },
  { top: 58, right: '10%', w: 5, h: 5, color: '#3BC46F', rotate: '0deg' },
  { top: 112, right: '14%', w: 10, h: 10, color: '#7FA3FF', rotate: '45deg', ring: true },
] as const;

export const OnboardingSuccess = ({
  title, body, rows, hero,
}: {
  title: string;
  body: string;
  rows: { icon: string; color: string; bg: string; label: string }[];
  hero?: OnboardingSvg | null;
}) => {
  const { palette: OB, styles } = useObStyles();
  const { width } = useWindowDimensions();
  return (
  <View style={styles.success}>
    {hero ? (
      <View style={styles.successHero} accessible accessibilityRole="image" accessibilityLabel={title}>
        <SvgAsset asset={hero} width={Math.min(width - OB_LAYOUT.padding * 2, 280)} height={170} />
      </View>
    ) : (
    <View style={styles.successHero}>
      {CONFETTI.map((c, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.confetti,
            {
              top: c.top,
              left: 'left' in c ? c.left : undefined,
              right: 'right' in c ? c.right : undefined,
              width: c.w,
              height: c.h,
              transform: [{ rotate: c.rotate }],
            },
            'ring' in c ? [styles.confettiRing, { borderColor: c.color }] : { backgroundColor: c.color },
          ]}
        />
      ))}
      <View style={styles.successRing} accessible accessibilityRole="image" accessibilityLabel={title}>
        <LinearGradient colors={['#45CC77', '#1FA35A']} style={styles.successCircle}>
          <MaterialCommunityIcons name="check" size={48} color={OB.white} />
        </LinearGradient>
      </View>
    </View>
    )}

    <Text style={[styles.title, styles.center]} accessibilityRole="header">{title}</Text>
    <Text style={[styles.subtitle, styles.center]}>{body}</Text>

    {rows.map(row => (
      <View key={row.label} style={[styles.featureRow, softShadow(1, 0.05)]}>
        <View style={[styles.featureIcon, { backgroundColor: row.bg }]}>
          <MaterialCommunityIcons name={row.icon} size={22} color={row.color} />
        </View>
        <Text style={styles.featureText}>{row.label}</Text>
      </View>
    ))}
  </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (OB: ObPalette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: OB.bg },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  glow: { position: 'absolute', borderRadius: 999 },
  glowTop: { width: 320, height: 320, top: -120, right: -140, backgroundColor: OB.glow },
  glowBottom: { width: 280, height: 280, bottom: 40, left: -160, backgroundColor: OB.glowBlue },

  header: {
    height: 48,
    paddingHorizontal: OB_LAYOUT.padding - 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OB.card,
    borderWidth: 1,
    borderColor: OB.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...softShadow(2, 0.06),
  },
  progressWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center' },
  progressLine: { width: 20, height: 3, borderRadius: 2, backgroundColor: OB.track },
  progressLineActive: { backgroundColor: OB.selected },
  progressDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: OB.track },
  progressDotDone: { backgroundColor: OB.selected },
  progressDotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: OB.selected,
    borderWidth: 3,
    borderColor: '#DCD0FF',
  },

  scroll: { flexGrow: 1, paddingHorizontal: OB_LAYOUT.padding, paddingTop: 22, paddingBottom: 24 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: OB.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 21, color: OB.muted, marginBottom: 24 },

  footer: { paddingHorizontal: OB_LAYOUT.padding, paddingTop: 8, gap: 4 },

  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 104,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    borderRadius: OB_LAYOUT.cardRadius,
    borderWidth: 1,
    borderColor: OB.border,
    backgroundColor: OB.card,
    gap: 16,
  },
  platformCardSelected: {
    borderWidth: 1.5,
    borderColor: OB.selected,
    backgroundColor: OB.selectedBg,
    ...softShadow(4, 0.12),
  },
  platformIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  platformLabel: { fontSize: 18, fontWeight: '700', color: OB.text },
  platformHint: { fontSize: 12, color: OB.muted, marginTop: 3 },

  iconTile: { backgroundColor: OB.white, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },

  phone: {
    alignSelf: 'center',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 8,
    borderBottomWidth: 0,
    borderColor: '#1C1F2A',
    backgroundColor: '#1C1F2A',
    overflow: 'hidden',
    marginBottom: 18,
  },
  phoneIos: { borderColor: '#E4E7EF', backgroundColor: '#E4E7EF' },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  phoneScreenIos: { backgroundColor: '#F2F2F7' },

  info: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 18, marginBottom: 12 },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: OB.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  infoBody: { fontSize: 13.5, lineHeight: 19, color: OB.muted },
  infoAction: { fontSize: 13.5, fontWeight: '700', marginTop: 8 },

  primaryWrap: { borderRadius: OB_LAYOUT.buttonRadius },
  primary: {
    height: OB_LAYOUT.buttonHeight,
    borderRadius: OB_LAYOUT.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  primaryText: { fontSize: 17, fontWeight: '700', color: OB.white, flexShrink: 1 },
  disabled: { opacity: 0.45 },
  secondary: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  secondaryText: { fontSize: 14, fontWeight: '600', color: OB.lavenderText },

  success: { alignItems: 'stretch' },
  successHero: { height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confetti: { position: 'absolute', borderRadius: 2 },
  confettiRing: { borderWidth: 2 },
  clip: { overflow: 'hidden' },
  illustration: { alignItems: 'center', marginBottom: 18 },
  successRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: OB.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: OB.border,
    backgroundColor: OB.card,
    marginBottom: 12,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 15, color: OB.text, fontWeight: '500' },
});

function useObStyles() {
  return useStepStyles(OB_LIGHT, OB_DARK, createStyles);
}
