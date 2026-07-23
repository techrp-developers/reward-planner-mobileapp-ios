import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';
const fallbackImage = require('../../assete/gov_documet/aadhar card.png');

type Props = {
  title: string;
  image: any;
  price: string;
  oldPrice?: string;
  rating?: number | string;
  users?: string;
  offerPrice?: string;
  coins?: string;
  discount?: string;
  onPress?: () => void;
};

function Card({
  title,
  image,
  price,
  oldPrice,
  rating,
  users,
  offerPrice,
  coins,
  discount,
  onPress,
}: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const servicesTheme = useServicesTheme();
  const [imgError, setImgError] = useState(false);
  const parsedRating = Number(rating);
  const hasRating = rating !== undefined && rating !== null && Number.isFinite(parsedRating);

  const handlePress = () => {
    if (onPress) {
      onPress(); // parent navigation
    } else {
      navigation.navigate('PackEnquiryForm', {
        title,
        price: offerPrice || price,
        oldPrice: oldPrice || '',
        coins: coins || '',
      });
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={handlePress} style={styles.touchable}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: servicesTheme.colors.surface,
            shadowColor: servicesTheme.colors.shadow,
          },
        ]}
      >
        {/* IMAGE */}
        <View style={[styles.imageBox, { backgroundColor: servicesTheme.colors.surfaceAlt }]}>
          {discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount} OFF</Text>
            </View>
          )}
          <Image
            source={imgError || !image ? fallbackImage : image}
            style={styles.cardImage}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: servicesTheme.colors.textStrong }]} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>

          {/* PRICE */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: servicesTheme.colors.success }]}>{price}</Text>
            {!!oldPrice && (
              <Text style={[styles.oldPrice, { color: servicesTheme.colors.subtle }]}>{oldPrice}</Text>
            )}
          </View>

          {/* RATING & ORDERS */}
          {(hasRating || !!users) && (
            <View style={styles.ratingRow}>
              {hasRating && (
                <>
                  <MaterialIcons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.ratingText, { color: servicesTheme.isDark ? '#FBBF24' : '#92400E' }]}>{parsedRating.toFixed(1)}</Text>
                </>
              )}
              {!!users && <Text style={[styles.users, { color: servicesTheme.colors.muted }]}>({users})</Text>}
            </View>
          )}

          {/* CTA */}
          <LinearGradient
            colors={servicesTheme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {offerPrice || price}
            </Text>
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ✅ Prevent unnecessary re-renders
export default memo(Card);

const styles = StyleSheet.create({
  touchable: {
    marginRight: 14,
  },
  card: {
    width: 172,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  imageBox: {
    backgroundColor: '#F4F5FA',
    borderRadius: 16,
    height: 118,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardImage: {
    width: '82%',
    height: '82%',
  },
  infoContainer: {
    paddingTop: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  price: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  oldPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
    marginLeft: 2,
  },
  users: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  cta: {
    flexDirection: 'row',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    paddingVertical: 10,

  },
});
