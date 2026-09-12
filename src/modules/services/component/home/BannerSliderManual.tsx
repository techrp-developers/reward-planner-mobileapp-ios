import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { HomeStackParamList, type BannerItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card width ensures the next card peeks in
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const SPACING = 12;
const SNAP_OFFSET = CARD_WIDTH + SPACING;

export default function BannerSliderManual() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { data: homeData, isLoading, error } = useServiceHome();
  const [activeIndex, setActiveIndex] = useState(0);

  // Extract home_banners section
  const banners = useMemo(() => {
    if (!homeData?.data || !Array.isArray(homeData.data)) return [];
    
    const bannerSection = homeData.data.find(
      (section) => section.section_key === 'home_banners'
    );
    
    return (bannerSection?.items || []) as BannerItem[];
  }, [homeData]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / SNAP_OFFSET);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (banner: BannerItem) => {
    const { redirect_type, redirect_id, redirect_url } = banner;

    if (redirect_type === 'service' && redirect_id) {
      navigation.navigate('ServiceDescription', {
        serviceId: redirect_id,
        title: banner.title,
      });
    } else if (redirect_type === 'category' && redirect_id) {
      navigation.navigate('Government_Document_Screen', {
        categoryId: redirect_id,
      });
    } else if (redirect_type === 'bundle' && redirect_id) {
      navigation.navigate('PackScreen', {
        bundleId: redirect_id,
        title: banner.title,
      });
    } else if (redirect_type === 'url' && redirect_url) {
      // Handle external URL if needed (e.g., WebView navigation)
      __DEV__ && console.log('Opening URL:', redirect_url);
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8665FF" />
      </View>
    );
  }

  // Handle error state
  if (error) {
    console.error('BannerSlider Error:', error);
    return null;
  }

  // Handle empty state
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_OFFSET}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.banner_id}
            style={styles.slide}
            activeOpacity={0.85}
            onPress={() => handleBannerPress(banner)}
          >
            <Image
              source={{ uri: banner.image_url }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* DOT INDICATOR */}
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i ? styles.activeDot : styles.inactiveDot,
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
    marginTop: 16,
  },
  loadingContainer: {
    marginTop: 16,
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  slide: {
    width: CARD_WIDTH,
    marginRight: SPACING,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerImage: {
    width: CARD_WIDTH,
    height: 180,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  inactiveDot: {
    width: 15, 
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    width: 50,
    backgroundColor: '#374151',
  },
});