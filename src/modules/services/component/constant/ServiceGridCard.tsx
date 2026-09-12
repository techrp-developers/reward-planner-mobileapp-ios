import React, { memo, useMemo } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import type { ServiceItem } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';

const RP_PRICE_COLOR = '#F2811D';
const fallbackImage = require('../../assete/gov_documet/aadhar card.png');

type Props = {
  item: ServiceItem;
  image?: ImageSourcePropType | string | null;
  cardWidth: number;
  onPress: (item: ServiceItem) => void;
};

function ServiceGridCard({ item, image, cardWidth, onPress }: Props) {
  const servicesTheme = useServicesTheme();

  const calculations = useMemo(() => ({
    imageDynamicSize: Math.round(Math.min(Math.max(cardWidth * 0.88, 56), 104)),
    borderRadius: Math.round(cardWidth * 0.06),
    imageWrapHeight: Math.round(Math.min(Math.max(cardWidth * 1.02, 104), 132)),
    cardMinHeight: Math.round(Math.min(Math.max(cardWidth * 1.78, 196), 238)),
    fontSizeLabel: Math.max(11, Math.round(cardWidth * 0.07)),
    fontSizeReview: Math.max(9, Math.round(cardWidth * 0.066)),
    fontSizePrice: Math.max(12, Math.round(cardWidth * 0.096)),
    fontSizeOriginal: Math.max(9, Math.round(cardWidth * 0.065)),
    fontSizeDiscount: Math.max(9, Math.round(cardWidth * 0.07)),
  }), [cardWidth]);

  const rating = Number(item.rating ?? 0);
  const reviews = Number(item.review_count ?? 0);
  const price = Number(item.price ?? 0);
  const mrp = Number(item.mrp ?? 0);
  const discount =
    item.discount_percent && item.discount_percent > 0
      ? `${item.discount_percent}%`
      : null;

  const resolvedImageSource = (() => {
    if (!image) return fallbackImage;

    if (typeof image === 'string') {
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return { uri: image };
      }
      return image;
    }

    return image;
  })();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(item)}
      style={[
        styles.card,
        {
          width: cardWidth,
          minHeight: calculations.cardMinHeight,
          borderRadius: calculations.borderRadius,
          backgroundColor: servicesTheme.isDark ? servicesTheme.appTheme.card : '#FFFFFF',
          borderColor: servicesTheme.isDark ? servicesTheme.appTheme.border : '#EEF0F4',
        },
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          {
            height: calculations.imageWrapHeight,
            borderRadius: calculations.borderRadius,
            backgroundColor: servicesTheme.isDark ? '#303038' : '#F9FAFB',
          },
        ]}
      >
        {discount ? (
          <View style={styles.discountBadgeWrap}>
            <View style={styles.discountBadge}>
              <Text style={[styles.discountArrow, { fontSize: calculations.fontSizeDiscount }]}>
                {'\u2193'}
              </Text>
              <Text
                style={[styles.discountText, { fontSize: calculations.fontSizeDiscount }]}
                numberOfLines={1}
              >
                {discount}
              </Text>
            </View>
          </View>
        ) : null}

        <Image
          source={resolvedImageSource}
          style={[
            styles.image,
            {
              width: calculations.imageDynamicSize,
              height: calculations.imageDynamicSize,
            },
          ]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.details}>
        <Text
          style={[
            styles.title,
            {
              fontSize: calculations.fontSizeLabel,
              color: servicesTheme.appTheme.text,
            },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title || item.name}
        </Text>

        <View style={styles.ratingRow}>
          <MaterialIcons name="star" size={11} color="#FFC514" />
          <Text
            style={[
              styles.ratingText,
              {
                fontSize: calculations.fontSizeReview,
                color: servicesTheme.appTheme.secondaryText,
              },
            ]}
            numberOfLines={1}
          >
            {`${Number.isFinite(rating) ? rating.toFixed(1) : '0.0'}(${reviews})`}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text
            style={[
              styles.price,
              {
                fontSize: calculations.fontSizePrice,
                color: price > 0 ? RP_PRICE_COLOR : servicesTheme.appTheme.text,
              },
            ]}
            numberOfLines={1}
          >
            {price > 0 ? (
              <>
                <Text style={[styles.rpPrefix, { fontSize: calculations.fontSizeOriginal }]}>
                  RP{' '}
                </Text>
                {`\u20B9${price}`}
              </>
            ) : (
              'Get Quote'
            )}
          </Text>
          {mrp > price ? (
            <Text
              style={[
                styles.oldPrice,
                {
                  fontSize: calculations.fontSizePrice,
                  color: servicesTheme.appTheme.secondaryText,
                },
              ]}
              numberOfLines={1}
            >
              {`\u20B9${mrp}`}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ServiceGridCard);

const styles = StyleSheet.create({
  card: {
    padding: 7,
    borderWidth: 1,
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F2F5',
  },
  image: {
    alignSelf: 'center',
  },
  discountBadgeWrap: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 10,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8EF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountArrow: {
    color: '#16A34A',
    fontWeight: '900',
    marginRight: 1,
  },
  discountText: {
    color: '#16A34A',
    fontWeight: '700',
  },
  details: {
    flex: 1,
    marginTop: 9,
  },
  title: {
    flexShrink: 1,
    minHeight: 34,
    fontWeight: '800',
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 18,
    marginTop: 3,
  },
  ratingText: {
    marginLeft: 3,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 4,
    columnGap: 6,
    rowGap: 3,
  },
  price: {
    fontWeight: '800',
  },
  rpPrefix: {
    fontWeight: '800',
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    fontWeight: '700',
  },
});
