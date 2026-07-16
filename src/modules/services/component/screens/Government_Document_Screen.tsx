import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  FlatList,
  View,
  StyleSheet,
  Text,
  ListRenderItem,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Banner from '../constant/Banner';
import CategoryCard from '../constant/CategoryCard';
import NeedHelpBanner from '../government/NeedHelpBanner';
import SkeletonBox from '../constant/SkeletonBox';

import { HomeStackParamList } from '../../navigation/type';
import { getServiceImageUrl } from '../../utils/serviceImage';
import { useCategoryServices } from '../../hooks/useCategoryServices';
import { getCachedService, prefetchServiceDetails } from '../../utils/serviceCache';
import type { CategoryServiceItem } from '../../services/categoryServices';
import CartHead from '../constant/navbar/CartHead';

type RouteProps = RouteProp<
  HomeStackParamList,
  'Government_Document_Screen'
>;

function GovernmentDocumentSkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 750,
          useNativeDriver: false,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View>
      {[1, 2, 3].map(index => (
        <View key={'gov-skeleton-' + index} style={styles.skeletonCard}>
          <SkeletonBox
            pulse={pulse}
            width={112}
            height={112}
            borderRadius={12}
            style={styles.skeletonImage}
          />

          <View style={styles.skeletonContent}>
            <SkeletonBox pulse={pulse} width="72%" height={18} style={styles.skeletonTitle} />
            <SkeletonBox pulse={pulse} width="92%" height={14} style={styles.skeletonLine} />
            <SkeletonBox pulse={pulse} width="70%" height={14} style={styles.skeletonLine} />

            <View style={styles.skeletonMetaRow}>
              <SkeletonBox pulse={pulse} width={90} height={14} />
              <SkeletonBox pulse={pulse} width={76} height={14} />
            </View>

            <SkeletonBox pulse={pulse} width="100%" height={40} borderRadius={10} style={styles.skeletonButton} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function Government_Document_Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProps>();
  const categoryId = Number(route?.params?.categoryId || 0);
  const hasNavigatedRef = useRef(false);
  const effectRunsRef = useRef(0);

  const {
    services,
    loading,
    error,
    directServiceId,
    directTitle,
  } = useCategoryServices(categoryId);

  useEffect(() => {
    effectRunsRef.current += 1;
    console.log(
      '[Government_Document_Screen] direct nav effect run #',
      effectRunsRef.current,
      '| directServiceId:',
      directServiceId,
    );

    if (!directServiceId || directServiceId <= 0) return;
    if (hasNavigatedRef.current) {
      console.log('[Government_Document_Screen] navigation skipped (already navigated once).');
      return;
    }

    hasNavigatedRef.current = true;

    const cached = getCachedService(directServiceId) ?? undefined;
    console.log(
      '[Government_Document_Screen] navigating to ServiceDescription for service',
      directServiceId,
      '| seededFromCache:',
      !!cached,
    );

    navigation.navigate('ServiceDescription', {
      serviceId: directServiceId,
      categoryId,
      title: directTitle,
      serviceData: cached,
    });

    prefetchServiceDetails(directServiceId).then((prefetched) => {
      console.log(
        '[Government_Document_Screen] prefetch finished for',
        directServiceId,
        '| hasData:',
        !!prefetched,
      );
    });
  }, [categoryId, directServiceId, directTitle, navigation]);

  const keyExtractor = useCallback((item: CategoryServiceItem, index: number) => {
    const id = Number(item?.id || 0);
    return String(id > 0 ? id : index);
  }, []);

  const renderServiceCard = useCallback<ListRenderItem<CategoryServiceItem>>(({ item }) => {
    return (
      <View style={styles.categoryItem}>
        <CategoryCard
          serviceId={item.id}
          title={item.name}
          description={item.description}
          image={getServiceImageUrl(item.service_image, 'small')}
          priceText={`₹${item.price}`}
          days={`${item.estimated_days} Days`}
        />
      </View>
    );
  }, []);

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return (
      <View style={styles.root}>
        <View style={styles.centeredState}>
          <Text style={styles.stateText}>Unable to open this category.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CartHead />

      {loading ? (
        <View style={styles.scrollContent}>
          <Banner />
          <View style={styles.categoryContainer}>
            <GovernmentDocumentSkeleton />
          </View>
          <NeedHelpBanner />
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          key={categoryId}
          data={services}
          renderItem={renderServiceCard}
          keyExtractor={keyExtractor}
          initialNumToRender={5}
          windowSize={7}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <>
              <Banner />
            </>
          }
          ListFooterComponent={<NeedHelpBanner />}
          ListEmptyComponent={
            <View style={styles.centeredState}>
              <Text style={styles.stateText}>No services found in this category.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  categoryContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECECF4',
    overflow: 'hidden',
  },
  skeletonImage: {
    flexShrink: 0,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  skeletonTitle: {
    marginTop: 4,
  },
  skeletonLine: {
    marginTop: 8,
  },
  skeletonMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  skeletonButton: {
    marginTop: 14,
  },
});

