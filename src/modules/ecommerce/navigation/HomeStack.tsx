import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "./types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      id="HomeStack"
      detachInactiveScreens={true}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Home" getComponent={() => require("../screens/homescreen").default} />
      <Stack.Screen name="Category" getComponent={() => require("../components/product/product_section/Categories_Product").default} />
      <Stack.Screen name="ProductDescription" getComponent={() => require("../screens/product_description_screen").default} />
      <Stack.Screen name="Cart" getComponent={() => require("../screens/cartScreen").default} />
      <Stack.Screen name="AddressSelect" getComponent={() => require("../components/ItemCardAddress/AddressSelectScreen").default} />
      <Stack.Screen name="WithAddress" getComponent={() => require("../components/ItemCardAddress/WithAddress").default} />
      <Stack.Screen name="OrderStepUI" getComponent={() => require("../components/checkout/OrderStepUI").default} />
      <Stack.Screen name="OrderConfirm" getComponent={() => require("../../common/order/OrderConfirm").default} />
      <Stack.Screen name="OrderReceipt" getComponent={() => require("../../common/order/OrderReceipt").default} />
      <Stack.Screen name="MyOrder" getComponent={() => require("../components/order/MyOrder").default} />
      <Stack.Screen name="Coupan" getComponent={() => require("../constants/coupan/CouponsPage").default} />
      <Stack.Screen name="CategoriesScreen" getComponent={() => require("../screens/CategoriesScreen").default} />
      <Stack.Screen name="Explore" getComponent={() => require("../screens/Explore").default} />
      <Stack.Screen name="SearchScreen" getComponent={() => require("../screens/SearchScreen").default} />
      <Stack.Screen name="WishList" getComponent={() => require("../screens/WishlistScreen").default} />
      <Stack.Screen name="AddAddressMap" getComponent={() => require("../components/ItemCardAddress/AddAddressMapScreen").default} />
      <Stack.Screen name="ReviewScreen" getComponent={() => require("../screens/ReviewScreen").default} />
      <Stack.Screen name="BuyNow" getComponent={() => require("../components/product/product_section/BuyAgain").default} />
      <Stack.Screen name="ProductScreen" getComponent={() => require("../screens/ProductScreen").default} />
      <Stack.Screen name="TermsAndConditions" getComponent={() => require("../profile/TermsandCondition").default} />
      <Stack.Screen name="PrivacyPolicy" getComponent={() => require("../profile/PrivacyPolicy").default} />
      <Stack.Screen name="TodoList" getComponent={() => require("../profile/TodoList").default} />
      <Stack.Screen name="Profile" getComponent={() => require("../profile/Profile").default} />

      <Stack.Screen
        name="AddressDetails"
        getComponent={() => require("../components/ItemCardAddress/NewAddressForm").default}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="SelectCancellationReason" getComponent={() => require("../components/order/SelectCancellationReason").default} />
      <Stack.Screen name="OrderConfirmedScreen" getComponent={() => require("../screens/OrderConfirmedScreen").default} />
      <Stack.Screen name="ChangePassword" getComponent={() => require("../../common/auth/screens/ChangePasswordScreen").default} />
    </Stack.Navigator>
  );
}
