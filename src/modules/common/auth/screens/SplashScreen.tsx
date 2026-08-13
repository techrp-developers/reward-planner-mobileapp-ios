import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";

import logo from "../../../../assets/menu/logo.png";

const { width } = Dimensions.get("window");

const SplashScreen = () => {
  return (
    
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>
          <Text style={styles.reward}>Reward</Text>
          <Text style={styles.space}> </Text>
          <Text style={styles.planners}>Planners</Text>
        </Text>
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F1F9", // light lavender bg from design
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: width * 0.32,
    height: width * 0.32,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: 0,
    textAlign: "center",
  },
  reward: {
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 29,
    color: "#852BAF",
  },
  space: {
    fontSize: 24,
  },
  planners: {
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "600",
    fontSize: 24,
    lineHeight: 29,
    color: "#FC3F78",
  },
});