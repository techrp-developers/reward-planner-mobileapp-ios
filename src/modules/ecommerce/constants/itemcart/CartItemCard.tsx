import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { useAppTheme } from '../../../../theme/ThemeContext'

type Props = {
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
  const { isDark, theme } = useAppTheme()

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.mainContent} activeOpacity={0.85} onPress={onPress}>
          {/* ✅ FIXED IMAGE */}
          {image ? (
            <View style={[styles.imageWrap, { backgroundColor: isDark ? '#18181B' : '#F9FAFB' }]}>
              <Image source={{ uri: image }} style={styles.image} />
            </View>
          ) : (
            <View style={[styles.imageWrap, { backgroundColor: isDark ? '#18181B' : '#E6E6E6' }]}>
              <Text style={{ fontSize: 12, color: theme.secondaryText }}>No Image</Text>
            </View>
          )}

          <View style={styles.info}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

            <View style={styles.deliveryRow}>
              <MaterialIcons name="local-shipping" size={16} color={theme.secondaryText} />
              <Text style={[styles.deliveryText, { color: theme.secondaryText }]}>{deliveryText}</Text>
            </View>

            <Text style={styles.returnText}>{returnText}</Text>

            <View style={styles.priceRow}>
              <Text style={[styles.mrp, { color: theme.secondaryText }]}>₹{mrp}</Text>
              <Text style={[styles.price, { color: theme.text }]}> ₹{price}</Text>
              <Text style={styles.discount}> {discountText}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.qtyBox, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: theme.border }]}>
          <TouchableOpacity onPress={onDecrease} style={styles.qtyBtn}>
            <Text style={[styles.qtyText, { color: theme.text }]}>−</Text>
          </TouchableOpacity>

          <Text style={[styles.qty, { color: theme.text }]}>{quantity}</Text>

          <TouchableOpacity onPress={onIncrease} style={styles.qtyBtn}>
            <Text style={[styles.qtyText, { color: theme.text }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onRemove}>
          <MaterialIcons name="delete-outline" size={18} color={theme.secondaryText} />
          <Text style={[styles.actionText, { color: theme.text }]}>Remove Item</Text>
        </TouchableOpacity>

        <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />

        <TouchableOpacity style={styles.actionBtn} onPress={onBuyNow}>
          <MaterialIcons name="auto-awesome" size={18} color={theme.secondaryText} />
          <Text style={[styles.actionText, { color: theme.text }]}>Buy this Now</Text>
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

    imageWrap: {
        width: 64,
        height: 64,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    image: {
        width: 58,
        height: 58,
        resizeMode: 'contain',
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
        height: 28,
        marginLeft: 6,
    },

    qtyBtn: {
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },

    qtyText: {
        fontSize: 16,
        color: '#333',
    },

    qty: {
        width: 20,
        fontSize: 12,
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
