import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import LinearGradient from 'react-native-linear-gradient'

type Coupon = {
  id: number
  code: string
  title: string
  subtitle: string
}

type Props = {
  coupons: Coupon[]
}

export default function CouponsSection({ coupons }: Props) {
  return (
    <View style={styles.wrapper}>
      {coupons.map(coupon => (
        <LinearGradient
          key={coupon.id}
          colors={['#FEF0FF', '#FFFFFF']}
          style={styles.couponCard}
        >
          <View style={styles.topRow}>
            <MaterialCommunityIcons
              name="tag-outline"
              size={18}
              color="#A654CD"
            />
            <Text style={styles.code}>{coupon.code}</Text>
            <Text style={styles.apply}>APPLY</Text>
          </View>

          <View style={styles.dashedLine} />

          <Text style={styles.mainText}>{coupon.title}</Text>
          <Text style={styles.subText}>{coupon.subtitle}</Text>
        </LinearGradient>
      ))}
    </View>
  )
}
const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
  },

  couponCard: {
    borderWidth: 1,
    borderColor: '#F7AAFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  code: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B21A8',
  },

  apply: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },

  dashedLine: {
    marginVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.2)',
  },

  mainText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },

  subText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
})
