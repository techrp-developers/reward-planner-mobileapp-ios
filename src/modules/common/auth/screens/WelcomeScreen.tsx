import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import GiftBanner from "../../../../assets/homepage/final splash screen.svg";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { AuthStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Welcome">;

// Rendered directly as an AuthStack.Screen component, so React Navigation
// only ever supplies {navigation, route} — it must get to Login via
// useNavigation, not a caller-supplied prop.
const WelcomeScreen = () => {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.screen}>
      <GiftBanner
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={styles.backgroundArtwork}
      />

      <View style={styles.overlay}>
        {/* Text block sits over the bottom (faded/light) part of the image */}
        <View style={styles.textWrapper}>
          <Text style={styles.title}>
            Unlock Exclusive rewards,{"\n"}deals & benefits
          </Text>
          <Text style={styles.subtitle}>
            Shop More, save more, pay smarter, travel better,{"\n"}
            and enjoy employee benefits. All in one place
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Login")}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={["#FC8BAD", "#A654CD"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <MaterialCommunityIcons name="chevron-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "rgb(250,247,250)",
  },
  backgroundArtwork: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 30,
  },
  textWrapper: {
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A1A1A",
    lineHeight: 26,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B6B6B",
    lineHeight: 19,
    marginBottom: 32,

  },
  buttonWrapper: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  button: {
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: 28,
    gap: 8,
    marginBottom: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
