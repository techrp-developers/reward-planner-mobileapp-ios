import React, { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PERMISSIONS, request } from "react-native-permissions";
import MaskedView from "@react-native-masked-view/masked-view";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import GiftBanner from "../../../../assets/homepage/login_logo.svg";
import AuthButton from "../../components/AuthButton";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import type { AuthStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "LocationAccess">;
type LocationAccessRouteProp = RouteProp<AuthStackParamList, "LocationAccess">;

function LocationAccessScreen() {
  const navigation = useNavigation<Nav>();
  const { height } = useWindowDimensions();
  const route = useRoute<LocationAccessRouteProp>();
  const { isDark } = useAppTheme();
  const { authenticateWithTokens } = useAuth();
  const [requesting, setRequesting] = useState(false);

  // Whether permission is granted, denied, or the request itself fails,
  // login proceeds regardless — this screen is an onboarding ask, not a
  // gate. RootNavigator swaps to the App/TermsGate stack automatically
  // once authenticateWithTokens flips isAuthenticated true.
  const handleAllow = useCallback(async () => {
    setRequesting(true);
    try {
      const permission =
        Platform.OS === "android"
          ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      await request(permission);
    } catch (error) {
      if (__DEV__) console.log("[LocationAccessScreen] permission request failed", error);
    } finally {
      await authenticateWithTokens(route.params.verifyResult);
      setRequesting(false);
    }
  }, [authenticateWithTokens, route.params.verifyResult]);

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}
    >
      <View style={[styles.illustrationWrapper, { height: height * 0.35 }]}>
        <GiftBanner width={278} height={209} />
      </View>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? "#18181B" : "#FFFFFF" }]}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color={isDark ? "#FFFFFF" : "#1F2937"} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: isDark ? "#09090B" : "#FFFFFF", marginTop: height * 0.35 }]}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>Location Access</Text>

        <View style={styles.pinWrap}>
          <MaskedView
            style={styles.markerMask}
            maskElement={<MaterialCommunityIcons name="map-marker" size={124} color="#000000" />}
          >
            <LinearGradient
              colors={["#A654CD", "#F0009D", "#FC8BAD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.markerGradient}
            />
          </MaskedView>
          <View style={styles.markerCenter} />
        </View>

        <Text style={[styles.heading, { color: isDark ? "#FFFFFF" : "#1F2937" }]}>
          Allow Location Access
        </Text>
        <Text style={[styles.description, { color: isDark ? "#A1A1AA" : "#6B7280" }]}>
          Find nearby offers, services, stores, turfs,{"\n"}
          healthcare providers, and travel options based on{"\n"}
          your current location.
        </Text>

        <AuthButton
          label="Allow Location Access"
          onPress={handleAllow}
          loading={requesting}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

export default React.memo(LocationAccessScreen);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  illustrationWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
    shadowColor: "#5B2677",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 22,
    alignItems: "center",
    shadowColor: "#6B278D",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 38,
    textShadowColor: "rgba(133,43,175,0.12)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  pinWrap: {
    width: 124,
    height: 124,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  markerMask: {
    width: 124,
    height: 124,
  },
  markerGradient: {
    flex: 1,
  },
  markerCenter: {
    position: "absolute",
    top: 31,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#852BAF",
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 32,
  },
  button: {
    marginTop: "auto",
    marginBottom: 20,
  },
});
