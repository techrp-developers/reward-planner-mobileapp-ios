import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/navigation/types'

export default function CheckoutSummary() {
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    return (

        <View style={styles.wrapper}>


            <View style={styles.freeBanner}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
                <Text style={styles.freeText}>Yay! You got FREE Delivery</Text>
            </View>

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
