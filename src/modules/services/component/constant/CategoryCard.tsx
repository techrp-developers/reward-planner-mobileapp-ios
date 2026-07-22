import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { prefetchService } from '../../utils/serviceCache';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';
import { getServiceImageUrl } from '../../utils/serviceImage';
import { useServicesTheme } from '../../utils/useServicesTheme';

type VerticalServiceCardProps = {
  serviceId: number;
  title: string;
  description: string;
  image: string | React.ComponentType<{ width?: number; height?: number }>;
  priceText?: string;
  days?: string;
};

function CategoryCard({
  serviceId,
  title,
  description,
  image,
  priceText,
  days,
}: VerticalServiceCardProps) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const servicesTheme = useServicesTheme();
  const isUrlImage = typeof image === 'string';
  const [imageLoading, setImageLoading] = useState(isUrlImage);

  const imageUri = useMemo(
    () => (isUrlImage ? getServiceImageUrl(String(image || ''), 'small') : ''),
    [isUrlImage, image]
  );

  useEffect(() => {
    setImageLoading(isUrlImage);
  }, [isUrlImage, image]);

  const handlePress = useCallback(() => {
    // Warm the cache immediately; ServiceDescription will read from it on mount.
    prefetchService(serviceId);
    navigation.navigate('ServiceDescription', {
      serviceId,
      title,
    });
  }, [navigation, serviceId, title]);

  const handleLoadStart = useCallback(() => setImageLoading(true), []);
  const handleLoadEnd = useCallback(() => setImageLoading(false), []);
  const handleLoadError = useCallback(() => setImageLoading(false), []);

  const parsedPriceValue = Number(String(priceText || '').replace(/[^0-9.]/g, ''));
  const hasPositivePrice = Number.isFinite(parsedPriceValue) && parsedPriceValue > 0;
  const primaryButtonText = hasPositivePrice
    ? `${priceText} + Get Start`
    : 'Get Started';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: servicesTheme.colors.surface,
          shadowColor: servicesTheme.colors.shadow,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* LEFT: IMAGE SECTION */}
      <View style={[styles.imageBox, { backgroundColor: servicesTheme.colors.surfaceAlt }]}>
        {isUrlImage ? (
          <>
            {imageLoading && (
              <View style={[styles.imageSkeleton, { backgroundColor: servicesTheme.colors.skeleton }]} />
            )}
            <Image
              source={{ uri: imageUri }}
              style={[styles.image, imageLoading && styles.imageHidden]}
              resizeMode="cover"
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleLoadError}
            />
          </>
        ) : (
          React.createElement(image, {
            width: 96,
            height: 96,
          })
        )}
      </View>

      {/* RIGHT: CONTENT SECTION */}
      <View style={styles.content}>
        <View>
          <Text style={[styles.title, { color: servicesTheme.colors.textStrong }]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
          <Text style={[styles.desc, { color: servicesTheme.colors.muted }]} numberOfLines={2}>{description}</Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.metaRow}>
            <View style={styles.ratingChip}>
              <MaterialIcons name="star" size={13} color="#F59E0B" />
              <Text style={[styles.ratingChipText, { color: servicesTheme.isDark ? '#FBBF24' : '#92400E' }]}>0.0</Text>
            </View>
            {!!days && (
              <View style={[styles.daysChip, { backgroundColor: servicesTheme.colors.surfaceAlt }]}>
                <MaterialIcons name="schedule" size={12} color={servicesTheme.colors.muted} />
                <Text style={[styles.daysChipText, { color: servicesTheme.colors.muted }]}>{days}</Text>
              </View>
            )}
          </View>

          <LinearGradient
            colors={servicesTheme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{primaryButtonText}</Text>
            {hasPositivePrice && <View style={styles.coinIcon} />}
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(CategoryCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  imageBox: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F4F5FA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHidden: {
    position: 'absolute',
    opacity: 0,
  },
  imageSkeleton: {
    width: '100%',
    height: 96,
    borderRadius: 16,
    backgroundColor: '#ECECEC',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1A1C1E',
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 16,
    fontWeight: '400',
  },
  bottomSection: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7E6',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  ratingChipText: {
    fontSize: 11.5,
    color: '#92400E',
    fontWeight: '700',
  },
  daysChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  daysChipText: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '600',
  },
  ctaButton: {
    borderRadius: 10,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    minWidth: 130,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  coinIcon: {
     width: 16,
     height: 16,
     backgroundColor: '#FFD700',
     borderRadius: 8,
     marginLeft: 4,
  }
});
