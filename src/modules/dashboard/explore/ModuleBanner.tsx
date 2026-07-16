import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { rs } from '../../../utils/responsive';
import { useAppTheme } from '../../../theme/ThemeContext';
import { getCampaignHome } from '../../../modules/ecommerce/api/CampaignAPI';

export default function ModuleBanner() {
  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  const bannerHeight = Math.round(width * 0.38);

  const { data: campaignHome } = useQuery({
    queryKey: ['ecommerce', 'home', 'campaign-home'],
    queryFn: getCampaignHome,
    staleTime: 10 * 60 * 1000,
  });

  const banners = useMemo(
    () => campaignHome?.data?.dashboard_posters ?? [],
    [campaignHome],
  );

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      indexRef.current = next;
      setIndex(next);
    }, 3000);
    return () => clearInterval(timer);
  }, [width, banners.length]);

  const t = useMemo(
    () => ({
      dot:       { backgroundColor: isDark ? '#374151' : '#D0D5E2' } as ViewStyle,
      activeDot: { backgroundColor: '#4A6CF7' } as ViewStyle,
    }),
    [isDark],
  );

  if (banners.length === 0) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={width}
        onMomentumScrollEnd={e => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
          indexRef.current = newIndex;
        }}
      >
        {banners.map((banner) => (
          <View key={banner.campaign_id} style={[styles.banner, { width }]}>
            <Image
              source={{ uri: banner.banner_image }}
              style={[styles.bannerImage, { height: bannerHeight }]}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {banners.map((banner, i) => (
          <View
            key={banner.campaign_id}
            style={[
              styles.dot,
              t.dot,
              i === index && styles.activeDot,
              i === index && t.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: rs(16),
    marginTop: rs(12),
  },

  bannerImage: {
    width: '100%',
    borderRadius: rs(18),
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(10),
    gap: rs(6),
  },

  dot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
  },

  activeDot: {
    width: rs(18),
    height: rs(6),
    borderRadius: rs(4),
  },
});
