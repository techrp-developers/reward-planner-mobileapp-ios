import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Pressable,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import ProductHeadColor from "../../constants/heading/Poduct_Head_Color";
import { deleteAddress, fetchAddressByID, fetchAllAddress, updateAddress } from "../../api/AddressApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQueryClient } from "@tanstack/react-query";
import { addressesQueryKey } from "../../navigation/navigationPerformance";
import { useAlert } from "../alerts";
import StickyBottomCTA from "../../../../bottombar/StickyBottomCTA";
import { useStickyBottomCTA } from "../../../../bottombar/hooks/useStickyBottomCTA";
import { useAppTheme } from "../../../../theme/ThemeContext";

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'AddressSelect'>;

type AddressItem = {
  id: string;
  title: string;
  isDefault?: boolean;
  address: string;
};
type ApiAddress = {
  address_id: number;
  address_type: string;
  is_default: number;
  address1: string;
  address2?: string | null;
  landmark?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  city: string;
  state?: string | null;
  state_id?: number | null;
  zipcode: string;
};

export default function AddressSelectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const alert = useAlert();
  const { isDark, theme } = useAppTheme();
  const queryClient = useQueryClient();
  const manageOnly = route.params?.manageOnly === true;
  // MainLayout already reserves space for the bottom navigation bar. Keep this
  // CTA anchored to that boundary instead of letting the search keyboard lift
  // it into the middle of the address list.
  const stickyCTA = useStickyBottomCTA({
    tabBarAware: false,
    keyboardAware: false,
    extraSpacing: 0,
  });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("1");
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const rawAddressesRef = useRef<Map<string, ApiAddress>>(new Map());

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchAllAddress();
      const list = Array.isArray(res.data) ? res.data : [];

      rawAddressesRef.current = new Map(
        list.map((a: ApiAddress) => [String(a.address_id), a])
      );

      const mapped: AddressItem[] = list.map((a: ApiAddress) => ({
        id: String(a.address_id),
        title: a.address_type.toUpperCase(),
        isDefault: a.is_default === 1,
        address: `${a.address1}${a.address2 ? ", " + a.address2 : ""}, ${a.city} - ${a.zipcode}`,
      }));

      setAddresses(mapped);

      setSelectedId(prev =>
        mapped.find(x => x.id === prev)?.id ??
        mapped.find(x => x.isDefault)?.id ??
        mapped[0]?.id ??
        ""
      );
    } catch {
      alert.error("Error", "Failed to load addresses");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [alert]);

  // `useFocusEffect` already fires once when the screen is first focused
  // (i.e. as soon as it's opened) and again every time it regains focus —
  // which covers "on open" and "after Add/Edit/Delete navigates back" in a
  // single place. A separate mount `useEffect` here used to double-fetch on
  // open, and combined with `alert`/`loadAddresses` not being referentially
  // stable, it turned into a continuous fetch loop.
  useFocusEffect(
    React.useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );


  const onDeleteAddress = async () => {
    if (!sheetItem) return;

    const deletedId = sheetItem.id;
    const previousAddresses = addresses;
    const previousSelectedId = selectedId;

    // Close immediately and update the list optimistically so the UI doesn't
    // sit there waiting on two sequential network calls (delete + full reload).
    closeSheet();
    setAddresses(prev => prev.filter(a => a.id !== deletedId));
    setSelectedId(prev => (prev === deletedId ? "" : prev));

    try {
      await deleteAddress(Number(deletedId));
      rawAddressesRef.current.delete(deletedId);
      queryClient.invalidateQueries({ queryKey: addressesQueryKey }).catch(() => { });
      alert.success("Deleted", "Address deleted successfully");
    } catch {
      setAddresses(previousAddresses);
      setSelectedId(previousSelectedId);
      alert.error("Error", "Could not delete address");
    }
  };

  const applyDefaultToQueryCache = (targetId: string) => {
    queryClient.setQueryData(addressesQueryKey, (old: any) => {
      if (!old || !Array.isArray(old.data)) return old;
      return {
        ...old,
        data: old.data.map((a: ApiAddress) => ({
          ...a,
          is_default: String(a.address_id) === targetId ? 1 : 0,
        })),
      };
    });
  };

  const setAddressAsDefault = async (targetId: string): Promise<boolean> => {
    const previousAddresses = addresses;

    setAddresses(prev =>
      prev.map(a => ({ ...a, isDefault: a.id === targetId }))
    );
    // Write straight into the shared query cache so the cart/checkout/navbar
    // update instantly, instead of waiting on a background refetch round-trip.
    applyDefaultToQueryCache(targetId);

    try {
      await updateAddress(Number(targetId), { is_default: 1 });

      const cached = rawAddressesRef.current.get(targetId);
      if (cached) rawAddressesRef.current.set(targetId, { ...cached, is_default: 1 });
      rawAddressesRef.current.forEach((value, key) => {
        if (key !== targetId && value.is_default === 1) {
          rawAddressesRef.current.set(key, { ...value, is_default: 0 });
        }
      });

      // Quietly re-sync with the server in the background for eventual consistency.
      queryClient.invalidateQueries({ queryKey: addressesQueryKey }).catch(() => { });
      return true;
    } catch {
      setAddresses(previousAddresses);
      queryClient.invalidateQueries({ queryKey: addressesQueryKey }).catch(() => { });
      return false;
    }
  };

  const onSetDefaultAddress = async () => {
    if (!sheetItem || sheetItem.isDefault) return;

    const targetId = sheetItem.id;
    closeSheet();

    const success = await setAddressAsDefault(targetId);
    if (success) {
      alert.success("Default address updated", "This address is now your default");
    } else {
      alert.error("Error", "Could not set this address as default");
    }
  };

  const canSubmit = !!selectedId;

  const handleSubmit = async () => {
    if (!selectedId) return;

    const selected = addresses.find(a => a.id === selectedId);

    // Make the chosen address the default so the cart/checkout actually uses
    // it for the order, instead of always falling back to whichever address
    // was previously default. Apply locally + to the shared cache right away
    // only after the server has accepted the new default. Otherwise checkout
    // can refetch too early and cache an addressless preview with zero shipping.
    if (selected && !selected.isDefault) {
      const success = await setAddressAsDefault(selectedId);
      if (!success) {
        alert.error("Error", "Could not save your selected address. Please try again.");
        return;
      }
    }

    // Refresh both reward modes and cart/buy-now previews after the address is
    // committed so shipping charges and EDD use the newly selected pincode.
    await queryClient.invalidateQueries({
      queryKey: ["ecommerce", "checkout-preview"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["service-checkout"],
    });

    // Go back to whichever screen pushed this one (cart, checkout, service
    // checkout, etc.) instead of hardcoding an ecommerce-only destination -
    // this screen is shared across the ecommerce and services stacks.
    navigation.goBack();
  };


  const filtered = useMemo(() => {
    if (!query.trim()) return addresses;
    const q = query.trim().toLowerCase();
    return addresses.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        x.address.toLowerCase().includes(q)
    );
  }, [addresses, query]);

  // -------------------- Bottom Sheet (Select Option) --------------------
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetForId, setSheetForId] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(260)).current;

  const openSheet = (id: string) => {
    setSheetForId(id);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: 260,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      setSheetForId(null);
    });
  };

  useEffect(() => {
    if (sheetVisible) {
      translateY.setValue(260);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 190,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [sheetVisible, translateY]);

  const sheetItem = useMemo(
    () => addresses.find((a) => a.id === sheetForId) || null,
    [addresses, sheetForId]
  );


  const onEditAddress = async () => {
    if (!sheetItem) return;

    const sheetItemId = sheetItem.id;
    closeSheet();

    try {
      // Use the already-fetched address data instead of hitting the network again,
      // which was causing a noticeable delay before the edit screen opened.
      const cached = rawAddressesRef.current.get(sheetItemId);
      const apiAddress = cached ?? (await fetchAddressByID(sheetItemId));

      const normalizedType = String(apiAddress?.address_type || "other").toLowerCase();
      const saveAs =
        normalizedType === "home"
          ? "Home"
          : normalizedType === "work"
            ? "Work"
            : "Other";

      navigation.navigate("AddressDetails", {
        mode: "edit",
        addressId: Number(sheetItem.id),
        manageOnly,
        initialData: {
          saveAs,
          flatHouseBuilding: apiAddress?.address1 || "",
          areaLocality: apiAddress?.address2 || "",
          landmark: apiAddress?.landmark || "",
          name: apiAddress?.contact_name || "",
          phone: apiAddress?.contact_phone || "",
          pincode: String(apiAddress?.zipcode || ""),
          city: apiAddress?.city || "",
          state: apiAddress?.state || "",
          state_id: Number(apiAddress?.state_id) || undefined,
          isDefault: Number(apiAddress?.is_default) === 1,
        },
      });
    } catch {
      alert.error("Error", "Could not load address details for editing");
    }
  };

  // -------------------- Header actions (UI only) --------------------

  const handleAddNewAddress = () => {
    navigation.navigate("AddressDetails", { manageOnly });
  };
  return (
    <SafeAreaView style={[styles.safe, isDark && darkStyles.safe]}>
      <ProductHeadColor
        title="Select Address"
        onBackPress={() => navigation.goBack()}
        showSearch={false}
        isDark={isDark}
      />


      <View style={[styles.screen, isDark && darkStyles.safe]}>
        {/* Search */}
        <View style={[styles.searchWrap, isDark && darkStyles.surface]}>
          <MaterialCommunityIcons name="magnify" size={18} color={isDark ? "#A1A1AA" : "#777"} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for area, street name..."
            placeholderTextColor={isDark ? "#71717A" : "#9A9AA5"}
            selectionColor={theme.primary}
            style={[styles.searchInput, isDark && darkStyles.primaryText]}
          />
        </View>

        {/* Top options card */}
        <View style={[styles.topCard, isDark && darkStyles.surface]}>
          {/* Add New Address */}
          <TouchableOpacity
            style={styles.topRow}
            activeOpacity={0.85}
            onPress={handleAddNewAddress}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircleSoft, isDark && darkStyles.iconCircle]}>
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.rowTitlePurple, isDark && darkStyles.accentText]}>Add New Address</Text>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#B2B2BD"
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, isDark && darkStyles.secondaryText]}>Saved Addresses</Text>
        {isInitialLoad && loading && (
          <Text style={[styles.loadingText, isDark && darkStyles.secondaryText]}>
            Loading addresses...
          </Text>
        )}

        {/* List */}
        <ScrollView
          contentContainerStyle={{
            paddingBottom: manageOnly || !canSubmit
              ? 16 + insets.bottom
              : stickyCTA.scrollContentPaddingBottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((item) => {
            const selected = item.id === selectedId;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => setSelectedId(item.id)}
                style={[styles.addrCard, isDark && darkStyles.surface]}
              >
                <View style={styles.addrTop}>
                  <View style={styles.addrLeft}>
                    <View style={[styles.pinCircle, isDark && darkStyles.iconCircle]}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={18}
                        color={isDark ? "#D4D4D8" : "#7B7B86"}
                      />
                    </View>

                    <View style={styles.flexOne}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.addrTitle, isDark && darkStyles.primaryText]}>{item.title}</Text>
                        {item.isDefault ? (
                          <View style={[styles.defaultPill, isDark && darkStyles.defaultPill]}>
                            <Text style={[styles.defaultPillText, isDark && darkStyles.secondaryText]}>Default</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={[styles.addrText, isDark && darkStyles.secondaryText]}>{item.address}</Text>

                      {/* ✅ only 3 dots like screenshot */}
                      <TouchableOpacity
                        style={[styles.moreBtn, isDark && darkStyles.iconButton]}
                        onPress={() => openSheet(item.id)}
                        activeOpacity={0.9}
                      >
                        <MaterialCommunityIcons
                          name="dots-horizontal"
                          size={18}
                          color={isDark ? "#D4D4D8" : "#6B6B76"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Radio */}
                  <View style={[styles.radioOuter, isDark && darkStyles.radioOuter]}>
                    {selected ? <View style={[styles.radioInner, isDark && darkStyles.radioInner]} /> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

      </View>

      {/* Bottom CTA - hidden when managing addresses (no checkout context) or when there's no address yet */}
      {!manageOnly && canSubmit && (
        <StickyBottomCTA bottomOffset={stickyCTA.bottomOffset} onLayout={stickyCTA.onCtaLayout}>
          <View style={[styles.bottomBar, isDark && darkStyles.bottomBar]}>
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.9}
              style={styles.ctaWrapper}
            >
              <LinearGradient
                colors={["#8665FF", "#5B47A3"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Select address</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </StickyBottomCTA>
      )}

      {/* -------------------- Bottom Sheet Modal -------------------- */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeSheet} />

        <Animated.View
          style={[
            styles.sheet,
            isDark && darkStyles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.sheetHandle, isDark && darkStyles.sheetHandle]} />

          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, isDark && darkStyles.primaryText]}>Select Option</Text>
            <TouchableOpacity onPress={closeSheet} style={styles.sheetCloseBtn}>
              <MaterialCommunityIcons name="close" size={20} color={isDark ? "#FFFFFF" : "#1C1C22"} />
            </TouchableOpacity>
          </View>

          {!sheetItem?.isDefault && (
            <TouchableOpacity
              style={[styles.sheetRow, isDark && darkStyles.sheetRow]}
              activeOpacity={0.9}
              onPress={onSetDefaultAddress}
            >
              <Text style={[styles.sheetRowText, isDark && darkStyles.primaryText]}>Set as Default</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color="#B2B2BD"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.sheetRow, isDark && darkStyles.sheetRow]}
            activeOpacity={0.9}
            onPress={onEditAddress}
          >
            <Text style={[styles.sheetRowText, isDark && darkStyles.primaryText]}>Edit Address</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#B2B2BD"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetRow, isDark && darkStyles.sheetRow]}
            activeOpacity={0.9}
            onPress={onDeleteAddress}
          >
            <Text style={[styles.sheetRowText, isDark && darkStyles.primaryText]}>Delete Address</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#B2B2BD"
            />
          </TouchableOpacity>

          <View style={styles.sheetBottomSpacer} />
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  // Header like screenshot
  header: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9E9EA",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 4,
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C22",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    position: "absolute",
    right: 10,
    top: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },

  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  loadingText: {
    textAlign: "center",
    marginTop: 20,
    color: "#6C6C76",
  },
  flexOne: { flex: 1 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#E8E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#1C1C22",
  },

  topCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8F0",
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircleSoft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitlePurple: {
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: "#2B2B33",
    fontSize: 12,
    fontWeight: "600",
  },

  addrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8F0",
    padding: 12,
    marginBottom: 10,
  },
  addrTop: { flexDirection: "row", alignItems: "flex-start" },
  addrLeft: { flexDirection: "row", flex: 1 },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FAFAFC",
    borderWidth: 1,
    borderColor: "#ECECF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addrTitle: {
    color: "#1B1B22",
    fontSize: 13,
    fontWeight: "600",
  },
  defaultPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultPillText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "600",
  },

  addrText: {
    marginTop: 6,
    color: "#6C6C76",
    fontSize: 11.5,
    lineHeight: 16,
  },

  // ✅ 3-dots button (single) like screenshot
  moreBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    width: 32,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECF4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#1C1C22",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginTop: 4,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1C1C22",
  },

  bottomBar: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600', },

  ctaWrapper: {
    alignSelf: "center",
  },
  cta: {
    width: 338,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    paddingVertical: 14,

  },

  // -------------------- Bottom Sheet styles --------------------
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 58,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C22",
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECECF4",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  sheetRowText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C22",
  },
  sheetBottomSpacer: {
    height: Platform.OS === "ios" ? 18 : 10,
  },
});

const darkStyles = StyleSheet.create({
  safe: { backgroundColor: "#09090B" },
  surface: {
    backgroundColor: "#18181B",
    borderColor: "rgba(255,255,255,0.20)",
  },
  primaryText: { color: "#F4F4F5" },
  secondaryText: { color: "#A1A1AA" },
  accentText: { color: "#C4B5FD" },
  iconCircle: {
    backgroundColor: "#27233A",
    borderColor: "rgba(255,255,255,0.16)",
  },
  defaultPill: { backgroundColor: "#27272A" },
  iconButton: {
    backgroundColor: "#27272A",
    borderColor: "rgba(255,255,255,0.16)",
  },
  radioOuter: { borderColor: "#C4B5FD" },
  radioInner: { backgroundColor: "#A78BFA" },
  bottomBar: { backgroundColor: "#09090B" },
  sheet: { backgroundColor: "#18181B" },
  sheetHandle: { backgroundColor: "#52525B" },
  sheetRow: {
    backgroundColor: "#27272A",
    borderColor: "rgba(255,255,255,0.16)",
  },
});
