import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
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

type BundleCardProps = {
  title: string;
  description: string;
  price: string;
  oldPrice: string;
  imageUrl?: string;
  onPress: () => void;
  servicesTheme: ReturnType<typeof useServicesTheme>;
};

const parseBundleServices = (description: string) =>
  String(description || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const formatBundlePrice = (value: string | number) => {
  const amount = Number(String(value || '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return '';

  return amount.toLocaleString('en-IN', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
};

const getServiceIcon = (label: string) => {
  const normalized = label.toLowerCase();

  if (normalized.includes('rent')) return 'home-work';
  if (normalized.includes('mseb') || normalized.includes('electric')) return 'bolt';
  if (normalized.includes('tax') || normalized.includes('property')) return 'account-balance';
  if (normalized.includes('aadhar') || normalized.includes('aadhaar')) return 'badge';
  if (normalized.includes('pan')) return 'credit-card';
  if (normalized.includes('passport')) return 'travel-explore';
  if (normalized.includes('marriage')) return 'favorite-border';
  if (normalized.includes('insurance')) return 'health-and-safety';

  return 'description';
};

const getShortServiceName = (label: string) => {
  const normalized = label.toLowerCase();

  if (normalized.includes('property tax')) return 'Property Tax';
  if (normalized.includes('mseb')) return 'MSEB';
  if (normalized.includes('name change')) return label.replace(/name change/ig, '').trim() || label;
  if (normalized.includes('aadhar card')) return 'Aadhar';
  if (normalized.includes('aadhaar card')) return 'Aadhaar';
  if (normalized.includes('pan card')) return 'PAN';
  if (normalized.includes('health insurance')) return 'Insurance';

  return label.length > 13 ? `${label.slice(0, 12).trim()}...` : label;
};

function BundleCard({
  title,
  description,
  price,
  oldPrice,
  imageUrl,
  onPress,
  servicesTheme,
}: BundleCardProps) {
  const [imgError, setImgError] = useState(false);
  const services = useMemo(() => parseBundleServices(description), [description]);
  const displayPrice = formatBundlePrice(price);
  const displayOldPrice = formatBundlePrice(oldPrice);

  return (
    <LinearGradient
      colors={servicesTheme.isDark ? ['#18112A', '#27272A'] : ['#F7F0FF', '#EEF4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.card}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.cardTitle, { color: servicesTheme.colors.textStrong }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.cardDesc, { color: servicesTheme.colors.muted }]}>
          {services.length || 0} services in one convenient package
        </Text>
      </View>

      {services.length > 0 ? (
        <View style={styles.chipRow}>
          {services.slice(0, 5).map((service) => (
            <View key={service} style={styles.serviceChip}>
              <MaterialIcons name={getServiceIcon(service)} size={11} color="#374151" />
              <Text style={styles.serviceChipText} numberOfLines={1}>
                {getShortServiceName(service)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.priceRow}>
        {!!displayPrice && (
          <Text style={styles.bundlePrice}>
            {'\u20B9'}{displayPrice}
          </Text>
        )}
        {!!displayOldPrice && displayOldPrice !== displayPrice && (
          <Text style={styles.bundleOldPrice}>
            {'\u20B9'}{displayOldPrice}
          </Text>
        )}
      </View>

      <TouchableOpacity activeOpacity={0.84} style={styles.buttonWrapper} onPress={onPress}>
        <LinearGradient
          colors={servicesTheme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Get Full Pack</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image
          source={!imgError && imageUrl ? { uri: imageUrl } : fallbackImage}
          style={styles.bundleImage}
          resizeMode="contain"
          onError={(event) => {
            __DEV__ && console.log('BundleCard image error:', event.nativeEvent.error, 'url:', imageUrl);
            setImgError(true);
          }}
        />
      </View>
    </LinearGradient>
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

      {data.map((item) => (
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
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 16,
  },
  card: {
    minHeight: 442,
    borderRadius: 14,
    paddingTop: 18,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  serviceChip: {
    height: 34,
    minWidth: 74,
    maxWidth: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  serviceChipText: {
    flexShrink: 1,
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  bundlePrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#7440F5',
    marginRight: 14,
  },
  bundleOldPrice: {
    fontSize: 23,
    fontWeight: '800',
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  buttonWrapper: {
    width: '60%',
    minWidth: 230,
    zIndex: 10,
  },
  cta: {
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  imageContainer: {
    marginTop: 18,
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bundleImage: {
    width: '100%',
    height: 145,
  },
  loader: {
    marginTop: 20,
  },
});
