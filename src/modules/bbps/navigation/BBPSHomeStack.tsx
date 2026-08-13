import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type BBPSStackParamList = {
  Home: undefined;
  ProductScreen: undefined;
  BillerSelectScreen: undefined;
  BillDetailsScreen: undefined;
  PaymentConfirmationScreen: undefined;
  OrderSuccessful: undefined;
  ReachargeHomeScreen: undefined;
  RechargeSection: undefined;
  RechargePlanScreen: undefined;
  RechargeConfirmationScreen: undefined;
  TransactionStatusScreen: undefined;
  Search: undefined;
  OrderHistory: undefined;
  Profile: { context?: 'bbps' } | undefined;
  AddressSelect: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  AddressDetails: undefined | { mode?: 'add' | 'edit'; addressId?: number; manageOnly?: boolean; initialData?: any };
  AddAddressMap: { fromCart?: boolean; manageOnly?: boolean } | undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
  HelpForm: undefined;
  MyTickets: undefined;

};

const Stack = createNativeStackNavigator<BBPSStackParamList>();

const BBPSHomeStack = React.memo(() => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }}>
      <Stack.Screen name="Home" getComponent={() => require('../screen/HomePage').default} />
      <Stack.Screen
        name="ProductScreen"
        getComponent={() => require('../screen/ProductScreen').default}
      />
      <Stack.Screen
        name="BillerSelectScreen"
        getComponent={() => require('../screen/BillerSelectScreen').default}
      />


      <Stack.Screen
        name="BillDetailsScreen"
        getComponent={() => require('../screen/BillDetailsScreen').default}
      />
      <Stack.Screen
        name="PaymentConfirmationScreen"
        getComponent={() => require('../screen/PaymentConfirmationScreen').default}
      />
      <Stack.Screen
        name="OrderSuccessful"
        getComponent={() => require('../screen/OrderSuccessful').default}
      />
      <Stack.Screen
        name="ReachargeHomeScreen"
        getComponent={() => require('../component/recharge/ReachargeHomeScreen').default}
      />
      <Stack.Screen
        name="RechargeSection"
        getComponent={() => require('../component/recharge/RechargeSection').default}
      />
      <Stack.Screen
        name="RechargePlanScreen"
        getComponent={() => require('../component/recharge/RechargeSection').default}
      />
      <Stack.Screen
        name="RechargeConfirmationScreen"
        getComponent={() => require('../screen/RechargeConfirmationScreen').default}
      />
      <Stack.Screen
        name="TransactionStatusScreen"
        getComponent={() => require('../screen/TransactionStatusScreen').default}
      />
      <Stack.Screen
        name="Search"
        getComponent={() => require('../constatnt/Search').default}
      />
      <Stack.Screen
        name="OrderHistory"
        getComponent={() => require('../component/order/OrderHistory').default}
      />
      <Stack.Screen
        name="Profile"
        getComponent={() => require('../../dashboard/dashboard/ProfileScreen').default}
        initialParams={{ context: 'bbps' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AddressSelect" getComponent={() => require('../../ecommerce/components/ItemCardAddress/AddressSelectScreen').default} options={{ headerShown: false }} />
      <Stack.Screen name="AddressDetails" getComponent={() => require('../../ecommerce/components/ItemCardAddress/NewAddressForm').default} options={{ headerShown: false }} />
      <Stack.Screen name="AddAddressMap" getComponent={() => require('../../ecommerce/components/ItemCardAddress/AddAddressMapScreen').default} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyPolicy" getComponent={() => require('../../ecommerce/profile/PrivacyPolicy').default} options={{ headerShown: false }} />
      <Stack.Screen name="TermsAndConditions" getComponent={() => require('../../ecommerce/profile/TermsandCondition').default} options={{ headerShown: false }} />
      <Stack.Screen name="HelpForm" getComponent={() => require('../../ecommerce/constants/Support/HelpForm').default} options={{ headerShown: false }} />
      <Stack.Screen name="MyTickets" getComponent={() => require('../../ecommerce/constants/Support/MyTickets').default} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
});

export default BBPSHomeStack;
