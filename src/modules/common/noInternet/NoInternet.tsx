import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme/ThemeContext';

interface Props {
  onRetry?: () => void;
}

const STATUS_CARDS = [
  {
    icon: 'cloud-sync-outline',
    title: 'Auto sync',
    text: 'Rewards and orders will refresh when the connection returns.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Data protected',
    text: 'Your wallet activity stays safe while you are offline.',
  },
];

export default function NoInternetScreen({ onRetry }: Props) {
  const { isDark } = useAppTheme();
  const [retrying, setRetrying] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const barOne = useRef(new Animated.Value(0.25)).current;
  const barTwo = useRef(new Animated.Value(0.45)).current;
  const barThree = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const makeBarLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0.28,
            duration: 520,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      );

    const loops = [
      pulseLoop,
      floatLoop,
      makeBarLoop(barOne, 0),
      makeBarLoop(barTwo, 130),
      makeBarLoop(barThree, 260),
    ];

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [barOne, barThree, barTwo, float, pulse]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await NetInfo.refresh();
      onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  const colors = {
    background: isDark ? '#050507' : '#F8F7FF',
    topGlow: isDark ? ['#171022', '#09090B', 'rgba(9,9,11,0)'] : ['#EDE9FE', '#F8F7FF', 'rgba(248,247,255,0)'],
    card: isDark ? '#111113' : '#FFFFFF',
    cardSoft: isDark ? '#17171A' : '#F8F6FF',
    border: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(134,101,255,0.14)',
    text: isDark ? '#FFFFFF' : '#21172D',
    muted: isDark ? '#A1A1AA' : '#6B6474',
    subtle: isDark ? '#71717A' : '#8B8497',
    primary: isDark ? '#A78BFA' : '#8665FF',
    primaryDark: isDark ? '#7C3AED' : '#5B47A3',
    accent: isDark ? '#F472B6' : '#FC8BAD',
    orb: isDark ? 'rgba(167,139,250,0.16)' : 'rgba(134,101,255,0.18)',
  };

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.84, 1.35],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });
  const floatTranslateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.topGlow}
        style={styles.topGlow}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <View style={[styles.orbLarge, { backgroundColor: colors.orb }]} />
      <View style={[styles.orbSmall, { backgroundColor: colors.orb }]} />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.hero,
            {
              transform: [{ translateY: floatTranslateY }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.pulseRing,
              {
                borderColor: colors.primary,
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <View style={[styles.signalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="wifi-off" size={42} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.signalBars}>
              {[barOne, barTwo, barThree].map((bar, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.signalBar,
                    {
                      height: bar.interpolate({
                        inputRange: [0.28, 1],
                        outputRange: [16 + index * 8, 42 + index * 10],
                      }),
                      backgroundColor: index === 2 ? colors.accent : colors.primary,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>CONNECTION LOST</Text>
        <Text style={[styles.title, { color: colors.text }]}>No Internet Connection</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          We are holding your place. Reconnect to continue shopping, booking, and redeeming rewards.
        </Text>

        <View style={styles.statusGrid}>
          {STATUS_CARDS.map((item) => (
            <View
              key={item.title}
              style={[
                styles.statusCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.statusIcon, { backgroundColor: colors.cardSoft }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.statusTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.statusText, { color: colors.subtle }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleRetry}
          disabled={retrying}
          activeOpacity={0.86}
          style={styles.btnWrap}
        >
          <LinearGradient
            colors={retrying ? ['#B8A9EF', '#8F7AC8'] : [colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            {retrying ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.btnText}>Checking...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.btnText}>Try Again</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.helperText, { color: colors.subtle }]}>
          Check Wi-Fi, mobile data, or airplane mode.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    borderBottomLeftRadius: 90,
    borderBottomRightRadius: 90,
  },
  orbLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -52,
    top: 80,
  },
  orbSmall: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    left: -22,
    top: 156,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  hero: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  pulseRing: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2,
  },
  signalCard: {
    width: 154,
    height: 154,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalBars: {
    position: 'absolute',
    bottom: 18,
    right: 20,
    height: 66,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  signalBar: {
    width: 8,
    borderRadius: 99,
    opacity: 0.9,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    maxWidth: 330,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  statusGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statusCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  btnWrap: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  helperText: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
