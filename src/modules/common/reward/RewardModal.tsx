import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Reward from "../../../assets/product/rewards.svg";

type RewardModalProps = {
  visible: boolean;
  points: number;
  onClose: () => void;
};

const BRAND_GRADIENT: string[] = ["#FC8BAD", "#A654CD"];

export const RewardModal = ({ visible, points, onClose }: RewardModalProps) => {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    cardOpacity.setValue(0);
    cardScale.setValue(0.85);
    badgeScale.setValue(0);

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
    ]).start();
  }, [visible, cardOpacity, cardScale, badgeScale]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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

            <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
              <LinearGradient
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badgeCircle}
              >
                <Reward width={46} height={46} />
              </LinearGradient>
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
          <Text style={styles.title}>🎉 Welcome to Reward Planners</Text>
          <Text style={styles.subtitle}>Your account is now active</Text>

          {/* Reward Card */}
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
          </LinearGradient>

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
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <Text style={styles.btnText}>Start Exploring</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#5B1E7A",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 18,
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
  badgeCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#A654CD",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  sparkleTopLeft: { position: "absolute", top: 6, left: 10 },
  sparkleTopRight: { position: "absolute", top: 18, right: 4 },
  sparkleBottom: { position: "absolute", bottom: 10, left: 22 },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#852BAF",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9B8AA8",
    marginBottom: 22,
  },
  rewardCard: {
    width: "100%",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 22,
    shadowColor: "#5B1E7A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 14,
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
    marginBottom: 16,
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
  description: {
    fontSize: 14,
    color: "#666",
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
  gradientBtn: {
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A654CD",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
