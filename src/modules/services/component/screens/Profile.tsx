import React, { useCallback, useEffect, useState } from 'react';
import CartHead from '../constant/navbar/CartHead';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/type';
import type { RootStackParamList } from '../../../../navigation/RootNavigator';
import { fetchUserInfo, getStoredUserName, deleteCustomer } from '../../../common/auth/api/AuthAPI';
import { useAuth } from '../../../common/auth/context/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import { LogoutConfirmationModal } from '../../../common/auth/screens/LogoutConfirmationModal';
import { useAppTheme } from '../../../../theme/ThemeContext';
type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;
const SERVICES_PROFILE_TOP_OFFSET = 110;

function Profile() {
    const navigation = useNavigation<Nav>();
    const rootNavigation = navigation.getParent()?.getParent()?.getParent() as RootNav | undefined;
    const { isAuthenticated, user, logout } = useAuth();
    const { isDark, toggleTheme } = useAppTheme();
    const [name, setName] = useState("User");
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const handleOpenOrders = () => {
        navigation.navigate("MyOrder");
    };
    const handleOpenNotes = () => {
        navigation.navigate("TodoList");
    };
    const OpenAddressDetails = () => {
        navigation.navigate("AddressSelect", { manageOnly: true });
    };


    const handleLogoutPress = () => {
        setLogoutModalVisible(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            setLogoutLoading(true);
            await logout();
        } finally {
            setLogoutModalVisible(false);
            rootNavigation?.reset({
                index: 0,
                routes: [{ name: "Auth" }],
            });
        }
    };

    const handleLogoutCancel = () => {
        setLogoutModalVisible(false);
    };

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLogoutLoading(true);
                            const res = await deleteCustomer();
                            if (res?.success || res?.status === 'ok' || res?.data) {
                                await logout();
                                rootNavigation?.reset({
                                    index: 0,
                                    routes: [{ name: 'Auth' }],
                                });
                            } else {
                                Alert.alert('Delete failed', 'Could not delete the account. Please try again.');
                            }
                        } catch (error) {
                            console.error('Delete account failed', error);
                            Alert.alert('Delete failed', 'Could not delete the account. Please try again.');
                        } finally {
                            setLogoutLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const loadUser = useCallback(async () => {
        if (!isAuthenticated) {
            setName("Guest");
            return;
        }

        try {
            if (user?.name) {
                setName(String(user.name));
                return;
            }

            const storedName = await getStoredUserName();
            if (storedName) {
                setName(storedName);
            }

            const res = await fetchUserInfo();
            const userName =
                res?.name ||
                res?.user?.name ||
                res?.user?.full_name ||
                res?.user?.username ||
                storedName ||
                "User";

            setName(userName);
        } catch (error) {
            __DEV__ && console.log("Failed to load user", error);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    useFocusEffect(
        useCallback(() => {
            loadUser();
        }, [loadUser])
    );

    return (
        <View style={[styles.screen, isDark && styles.screenDark]}>

            {/* Header */}
            <View style={[styles.fixedHeader, isDark && styles.fixedHeaderDark]}>
                <CartHead />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pageContent}
                style={{ marginTop: SERVICES_PROFILE_TOP_OFFSET }}
            >
                <View style={[styles.container, isDark && styles.surfaceDark]}>

                    {/* Top Row */}
                    <View style={styles.topRow}>

                        {/* Left Section */}
                        <View style={styles.leftRow}>
                            <View style={[styles.avatar, isDark && styles.avatarDark]}>
                                <MaterialIcons name="person" size={26} color="#6C63FF" />
                            </View>

                            <View style={styles.nameRow}>
                                <Text style={[styles.helloText, isDark && styles.textDark]}>Hello {name}</Text>
                            </View>
                        </View>

                        {/* Right Section */}
                        <View style={styles.rightRow}>
                            {/* <View style={styles.langRow}>
                            <Text style={styles.flagText}>🇮🇳</Text>
                            <Text style={styles.langText}>EN</Text>
                        </View> */}
                        </View>
                    </View>

                    <View style={styles.buttonRow}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            <OutlineButton title="My Orders" onPress={handleOpenOrders} />
                            <OutlineButton title="Wallet" onPress={() => navigation.navigate("WalletHistory")} />
                            {/* <OutlineButton title="Rewards" onPress={() => navigation.navigate("WalletHistory")} */}
                            
                        </ScrollView>
                    </View>


                    {/* Divider */}
                    <View style={[styles.divider, isDark && styles.dividerDark]} />

                    {/* Your Orders Row */}
                    <TouchableOpacity style={styles.ordersRow} onPress={handleOpenOrders} activeOpacity={0.8}>
                        <Text style={[styles.ordersText, isDark && styles.textDark]}>Your Orders</Text>
                        <MaterialIcons name="keyboard-arrow-right" size={22} color={isDark ? "#A1A1AA" : "#444"} />
                    </TouchableOpacity>
                </View>
                {/* <View style={styles.listWrap}>
                    {ordersLoading ? (SSSS
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="small" color="#852BAF" />
                        </View>
                    ) : (
                        <FlatList
                            data={orders}
                            keyExtractor={(item, index) => String(item?.order_id || item?.order_ref || index)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.listItemWrap}
                                    activeOpacity={0.8}
                                    onPress={() => handleOpenOrdersDetails(item)}
                                >
                                    <OrderItemCard
                                        image={
                                            <Image
                                                source={{ uri: getOrderImageUri(item) }}
                                                style={styles.orderImage}
                                                resizeMode="contain"
                                            />
                                        }
                                        title={item.product_name || "Product"}
                                        weight={item.brand_name || ""}
                                        orderId={String(item.order_ref || item.order_id || "")}
                                    />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View> */}
                {/* Profile Menu Card */}
                <View style={[styles.menuCard, isDark && styles.menuCardDark]}>
                    <DarkModeMenuItem isDark={isDark} onToggle={toggleTheme} />
                    <View style={[styles.menuDivider, isDark && styles.dividerDark]} />

                    <MenuItem title="Your Notes" showArrow onPress={handleOpenNotes} isDark={isDark} />
                    <View style={[styles.menuDivider, isDark && styles.dividerDark]} />

                    <MenuItem title="Address Book" showArrow onPress={OpenAddressDetails} isDark={isDark} />
                    <View style={[styles.menuDivider, isDark && styles.dividerDark]} />

                    {/* <MenuItem title="Settings" />
                <View style={styles.menuDivider} /> */}

                    {/* <MenuItem title="Languages" />
                <View style={styles.menuDivider} /> */}

                    <MenuItem title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} isDark={isDark} />
                    <View style={[styles.menuDivider, isDark && styles.dividerDark]} />

                    <MenuItem title="Terms & Conditions" onPress={() => navigation.navigate('TermsAndConditions')} isDark={isDark} />
                    <View style={[styles.menuDivider, isDark && styles.dividerDark]} />
                    <MenuItem title="Delete Account" onPress={handleDeleteAccount} isDark={isDark} />
                    <View style={[styles.menuDivider, isDark && styles.dividerDark]} />

                    <MenuItem title="Logout" onPress={handleLogoutPress} isDark={isDark} />

                </View>

                {/* Logout Confirmation Modal */}
                <LogoutConfirmationModal
                    visible={logoutModalVisible}
                    onConfirm={handleLogoutConfirm}
                    onCancel={handleLogoutCancel}
                    isLoading={logoutLoading}
                />
            </ScrollView>
        </View>
    );
}

const MenuItem = ({
    title,
    showArrow = true,
    onPress,
    isDark = false,
}: {
    title: string;
    showArrow?: boolean;
    onPress?: () => void;
    isDark?: boolean;
}) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <Text style={[styles.menuText, isDark && styles.textDark]}>{title}</Text>
        {showArrow && (
            <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={isDark ? "#71717A" : "#999"}
            />
        )}
    </TouchableOpacity>
);

