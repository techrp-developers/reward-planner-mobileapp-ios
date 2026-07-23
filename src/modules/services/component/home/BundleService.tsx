import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HomeStackParamList } from '../../navigation/type';
import { useServiceBundles } from '../../hooks/useServiceBundles';
import { useServicesTheme } from '../../utils/useServicesTheme';

const fallbackImage = require('../../assete/service/PackBanner.png');

const PACK_TYPE_MAP: { [key: number]: 'home' | 'married' | 'job' } = {
  1: 'home',
  2: 'married',
  3: 'job',
};

type NavProp = NativeStackNavigationProp<HomeStackParamList>;

interface BundleCardProps {
  title: string;
  description: string;
  price: string;
  oldPrice: string;
  imageUrl?: string;
  onPress: () => void;
  servicesTheme: ReturnType<typeof useServicesTheme>;
}

function BundleCard({ title, description, price, oldPrice, imageUrl, onPress, servicesTheme }: BundleCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <View style={styles.cardShadow}>
    <LinearGradient colors={servicesTheme.isDark ? ['#18112A', '#27272A'] : ['#EDE8FF', '#C2B2FF']} style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={[styles.cardTitle, { color: servicesTheme.colors.textStrong }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: servicesTheme.colors.muted }]}>{description}</Text>
      </View>

      <TouchableOpacity activeOpacity={0.8} style={styles.buttonWrapper} onPress={onPress}>
        <LinearGradient
          colors={servicesTheme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>
            Get the Full Package at ₹{price}
            <Text style={styles.oldPriceText}> ₹{oldPrice}</Text>
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image
          source={!imgError && imageUrl ? { uri: imageUrl } : fallbackImage}
          style={styles.bundleImage}
          onError={e => {
            __DEV__ && console.log('BundleCard image error:', e.nativeEvent.error, 'url:', imageUrl);
            setImgError(true);
          }}
        />
      </View>
    </LinearGradient>
    </View>
  );
}

export default function BundleService() {
  const navigation = useNavigation<NavProp>();
  const servicesTheme = useServicesTheme();
  const { data, isLoading } = useServiceBundles();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
        <Text style={[styles.mainHeading, { color: servicesTheme.colors.textStrong }]}>Bundle Services</Text>
        <ActivityIndicator size="large" color={servicesTheme.colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: servicesTheme.colors.background }]}>
      <Text style={[styles.mainHeading, { color: servicesTheme.colors.textStrong }]}>Bundle Services</Text>

      {data.map(item => (
        <BundleCard
          key={item.id}
          title={item.name}
          description={item.description}
          price={item.bundle_price}
          oldPrice={item.original_price}
          imageUrl={item.banner_image || undefined}
          servicesTheme={servicesTheme}
          onPress={() =>
            navigation.navigate('PackScreen', {
              packType: PACK_TYPE_MAP[item.id] ?? 'home',
              bundleId: item.id,
              title: item.name,
            })
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  mainHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  cardShadow: {
      elevation: 4,
      borderRadius: 20,
    },

  card: {
    borderRadius: 20,
    paddingTop: 20,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonWrapper: {
    width: '80%',
    zIndex: 10,
  },
  cta: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 12,

  },
  oldPriceText: {
    textDecorationLine: 'line-through',
    fontSize: 12,
    color: '#E5E7EB',
    opacity: 0.8,
  },
  imageContainer: {
    marginTop: 10,
    width: '100%',
  },
  bundleImage: {
    width: '100%',
    height: 160,
    resizeMode: 'contain',
  },
  loader: {
    marginTop: 20,
  },
});
