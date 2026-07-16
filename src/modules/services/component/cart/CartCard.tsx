import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getServiceImageUrl } from '../../utils/serviceImage';
import LinearGradient from 'react-native-linear-gradient';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type CartCardProps = {
id: string | number;
  serviceName: string;
  variantName: string;
  description?: string;
  price: number;
  mrp: number;
    isBundle?: boolean;

  imageUrl?: string;
  documents?: string[];
  onRemove?: () => void;
  onBuyNow?: () => void;
  removing?: boolean;
  buyingNow?: boolean;
};

const CartCard = ({
  serviceName,
  variantName,
  description,
  price,
  mrp,
  imageUrl,
  documents,
  onRemove,
  onBuyNow,
  removing = false,
  buyingNow = false,
}: CartCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(v => !v);
  };

  const saving = mrp > price ? mrp - price : 0;
  const savePct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const hasDocs = Array.isArray(documents) && documents.length > 0;

  return (
    <View style={styles.cardContainer}>
      {/* Save badge */}
      {saving > 0 && (
        <View style={styles.bundleBadge}>
          <Text style={styles.bundleText}>🪙 Save ₹{saving.toLocaleString('en-IN')} more when bundled</Text>
        </View>
      )}

      <View style={styles.productSection}>
        <View style={styles.row}>
          {/* Thumbnail */}
          <View style={styles.imageWrapper}>
            <View style={styles.checkboxOverlay}>
              <MaterialIcons name="check" size={12} color="white" />
            </View>
            {imageUrl ? (
              <Image source={{ uri: getServiceImageUrl(imageUrl) }} style={styles.thumbnail} resizeMode="contain" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialIcons name="description" size={34} color="#8665FF" />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.textContent}>
            <Text style={styles.title} numberOfLines={2}>{serviceName}</Text>
            <Text style={styles.variantBadge}>{variantName}</Text>
            {!!description && (
              <Text style={styles.description} numberOfLines={2}>{description}</Text>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>
              {mrp > price && (
                <Text style={styles.oldPrice}>₹{mrp.toLocaleString('en-IN')}</Text>
              )}
              {savePct > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discount}>Save {savePct}%</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.borderRight]}
          onPress={onRemove}
          disabled={removing}
        >
          {removing ? (
            <ActivityIndicator size={16} color="#B91C1C" />
          ) : (
            <MaterialIcons name="delete-outline" size={20} color="#B91C1C" />
          )}
          <Text style={[styles.buttonText, removing ? styles.removeTextDisabled : styles.removeText]}>
            {removing ? 'Removing…' : 'Remove Item'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onBuyNow} disabled={buyingNow}>
          {buyingNow ? (
            <ActivityIndicator size={16} color="#8665FF" />
          ) : (
            <MaterialIcons name="auto-awesome" size={18} color="#8665FF" />
          )}
          <Text style={[styles.buttonText, buyingNow ? styles.buyNowTextDisabled : styles.buyNowText]}>
            {buyingNow ? 'Loading…' : 'Buy this Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Documents Dropdown */}
      {hasDocs && (
        <LinearGradient
          colors={['#F0E2FE', '#FEFEFF', '#FEFDFF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.dropdownSection}
        >
          <TouchableOpacity onPress={toggleOpen} style={styles.dropdownHeader} activeOpacity={0.8}>
            <Text style={styles.dropdownTitle}>Documents Needed to Proceed</Text>
            <View style={styles.headerRight}>
              <View style={styles.folderIcon}>
                <MaterialIcons name="folder" size={18} color="white" />
              </View>
              <MaterialIcons
                name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color="#333"
              />
            </View>
          </TouchableOpacity>

          {isOpen && (
            <View style={styles.collapsibleContent}>
              {documents!.map((doc, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={styles.docDot} />
                  <Text style={styles.listText}>{doc}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bundleBadge: {
    backgroundColor: '#F9EBFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-end',
    borderBottomLeftRadius: 12,
  },
  bundleText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '600',
  },
  productSection: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
  },
  imageWrapper: {
    width: 90,
    height: 90,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  checkboxOverlay: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#7C3AED',
    borderRadius: 5,
    padding: 3,
    zIndex: 1,
  },
  thumbnail: {
    width: 62,
    height: 72,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 62,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  variantBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  description: {
    marginTop: 5,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#065F46',
  },
  oldPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discount: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 6,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  removeText: {
    color: '#B91C1C',
  },
  removeTextDisabled: {
    color: '#9CA3AF',
  },
  buyNowText: {
    color: '#8665FF',
  },
  buyNowTextDisabled: {
    color: '#C4B5FD',
  },
  dropdownSection: {
    width: '100%',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  folderIcon: {
    backgroundColor: '#F97316',
    borderRadius: 6,
    padding: 4,
  },
  collapsibleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  docDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C3AED',
    marginTop: 5,
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});

export default CartCard;