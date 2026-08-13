import { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { ServiceItem } from '../../navigation/type';
import Card from './Card';
import { chunkArray, getServiceImageSource, getDiscount } from '../../utils/serviceUtils';

type Props = {
  items: ServiceItem[];
  navigation: NavigationProp<any>;
  defaultDiscount?: string;
  dotColor?: string;
  activeDotColor?: string;
};

export default function PaginatedServiceGrid({
  items,
  navigation,
  defaultDiscount,
  dotColor = 'rgba(100,100,100,0.22)',
  activeDotColor = '#5B47A3',
}: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activePage, setActivePage] = useState(0);

  const pages = useMemo(() => chunkArray(items, 4), [items]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== containerWidth) setContainerWidth(w);
  };

  const handleServicePress = (service: ServiceItem) => {
    (navigation as any).navigate('ServiceDescription', {
      serviceId: service.service_id,
      title: service.name,
    });
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <FlatList
          horizontal
          pagingEnabled
          data={pages}
          keyExtractor={(_, i) => `service-page-${i}`}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={e => {
            const page = Math.round(
              e.nativeEvent.contentOffset.x / containerWidth,
            );
            setActivePage(Math.max(0, Math.min(page, pages.length - 1)));
          }}
          renderItem={({ item: pageItems }) => (
            <View style={[styles.page, { width: containerWidth }]}>
              <View style={styles.grid}>
                {pageItems.map((service, index) => (
                  <View
                    key={`${service.service_id}-${service.variant_id ?? index}-${index}`}
                    style={styles.gridItem}
                  >
                    <Card
                      compact
                      title={service.title || service.name}
                      image={getServiceImageSource(service)}
                      price={service.price > 0 ? `₹${service.price}` : 'Get Quote'}
                      oldPrice={
                        service.mrp && service.mrp > service.price
                          ? `₹${service.mrp}`
                          : undefined
                      }
                      rating={service.rating}
                      users={String(service.review_count ?? 0)}
                      coins={service.coins ? String(service.coins) : ''}
                      discount={getDiscount(service, defaultDiscount)}
                      onPress={() => handleServicePress(service)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}

      {pages.length > 1 && containerWidth > 0 && (
        <View style={styles.dotContainer}>
          {pages.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: dotColor },
                i === activePage && [styles.activeDot, { backgroundColor: activeDotColor }],
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  page: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
});
