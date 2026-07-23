import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import Card from './Card';
import { HomeStackParamList, type ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
import { useServicesTheme } from '../../utils/useServicesTheme';

const LimitedImage = require('../../assete/service/Limited_offer.png');
const fallbackImg = require('../../assete/gov_documet/domacile_certificate.png');

export default function LimitedOffer() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const servicesTheme = useServicesTheme();
  const { data, isLoading, error } = useServiceHome();

  const services = useMemo((): ServiceItem[] => {
    if (!data?.data) return [];
    const section = data.data.find(s => s.section_key === 'quick_services');
    return (section?.items as ServiceItem[]) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.shadowWrap}>
        <LinearGradient
          colors={['#E6ECFF', '#5B7CFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, styles.loadingBox]}
        >
          <ActivityIndicator size="large" color="#5B47A3" />
        </LinearGradient>
      </View>
    );
  }

  if (error || services.length === 0) return null;

  const getImageSource = (item: ServiceItem) => {
    const imageUrl = item.variant_image || item.service_image || item.image;
    return imageUrl ? { uri: imageUrl } : fallbackImg;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: servicesTheme.colors.textStrong }]}>Limited Time Offers</Text>
        <Text style={[styles.subheading, { color: servicesTheme.colors.muted }]}>Grab them before they're gone</Text>
      </View>

      <View style={styles.shadowWrap}>
        <LinearGradient
          colors={['#E6ECFF', '#5B7CFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          <View style={styles.left}>
            <Image
              source={LimitedImage}
              style={styles.limitedImage}
              resizeMode="contain"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            style={styles.right}
          >
            {services.map(item => {
              const discount =
                item.discount_percent && item.discount_percent > 0
                  ? `${item.discount_percent}%`
                  : undefined;
              const coinsText = item.coins ? `${item.coins}` : '0';
              const orders = item.total_orders
                ? `${(item.total_orders / 1000).toFixed(1)}K`
                : '0';

              return (
                <Card
                  key={`${item.service_id}-${item.variant_id}`}
                  title={item.title || item.name}
                  image={getImageSource(item)}
                  price={Number(item.price) > 0 ? `₹${item.price}` : 'Get Quote'}
                  oldPrice={item.mrp ? `${item.mrp}` : `${item.price}`}
                  rating={item.rating}
                  users={orders}
                  coins={coinsText}
                  discount={discount}
                  onPress={() =>
                    navigation.navigate('ServiceDescription', {
                      serviceId: item.service_id,
                      title: item.name,
                    })
                  }
                />
              );
            })}
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
  },
  headerRow: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  heading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '500',
  },
  shadowWrap: {
    marginHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#3F4FE0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 22,
  },
  loadingBox: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  left: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  limitedImage: {
    width: 110,
    height: 160,
  },
  right: {
    flex: 1,
    paddingVertical: 12,
  },
  scroll: {
    paddingLeft: 4,
    paddingRight: 12,
  },
});
