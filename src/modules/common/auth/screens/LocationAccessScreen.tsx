import React, { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PERMISSIONS, request } from "react-native-permissions";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import Logo from "../../../../assets/homepage/login_logo.svg";
import AuthButton from "../../components/AuthButton";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useAuth } from "../context/AuthContext";
import type { AuthStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "LocationAccess">;
type LocationAccessRouteProp = RouteProp<AuthStackParamList, "LocationAccess">;

function LocationAccessScreen() {
  const navigation = useNavigation<Nav>();
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
    <View style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}>
      <View style={styles.logoWrapper}>
        <Logo width={150} height={150} />
      </View>

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? "#18181B" : "#FFFFFF" }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color={isDark ? "#FFFFFF" : "#1F2937"} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: isDark ? "#09090B" : "#FFFFFF" }]}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>Location Access</Text>

        <LinearGradient
          colors={["#FC8BAD", "#A654CD"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={styles.pinWrap}
        >
          <MaterialCommunityIcons name="map-marker" size={40} color="#fff" />
        </LinearGradient>

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
    </View>
  );
}

export default React.memo(LocationAccessScreen);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  logoWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  card: {
    flex: 1,
    marginTop: "38%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
  },
  pinWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 32,
  },
  button: {
    marginTop: "auto",
    marginBottom: 20,
  },
});
