import React, { useCallback, useEffect, useState } from 'react';
import ProductHead from '../constants/heading/Product_Head_Img';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, useWindowDimensions, Alert, ScrollView } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import OrderItemCard from '../../common/order/OrderItemCard';
import { fetchHistory } from '../api/OrderApi';
import { FlatList } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { fetchUserInfo, getStoredUserName, deleteCustomer } from '../../common/auth/api/AuthAPI';
import { getProductImageUrl } from '../api/ProductApi';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useCart } from '../context/CartContext';
import LinearGradient from 'react-native-linear-gradient';
import { LogoutConfirmationModal } from '../../common/auth/screens/LogoutConfirmationModal';
type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

function Profile() {
    const navigation = useNavigation<Nav>();
    const rootNavigation = navigation.getParent() as RootNav | undefined;
    const { isAuthenticated, user, logout } = useAuth();
    const { totalQuantity } = useCart();
    const { width } = useWindowDimensions();
    const HEADER_HEIGHT = Math.round(width * 0.25);
    const [name, setName] = useState("User");
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const handleOpenOrders = () => {
        navigation.navigate("MyOrder");
    };
    const handleOpenNotes = () => {
        navigation.navigate("TodoList");
    };
    const handleOpenOrdersDetails = (order: any) => {
        const orderId = Number(order?.order_id ?? order?.id);
        if (!orderId || Number.isNaN(orderId)) return;

        navigation.navigate("OrderConfirmedScreen", {
            order_id: orderId,
        });
    };
    const OpenAddressDetails = () => {
        // direct app-level navigation (AddAddressMap is now in AppStack)
        navigation.navigate("AddressSelect");
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
            console.log("Failed to load user", error);
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

    const loadOrders = useCallback(async () => {
        if (!isAuthenticated) {
            setOrders([]);
            return;
        }

        try {
            setOrdersLoading(true);
            const res = await fetchHistory();
            if (res?.success) {
                setOrders(res.orders || []);
            } else {
                setOrders([]);
            }
        } finally {
            setOrdersLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const getOrderImageUri = (order: any) => {
        const rawImage =
            order?.image ||
            order?.product_image ||
            order?.product?.image ||
            "";

        if (!rawImage) {
            return "https://via.placeholder.com/150";
        }

        if (/^https?:\/\//i.test(rawImage)) {
            return rawImage;
        }

        return getProductImageUrl(rawImage) || "https://via.placeholder.com/150";
    };

    return (
        <View style={styles.screen}>

            {/* Header */}
            <View style={[styles.fixedHeader, { height: HEADER_HEIGHT }]}>
                <ProductHead headerHeight={HEADER_HEIGHT} cartCount={totalQuantity} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pageContent}
                style={{ marginTop: HEADER_HEIGHT }}
            >
                <View style={styles.container}>

                    {/* Top Row */}
                    <View style={styles.topRow}>

                        {/* Left Section */}
                        <View style={styles.leftRow}>
                            <View style={styles.avatar}>
                                <MaterialIcons name="person" size={26} color="#6C63FF" />
                            </View>

                            <View style={styles.nameRow}>
                                <Text style={styles.helloText}>Hello {name}</Text>
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
                            <OutlineButton title="Buy Again" onPress={() => navigation.navigate('BuyNow')} />
                            <OutlineButton title="Wishlist" onPress={() => navigation.navigate("WishList")} />
                            <OutlineButton title="Rewards" onPress={() => navigation.navigate("WalletHistory")}
                            />
                        </ScrollView>
                    </View>


                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Your Orders Row */}
                    <TouchableOpacity style={styles.ordersRow} onPress={handleOpenOrders} activeOpacity={0.8}>
                        <Text style={styles.ordersText}>Your Orders</Text>
                        <MaterialIcons name="keyboard-arrow-right" size={22} color="#444" />
                    </TouchableOpacity>
                </View>
                <View style={styles.listWrap}>
                    {ordersLoading ? (
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
                                        title={item.title || item.product_name || "Product"}
                                        weight={item.brand || item.brand_name || ""}
                                        orderId={String(item.order_ref || item.order_id || "")}
                                    />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
                {/* Profile Menu Card */}
                <View style={styles.menuCard}>
                    <MenuItem title="Your Notes" showArrow onPress={handleOpenNotes} />
                    <View style={styles.menuDivider} />

                    <MenuItem title="Address Book" showArrow onPress={OpenAddressDetails} />
                    <View style={styles.menuDivider} />

                    {/* <MenuItem title="Settings" />
                <View style={styles.menuDivider} /> */}

                    {/* <MenuItem title="Languages" />
                <View style={styles.menuDivider} /> */}

                    <MenuItem title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
                    <View style={styles.menuDivider} />

                    <MenuItem title="Terms & Conditions" onPress={() => navigation.navigate('TermsAndConditions')} />
                    <View style={styles.menuDivider} />
                    <MenuItem title="Delete Account" onPress={handleDeleteAccount} />
                    <View style={styles.menuDivider} />

                    <MenuItem title="Logout" onPress={handleLogoutPress} />

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
}: {
    title: string;
    showArrow?: boolean;
    onPress?: () => void;
}) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <Text style={styles.menuText}>{title}</Text>
        {showArrow && (
            <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#999"
            />
        )}
    </TouchableOpacity>
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
    fixedHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: "#FFF",
    },
    container: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 12,
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

    menuDivider: {
        height: 1,
        backgroundColor: "#E5E5E5",
        marginLeft: 16,
    },

    gradientBtn: {

        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },

    gradientText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFFFFF",
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
});
