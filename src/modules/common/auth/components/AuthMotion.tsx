import React, { useEffect, useState } from "react";
import { AccessibilityInfo, TouchableOpacity, type TouchableOpacityProps } from "react-native";
import Animated, {
  cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion,
  useSharedValue, withDelay, withTiming,
} from "react-native-reanimated";

// Reanimated supplies a synchronous startup value; subscribe as well so changes
// made in accessibility settings take effect while the screen is mounted.
export function useAuthReducedMotion() {
  const initialPreference = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialPreference);
  useEffect(() => {
    let active = true;
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setReducedMotion(value);
    }).catch(() => {});
    return () => { active = false; listener.remove(); };
  }, []);
  return reducedMotion;
}

export function AuthEntrance({ children, delay, enabled, reducedMotion }: {
  children: React.ReactNode;
  delay: number;
  enabled: boolean;
  reducedMotion: boolean;
}) {
  const progress = useSharedValue(enabled && !reducedMotion ? 0 : 1);
  useEffect(() => {
    if (!enabled || reducedMotion) {
      cancelAnimation(progress);
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, {
      duration: 420, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System,
    }));
    return () => cancelAnimation(progress);
  }, [delay, enabled, progress, reducedMotion]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function AuthPressable({ children, onPressIn, onPressOut, disabled, ...props }: TouchableOpacityProps) {
  const reducedMotion = useAuthReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reducedMotion || disabled) {
      cancelAnimation(scale);
      scale.value = 1;
    }
    return () => cancelAnimation(scale);
  }, [disabled, reducedMotion, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <TouchableOpacity {...props} disabled={disabled}
        onPressIn={event => {
          if (!reducedMotion && !disabled) scale.value = withTiming(0.98, { duration: 100 });
          onPressIn?.(event);
        }}
        onPressOut={event => {
          scale.value = reducedMotion ? 1 : withTiming(1, { duration: 120 });
          onPressOut?.(event);
        }}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
