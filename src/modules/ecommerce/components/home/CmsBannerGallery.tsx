import React from 'react';
import { Image, View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { CmsOffersBannerEntry } from '../../../common/cms/cmsContentApi';
import { normalizeLocalCmsImageUrl } from '../../../../config/apiConfig';
import { parseCmsColor, cmsSolidColor } from '../../../common/cms/cmsColor';

const AUTOPLAY_MS = 3500;
// Programmatic animated scrolls do not reliably fire momentum events, so the
// autoplay settles itself once the slide animation has finished.
const SLIDE_ANIMATION_MS = 500;

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
  // Ignore the CMS display_mode: several images become an auto-sliding
  // carousel and a single image is shown on its own.
  slider?: boolean;
  // How long each slide stays before the carousel advances.
  autoplayMs?: number;
  // Applied only when the banner renders, so an empty zone leaves no gap.
  style?: StyleProp<ViewStyle>;
};

export default function CmsBannerGallery({
  banner, fallbackRatio, inset = 0, visibleItems = 1, onPress, slider = false, autoplayMs = AUTOPLAY_MS, style,
}: Props) {
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
  const mode = slider ? (images.length > 1 ? 'carousel' : 'single') : banner?.display_mode || 'carousel';
  const itemsPerView = mode === 'carousel' ? Math.min(Math.max(visibleItems, 1), Math.max(1, images.length - 0.5)) : 1;
  const gap = itemsPerView > 1 ? 8 : 0;
  const slideWidth = Math.max(0, (width - Math.ceil(itemsPerView - 1) * gap) / itemsPerView);
  const slideInterval = slideWidth + gap;
  const count = images.length;
  // Carousels loop forever: the strip holds three copies of the images, always
  // rests in the middle copy, and silently re-centres after entering either
  // neighbour, so sliding past the last image continues with the first.
  const loop = mode === 'carousel' && count > 1;
  const home = loop ? count : 0;
  const slides = React.useMemo(
    () => (loop ? [0, 1, 2] : [0]).flatMap(copy => images.map(image => ({ ...image, copy }))),
    [images, loop],
  );
  const position = React.useRef(home);
  const dragging = React.useRef(false);
  const [cycle, nextCycle] = React.useReducer(value => value + 1, 0);
  const visibleRange = (offset: number): [number, number] => [
    Math.max(0, Math.min(slides.length - 1, Math.floor(offset / slideInterval))),
    Math.max(0, Math.min(slides.length - 1, Math.ceil((offset + width) / slideInterval) - 1)),
  ];
  const showRange = (offset: number) => {
    const [first, last] = visibleRange(offset);
    setVisiblePages(previous => previous[0] === first && previous[1] === last ? previous : [first, last]);
  };
  const settleAt = (index: number) => {
    let next = Math.max(0, Math.min(slides.length - 1, index));
    if (loop && (next < count || next >= count * 2)) {
      next = count + (next % count);
      scroller.current?.scrollTo({ x: next * slideInterval, animated: false });
    }
    position.current = next;
    setPage(next % Math.max(count, 1));
    showRange(next * slideInterval);
    nextCycle();
  };
  const identity = `${banner?.content_id}-${mode}-${visibleItems}-${images.map(image => image.image_url).join('|')}`;
  React.useEffect(() => {
    let active = true;
    Promise.all(images.map(image => measure(image.image_url))).then(() => { if (active) updateRatios(); });
    return () => { active = false; };
  }, [images]);
  React.useEffect(() => { setPage(0); setFailed({}); position.current = home; }, [identity]);
  // Keep the resting slide aligned whenever the layout or banner changes.
  React.useEffect(() => {
    scroller.current?.scrollTo({ x: position.current * slideInterval, animated: false });
    showRange(position.current * slideInterval);
  }, [width, slideInterval, identity]);
  // Each settle bumps `cycle`, restarting the countdown, so autoplay waits a
  // full interval after the user lets go before moving again.
  React.useEffect(() => {
    if (!loop || slideInterval <= 0) return undefined;
    let landing: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      if (dragging.current) return;
      const next = position.current + 1;
      scroller.current?.scrollTo({ x: next * slideInterval, animated: true });
      landing = setTimeout(() => settleAt(next), SLIDE_ANIMATION_MS);
    }, autoplayMs);
    return () => { clearTimeout(timer); clearTimeout(landing); };
  }, [cycle, loop, slideInterval, identity, autoplayMs]);
  // Metadata causes one update after it arrives; loading image bytes does
  // not subsequently change layout. Cold, unknown dimensions use the zone ratio.
  if (!banner) return null;
  const ratioFor = (uri: string) => ratios.get(uri) || fallbackRatio;
  const tile = (image: typeof images[number], tileWidth: number, copy = 0) => (
    <TouchableOpacity key={`${copy}-${image.image_id}-${image.image_url}`} disabled={!onPress} onPress={onPress}
      accessibilityLabel={banner.title} style={{ width: tileWidth, aspectRatio: ratioFor(image.image_url) }}>
      {!failed[image.image_url] && <Image source={{ uri: image.image_url }} resizeMode="contain" style={StyleSheet.absoluteFill}
        onError={() => setFailed(previous => ({ ...previous, [image.image_url]: true }))} />}
    </TouchableOpacity>
  );
  let body: React.ReactNode;
  if (banner.content_type === 'color') {
    const fill = parseCmsColor(banner.color_value);
    const gradient = fill?.isGradient ? fill : null;
    const textColor = cmsSolidColor(banner.text_color) || '#FFFFFF';
    const label = <><Text style={{ color: textColor, fontWeight: '700' }}>{banner.title}</Text>
      {!!banner.cta_text && <Text style={{ color: textColor }}>{banner.cta_text}</Text>}</>;
    const box = { width, aspectRatio: fallbackRatio, padding: 20, justifyContent: 'center' as const };
    body = <TouchableOpacity disabled={!onPress} onPress={onPress}>{gradient
      ? <LinearGradient colors={gradient.colors} start={gradient.start} end={gradient.end} style={box}>{label}</LinearGradient>
      : <View style={[box, { backgroundColor: fill?.colors[0] || '#852BAF' }]}>{label}</View>}</TouchableOpacity>;
  } else {
    if (!images.length) return null;
    if (mode === 'single') body = tile(images[0], width);
    else if (mode === 'grid_2' || mode === 'grid_3') {
      const columns = mode === 'grid_2' ? 2 : 3;
      body = <View style={styles.grid}>{images.map(image => tile(image, (width - (columns - 1) * 8) / columns))}</View>;
    } else {
      const currentPage = Math.min(page, count - 1);
      const firstVisible = Math.min(visiblePages[0], slides.length - 1);
      const lastVisible = Math.min(visiblePages[1], slides.length - 1);
      const settle = (offset: number) => settleAt(Math.round(offset / slideInterval));
      body = <><ScrollView ref={scroller} horizontal pagingEnabled={itemsPerView === 1}
        snapToInterval={itemsPerView > 1 ? slideInterval : undefined}
        decelerationRate={itemsPerView > 1 ? 'fast' : 'normal'}
        showsHorizontalScrollIndicator={false}
        style={{ height: Math.max(...slides.slice(firstVisible, lastVisible + 1).map(image => slideWidth / ratioFor(image.image_url))) }}
        contentContainerStyle={[styles.slides, { gap, paddingRight: loop ? 0 : Math.max(0, width - slideWidth) }]}
        scrollEventThrottle={16}
        onScroll={event => showRange(event.nativeEvent.contentOffset.x)}
        onScrollBeginDrag={() => { dragging.current = true; }}
        onScrollEndDrag={event => {
          dragging.current = false;
          if (!event.nativeEvent.velocity?.x) settle(event.nativeEvent.contentOffset.x);
        }}
        onMomentumScrollEnd={event => settle(event.nativeEvent.contentOffset.x)}>
        {slides.map(image => tile(image, slideWidth, image.copy))}
      </ScrollView>{count > 1 && <View style={styles.dots}>{images.map((image, index) =>
        <View key={`${image.image_id}-${index}`} style={[styles.dot, index === currentPage ? styles.dotActive : styles.dotIdle]} />)}</View>}</>;
    }
  }
  return <View style={[{ paddingHorizontal: inset }, style]}><View onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}>{body}</View></View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' },
  slides: { alignItems: 'flex-start' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#852BAF' },
  dotIdle: { opacity: 0.3 },
  dotActive: { width: 16 },
});
