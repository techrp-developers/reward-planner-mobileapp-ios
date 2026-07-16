import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import Logo from "../../../../assets/homepage/login_logo.svg";

type AuthModalStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  OTPScreen: { email: string };
  SetNewPassword: { email: string };
  AccountActivationSuccess: undefined;
  VerifyEmail: { email: string };
};

type Nav = NativeStackNavigationProp<AuthModalStackParamList>;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const onRegister = async () => {
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        cpassword: confirmPassword,
      });

      Alert.alert("Registration", "Please verify your email before login.");
      navigation.navigate("VerifyEmail", { email: email.trim() });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Registration failed";
      Alert.alert("Registration", String(message));
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Logo width={180} height={180} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create Your Account</Text>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Name"
                placeholderTextColor="#999"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Email ID"
                placeholderTextColor="#999"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#999"
                style={styles.input}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Create Password"
                placeholderTextColor="#999"
                secureTextEntry={!passwordVisible}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setPasswordVisible((prev) => !prev)}>
                <MaterialCommunityIcons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#A654CD"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry={!confirmVisible}
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setConfirmVisible((prev) => !prev)}>
                <MaterialCommunityIcons
                  name={confirmVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#A654CD"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={onRegister} disabled={loading}>
              <LinearGradient
                colors={["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.loginBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Sign up</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 10 }]}> 
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.signUp}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F0FF",
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: "100%",
    marginTop: -40,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    marginBottom: 20,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 48,
    backgroundColor: "#F9F9F9",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  loginBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomWrap: {
    backgroundColor: "#F5F0FF",
    paddingVertical: 14,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  bottomText: {
    fontSize: 13,
    color: "#555",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signUp: {
    color: "#852BAF",
    fontWeight: "700",
  },
});
