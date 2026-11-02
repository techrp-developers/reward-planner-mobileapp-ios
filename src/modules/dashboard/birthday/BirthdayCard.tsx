import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fs, rs } from '../../../utils/responsive';
import type { BirthdayEmployee } from './types';
import { useTranslation } from "react-i18next";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_SIZE = rs(64);
const RING_SIZE = AVATAR_SIZE + rs(6);   // 3px ring each side

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = memo(({ name, photo }: { name: string; photo?: string | null }) => {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    // Gold-warm gradient ring — contrasts beautifully with the purple card
    <View style={[styles.avatarRing, { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2 }]}>
      {/* LinearGradient 2.8 is a legacy view on Fabric: keep it childless so
          iOS lays out the avatar inside the ring. */}
      <LinearGradient
        pointerEvents="none"
        colors={['#E0E7FF', '#818CF8', '#4F46E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.avatarInner, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={[styles.avatarImage, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.initialsText}>{initials}</Text>
        )}
      </View>
    </View>
  );
});

// ─── Decorative sparkle dot ───────────────────────────────────────────────────

const SparkDot = memo(({
  size, top, right, left, bottom, color, delay,
}: {
  size: number;
  top?: number; right?: number; left?: number; bottom?: number;
  color: string;
  delay: number;
}) => {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, delay]);

  return (
    <Animated.View
      style={[
        styles.sparkDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top, right, left, bottom,
          opacity: pulse,
        },
      ]}
    />
  );
});

// ─── BirthdayCard ─────────────────────────────────────────────────────────────

const BirthdayCard = memo(({
  employee,
  isDark,
}: {
  employee: BirthdayEmployee;
  isDark: boolean;
}) => {
  const { width } = useWindowDimensions();
  const cardWidth = width - rs(32);  // matches dashboard horizontal padding

  // Subtle floating lift animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1, duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0, duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const { t: tr } = useTranslation();

  const message =
    employee.message ??
    tr("dashboard:birthday.defaultMessage");

  return (
    <Animated.View style={[styles.wrapper, { width: cardWidth, transform: [{ translateY }] }]}>
      <View style={[styles.card, { backgroundColor: isDark ? '#111827' : '#1E1B4B' }]}>
        <LinearGradient
          pointerEvents="none"
          colors={isDark
            ? ['#09090B', '#111827', '#18181B']
            : ['#111827', '#1E1B4B', '#312E81']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* ── Decorative background blobs ─────────────────────────────── */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />
        <SparkDot size={rs(5)} top={rs(18)} right={rs(56)} color="rgba(199,210,254,0.75)" delay={0} />
        <SparkDot size={rs(4)} top={rs(40)} right={rs(30)} color="rgba(255,255,255,0.5)" delay={400} />
        <SparkDot size={rs(5)} bottom={rs(22)} right={rs(72)} color="rgba(129,140,248,0.75)" delay={800} />
        <SparkDot size={rs(3)} bottom={rs(40)} right={rs(20)} color="rgba(99,102,241,0.55)" delay={200} />

        {/* ── Glassmorphism inner panel ────────────────────────────────── */}
        <View style={styles.glass}>

          {/* Main content row: avatar left, info right */}
          <View style={styles.contentRow}>

            {/* Avatar + department badge */}
            <View style={styles.avatarSection}>
              <Avatar name={employee.name} photo={employee.photo} />
              {!!employee.department?.trim() && (
                <View style={styles.deptBadge}>
                  <MaterialCommunityIcons name="domain" size={fs(9)} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.deptBadgeText} numberOfLines={1}>
                    {employee.department}
                  </Text>
                </View>
              )}
            </View>

            {/* Text content */}
            <View style={styles.textSection}>
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <MaterialCommunityIcons name="cake-variant" size={fs(12)} color="#C7D2FE" />
                  <Text style={styles.chipText}>{tr("dashboard:birthday.happy")}</Text>
                </View>
              </View>
              <Text style={styles.nameText} numberOfLines={1}>
                {employee.name}
              </Text>
              {!!employee.designation?.trim() && (
                <Text style={styles.designationText} numberOfLines={1}>
                  {employee.designation}
                </Text>
              )}

              <View style={styles.separator} />

              <Text style={styles.messageText} numberOfLines={2}>
                "{message}"
              </Text>
            </View>

          </View>
        </View>

        {/* ── Cake icon — decorative, top-right corner ─────────────────── */}
        <View style={styles.cakeIconWrap}>
          <MaterialCommunityIcons name="cake-variant-outline" size={rs(36)} color="rgba(255,255,255,0.08)" />
        </View>

      </View>
    </Animated.View>
  );
});

export default BirthdayCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    // width set inline. A solid background gives iOS a rounded shape to cast
    // the shadow from, instead of a grey block behind the card.
    borderRadius: rs(20),
    backgroundColor: '#1E1B4B',
    ...Platform.select({
      ios: {
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: rs(6) },
        shadowOpacity: 0.25,
        shadowRadius: rs(12),
      },
      android: { elevation: 8 },
    }),
  },

  card: {
    borderRadius: rs(20),
    overflow: 'hidden',
    minHeight: rs(162),
    position: 'relative',
  },

  // ── Background decoration ────────────────────────────────────────────────────
  blobTopRight: {
    position: 'absolute',
    width: rs(140),
    height: rs(140),
    borderRadius: rs(70),
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -rs(40),
    right: -rs(30),
  },
  blobBottomLeft: {
    position: 'absolute',
    width: rs(90),
    height: rs(90),
    borderRadius: rs(45),
    backgroundColor: 'rgba(79,70,229,0.16)',
    bottom: -rs(30),
    left: -rs(20),
  },

  // ── Glass panel ──────────────────────────────────────────────────────────────
  sparkDot: {
    position: 'absolute',
  },
  glass: {
    margin: rs(6),
    borderRadius: rs(16),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
  },

  // ── Celebration chip ─────────────────────────────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    marginBottom: rs(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: rs(20),
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderWidth: 1,
    borderColor: 'rgba(199,210,254,0.28)',
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#C7D2FE',
    letterSpacing: 0.2,
  },

  // ── Content row ──────────────────────────────────────────────────────────────
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(14),
  },

  // ── Avatar section ───────────────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    gap: rs(6),
    flexShrink: 0,
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInner: {
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  initialsText: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: rs(10),
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    maxWidth: rs(76),
  },
  deptBadgeText: {
    fontSize: fs(8),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    flexShrink: 1,
  },

  // ── Text section ─────────────────────────────────────────────────────────────
  textSection: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: rs(2),
  },
  nameText: {
    fontSize: fs(17),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: fs(22),
  },
  designationText: {
    fontSize: fs(11),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: rs(8),
  },
  messageText: {
    fontSize: fs(10.5),
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: fs(15),
  },

  // ── Cake watermark ───────────────────────────────────────────────────────────
  cakeIconWrap: {
    position: 'absolute',
    bottom: rs(8),
    right: rs(12),
    pointerEvents: 'none',
  },
});
