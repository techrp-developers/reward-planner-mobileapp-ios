import React from 'react';
import {
  FlatList,
  Image,
  ImageResizeMode,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { queryClient } from '../../../../query/queryClient';
import { fetchResolvedZones } from '../../../common/cms/cmsContentApi';
import type { CmsModuleKey, CmsResolvedZones } from '../../../common/cms/cmsContentApi';
import { useModuleContent, moduleContentQueryKey } from '../../../common/cms/useModuleContent';

const AUTOPLAY_MS = 3500;
const OFFER_ASPECT_RATIO = 4 / 5;

type OfferSlide = {
  id: string;
  imageUrl: string;
};

type Props = {
  module?: CmsModuleKey;
  aspectRatio?: number;
  resizeMode?: ImageResizeMode;
  moduleContent?: CmsResolvedZones | null;
  wrapperStyle?: StyleProp<ViewStyle>;
};

function OffersBanner({
  module = 'product',
  aspectRatio = OFFER_ASPECT_RATIO,
  resizeMode = 'contain',
  moduleContent: controlledModuleContent,
  wrapperStyle,
}: Props) {
  const { width } = useWindowDimensions();
  const { moduleContent: fetchedModuleContent } = useModuleContent(module);
  const moduleContent = controlledModuleContent ?? fetchedModuleContent;
  const banner = moduleContent?.offers_banner ?? null;
  const listRef = React.useRef<FlatList<OfferSlide>>(null);
  const pauseCyclesRef = React.useRef(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({});

  const itemWidth = width - 32;
  const slides = React.useMemo<OfferSlide[]>(() => {
    if (banner?.content_type !== 'image') {
      return [];
    }

    const images = Array.isArray(banner.images) ? banner.images : [];

    return images
      .filter((image) => image.is_active === 1)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: String(image.image_id),
        imageUrl: image.image_url,
      }))
      .filter((slide) => slide.imageUrl && !failedImages[slide.id]);
  }, [banner, failedImages]);

  React.useEffect(() => {
    setActiveIndex(0);
    setFailedImages({});
  }, [banner?.content_id]);

  React.useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (pauseCyclesRef.current > 0) {
        pauseCyclesRef.current -= 1;
        return;
      }

      const nextIndex = (activeIndex + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, AUTOPLAY_MS);

    return () => clearInterval(interval);
  }, [activeIndex, slides.length]);

  React.useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(Math.max(slides.length - 1, 0));
    }
  }, [activeIndex, slides.length]);

  if (!banner) {
    return null;
  }

  const showColorFallback =
    slides.length === 0 &&
    banner.content_type === 'color' &&
    Boolean(banner.color_value);

  if (!slides.length && !showColorFallback) {
    return null;
  }

  const handlePress = () => {
    if (banner.redirect_link) {
      Linking.openURL(banner.redirect_link).catch(() => undefined);
    }
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1));
  };

  if (showColorFallback) {
    return (
      <View style={[styles.wrapper, wrapperStyle]}>
        <TouchableOpacity
          activeOpacity={banner.redirect_link ? 0.9 : 1}
          disabled={!banner.redirect_link}
          onPress={handlePress}
          style={[
            styles.colorFallback,
            {
              width: itemWidth,
              aspectRatio,
              backgroundColor: banner.color_value as string,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => {
          pauseCyclesRef.current = 1;
        }}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={banner.redirect_link ? 0.9 : 1}
            disabled={!banner.redirect_link}
            onPress={handlePress}
            style={[styles.slide, { width: itemWidth, aspectRatio }]}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={resizeMode}
              onError={() => {
                setFailedImages((current) => ({
                  ...current,
                  [item.id]: true,
                }));
              }}
            />
          </TouchableOpacity>
        )}
      />

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex ? styles.dotActive : null]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default React.memo(OffersBanner);

export const prefetchOffersBanner = (module: CmsModuleKey = 'product') =>
  queryClient.prefetchQuery({
    queryKey: moduleContentQueryKey(module),
    queryFn: () => fetchResolvedZones(module),
    staleTime: 5 * 60 * 1000,
  });

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  slide: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  colorFallback: {
    borderRadius: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.65)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#111827',
  },
});
