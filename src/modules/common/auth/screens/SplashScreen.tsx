import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import logo from "../../../../assets/menu/logo.png";
import { fetchAllCategories } from "../../../ecommerce/api/ProductApi";
import {
  fetchBestSellers,
  fetchMostViewedProducts,
  fetchTopRatedProducts,
} from "../../../ecommerce/api/PromotionalApi";

const MIN_SPLASH_MS = 2500;

function SplashScreenComponent() {
  const isMounted = useRef(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const dotOne = useRef(new Animated.Value(0)).current;
  const dotTwo = useRef(new Animated.Value(0)).current;
  const dotThree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const introAnimation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 58,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    const ringAnimation = Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 1700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const floatingAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(floatA, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatA, {
            toValue: 0,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(floatB, {
            toValue: 1,
            duration: 3400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatB, {
            toValue: 0,
            duration: 3400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const createDotAnimation = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 360,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(360 - delay),
        ])
      );

    const dotAnimations = [
      createDotAnimation(dotOne, 0),
      createDotAnimation(dotTwo, 120),
      createDotAnimation(dotThree, 240),
    ];

    introAnimation.start();
    ringAnimation.start();
    shimmerAnimation.start();
    floatingAnimation.start();
    dotAnimations.forEach((animation) => animation.start());

    const prepareApp = async () => {
      const minDelay = new Promise<void>((resolve) =>
        setTimeout(resolve, MIN_SPLASH_MS)
      );

      const fetchAll = Promise.all([
        fetchBestSellers().catch(() => null),
        fetchTopRatedProducts().catch(() => null),
        fetchMostViewedProducts().catch(() => null),
        fetchAllCategories().catch(() => null),
      ]);

      await Promise.all([fetchAll, minDelay]);

      if (!isMounted.current) return;
    };

    prepareApp().catch((error) => {
      if (isMounted.current) {
        console.warn("SplashScreen prepareApp error:", error);
      }
    });

    return () => {
      isMounted.current = false;
      introAnimation.stop();
      ringAnimation.stop();
      shimmerAnimation.stop();
      floatingAnimation.stop();
      dotAnimations.forEach((animation) => animation.stop());
    };
  }, [
    dotOne,
    dotThree,
    dotTwo,
    floatA,
    floatB,
    logoOpacity,
    logoScale,
    ringRotate,
    shimmer,
  ]);

  const spin = useMemo(
    () => ringRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    }),
    [ringRotate],
  );

  const floatATranslate = useMemo(
    () => floatA.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -18],
    }),
    [floatA],
  );

  const floatBTranslate = useMemo(
    () => floatB.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 22],
    }),
    [floatB],
  );

  const shimmerTranslate = useMemo(
    () => shimmer.interpolate({
      inputRange: [0, 1],
      outputRange: [-120, 120],
    }),
    [shimmer],
  );

  const dotTranslate = useCallback(
    (value: Animated.Value) =>
      value.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
      }),
    [],
  );

  const dotValues = useMemo(
    () => [dotOne, dotTwo, dotThree],
    [dotOne, dotTwo, dotThree],
  );

  return (
    <LinearGradient
      colors={["#050716", "#0B1027", "#17102F"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingShape,
          styles.shapeTop,
          { transform: [{ translateY: floatATranslate }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingShape,
          styles.shapeBottom,
          { transform: [{ translateY: floatBTranslate }] },
        ]}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoStage,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View
            style={[styles.loadingRing, { transform: [{ rotate: spin }] }]}
          />
          <View style={styles.logoCard}>
            <Image source={logo} style={styles.logo} />
          </View>
        </Animated.View>

        <View style={styles.copy}>
          <Text style={styles.title}>Reward Planner</Text>
          <Text style={styles.subtitle}>Getting your rewards ready</Text>
        </View>

        <View style={styles.loader}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressShimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />
          </View>
          <View style={styles.dots}>
            {dotValues.map((dot, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { transform: [{ translateY: dotTranslate(dot) }] },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const SplashScreen = React.memo(SplashScreenComponent);
export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  floatingShape: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.35,
  },
  shapeTop: {
    top: 74,
    right: -58,
    width: 184,
    height: 184,
    backgroundColor: "#EC4899",
  },
  shapeBottom: {
    left: -72,
    bottom: 78,
    width: 218,
    height: 218,
    backgroundColor: "#7C3AED",
  },
  logoStage: {
    width: 188,
    height: 188,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRing: {
    position: "absolute",
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderTopColor: "#EC4899",
    borderRightColor: "#A855F7",
    borderBottomColor: "rgba(168, 85, 247, 0.28)",
  },
  logoCard: {
    width: 126,
    height: 126,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDF7FF",
    borderWidth: 1,
    borderColor: "rgba(244, 114, 182, 0.42)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 10,
  },
  logo: {
    width: 88,
    height: 88,
    resizeMode: "contain",
  },
  copy: {
    alignItems: "center",
    marginTop: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    color: "rgba(226, 232, 240, 0.78)",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0,
    marginTop: 8,
  },
  loader: {
    width: "100%",
    maxWidth: 260,
    alignItems: "center",
    marginTop: 34,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  progressShimmer: {
    width: 120,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#EC4899",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 24,
    marginTop: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#A855F7",
  },
});
