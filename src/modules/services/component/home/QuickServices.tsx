import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useServiceHome } from '../../hooks/useServiceHome';
import type { ServiceItem } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';
import ServiceGridCard from '../constant/ServiceGridCard';

const HORIZONTAL_PADDING = 16;
const GRID_COLUMNS = 3;
const GRID_GAP = 12;

const fallbackImg = require('../../assete/gov_documet/domacile_certificate.png');

export default function QuickServices() {
  const navigation = useNavigation<any>();
  const servicesTheme = useServicesTheme();
  const { data: homeData, isLoading, error } = useServiceHome();
  const { width } = useWindowDimensions();

  const quickServicesSection = useMemo(() => {
    if (!homeData?.data || !Array.isArray(homeData.data)) return null;
    return homeData.data.find(
      section => section.section_key === 'quick_services',
    );
  }, [homeData]);

  const visibleItems = (quickServicesSection?.items as ServiceItem[]) || [];
  const cardWidth = Math.floor(
    (width - HORIZONTAL_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS,
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.heading, { color: servicesTheme.colors.textStrong }]}>
          Quick Picks
        </Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={servicesTheme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error) {
    console.error('QuickServices Error:', error);
    return null;
  }

  if (visibleItems.length === 0) {
    return null;
  }

  const getImageSource = (item: ServiceItem): ImageSourcePropType => {
    const imageUrl = item.variant_image || item.service_image || item.image;
    return imageUrl ? { uri: imageUrl } : fallbackImg;
  };

  const openService = (item: ServiceItem) => {
    navigation.navigate('ServiceDescription', {
      serviceId: item.service_id,
      title: item.name,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: servicesTheme.colors.textStrong }]}>
          {quickServicesSection?.title || 'Quick Picks'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('ServiceSearch')}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Text style={[styles.viewAll, { color: servicesTheme.colors.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {visibleItems.map((item) => (
          <ServiceGridCard
            key={`${item.service_id}-${item.variant_id}`}
            item={item}
            image={getImageSource(item)}
            cardWidth={cardWidth}
            onPress={openService}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    marginTop: 12,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  viewAll: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: GRID_GAP,
    columnGap: GRID_GAP,
  },
});
