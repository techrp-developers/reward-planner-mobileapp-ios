import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { HomeStackParamList, ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
import Card from '../constant/Card';
import { getServiceImageSource, getDiscount } from '../../utils/serviceUtils';

export default function MostBookedServices() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { data, isLoading, error } = useServiceHome();

  const services = useMemo((): ServiceItem[] => {
    if (!data?.data || !Array.isArray(data.data)) return [];
    const section = data.data.find(s => s.section_key === 'popular_services');
    return (section?.items as ServiceItem[]) ?? [];
  }, [data]);

  const handleServicePress = (service: ServiceItem) => {
    (navigation as any).navigate('ServiceDescription', {
      serviceId: service.service_id,
      title: service.name,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.containerWrap}>
        <LinearGradient
          colors={['#080B26', '#171F59', '#3545A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, styles.loaderContainer]}
        >
          <Text style={styles.title}>Most Booked Services</Text>
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        </LinearGradient>
      </View>
    );
  }

  if (error || services.length === 0) return null;

  return (
    <View style={styles.containerWrap}>
      <LinearGradient
        colors={['#080B26', '#171F59', '#3545A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Most Booked Services</Text>
            <Text style={styles.subtitle}>Trusted by thousands of customers</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Trending</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slider}
        >
          {services.map((service, index) => (
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

        <View style={styles.bottomPad} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrap: {
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 28,
    backgroundColor: '#3545A3',
    shadowColor: '#080B26',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  container: {
    borderRadius: 28,
    paddingTop: 22,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  loader: {
    marginTop: 16,
  },
  slider: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  bottomPad: {
    height: 20,
  },
});
