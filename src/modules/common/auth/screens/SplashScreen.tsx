import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchAllCategories } from "../../../ecommerce/api/ProductApi";
import {
  fetchBestSellers,
  fetchMostViewedProducts,
  fetchTopRatedProducts,
} from "../../../ecommerce/api/PromotionalApi";

const MIN_SPLASH_MS = 1800;

const CONFETTI = [
  { x: -72, y: -92, color: "#EC4899", rotate: "-28deg" },
  { x: -44, y: -118, color: "#8B5CF6", rotate: "22deg" },
  { x: -16, y: -98, color: "#FFFFFF", rotate: "54deg" },
  { x: 18, y: -124, color: "#F472B6", rotate: "-36deg" },
  { x: 48, y: -100, color: "#34D399", rotate: "30deg" },
  { x: 74, y: -80, color: "#F472B6", rotate: "-18deg" },
  { x: -82, y: -42, color: "#34D399", rotate: "40deg" },
  { x: 82, y: -48, color: "#8B5CF6", rotate: "-42deg" },
];

const SPARKLES = [
  { x: -52, y: -76, size: 8, color: "#FFFFFF" },
  { x: 56, y: -88, size: 7, color: "#F9A8D4" },
  { x: -88, y: -8, size: 6, color: "#8B5CF6" },
  { x: 88, y: -14, size: 6, color: "#FFFFFF" },
];

function SplashScreenComponent() {
  const isMounted = useRef(true);
  const giftScale = useRef(new Animated.Value(0.88)).current;
  const lidOpen = useRef(new Animated.Value(0)).current;
  const celebration = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const giftAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.spring(giftScale, {
            toValue: 1,
            tension: 84,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(lidOpen, {
            toValue: 1,
            duration: 560,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
          Animated.timing(celebration, {
            toValue: 1,
            duration: 720,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sparkle, {
            toValue: 1,
            duration: 620,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(580),
        Animated.parallel([
          Animated.timing(lidOpen, {
            toValue: 0,
            duration: 380,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(celebration, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sparkle, {
            toValue: 0,
            duration: 260,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(giftScale, {
            toValue: 0.94,
            duration: 380,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 380,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(180),
      ]),
    );

    giftAnimation.start();

    const prepareApp = async () => {
      const minDelay = new Promise<void>((resolve) =>
        setTimeout(resolve, MIN_SPLASH_MS),
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
      giftAnimation.stop();
    };
  }, [celebration, giftScale, glow, lidOpen, sparkle]);

  const lidRotate = useMemo(
    () =>
      lidOpen.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-18deg"],
      }),
    [lidOpen],
  );

  const lidTranslateY = useMemo(
    () =>
      lidOpen.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -30],
      }),
    [lidOpen],
  );

  const lidTranslateX = useMemo(
    () =>
      lidOpen.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -5],
      }),
    [lidOpen],
  );

  const glowScale = useMemo(
    () =>
      glow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.72, 1.18],
      }),
    [glow],
  );

  const glowOpacity = useMemo(
    () =>
      glow.interpolate({
        inputRange: [0, 1],
        outputRange: [0.16, 0.46],
      }),
    [glow],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.stage}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {CONFETTI.map((piece, index) => {
          const translateX = celebration.interpolate({
            inputRange: [0, 1],
            outputRange: [0, piece.x],
          });
          const translateY = celebration.interpolate({
            inputRange: [0, 1],
            outputRange: [0, piece.y],
          });
          const opacity = celebration.interpolate({
            inputRange: [0, 0.12, 0.78, 1],
            outputRange: [0, 1, 1, 0],
          });
          const scale = celebration.interpolate({
            inputRange: [0, 0.16, 1],
            outputRange: [0.4, 1, 0.9],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: piece.color,
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate: piece.rotate },
                    { scale },
                  ],
                },
              ]}
            />
          );
        })}

        {SPARKLES.map((item, index) => {
          const opacity = sparkle.interpolate({
            inputRange: [0, 0.18, 0.7, 1],
            outputRange: [0, 1, 0.9, 0],
          });
          const scale = sparkle.interpolate({
            inputRange: [0, 0.18, 1],
            outputRange: [0.4, 1, 1.25],
          });

          return (
            <Animated.View
              key={`sparkle-${index}`}
              style={[
                styles.sparkle,
                {
                  width: item.size,
                  height: item.size,
                  backgroundColor: item.color,
                  opacity,
                  transform: [
                    { translateX: item.x },
                    { translateY: item.y },
                    { rotate: "45deg" },
                    { scale },
                  ],
                },
              ]}
            />
          );
        })}

        <Animated.View style={[styles.gift, { transform: [{ scale: giftScale }] }]}>
          <View style={styles.giftShadow} />
          <Animated.View
            style={[
              styles.lid,
              {
                transform: [
                  { translateX: lidTranslateX },
                  { translateY: lidTranslateY },
                  { rotate: lidRotate },
                ],
              },
            ]}
          >
            <View style={styles.lidRibbon} />
            <View style={styles.lidHighlight} />
          </Animated.View>

          <View style={styles.box}>
            <View style={styles.boxHighlight} />
            <View style={styles.verticalRibbon} />
            <View style={styles.horizontalRibbon} />
            <View style={styles.boxBaseShadow} />
          </View>

          <View style={styles.bowRow}>
            <View style={[styles.bowLoop, styles.bowLeft]} />
            <View style={styles.bowKnot} />
            <View style={[styles.bowLoop, styles.bowRight]} />
          </View>
        </Animated.View>
      </View>

      <Text style={styles.label}>Reward Planners</Text>
    </View>
  );
}

