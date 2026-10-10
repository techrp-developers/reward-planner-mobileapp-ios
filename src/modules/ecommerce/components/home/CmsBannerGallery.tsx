import React from 'react';
import { Image, View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { CmsOffersBannerEntry } from '../../../common/cms/cmsContentApi';
import { normalizeLocalCmsImageUrl } from '../../../../config/apiConfig';

// Reuse metadata across slides, remounts and device rotations.
const ratios = new Map<string, number>();
const pending = new Map<string, Promise<number | null>>();
function measure(uri: string) {
  if (ratios.has(uri)) return Promise.resolve(ratios.get(uri)!);
  if (pending.has(uri)) return pending.get(uri)!;
  const request = new Promise<number | null>(resolve => {
    Image.getSize(uri, (width, height) => {
      const ratio = width > 0 && height > 0 && Number.isFinite(width / height) ? width / height : null;
      if (ratio) ratios.set(uri, ratio);
      resolve(ratio);
    }, () => resolve(null));
  }).finally(() => pending.delete(uri));
  pending.set(uri, request);
  return request;
}

type Props = {
  banner?: CmsOffersBannerEntry | null;
  fallbackRatio: number;
  inset?: number;
  visibleItems?: number;
  onPress?: () => void;
};

export default function CmsBannerGallery({ banner, fallbackRatio, inset = 0, visibleItems = 1, onPress }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = React.useState<number | null>(null);
  const [page, setPage] = React.useState(0);
  const [visiblePages, setVisiblePages] = React.useState<[number, number]>([0, 0]);
  const [, updateRatios] = React.useReducer(value => value + 1, 0);
  const [failed, setFailed] = React.useState<Record<string, boolean>>({});
  const scroller = React.useRef<ScrollView>(null);
  const width = measuredWidth ?? Math.max(0, screenWidth - inset * 2);
  const images = React.useMemo(() => {
    const gallery = banner?.images?.length ? banner.images.filter(image => Number(image.is_active) === 1)
      : banner?.image_url ? [{ image_id: 0, image_url: banner.image_url, sort_order: 0, is_active: 1 }] : [];
    return gallery.slice().sort((a, b) => a.sort_order - b.sort_order)
      .map(image => ({ ...image, image_url: normalizeLocalCmsImageUrl(image.image_url) || '' }))
      .filter(image => image.image_url);
  }, [banner]);
  const mode = banner?.display_mode || 'carousel';
  const itemsPerView = mode === 'carousel' ? Math.min(Math.max(visibleItems, 1), Math.max(1, images.length - 0.5)) : 1;
  const gap = itemsPerView > 1 ? 8 : 0;
  const slideWidth = Math.max(0, (width - Math.ceil(itemsPerView - 1) * gap) / itemsPerView);
  const slideInterval = slideWidth + gap;
  const visibleRange = (offset: number): [number, number] => [
    Math.max(0, Math.min(images.length - 1, Math.floor(offset / slideInterval))),
    Math.max(0, Math.min(images.length - 1, Math.ceil((offset + width) / slideInterval) - 1)),
  ];
  const identity = `${banner?.content_id}-${banner?.display_mode}-${visibleItems}-${images.map(image => image.image_url).join('|')}`;
  React.useEffect(() => {
    let active = true;
    Promise.all(images.map(image => measure(image.image_url))).then(() => { if (active) updateRatios(); });
    return () => { active = false; };
  }, [images]);
  React.useEffect(() => { setPage(0); setVisiblePages([0, 0]); setFailed({}); scroller.current?.scrollTo({ x: 0, animated: false }); }, [identity]);
  React.useEffect(() => {
    scroller.current?.scrollTo({ x: page * slideInterval, animated: false });
    const [first, last] = visibleRange(page * slideInterval);
    setVisiblePages(previous => previous[0] === first && previous[1] === last ? previous : [first, last]);
  }, [width, slideInterval, page, images.length, identity]);
  // Metadata causes one update after it arrives; loading image bytes does
  // not subsequently change layout. Cold, unknown dimensions use the zone ratio.
  if (!banner) return null;
  const ratioFor = (uri: string) => ratios.get(uri) || fallbackRatio;
  const tile = (image: typeof images[number], tileWidth: number) => (
    <TouchableOpacity key={`${image.image_id}-${image.image_url}`} disabled={!onPress} onPress={onPress}
      accessibilityLabel={banner.title} style={{ width: tileWidth, aspectRatio: ratioFor(image.image_url) }}>
      {!failed[image.image_url] && <Image source={{ uri: image.image_url }} resizeMode="contain" style={StyleSheet.absoluteFill}
        onError={() => setFailed(previous => ({ ...previous, [image.image_url]: true }))} />}
    </TouchableOpacity>
  );
  let body: React.ReactNode;
  if (banner.content_type === 'color') {
    let gradient: { colors: string[]; direction?: string } | null = null;
    try { const value = JSON.parse(banner.color_value || ''); if (Array.isArray(value.colors) && value.colors.length >= 2) gradient = value; } catch { /* Plain colors are valid. */ }
    const directions: Record<string, [{ x: number; y: number }, { x: number; y: number }]> = {
      'left-right': [{x:0,y:0},{x:1,y:0}], 'right-left': [{x:1,y:0},{x:0,y:0}],
      'top-bottom': [{x:0,y:0},{x:0,y:1}], 'bottom-top': [{x:0,y:1},{x:0,y:0}],
      'top-left-bottom-right': [{x:0,y:0},{x:1,y:1}], 'bottom-left-top-right': [{x:0,y:1},{x:1,y:0}],
    };
    const points = directions[gradient?.direction || 'left-right'] || directions['left-right'];
    const label = <><Text style={{ color: banner.text_color || '#FFFFFF', fontWeight: '700' }}>{banner.title}</Text>
      {!!banner.cta_text && <Text style={{ color: banner.text_color || '#FFFFFF' }}>{banner.cta_text}</Text>}</>;
    const box = { width, aspectRatio: fallbackRatio, padding: 20, justifyContent: 'center' as const };
    body = <TouchableOpacity disabled={!onPress} onPress={onPress}>{gradient
      ? <LinearGradient colors={gradient.colors} start={points[0]} end={points[1]} style={box}>{label}</LinearGradient>
      : <View style={[box, { backgroundColor: banner.color_value || '#852BAF' }]}>{label}</View>}</TouchableOpacity>;
  } else {
    if (!images.length) return null;
    if (mode === 'single') body = tile(images[0], width);
    else if (mode === 'grid_2' || mode === 'grid_3') {
      const columns = mode === 'grid_2' ? 2 : 3;
      body = <View style={styles.grid}>{images.map(image => tile(image, (width - (columns - 1) * 8) / columns))}</View>;
    } else {
      const currentPage = Math.min(page, images.length - 1);
      const firstVisible = Math.min(visiblePages[0], images.length - 1);
      const lastVisible = Math.min(visiblePages[1], images.length - 1);
      const settle = (offset: number) => {
        const next = Math.max(0, Math.min(images.length - 1, Math.round(offset / slideInterval)));
        setPage(next);
        setVisiblePages(visibleRange(offset));
      };
      body = <><ScrollView ref={scroller} horizontal pagingEnabled={itemsPerView === 1}
        snapToInterval={itemsPerView > 1 ? slideInterval : undefined}
        decelerationRate={itemsPerView > 1 ? 'fast' : 'normal'}
        showsHorizontalScrollIndicator={false}
        style={{ height: Math.max(...images.slice(firstVisible, lastVisible + 1).map(image => slideWidth / ratioFor(image.image_url))) }}
        contentContainerStyle={[styles.slides, { gap, paddingRight: Math.max(0, width - slideWidth) }]}
        scrollEventThrottle={16}
        onScroll={event => {
          const [first, last] = visibleRange(event.nativeEvent.contentOffset.x);
          setVisiblePages(previous => previous[0] === first && previous[1] === last ? previous : [first, last]);
        }}
        onScrollEndDrag={event => { if (!event.nativeEvent.velocity?.x) settle(event.nativeEvent.contentOffset.x); }}
        onMomentumScrollEnd={event => settle(event.nativeEvent.contentOffset.x)}>
        {images.map(image => tile(image, slideWidth))}
      </ScrollView>{images.length > 1 && <View style={styles.dots}>{images.map((image, index) =>
        <View key={`${image.image_id}-${index}`} style={[styles.dot, { opacity: index === currentPage ? 1 : 0.3 }]} />)}</View>}</>;
    }
  }
  return <View style={{ paddingHorizontal: inset }}><View onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}>{body}</View></View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' },
  slides: { alignItems: 'flex-start' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#852BAF' },
});
