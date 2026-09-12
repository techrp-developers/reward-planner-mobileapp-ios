import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { rs, fs } from '../../../utils/responsive';
import { useAppTheme } from '../../../theme/ThemeContext';
import { useModuleIcons } from '../../../navbar/hooks/useModuleIcons';
import { TOP_TAB_BY_MODULE, type CmsModuleKey } from '../../common/cms/moduleMapping';
import type { CmsModule } from '../../common/cms/cmsContentApi';

import ProductIcon from '../../../assets/sampleImages/Product.svg';
import ServiceIcon from '../../../assets/sampleImages/Service.svg';
import PaymentIcon from '../../../assets/sampleImages/Payment.svg';
import DineOutIcon from '../../../assets/sampleImages/DineOut.svg';

export type ExploreServiceTab = 'Product' | 'Services' | 'Payments' | 'DineOut';
type TopTab = ExploreServiceTab;

type ServicesModuleProps = {
  onModulePress?: (tab: ExploreServiceTab) => void;
};

// Purpose-built transparent icon glyphs — unlike the bundled Categories(N).png
// tile photos these replaced, these have no baked-in white canvas, so a
// module without a published dashboard/nav icon yet still renders cleanly.
const FALLBACK_ICON_BY_TAB: Record<TopTab, React.ComponentType<{ width: number; height: number }>> = {
  Product: ProductIcon,
  Services: ServiceIcon,
  Payments: PaymentIcon,
  DineOut: DineOutIcon,
};

const TAB_TO_MODULE: Record<TopTab, { screen: string; moduleName: TopTab }> = {
  Product: { screen: 'ProductModule', moduleName: 'Product' },
  Services: { screen: 'ServicesModule', moduleName: 'Services' },
  Payments: { screen: 'PaymentsModule', moduleName: 'Payments' },
  DineOut: { screen: 'DineOutModule', moduleName: 'DineOut' },
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CARD_H_PADDING = rs(16);
const CARD_GAP = rs(10);
const VISIBLE_CARD_COUNT = 4;
// Icon container / icon / radius stay proportional to the card width so
// they scale together instead of the icon looking small inside a bigger card.
const ICON_CONTAINER_RATIO = 52 / 68;
const ICON_RATIO = 40 / 68;
const ICON_RADIUS_RATIO = 15 / 52;

type ServiceCardProps = {
  tab: TopTab | null;
  label: string;
  iconUrl: string | null;
  cardWidth: number;
  iconContainerSize: number;
  iconRadius: number;
  iconSize: number;
  onPress: () => void;
};

const ServiceCard = React.memo(
  ({ tab, label, iconUrl, cardWidth, iconContainerSize, iconRadius, iconSize, onPress }: ServiceCardProps) => {
    const { isDark } = useAppTheme();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
    }, [scale]);

    const t = useMemo(
      () => ({
        cardLabel: { color: isDark ? '#E5E7EB' : '#374151' } as TextStyle,
      }),
      [isDark],
    );

    const FallbackIcon = tab ? FALLBACK_ICON_BY_TAB[tab] : null;

    return (
      <AnimatedTouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { width: cardWidth, transform: [{ scale }] }]}
      >
        <View
          style={[
            styles.iconContainer,
            { width: iconContainerSize, height: iconContainerSize, borderRadius: iconRadius },
          ]}
        >
          {iconUrl ? (
            <Image source={{ uri: iconUrl }} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
          ) : FallbackIcon ? (
            <FallbackIcon width={iconSize} height={iconSize} />
          ) : null}
        </View>
        <Text
          style={[styles.cardLabel, t.cardLabel, { maxWidth: cardWidth }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </AnimatedTouchableOpacity>
    );
  },
);
ServiceCard.displayName = 'ServiceCard';

function ServicesModule({ onModulePress }: ServicesModuleProps) {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { modules } = useModuleIcons();
  const isNavigatingRef = useRef(false);
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Size cards so exactly VISIBLE_CARD_COUNT fill the row width — previously
  // a fixed rs(68) card left the 4th module cut off/cramped on most screens.
  const cardWidth = useMemo(
    () =>
      Math.floor(
        (width - CARD_H_PADDING * 2 - CARD_GAP * (VISIBLE_CARD_COUNT - 1)) / VISIBLE_CARD_COUNT,
      ),
    [width],
  );
  const iconContainerSize = Math.round(cardWidth * ICON_CONTAINER_RATIO);
  const iconRadius = Math.round(iconContainerSize * ICON_RADIUS_RATIO);
  const iconSize = Math.round(cardWidth * ICON_RATIO);

  const t = useMemo(
    () => ({
      wrapper: { backgroundColor: 'transparent' } as ViewStyle,
      headerTitle: { color: isDark ? '#FFFFFF' : '#0F172A' } as TextStyle,
    }),
    [isDark],
  );

  const navigateToModule = useCallback(
    (tab: TopTab | null, module: CmsModule) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;

      if (tab) {
        const target = TAB_TO_MODULE[tab];
        if (onModulePress) {
          onModulePress(tab);
        } else {
          navigation.navigate('Home', {
            screen: target.screen,
            params: { moduleName: target.moduleName },
            moduleName: target.moduleName,
          });
        }
      } else if (module.route_key) {
        // A module the 4 known bottom tabs don't cover — navigate generically
        // by its CMS route_key, same fallback Navbar.tsx uses.
        navigation.navigate('Home', {
          screen: module.route_key,
          params: { moduleName: module.module_key },
          moduleName: module.module_key,
        });
      }

      navigationUnlockTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
        navigationUnlockTimerRef.current = null;
      }, 1000);
    },
    [navigation, onModulePress],
  );

  useEffect(
    () => () => {
      if (navigationUnlockTimerRef.current) {
        clearTimeout(navigationUnlockTimerRef.current);
      }
    },
    [],
  );

  const handleViewAll = useCallback(() => {
    navigation.navigate('ExploreModule');
  }, [navigation]);

  return (
    <View style={[styles.wrapper, t.wrapper]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, t.headerTitle]}>
          Explore Services
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleViewAll}
        >
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
      >
        {modules.map((module) => {
          const tab = TOP_TAB_BY_MODULE[module.module_key as CmsModuleKey] ?? null;
          const iconUrl = module.dashboard_icon_url || module.icon_url || null;

          return (
            <ServiceCard
              key={module.module_key}
              tab={tab}
              cardWidth={cardWidth}
              iconContainerSize={iconContainerSize}
              iconRadius={iconRadius}
              iconSize={iconSize}
              label={module.label}
              iconUrl={iconUrl}
              onPress={() => navigateToModule(tab, module)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default React.memo(ServicesModule);

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: rs(14),
    paddingBottom: rs(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    marginBottom: rs(10),
  },
  headerTitle: {
    fontSize: fs(17),
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  viewAll: {
    fontSize: fs(12.5),
    fontWeight: '600',
    color: '#4A6CF7',
  },
  scrollContainer: {
    paddingHorizontal: CARD_H_PADDING,
    gap: CARD_GAP,
    alignItems: 'flex-start',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    marginTop: rs(6),
    fontSize: fs(10.5),
    fontWeight: '600',
    textAlign: 'center',
  },
});
