import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
interface PackItemCardProps {
  title: string;
  desc: string;
  oldPrice: number;
  price: number;
  image?: any;
  saveText?: string;
  showOldPrice?: boolean;
    disableSelection?: boolean; // ✅ NEW

  onDelete?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}

const PackItemCard: React.FC<PackItemCardProps> = ({
  title,
  desc,
  oldPrice,
  price,
  image,
  saveText,
  disableSelection,
  showOldPrice = true,
  onDelete,
  selected = true,
  onToggleSelect,
}) => {
  return (
    <View style={styles.outerCard}>
      {/* SAVE BADGE */}
      {Boolean(saveText) && (
        <View style={styles.saveBadge}>
          <Text style={styles.saveText}>{saveText}</Text>
        </View>
      )}

      <View style={styles.row}>
        {/* IMAGE */}
        <View style={styles.imageBlock}>
        {!disableSelection && (
  <TouchableOpacity
    style={[styles.checkBox, !selected && styles.checkBoxUnchecked]}
    onPress={onToggleSelect}
    activeOpacity={0.8}
  >
    {selected ? <MaterialIcons name="check" size={14} color="#FFF" /> : null}
  </TouchableOpacity>
)}

          <LinearGradient
            colors={['#F3F3F3', '#E3E4FF']}
            style={styles.imageWrap}
          >
            {image && (
              <Image
                source={image}
                style={styles.cardImage}
                resizeMode="contain"
              />
            )}
          </LinearGradient>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text numberOfLines={2} style={styles.desc}>{desc}</Text>

          <View style={styles.priceRow}>
            {showOldPrice && oldPrice > 0 && (
              <Text style={styles.oldPrice}>₹{oldPrice}</Text>
            )}
            <Text style={styles.newPrice}> ₹{price}</Text>
          </View>
        </View>

        {/* DELETE (only if provided) */}
        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <MaterialIcons name="delete" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};


export default PackItemCard;
const styles = StyleSheet.create({
    /* OUTER WHITE CARD */
    outerCard: {
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E6E6E6',
        padding: 12,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    /* SAVE 30% */
    saveBadge: {
        position: 'absolute',
        right: 12,
        top: 10,
        backgroundColor: '#F9EBFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },

    saveText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#A855F7',
    },

    /* IMAGE BLOCK */
    imageBlock: {
        marginRight: 12,
    },

    imageWrap: {
        width: 68,
        height: 68,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    checkBox: {
        position: 'absolute',
        top: -6,
        left: -6,
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },

      checkBoxUnchecked: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#3B82F6',
      },

    /* CONTENT */
    content: {
        flex: 1,
        paddingRight: 8,
    },

    title: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },

    desc: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
        lineHeight: 14,
    },

    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },

    oldPrice: {
        fontSize: 12,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },

    newPrice: {
        fontSize: 13,
        color: '#16A34A',
        fontWeight: '700',
    },

    /* DELETE */
    deleteBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },

    cardImage: {
        width: 50,
        height: 50,
    },
    primaryButton: {
        height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    outlineButtonBorder: {
        height: 54, borderRadius: 12, padding: 1.5,
        backgroundColor: '#8665FF', // Fallback for the border gradient logic
    },
    outlineButtonInner: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 11, justifyContent: 'center', alignItems: 'center',
    },
    outlineButtonText: { color: '#8665FF', fontSize: 16, fontWeight: 'bold' },
});