const DarkModeMenuItem = ({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => (
    <View style={styles.menuItem}>
        <View style={styles.darkModeLeft}>
            <MaterialCommunityIcons
                name={isDark ? "weather-night" : "white-balance-sunny"}
                size={20}
                color="#6366F1"
            />
            <View>
                <Text style={[styles.menuText, isDark && styles.textDark]}>Dark Mode</Text>
                <Text style={[styles.darkModeSub, isDark && styles.mutedDark]}>
                    {isDark ? "Dark theme active" : "Light theme active"}
                </Text>
            </View>
        </View>
        <Switch
            value={isDark}
            onValueChange={onToggle}
            thumbColor="#FFFFFF"
            trackColor={{ false: "#CBD5E1", true: "#4F46E5" }}
            ios_backgroundColor="#CBD5E1"
        />
    </View>
);
const OutlineButton = ({ title, onPress }: { title: string; onPress?: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
        >
            <Text style={styles.gradientText}>{title}</Text>
        </LinearGradient>
    </TouchableOpacity>
);
export default Profile;
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#FFFF",
    },
    screenDark: {
        backgroundColor: "#09090B",
    },
    fixedHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "#FFF",
    },
    fixedHeaderDark: {
        backgroundColor: "#111113",
    },
    container: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 12,
    },
    surfaceDark: {
        backgroundColor: "#111113",
    },
    pageContent: {
        paddingBottom: 28,
    },

    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    leftRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#FFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarDark: {
        backgroundColor: "#27272A",
    },

    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
    },

    helloText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginRight: 4,
    },
    textDark: {
        color: "#FFFFFF",
    },
    mutedDark: {
        color: "#A1A1AA",
    },

    rightRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    bellIcon: {
        marginHorizontal: 15,
    },

    langRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    flagText: {
        fontSize: 16,
    },

    langText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },

    buttonRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 12,
        marginTop: 18,
    },

    scrollContent: {
        gap: 10,
    },

    outlineBtn: {
        borderWidth: 1,
        borderColor: "#D0D0D0",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },

    outlineText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#333",
    },

    divider: {
        height: 1,
        backgroundColor: "#FFFF",
        marginVertical: 16,
    },
    dividerDark: {
        backgroundColor: "rgba(255,255,255,0.08)",
    },

    ordersRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    ordersText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
    },
    listWrap: {
        marginTop: 10,
    },
    loadingWrap: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: 72,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    listItemWrap: {
        marginRight: 12,
    },
    orderImage: {
        width: 52,
        height: 52,
    },
    orderImagePlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 8,
        backgroundColor: "#FFF",
    },
    menuCard: {
        marginHorizontal: 16,
        marginTop: 20,
        backgroundColor: "#FFF",
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    menuCardDark: {
        backgroundColor: "#111113",
        borderColor: "rgba(255,255,255,0.08)",
    },

    menuItem: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    menuText: {
        fontSize: 14,
        color: "#444",
        fontWeight: "500",
    },
    darkModeLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    darkModeSub: {
        marginTop: 2,
        fontSize: 11,
        color: "#777",
        fontWeight: "500",
    },

    menuDivider: {
        height: 1,
        backgroundColor: "#E5E5E5",
        marginLeft: 16,
    },

    gradientBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },

    gradientText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
