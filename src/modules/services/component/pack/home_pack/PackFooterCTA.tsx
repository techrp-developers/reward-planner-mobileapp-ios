import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useServicesTheme } from '../../../utils/useServicesTheme';

interface StatItem {
  value: string;
  label: string;
}

interface Props {
  totalPrice: number;
  originalPrice: number;
  stats: StatItem[];

  onPrimaryPress: () => void;
  onEnquirePress: () => void;

  /* 🔽 NEW OPTIONAL BOTTOM BAR */
  showBottomBar?: boolean;
  onAddToCart?: () => void;
  isAddingToCart?: boolean;
}

const PackFooterCTA: React.FC<Props> = ({
  totalPrice,
  originalPrice,
  stats,
  onPrimaryPress,
  onEnquirePress,

  showBottomBar = false,
  onAddToCart,
  isAddingToCart = false,
}) => {
  const servicesTheme = useServicesTheme();
  const showOriginalPrice = originalPrice > totalPrice;

  return (
    <>
      {/* MAIN CTA SECTION */}
      <View style={styles.container}>
        <TouchableOpacity activeOpacity={0.9} onPress={onPrimaryPress}>
          <LinearGradient
            colors={servicesTheme.gradients.primary}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryText}>
              Get the Full Package at ₹{totalPrice}{' '}
              {showOriginalPrice && (
                <Text style={styles.strike}>₹{originalPrice}</Text>
              )}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.outlineBorder, { borderColor: servicesTheme.colors.primary }]} onPress={onEnquirePress}>
          <View style={[styles.outlineInner, { backgroundColor: servicesTheme.colors.surface }]}>
            <Text style={[styles.outlineText, { color: servicesTheme.colors.primary }]}>Enquire Now</Text>
          </View>
        </TouchableOpacity>

        <LinearGradient
          colors={servicesTheme.isDark ? ['#18112A', '#111113'] : ['#F1EFFF', '#ECEBFF']}
          style={styles.statsCard}
        >
          {stats.map((item, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={[styles.statValue, { color: servicesTheme.colors.primary }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: servicesTheme.colors.muted }]}>{item.label}</Text>
            </View>
          ))}
        </LinearGradient>
      </View>

      {/* 🔽 BOTTOM ADD TO CART BAR */}
      {showBottomBar && (
        <View style={[styles.bottomBar, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.divider }]}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.addToCartBtn,
              { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.primary },
              isAddingToCart && styles.addToCartBtnDisabled,
              pressed && styles.addToCartBtnPressed,
              pressed && styles.addToCartBtnScaled,
            ]}
            onPress={onAddToCart}
            disabled={isAddingToCart}
          >
            <Text style={[styles.addToCartText, { color: servicesTheme.colors.primary }]}>
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
};

export default PackFooterCTA;
const styles = StyleSheet.create({
  /* MAIN WRAPPER */
  container: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
  },

  primaryBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  strike: {
    fontSize: 12,
    color: '#E5E7EB',
    textDecorationLine: 'line-through',
  },

  outlineBorder: {
    marginTop: 12,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8665FF',
  },

  outlineInner: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  outlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8665FF',
  },

  statsCard: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6D5BFF',
  },

  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },

  /* ================= BOTTOM BAR ================= */
  bottomBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  addToCartBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8665FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  addToCartBtnPressed: {
    backgroundColor: '#F2EEFF',
    borderColor: '#7A59F0',
  },

  addToCartBtnScaled: {
    transform: [{ scale: 0.98 }],
  },

  addToCartBtnDisabled: {
    opacity: 0.7,
  },

  addToCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8665FF',
  },
});
