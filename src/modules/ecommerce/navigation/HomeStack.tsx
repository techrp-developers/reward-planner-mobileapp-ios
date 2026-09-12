import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "./types";
import { useAppTheme } from "../../../theme/ThemeContext";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      id="HomeStack"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        freezeOnBlur: true,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="Home" getComponent={() => require("../screens/homescreen").default} />
      <Stack.Screen
        name="Category"
        getComponent={() => require("../components/product/product_section/Categories_Product").default}
        options={{
          animation: "fade",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen
        name="ProductDescription"
        getComponent={() => require("../screens/product_description_screen").default}
        options={{
          animation: "slide_from_right",
          // Keep Home attached behind this opaque screen so popping cannot
          // briefly expose the outgoing product image while Home reattaches.
          presentation: "transparentModal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen
        name="Cart"
        getComponent={() => require("../screens/cartScreen").default}
        options={{
          animation: "fade",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen name="AddressSelect" getComponent={() => require("../components/ItemCardAddress/AddressSelectScreen").default} />
      <Stack.Screen name="WithAddress" getComponent={() => require("../components/ItemCardAddress/WithAddress").default} />
      <Stack.Screen name="OrderStepUI" getComponent={() => require("../components/checkout/OrderStepUI").default} />
      <Stack.Screen name="OrderConfirm" getComponent={() => require("../../common/order/OrderConfirm").default} />
      <Stack.Screen name="OrderReceipt" getComponent={() => require("../../common/order/OrderReceipt").default} />
      <Stack.Screen name="MyOrder" getComponent={() => require("../components/order/MyOrder").default} />
      <Stack.Screen name="Coupan" getComponent={() => require("../constants/coupan/CouponsPage").default} />
      <Stack.Screen
        name="CategoriesScreen"
        getComponent={() => require("../screens/CategoriesScreen").default}
        options={{
          animation: "fade",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen name="Explore" getComponent={() => require("../screens/Explore").default} />
      <Stack.Screen
        name="SearchScreen"
        getComponent={() => require("../screens/SearchScreen").default}
        options={{
          animation: "fade",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen name="WishList" getComponent={() => require("../screens/WishlistScreen").default} />
      <Stack.Screen name="AddAddressMap" getComponent={() => require("../components/ItemCardAddress/AddAddressMapScreen").default} />
      <Stack.Screen name="ReviewScreen" getComponent={() => require("../screens/ReviewScreen").default} />
      <Stack.Screen name="BuyNow" getComponent={() => require("../components/product/product_section/BuyAgain").default} />
      <Stack.Screen name="ProductScreen" getComponent={() => require("../screens/ProductScreen").default} />
      <Stack.Screen name="TermsAndConditions" getComponent={() => require("../profile/TermsandCondition").default} />
      <Stack.Screen name="PrivacyPolicy" getComponent={() => require("../profile/PrivacyPolicy").default} />
      <Stack.Screen
        name="TodoList"
        getComponent={() => require("../profile/TodoList").default}
        options={{
          animation: "fade",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <Stack.Screen
        name="Profile"
        getComponent={() => require("../profile/ProfileScreen").default}
        initialParams={{ context: "ecommerce" }}
        options={{
          animation: "fade",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: theme.background },
        }}
      />

      <Stack.Screen
        name="AddressDetails"
        getComponent={() => require("../components/ItemCardAddress/NewAddressForm").default}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="SelectItemCancellationReason" getComponent={() => require("../components/order/SelectItemCancellationReason").default} />
      <Stack.Screen name="ItemCancellationDetails" getComponent={() => require("../screens/ItemCancellationDetailsScreen").default} />
      <Stack.Screen name="OrderConfirmedScreen" getComponent={() => require("../screens/OrderConfirmedScreen").default} />
      <Stack.Screen name="HelpForm" getComponent={() => require("../constants/Support/HelpForm").default} initialParams={{ context: "ecommerce" }} />
      <Stack.Screen name="MyTickets" getComponent={() => require("../constants/Support/MyTickets").default} />
    </Stack.Navigator>
  );
}
