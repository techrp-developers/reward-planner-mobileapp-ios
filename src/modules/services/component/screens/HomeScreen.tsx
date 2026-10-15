import React, { useCallback, useRef, useState } from 'react';
import { FlatList, InteractionManager, Platform, StyleSheet, View, ViewToken } from 'react-native';

import Banner from '../constant/Banner';
import ServicesHome from '../home/ServicesHome';
import BannerSliderManual from '../home/BannerSliderManual';
import MostBookedServices from '../home/MostBookedServices';
import QuickServices from '../home/QuickServices';
import BundleService from '../home/BundleService';
import ExclusiveOffers from '../home/ExclusiveOffers';
import { useServicesTheme } from '../../utils/useServicesTheme';
import PromotionalBanner from '../../../ecommerce/components/home/PromotionalBanner';
import CmsOffersBanner from '../../../ecommerce/components/home/CmsOffersBanner';
import BrandPromotionalBanner from '../../../ecommerce/components/home/BrandPromotionalBanner';

type ServiceSectionKey =
  | 'banner'
  | 'services'
  | 'cmsOffers'
  | 'slider'
  | 'mostBooked'
  | 'quickServices'
  | 'exclusiveOffers'
  | 'bundles'
  | 'brandBanner';

const SERVICE_SECTIONS: Array<{ key: ServiceSectionKey }> = [
  { key: 'banner' },
  { key: 'services' },
  { key: 'cmsOffers' },
  { key: 'slider' },
  { key: 'mostBooked' },
  { key: 'brandBanner' },
  { key: 'quickServices' },
  { key: 'exclusiveOffers' },
  { key: 'bundles' },
];

const INITIAL_SERVICE_SECTIONS = new Set<ServiceSectionKey>(['banner', 'services', 'cmsOffers', 'slider']);

const ServiceSection = React.memo(({
  sectionKey,
  isReady,
}: {
  sectionKey: ServiceSectionKey;
  isReady: boolean;
}) => {
  if (!isReady) return <View style={styles.sectionPlaceholder} />;

  switch (sectionKey) {
    case 'banner': return <Banner />;
    case 'services': return <ServicesHome />;
    case 'cmsOffers': return <CmsOffersBanner module="service" style={styles.cmsBanner} />;
    case 'slider': return <BannerSliderManual />;
    case 'mostBooked': return <MostBookedServices />;
    case 'quickServices': return <QuickServices />;
    case 'exclusiveOffers': return <ExclusiveOffers />;
    case 'bundles': return <BundleService />;
    case 'brandBanner': return <BrandPromotionalBanner module="service" style={styles.cmsBanner} />;
    default: return null;
  }
});

ServiceSection.displayName = 'ServiceHomeSection';

function HomeScreen() {
  const { colors } = useServicesTheme();
  const readySectionsRef = useRef<Set<ServiceSectionKey>>(new Set(INITIAL_SERVICE_SECTIONS));
  const [readySections, setReadySections] = useState<Set<ServiceSectionKey>>(
    () => new Set(readySectionsRef.current),
  );
  const pendingReadySections = useRef<Set<ServiceSectionKey>>(new Set(readySectionsRef.current));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const nextKeys = viewableItems
        .map((entry) => (entry.item as { key: ServiceSectionKey } | undefined)?.key)
        .filter((key): key is ServiceSectionKey => Boolean(key));

      const keysToAdd = nextKeys.filter((key) => !pendingReadySections.current.has(key));
      if (keysToAdd.length === 0) return;

      keysToAdd.forEach((key) => {
        pendingReadySections.current.add(key);
        readySectionsRef.current.add(key);
      });

      InteractionManager.runAfterInteractions(() => {
        setReadySections((previous) => {
          const next = new Set(previous);
          keysToAdd.forEach((key) => next.add(key));
          return next;
        });
      });
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 8,
    minimumViewTime: 80,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: { key: ServiceSectionKey } }) => (
      <ServiceSection sectionKey={item.key} isReady={readySections.has(item.key)} />
    ),
    [readySections],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={SERVICE_SECTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          <>
            <PromotionalBanner module="service" />
            <View style={styles.headerSpacer} />
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={32}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
}

export default React.memo(HomeScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  headerSpacer: {
    height: 15,
  },
  listContent: {
    paddingBottom: 32,
  },
  cmsBanner: {
    marginVertical: 8,
  },
  sectionPlaceholder: {
    minHeight: 180,
  },
});
