import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

interface Props {
  onRetry?: () => void;
}

const HINTS = [
  { icon: 'rocket-launch',  iconColor: '#8665FF', bg: 'rgba(134,101,255,0.10)', text: 'Wi-Fi is on a space adventure' },
  { icon: 'shield-check',   iconColor: '#10B981', bg: 'rgba(16,185,129,0.10)',  text: 'Your rewards are safe at mission control' },
  { icon: 'access-point',   iconColor: '#F59E0B', bg: 'rgba(245,158,11,0.10)', text: "We'll sync everything when you're back online" },
];

export default function NoInternetScreen({ onRetry }: Props) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await NetInfo.refresh();
      onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Top gradient blob */}
      <LinearGradient
        colors={['#EDE9FE', '#F5F3FF', 'rgba(245,243,255,0)']}
        style={styles.topBlob}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Decorative orbs */}
      <View style={[styles.orb, { width: 48, height: 48, top: 60, right: 32, opacity: 0.45 }]} />
      <View style={[styles.orb, { width: 28, height: 28, top: 96, left: 28, opacity: 0.30 }]} />
      <View style={[styles.orb, { width: 18, height: 18, top: 160, right: 56, opacity: 0.25 }]} />

      <View style={styles.content}>

        {/* ── Glow rings + icon ─────────────────────────────────────── */}
        <View style={styles.ringOuter}>
          <View style={styles.ringMid}>
            <LinearGradient
              colors={['#8665FF', '#5B47A3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <MaterialCommunityIcons name="wifi-off" size={44} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>

        {/* ── Title ─────────────────────────────────────────────────── */}
        <Text style={styles.title}>No Internet Connection</Text>

        {/* Divider pill */}
        <View style={styles.divider} />

        {/* ── Hint cards ────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>QUICK TIPS</Text>
        <View style={styles.hintBlock}>
          {HINTS.map((h, i) => (
            <View key={i} style={styles.hintCard}>
              <View style={[styles.hintIconWrap, { backgroundColor: h.bg }]}>
                <MaterialCommunityIcons name={h.icon} size={18} color={h.iconColor} />
              </View>
              <Text style={styles.hintText}>{h.text}</Text>
            </View>
          ))}
        </View>

        {/* ── Try Again button ──────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleRetry}
          disabled={retrying}
          activeOpacity={0.85}
          style={styles.btnWrap}
        >
          <LinearGradient
            colors={retrying ? ['#C4B8F5', '#A090D0'] : ['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            {retrying ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.btnText}>Checking…</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.btnText}>Try Again</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Check your Wi-Fi or mobile data settings
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },

  // ── Decorations ──────────────────────────────────────────────────────────────
  topBlob: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(134,101,255,0.55)',
  },

  // ── Layout ───────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  // ── Glow rings ───────────────────────────────────────────────────────────────
  ringOuter: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(134,101,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ringMid: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(134,101,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    // shadow
    shadowColor: '#8665FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },

  // ── Text ─────────────────────────────────────────────────────────────────────
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A3AB8',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  divider: {
    width: 40,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#8665FF',
    marginBottom: 24,
    opacity: 0.5,
  },

  // ── Hint cards ───────────────────────────────────────────────────────────────
  hintBlock: {
    width: '100%',
    gap: 8,
    marginBottom: 32,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(134,101,255,0.15)',
    // shadow
    shadowColor: '#8665FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 1.4,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  hintIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500',
  },

  // ── Button ───────────────────────────────────────────────────────────────────
  btnWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8665FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  helperText: {
    marginTop: 14,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});