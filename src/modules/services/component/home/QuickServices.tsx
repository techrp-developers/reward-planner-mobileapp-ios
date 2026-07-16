import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useServiceHome } from '../../hooks/useServiceHome';
import type { ServiceItem } from '../../navigation/type';
import Card from '../constant/Card';

const HORIZONTAL_PADDING = 16;

// Fixed typo from 'assete' to 'assets'
const fallbackImg = require('../../assete/gov_documet/domacile_certificate.png');

export default function QuickServices() {
  const navigation = useNavigation<any>();
  const { data: homeData, isLoading, error } = useServiceHome();

  // Extract the Quick Services section
  const quickServicesSection = useMemo(() => {
    if (!homeData?.data || !Array.isArray(homeData.data)) return null;
    return homeData.data.find(
      section => section.section_key === 'quick_services',
    );
  }, [homeData]);

  const items = (quickServicesSection?.items as ServiceItem[]) || [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Quick & Easy Services</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
        </View>
      </View>
    );
  }

  if (error) {
    console.error('QuickServices Error:', error);
    return null;
  }

  if (!items || items.length === 0) {
    return null;
  }

  const getImageSource = (item: ServiceItem) => {
    const imageUrl = item.variant_image || item.service_image || item.image;
    if (imageUrl) {
      return { uri: imageUrl };
    }
    return fallbackImg;
  };

  const renderItem = ({ item }: { item: ServiceItem; index: number }) => {
    const coinsText = item.coins ? `${item.coins}` : '0';
    const orders = item.total_orders
      ? `${(item.total_orders / 1000).toFixed(1)}K`
      : '0';
    const discount =
      item.discount_percent && item.discount_percent > 0
        ? `${item.discount_percent}%`
        : undefined;

    return (
      <View style={[styles.cardWrapper]}>
        <Card
          title={item.title || item.name}
          image={getImageSource(item)}
          price={`${item.price}`}
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>
            {quickServicesSection?.title || 'Quick & Easy Services'}
          </Text>
          <Text style={styles.subheading}>Quick and easy</Text>
        </View>
      </View>

      <FlatList<ServiceItem>
        data={items}
        keyExtractor={item => `${item.service_id}-${item.variant_id}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Manual sliding snapping configurations
        decelerationRate="fast"
        disableIntervalMomentum={true}
        contentContainerStyle={styles.horizontalContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    marginTop: 16,
  },
  headerRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 14,
  },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937', // Deeper contrast typography
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 12.5,
    color: '#8B93A1',
    marginTop: 3,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalContent: {
    paddingLeft: HORIZONTAL_PADDING,
    paddingRight: 4,
  },
  cardWrapper: {
    justifyContent: 'flex-start',
    paddingBottom: 4, // Prevents Android card shadow clipping
  },
});
