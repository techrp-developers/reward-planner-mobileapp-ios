import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { changePassword } from "../api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";
import type { AppStackParamList } from "../../../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<AppStackParamList, "ChangePassword">;

function ChangePasswordScreen() {
    const navigation = useNavigation<Nav>();
    const alert = useAlert();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleReturnToDashboard = () => {
        navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
    };

    // ── Success view (PasswordSuccess UI) ─────────────────────────────────────
    if (isSuccess) {
        return (
            <View style={styles.successScreen}>
                <View style={styles.logoWrap}>
                    <Logo width={160} height={160} />
                </View>

                <View style={styles.successCard}>
                    <View style={styles.successOuter}>
                        <View style={styles.successInner}>
                            <MaterialCommunityIcons name="check" size={40} color="#FFFFFF" />
                        </View>
                    </View>

                    <Text style={styles.successTitle}>
                        Password Updated{"\n"}Successfully
                    </Text>

                    <Text style={styles.successSub}>
                        Your Password has been updated successfully!{"\n"}
                        You can now continue using the app.
                    </Text>

                    <TouchableOpacity activeOpacity={0.85} onPress={handleReturnToDashboard}>
                        <LinearGradient
                            colors={["#A654CD", "#FC8BAD"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.confirmBtn}
                        >
                            <Text style={styles.confirmText}>Return to Dashboard</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Validation + API ──────────────────────────────────────────────────────
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert.error("Validation", "All fields are required");
            return;
        }

        if (newPassword.length < 6) {
            alert.warning("Weak Password", "New password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert.error("Mismatch", "New password and confirm password do not match");
            return;
        }

        if (currentPassword === newPassword) {
            alert.error("Invalid", "New password cannot be the same as current password");
            return;
        }

        try {
            setLoading(true);
            await changePassword({ currentPassword, newPassword });
            setIsSuccess(true);
        } catch (error: any) {
            console.log("Change password error:", error?.response?.data || error?.message);
            alert.error(
                "Failed",
                error?.response?.data?.message || "Failed to change password"
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Form view ─────────────────────────────────────────────────────────────
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
                        <Logo width={160} height={160} />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>Change Password</Text>

                        {/* Current Password */}
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                placeholder="Enter current password"
                                placeholderTextColor="#999"
                                secureTextEntry={!currentPasswordVisible}
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                            >
                                <MaterialCommunityIcons
                                    name={currentPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#A654CD"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* New Password */}
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                placeholder="Enter your new password"
                                placeholderTextColor="#999"
                                secureTextEntry={!newPasswordVisible}
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                            >
                                <MaterialCommunityIcons
                                    name={newPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#A654CD"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm New Password */}
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.inputWrap}>
                            <TextInput
                                placeholder="Confirm your new password"
                                placeholderTextColor="#999"
                                secureTextEntry={!confirmPasswordVisible}
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            >
                                <MaterialCommunityIcons
                                    name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#A654CD"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={["#A654CD", "#FC8BAD"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.confirmBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmText}>Change Password</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

export default ChangePasswordScreen;

const styles = StyleSheet.create({
    // ── Form screen ──────────────────────────────────────────────────────────
    screen: {
        flex: 1,
        backgroundColor: "#F5F0FF",
    },

    keyboardWrap: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
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
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#852BAF",
        marginBottom: 25,
        textAlign: "center",
    },

    label: {
        fontSize: 13,
        color: "#555",
        marginBottom: 6,
        marginTop: 10,
    },

    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: "#F9F9F9",
        marginBottom: 10,
    },

    input: {
        flex: 1,
        fontSize: 14,
        color: "#333",
    },

    confirmBtn: {
        marginTop: 20,

        borderRadius: 10,
        alignItems: "center",
    },

    confirmText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
        paddingVertical: 14,
        paddingHorizontal: 24,
    },

    // ── Success screen ────────────────────────────────────────────────────────
    successScreen: {
        flex: 1,
        backgroundColor: "#F5F0FF",
    },

    successCard: {
        flex: 1,
        marginTop: 20,
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#E6F7EC",
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

    successTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#852BAF",
        textAlign: "center",
        marginBottom: 15,
    },

    successSub: {
        fontSize: 13,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
        lineHeight: 20,
    },
});
