import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/types'

export default function CheckoutSummary() {
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    
    <View style={styles.wrapper}>
      

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.price}>₹12738</Text>
          <Text style={styles.items}>2 items selected</Text>
        </View>

        <TouchableOpacity activeOpacity={0.85}>
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Proceed To Buy</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#F4F5FF',
        padding: 16,
        borderRadius: 18,

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
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 12,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        marginRight: 6,
    },
})
