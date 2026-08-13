import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useServiceHome } from '../../hooks/useServiceHome';
import type { ServiceItem } from '../../navigation/type';
import Card from '../constant/Card';
import { getServiceImageSource, getDiscount } from '../../utils/serviceUtils';
import { useServicesTheme } from '../../utils/useServicesTheme';

export default function QuickServices() {
  const navigation = useNavigation<any>();
  const servicesTheme = useServicesTheme();
  const { data: homeData, isLoading, error } = useServiceHome();

  const { section, items } = useMemo(() => {
    if (!homeData?.data || !Array.isArray(homeData.data)) {
      return { section: null, items: [] as ServiceItem[] };
    }
    const found = homeData.data.find(s => s.section_key === 'quick_services');
    return {
      section: found ?? null,
      items: (found?.items as ServiceItem[]) ?? [],
    };
  }, [homeData]);

  const handleServicePress = (service: ServiceItem) => {
    (navigation as any).navigate('ServiceDescription', {
      serviceId: service.service_id,
      title: service.name,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.heading, { color: servicesTheme.colors.textStrong }]}>
          Quick &amp; Easy Services
        </Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={servicesTheme.colors.primary} />
        </View>
      </View>
    );
  }

  if (error || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: servicesTheme.colors.textStrong }]}>
          {section?.title || 'Quick & Easy Services'}
        </Text>
        <Text style={[styles.subheading, { color: servicesTheme.colors.muted }]}>
          Quick and easy
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slider}
      >
        {items.map((service, index) => (
          <Card
            key={`${service.service_id}-${index}`}
            title={service.title || service.name}
            image={getServiceImageSource(service)}
            price={service.price > 0 ? `₹${service.price}` : 'Get Quote'}
            oldPrice={service.mrp && service.mrp > service.price ? `₹${service.mrp}` : undefined}
            rating={service.rating}
            users={String(service.review_count ?? 0)}
            coins={service.coins ? String(service.coins) : ''}
            discount={getDiscount(service)}
            onPress={() => handleServicePress(service)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingTop: 4,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
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
  slider: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
});
