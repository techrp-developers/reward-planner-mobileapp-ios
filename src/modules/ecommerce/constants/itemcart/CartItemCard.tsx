import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

type Props = {
  checked?: boolean
  title: string
  image: string
  deliveryText: string
  returnText: string
  mrp: number
  price: number
  discountText: string
  quantity: number
  onIncrease?: () => void
  onDecrease?: () => void
  onRemove?: () => void
  onBuyNow?: () => void
  onPress?: () => void
}

export default function CartItemCard({
  checked = true,
  title,
  image,
  deliveryText,
  returnText,
  mrp,
  price,
  discountText,
  quantity,
  onIncrease,
  onDecrease,
  onRemove,
  onBuyNow,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.checkbox}>
          {checked && <MaterialIcons name="check" size={16} color="#fff" />}
        </View>

        <TouchableOpacity style={styles.mainContent} activeOpacity={0.85} onPress={onPress}>
          {/* ✅ FIXED IMAGE */}
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={[styles.image, { backgroundColor: '#E6E6E6', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 12, color: '#999' }}>No Image</Text>
            </View>
          )}

          <View style={styles.info}>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.deliveryRow}>
              <MaterialIcons name="local-shipping" size={16} color="#777" />
              <Text style={styles.deliveryText}>{deliveryText}</Text>
            </View>

            <Text style={styles.returnText}>{returnText}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.mrp}>₹{mrp}</Text>
              <Text style={styles.price}> ₹{price}</Text>
              <Text style={styles.discount}> {discountText}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.qtyBox}>
          <TouchableOpacity onPress={onDecrease} style={styles.qtyBtn}>
            <Text style={styles.qtyText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qty}>{quantity}</Text>

          <TouchableOpacity onPress={onIncrease} style={styles.qtyBtn}>
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onRemove}>
          <MaterialIcons name="delete-outline" size={18} color="#444" />
          <Text style={styles.actionText}>Remove Item</Text>
        </TouchableOpacity>

        <View style={styles.verticalDivider} />

        <TouchableOpacity style={styles.actionBtn} onPress={onBuyNow}>
          <MaterialIcons name="auto-awesome" size={18} color="#444" />
          <Text style={styles.actionText}>Buy this Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E6E6E6',
        marginHorizontal: 14,
        marginVertical: 8,
        overflow: 'hidden',
    },

    row: {
        flexDirection: 'row',
        padding: 12,
    },

    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#2F80ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
    },

    image: {
        width: 64,
        height: 64,
        resizeMode: 'contain',
        marginRight: 10,
    },

    info: {
        flex: 1,
    },

    mainContent: {
      flex: 1,
      flexDirection: 'row',
    },

    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },

    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },

    deliveryText: {
        fontSize: 12,
        color: '#666',
    },

    returnText: {
        fontSize: 12,
        color: '#2F80ED',
        marginTop: 4,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },

    mrp: {
        fontSize: 13,
        color: '#999',
        textDecorationLine: 'line-through',
    },

    price: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222',
    },

    discount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E9E3E',
    },

    qtyBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D0D5DD',
        borderRadius: 6,
        height: 32,
        marginLeft: 8,
    },

    qtyBtn: {
        width: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },

    qtyText: {
        fontSize: 18,
        color: '#333',
    },

    qty: {
        width: 24,
        textAlign: 'center',
        fontWeight: '600',
    },

    divider: {
        height: 1,
        backgroundColor: '#E6E6E6',
    },

    actions: {
        flexDirection: 'row',
        height: 48,
    },

    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },

    verticalDivider: {
        width: 1,
        backgroundColor: '#E6E6E6',
    },
})
