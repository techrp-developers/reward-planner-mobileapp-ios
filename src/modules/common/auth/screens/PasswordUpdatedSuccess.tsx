import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<AuthStackParamList>;

function PasswordSuccessComponent() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useAppTheme();

  const handleReturnToLogin = useCallback(() => {
    navigation.navigate("Login");
  }, [navigation]);

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#D4D4D5" }]}>
      <View style={styles.logoWrap}>
        <Logo width={160} height={160} />
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#111113" : "#FFFFFF" }]}>
        {/* Success Icon */}
        <View style={[styles.successOuter, { backgroundColor: isDark ? "rgba(34,197,94,0.16)" : "#E6F7EC" }]}>
          <View style={styles.successInner}>
            <MaterialCommunityIcons
              name="check"
              size={40}
              color="#FFFFFF"
            />
          </View>
        </View>

        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>
          Password Updated{"\n"}Successfully
        </Text>

        <Text style={[styles.subText, { color: isDark ? "#D4D4D8" : "#666" }]}>
          Your Password has been updated successfully!{"\n"}
          You can now log in to your account using your new password.
        </Text>

        <TouchableOpacity activeOpacity={0.85} onPress={handleReturnToLogin}>
          <LinearGradient
            colors={["#A654CD", "#FC8BAD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              Return to Login Screen
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PasswordSuccess = React.memo(PasswordSuccessComponent);
export default PasswordSuccess;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 70,
  },

  card: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },

  successOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  successInner: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    textAlign: "center",
    marginBottom: 15,
  },

  subText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },

  button: {
    width: "100%",

    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
});
