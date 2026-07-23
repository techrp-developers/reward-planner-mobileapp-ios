import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { HomeStackParamList } from '../../navigation/types'
import StickyBottomCTA from '../../../../bottombar/StickyBottomCTA'
import { useStickyBottomCTA } from '../../../../bottombar/hooks/useStickyBottomCTA'
import { useAppTheme } from '../../../../theme/ThemeContext'

type Nav = NativeStackNavigationProp<HomeStackParamList>

type Props = {
  address: any
  total: number
  count: number
  onProceedToBuy?: () => void
  wrapperPaddingBottom?: number
  bottomOffset?: number
  onLayout?: ReturnType<typeof useStickyBottomCTA>['onCtaLayout']
}

export default function CheckoutSummary({
  address,
  total,
  count,
  onProceedToBuy,
  wrapperPaddingBottom = 16,
  bottomOffset,
  onLayout,
}: Props) {
  const navigation = useNavigation<Nav>()
  const autoSticky = useStickyBottomCTA()
  const { theme } = useAppTheme()
  const resolvedBottomOffset = bottomOffset ?? autoSticky.bottomOffset
  const resolvedOnLayout = onLayout ?? autoSticky.onCtaLayout

  return (
    <StickyBottomCTA bottomOffset={resolvedBottomOffset} onLayout={resolvedOnLayout}>
      <View style={[styles.wrapper, { paddingBottom: wrapperPaddingBottom, backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.addressRow}>
          <View style={styles.addressLeft}>
            <MaterialCommunityIcons name="home-outline" size={22} color="#7C3AED" />
            <View style={styles.addressTextWrap}>
              <Text style={[styles.addressTitle, { color: theme.text }]}>
                {address
                  ? `Delivering to ${address.contact_name || 'User'}`
                  : 'Delivery address'}
              </Text>
              <Text style={[styles.addressSub, { color: theme.secondaryText }]}>
                {address ? `${address.address1}, ${address.city}` : 'No address selected'}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('AddressSelect')}>
            <Text style={styles.changeText}>{address ? 'Change' : 'Add'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <View>
            <Text style={[styles.price, { color: theme.text }]}>₹{total}</Text>
            <Text style={[styles.items, { color: theme.secondaryText }]}>{count} items selected</Text>
          </View>

          <TouchableOpacity onPress={() => (onProceedToBuy ? onProceedToBuy() : navigation.push('OrderStepUI', { mode: 'cart' }))}>
            <LinearGradient colors={['#8665FF', '#5B47A3']} style={styles.button}>
              <Text style={styles.buttonText}>Proceed To Buy</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </StickyBottomCTA>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F4F5FF',
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressTextWrap: {
    marginLeft: 8,
  },
  addressTitle: {
    fontWeight: '600',
    fontSize: 13,
  },
  addressSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  changeText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  freeText: {
    marginLeft: 6,
    color: '#15803D',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  items: {
    fontSize: 12,
    color: '#777',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
})
