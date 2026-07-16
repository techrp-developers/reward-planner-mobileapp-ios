import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { RootStackParamList } from './types'
import CheckoutSummary from '../modules/ecommerce/components/ItemCardAddress/CheckoutSummary'
import AddressPage from '../modules/ecommerce/components/ItemCardAddress/AddressPage'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function CheckoutStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Checkout" component={CheckoutSummary} />
      <Stack.Screen name="Address" component={AddressPage} />
    </Stack.Navigator>
  )
}
