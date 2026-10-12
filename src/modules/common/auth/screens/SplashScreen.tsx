import React from "react";
import { View, Image, StatusBar, StyleSheet, useWindowDimensions } from "react-native";

import logo from "../../../../assets/menu/logo.png";
import logoword from "../../../../assets/homepage/Reward Planners word Logo.png";

const SplashScreen = () => {
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(width * 0.52, height * 0.32, 240);
  const wordWidth = Math.min(width * 0.76, 340);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F1F9" />
      <View style={styles.content}>
        <View style={[styles.logo, { width: logoSize, height: logoSize }]}>
          <Image
            source={logo}
            style={{ width: logoSize * 2, height: logoSize * 2 }}
            resizeMode="contain"
          />
        </View>
        <Image
          source={logoword}
          style={{ width: wordWidth, height: wordWidth * 718 / 2191 }}
          resizeMode="contain"
          accessible
          accessibilityLabel="Reward Planners"
        />
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F1F9",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    marginBottom: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
