import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Reward from "../../../assets/product/rewards.svg";

type RewardModalProps = {
  visible: boolean;
  points: number;
  onClose: () => void;
};

const BRAND_GRADIENT: string[] = ["#FC8BAD", "#A654CD"];
const DARK_GRADIENT: string[] = ["#251126", "#A654CD", "#FC8BAD"];

export const RewardModal = ({ visible, points, onClose }: RewardModalProps) => {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const coinFlip = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    cardOpacity.setValue(0);
    cardScale.setValue(0.85);
    badgeScale.setValue(0);
    coinFlip.setValue(0);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 110,
        delay: 140,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(coinFlip, {
          toValue: 1,
          duration: 950,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible, cardOpacity, cardScale, badgeScale, coinFlip]);

  const coinRotateY = coinFlip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "180deg", "360deg"],
  });

  const coinScaleX = coinFlip.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.42, 1, 0.42, 1],
  });

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          {/* Badge with layered glow + floating sparkles */}
          <View style={styles.badgeWrap}>
            <View style={styles.glowOuter} />
            <View style={styles.glowMid} />

            <Animated.View
              style={[
                styles.coinFlip,
                {
                  transform: [
                    { perspective: 900 },
                    { scale: badgeScale },
                    { rotateY: coinRotateY },
                    { scaleX: coinScaleX },
                  ],
                },
              ]}
            >
              <View style={styles.badgeCircleShadow}>
              <LinearGradient
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badgeCircle}
              >
                <Reward width={46} height={46} />
              </LinearGradient>
              </View>
            </Animated.View>

            <MaterialCommunityIcons
              name="star-four-points"
              size={18}
              color="#FC8BAD"
              style={styles.sparkleTopLeft}
            />
            <MaterialCommunityIcons
              name="star-four-points"
              size={12}
              color="#A654CD"
              style={styles.sparkleTopRight}
            />
            <MaterialCommunityIcons
              name="circle"
              size={8}
              color="#FC8BAD"
              style={styles.sparkleBottom}
            />
          </View>

          {/* Header */}
          <View style={styles.premiumPill}>
            <MaterialCommunityIcons name="crown-outline" size={15} color="#A654CD" />
            <Text style={styles.premiumPillText}>Welcome Bonus</Text>
          </View>
          <Text style={styles.title}>Welcome to Reward Planners</Text>
          <Text style={styles.subtitle}>Your account is now active</Text>

          {/* Reward Card */}
          <View style={styles.rewardCardShadow}>
          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardCard}
          >
            <View style={styles.rewardBonusRow}>
              <MaterialCommunityIcons name="star-four-points" size={13} color="#FFE9F4" />
              <Text style={styles.rewardBonusLabel}>First Login Bonus</Text>
              <MaterialCommunityIcons name="star-four-points" size={13} color="#FFE9F4" />
            </View>

            <Text style={styles.rewardAmount}>{points.toLocaleString()}</Text>
            <Text style={styles.rewardCoinsLabel}>Reward Coins</Text>

            <View style={styles.rewardSuccessPill}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#FFFFFF" />
              <Text style={styles.rewardSuccessText}>Successfully Credited</Text>
            </View>

            <View style={styles.rewardMetaRow}>
              <View style={styles.rewardMetaItem}>
                <MaterialCommunityIcons name="wallet-giftcard" size={16} color="#FFFFFF" />
                <Text style={styles.rewardMetaText}>Reward wallet</Text>
              </View>
              <View style={styles.rewardMetaDivider} />
              <View style={styles.rewardMetaItem}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFFFFF" />
                <Text style={styles.rewardMetaText}>Ready to use</Text>
              </View>
            </View>
          </LinearGradient>
          </View>

          {/* Content */}
          <Text style={styles.description}>
            Congratulations!{"\n\n"}
            As a welcome gift, we have credited{" "}
            <Text style={styles.descriptionHighlight}>
              {points.toLocaleString()} reward coins
            </Text>{" "}
            to your account.{"\n\n"}
            Start earning, shopping, and redeeming exciting rewards with Reward Planners.
          </Text>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleClose}
            style={styles.buttonContainer}
          >
            <View style={styles.gradientBtnShadow}>
            <LinearGradient
              colors={DARK_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <Text style={styles.btnText}>Start Exploring</Text>
              <MaterialCommunityIcons name="arrow-right" size={19} color="#FFFFFF" />
            </LinearGradient>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(7, 6, 10, 0.76)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 386,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(166, 84, 205, 0.18)",
    shadowColor: "#5B1E7A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.34,
    shadowRadius: 30,
    elevation: 20,
  },
  badgeWrap: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  glowOuter: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(166, 84, 205, 0.08)",
  },
  glowMid: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(166, 84, 205, 0.14)",
  },
  coinFlip: {
    backfaceVisibility: "hidden",
  },
  badgeCircleShadow: {
      shadowColor: "#A654CD",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.45,
      shadowRadius: 18,
      elevation: 12,
      borderRadius: 44,
    },

  badgeCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sparkleTopLeft: { position: "absolute", top: 6, left: 10 },
  sparkleTopRight: { position: "absolute", top: 18, right: 4 },
  sparkleBottom: { position: "absolute", bottom: 10, left: 22 },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF2F8",
    borderWidth: 1,
    borderColor: "rgba(252, 139, 173, 0.35)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },
  premiumPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A654CD",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2D1732",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8D7A94",
    marginBottom: 22,
  },
  rewardCardShadow: {
      shadowColor: "#5B1E7A",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.32,
      shadowRadius: 20,
      elevation: 14,
      borderRadius: 22,
    },

  rewardCard: {
    width: "100%",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
  },
  rewardBonusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  rewardBonusLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFE9F4",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  rewardAmount: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  rewardCoinsLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFE9F4",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
    marginBottom: 14,
  },
  rewardSuccessPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  rewardSuccessText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rewardMetaRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.22)",
  },
  rewardMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewardMetaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  rewardMetaDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  description: {
    fontSize: 14,
    color: "#5F5267",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  descriptionHighlight: {
    fontWeight: "800",
    color: "#A654CD",
  },
  buttonContainer: {
    width: "100%",
  },
  gradientBtnShadow: {
      shadowColor: "#251126",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 16,
      elevation: 10,
      borderRadius: 18,
    },

  gradientBtn: {
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
