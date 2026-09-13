import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Svg, Polygon } from 'react-native-svg';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';
import { isFestivePeriod } from '../../../../utils/festiveTheme';
const fallbackImage = require('../../assete/gov_documet/aadhar card.png');

function TricolorCornerRibbon({ size }: { size: number }) {
  const s = size;
  return (
    <Svg width={s} height={s} style={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }} pointerEvents="none">
      <Polygon points={`${s},0 0,0 ${s},${s}`} fill="#138808" />
      <Polygon points={`${s},0 ${Math.round(s * 0.65)},0 ${s},${Math.round(s * 0.65)}`} fill="#FFFFFF" />
      <Polygon points={`${s},0 ${Math.round(s * 0.33)},0 ${s},${Math.round(s * 0.33)}`} fill="#FF9933" />
    </Svg>
  );
}

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
  width?: number;
  compact?: boolean;
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
  width,
  compact = false,
}: Props) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const servicesTheme = useServicesTheme();
  const isFestive = isFestivePeriod();
  const [imgError, setImgError] = useState(false);
  const parsedRating = Number(rating);
  const hasRating = rating !== undefined && rating !== null && Number.isFinite(parsedRating);

  const resolvedImageSource = (() => {
    if (imgError || !image) return fallbackImage;

    if (typeof image === 'string') {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return { uri: image };
      }
      return image;
    }

    return image;
  })();

  const handlePress = () => {
    if (onPress) {
      onPress();
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
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={compact ? styles.touchableCompact : styles.touchable}
    >
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          {
            backgroundColor: servicesTheme.colors.surface,
            shadowColor: servicesTheme.colors.shadow,
          },
          !compact && width ? { width } : undefined,
        ]}
      >
        {/* IMAGE */}
        <View
          style={[
            styles.imageBox,
            compact && styles.imageBoxCompact,
            { backgroundColor: servicesTheme.colors.surfaceAlt },
          ]}
        >
          {isFestive && <TricolorCornerRibbon size={compact ? 24 : 34} />}
          {discount ? (
            <View style={compact ? styles.discountBadgeCompact : styles.discountBadge}>
              <Text style={compact ? styles.discountTextCompact : styles.discountText}>
                {discount} OFF
              </Text>
            </View>
          ) : null}
          <Image
            source={resolvedImageSource}
            style={compact ? styles.cardImageCompact : styles.cardImage}
            resizeMode="contain"
            onLoad={() => {
              if (__DEV__) {
                console.log('[SERVICE CARD IMAGE LOAD]', image);
              }
            }}
            onError={(event) => {
              if (__DEV__) {
                console.log('[SERVICE CARD IMAGE ERROR]', {
                  image,
                  source: resolvedImageSource,
                  nativeEvent: event?.nativeEvent,
                });
              }
              setImgError(true);
            }}
          />
        </View>

        <View style={compact ? styles.infoContainerCompact : styles.infoContainer}>
          <Text
            style={[
              compact ? styles.titleCompact : styles.title,
              { color: servicesTheme.colors.textStrong },
            ]}
            numberOfLines={compact ? 2 : 1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>

          {/* PRICE */}
          <View style={[styles.priceRow, compact && styles.priceRowCompact]}>
            <Text
              style={[
                compact ? styles.priceCompact : styles.price,
                { color: servicesTheme.colors.success },
              ]}
            >
              {price}
            </Text>
            {!!oldPrice && (
              <Text
                style={[
                  compact ? styles.oldPriceCompact : styles.oldPrice,
                  { color: servicesTheme.colors.subtle },
                ]}
              >
                {oldPrice}
              </Text>
            )}
          </View>

          {/* RATING — hidden in compact */}
          {!compact && (hasRating || !!users) && (
            <View style={styles.ratingRow}>
              {hasRating && (
                <>
                  <MaterialIcons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.ratingText, { color: servicesTheme.isDark ? '#FBBF24' : '#92400E' }]}>
                    {parsedRating.toFixed(1)}
                  </Text>
                </>
              )}
              {!!users && (
                <Text style={[styles.users, { color: servicesTheme.colors.muted }]}>
                  ({users})
                </Text>
              )}
            </View>
          )}

          {/* CTA — hidden in compact (whole card is tappable) */}
          {!compact && (
            <View style={styles.ctaWrap}>
              <LinearGradient
                colors={servicesTheme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>{offerPrice || price}</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(Card);

const styles = StyleSheet.create({
  // ─── Default (horizontal scroll) styles ───────────────────────
  touchable: {
    marginRight: 14,
  },
  touchableCompact: {
    width: '100%',
    marginRight: 0,
  },
  card: {
    width: 172,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 8,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageBox: {
    backgroundColor: '#F4F5FA',
    borderRadius: 14,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardImage: {
    width: '80%',
    height: '80%',
  },
  infoContainer: {
    paddingTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
    letterSpacing: -0.2,
    lineHeight: 17,
    marginBottom: 2,
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
    flexShrink: 1,
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
  ctaWrap: {
    borderRadius: 12,
    backgroundColor: '#5B47A3',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  cta: {
    flexDirection: 'row',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    paddingVertical: 10,
  },

  // ─── Compact (2×2 grid) overrides ─────────────────────────────
  cardCompact: {
    width: '100%',
    minHeight: 120,
    borderRadius: 14,
    padding: 7,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageBoxCompact: {
    height: 62,
    borderRadius: 10,
  },
  discountBadgeCompact: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 10,
  },
  discountTextCompact: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  cardImageCompact: {
    width: '72%',
    height: '72%',
  },
  infoContainerCompact: {
    paddingTop: 5,
  },
  titleCompact: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1C1E',
    letterSpacing: -0.1,
    lineHeight: 15,
    minWidth: 0,
    flexShrink: 1,
    marginBottom: 2,
  },
  priceRowCompact: {
    marginTop: 2,
    flexWrap: 'wrap',
  },
  priceCompact: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
    marginRight: 4,
  },
  oldPriceCompact: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    flexShrink: 1,
  },
});