const SplashScreen = React.memo(SplashScreenComponent);
export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  stage: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#EC4899",
  },
  gift: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  giftShadow: {
    position: "absolute",
    bottom: -8,
    width: 118,
    height: 24,
    borderRadius: 59,
    backgroundColor: "rgba(236, 72, 153, 0.24)",
    transform: [{ scaleX: 1.08 }],
  },
  lid: {
    position: "absolute",
    top: 32,
    width: 112,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EC4899",
    borderWidth: 2,
    borderColor: "#F9A8D4",
    zIndex: 3,
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  lidRibbon: {
    position: "absolute",
    left: 49,
    top: -2,
    width: 14,
    height: 32,
    backgroundColor: "#8B5CF6",
  },
  lidHighlight: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 4,
    height: 5,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  box: {
    width: 96,
    height: 78,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#EC4899",
    borderWidth: 2,
    borderColor: "#F9A8D4",
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  boxHighlight: {
    position: "absolute",
    top: 7,
    left: 8,
    right: 8,
    height: 18,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  verticalRibbon: {
    position: "absolute",
    left: 39,
    top: 0,
    width: 18,
    height: "100%",
    backgroundColor: "#8B5CF6",
  },
  horizontalRibbon: {
    position: "absolute",
    left: 0,
    top: 28,
    width: "100%",
    height: 16,
    backgroundColor: "#8B5CF6",
  },
  boxBaseShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    backgroundColor: "rgba(0, 0, 0, 0.14)",
  },
  bowRow: {
    position: "absolute",
    top: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  bowLoop: {
    width: 32,
    height: 24,
    borderRadius: 16,
    borderWidth: 8,
    borderColor: "#8B5CF6",
  },
  bowLeft: {
    transform: [{ rotate: "-24deg" }],
  },
  bowRight: {
    transform: [{ rotate: "24deg" }],
  },
  bowKnot: {
    width: 18,
    height: 18,
    marginHorizontal: -4,
    borderRadius: 9,
    backgroundColor: "#8B5CF6",
  },
  confetti: {
    position: "absolute",
    width: 9,
    height: 16,
    borderRadius: 3,
    zIndex: 1,
  },
  sparkle: {
    position: "absolute",
    borderRadius: 2,
    zIndex: 2,
  },
  label: {
    marginTop: 20,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "rgba(236, 72, 153, 0.42)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
});
