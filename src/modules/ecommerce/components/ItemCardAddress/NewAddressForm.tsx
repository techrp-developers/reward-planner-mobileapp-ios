import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import ProductHeadColor from "../../constants/heading/Poduct_Head_Color";
import AddressDetailsSheet, { AddressFormPayload } from "./AddressFormPayload";
import { addAddress, AddToAddressPayload, updateAddress } from "../../api/AddressApi";
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { useQueryClient } from '@tanstack/react-query';
import { addressesQueryKey } from '../../navigation/navigationPerformance';
import { useAlert } from '../alerts';
import { useAppTheme } from '../../../../theme/ThemeContext';

export default function AddressDetailsSheetWrapper() {
  const [open, setOpen] = useState(true);
  type Nav = NativeStackNavigationProp<HomeStackParamList>;
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const alert = useAlert();
  const { isDark } = useAppTheme();
  const queryClient = useQueryClient();

  const params = (route.params || {}) as HomeStackParamList["AddressDetails"];
  const mode = params?.mode === "edit" ? "edit" : "add";
  const addressId = params?.addressId;
  const initialData = params?.initialData;
  const submitLabel = mode === "edit" ? "Update address" : "Save address";

  const handleSubmit = async (payload: AddressFormPayload) => {
    try {
      const apiPayload: AddToAddressPayload = {
        address_type: payload.saveAs.toLowerCase() as "home" | "work" | "other",
        address1: payload.flatHouseBuilding,
        address2: payload.areaLocality,
        city: payload.city,
        state_id: payload.state_id,
        zipcode: payload.pincode,
        is_default: payload.isDefault ? 1 : 0,
        landmark: payload.landmark,
        contact_name: payload.name,
        contact_phone: payload.phone,
      };

      if (mode === "edit" && addressId) {
        await updateAddress(addressId, apiPayload);
      } else {
        await addAddress(apiPayload);
      }

      queryClient.invalidateQueries({ queryKey: addressesQueryKey }).catch(() => {});
      alert.success("Success", mode === "edit" ? "Address updated successfully" : "Address added successfully");
      setOpen(false);
      navigation.goBack();
    } catch (err: any) {
      console.error("Save address failed:", err);
      const fallback = mode === "edit" ? "Failed to update address. Please try again." : "Failed to add address. Please try again.";
      alert.error("Error", err?.response?.data?.message || fallback);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ProductHeadColor
        title={mode === "edit" ? "Edit Address" : "Add Address"}
        onBackPress={() => navigation.goBack()}
        showSearch={false}
        isDark={isDark}
      />
      <View style={styles.spacer} />

      <AddressDetailsSheet
        visible={open}
        fullAddress=""
        initialValues={initialData}
        submitLabel={submitLabel}
        onClose={() => {
          setOpen(false);
          navigation.goBack();
        }}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerDark: { backgroundColor: "#09090B" },
  spacer: { flex: 1 },
});
