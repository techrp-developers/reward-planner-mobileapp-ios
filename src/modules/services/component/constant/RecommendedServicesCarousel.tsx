import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import Card from './Card';
import { HomeStackParamList, type ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';

const fallbackImg = require('../../assete/gov_documet/aadhar card.png');

const RecommendedServicesCarousel = () => {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { data, isLoading, error } = useServiceHome();

  const services = useMemo((): ServiceItem[] => {
    if (!data?.data) return [];
    const section = data.data.find(s => s.section_key === 'popular_services');
    return (section?.items as ServiceItem[]) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Recommended for you</Text>
          <Text style={styles.subheading}>Picked based on what's popular</Text>
        </View>
        <ActivityIndicator size="small" color="#8665FF" style={styles.loader} />
      </View>
    );
  }

  if (error || services.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Recommended for you</Text>
        <Text style={styles.subheading}>Picked based on what's popular</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {services.map(item => {
          const imageUri = item.variant_image || item.service_image || item.image;
          const imageSource = imageUri ? { uri: imageUri } : fallbackImg;
          const discount =
            item.discount_percent && item.discount_percent > 0
              ? `${item.discount_percent}%`
              : undefined;
          const coinsText = item.coins ? String(item.coins) : '';

          return (
            <Card
              key={`${item.service_id}-${item.variant_id}`}
              title={item.name}
              image={imageSource}
              price={item.price > 0 ? `₹${item.price}` : 'Get Quote'}
              oldPrice={
                item.mrp && item.mrp > item.price
                  ? `₹${item.mrp}`
                  : undefined
              }
              rating={item.rating}
              users={String(item.total_orders ?? 0)}
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
    </View>
  );
};

export default RecommendedServicesCarousel;

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 22,
  },
  headerRow: {
    marginHorizontal: 16,
    marginBottom: 14,
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
  scroll: {
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 8,
    marginLeft: 16,
  },
});
