import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { HomeStackParamList, ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
import ServiceGridCard from '../constant/ServiceGridCard';

const CONTAINER_PADDING = 16;
const GRID_COLUMNS = 3;
const GRID_GAP = 12;

const CardSeparator = () => <View style={styles.cardGap} />;

export default function MostBookedServices() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { data, isLoading, error } = useServiceHome();
  const { width } = useWindowDimensions();
  const [activeIdx, setActiveIdx] = useState(0);
  const cardWidth = Math.floor(
    (width - CONTAINER_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS,
  );

  const viewConfigPairs = useRef([
    {
      viewabilityConfig: {
        viewAreaCoveragePercentThreshold: 60,
        minimumViewTime: 30,
      },
      onViewableItemsChanged: ({ viewableItems }: any) => {
        const idx = viewableItems?.[0]?.index;
        if (idx != null) setActiveIdx(idx);
      },
    },
  ]);

  const services = useMemo((): ServiceItem[] => {
    if (!data?.data || !Array.isArray(data.data)) return [];

    const section = data.data.find(
      s => s.section_key === 'popular_services',
    );

    return (section?.items as ServiceItem[]) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#080B26', '#171F59', '#3545A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, styles.loaderContainer]}
      >
        <Text style={styles.title}>Most Booked Services</Text>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </LinearGradient>
    );
  }

  if (error || services.length === 0) {
    return null;
  }

  return (
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

      <FlatList
        horizontal
        data={services}
        keyExtractor={item => `${item.service_id}-${item.variant_id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={CardSeparator}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        viewabilityConfigCallbackPairs={viewConfigPairs.current}
        renderItem={({ item }) => {
          const imageSource =
            item.variant_image
              ? { uri: item.variant_image }
              : item.service_image
                ? { uri: item.service_image }
                : item.image
                  ? { uri: item.image }
                  : null;

          return (
            <ServiceGridCard
              item={item}
              image={imageSource}
              cardWidth={cardWidth}
              onPress={() =>
                navigation.navigate('ServiceDescription', {
                  serviceId: item.service_id,
                  title: item.name,
                })
              }
            />
          );
        }}
      />

      <View style={styles.dotContainer}>
        {services.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIdx === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingTop: 22,
    paddingBottom: 20,
    overflow: 'hidden',
    shadowColor: '#080B26',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: CONTAINER_PADDING,
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.78)',
    marginTop: 4,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingLeft: CONTAINER_PADDING,
    paddingRight: 6,
  },
  cardGap: {
    width: GRID_GAP,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
