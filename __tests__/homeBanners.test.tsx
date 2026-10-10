import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Image, ScrollView, StyleSheet, TouchableOpacity, Animated, View } from 'react-native';
import CmsBannerGallery from '../src/modules/ecommerce/components/home/CmsBannerGallery';
import NavbarBackground from '../src/navbar/Navbar_Background';

let mockWidth = 390;
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const mocked = Object.create(actual);
  Object.defineProperty(mocked, 'useWindowDimensions', { value: () => ({ width: mockWidth, height: 844, scale: 3, fontScale: 1 }) });
  return mocked;
});
jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('../src/config/apiConfig', () => ({ normalizeLocalCmsImageUrl: (uri: string) => uri }));
let renderer: ReactTestRenderer | undefined;
const banner = (width: number, mode: string, zone = 'main') => ({
  content_id: 1, content_type: 'image' as const, display_mode: mode as any, title: zone,
  color_value: null, image_url: null, text_color: null, cta_text: null, redirect_link: null,
  is_default: 0 as const, status: 'active' as const,
  images: [
    { image_id: 1, image_url: `${zone}-${width}-wide`, sort_order: 1, is_active: 1 as const },
    { image_id: 2, image_url: `${zone}-${width}-portrait`, sort_order: 2, is_active: 1 as const },
  ],
});
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(Image, 'getSize').mockImplementation((uri, success) => { success(uri.endsWith('wide') ? 2048 : 720, uri.endsWith('wide') ? 1008 : 900); });
});
afterEach(async () => { if (renderer) await act(async () => renderer!.unmount()); renderer = undefined; jest.restoreAllMocks(); });

it.each([360, 375, 390, 412])('preserves full slide proportions and changes carousel height at width %s', async width => {
  mockWidth = width;
  await act(async () => { renderer = create(<CmsBannerGallery banner={banner(width, 'carousel')} fallbackRatio={2} />); });
  const images = renderer!.root.findAllByType(Image);
  expect(images).toHaveLength(2);
  expect(images.every(image => image.props.resizeMode === 'contain')).toBe(true);
  const tiles = renderer!.root.findAllByType(TouchableOpacity);
  expect(tiles[0].props.style).toMatchObject({ width, aspectRatio: 2048 / 1008 });
  expect(tiles[1].props.style).toMatchObject({ width, aspectRatio: 720 / 900 });
  expect(StyleSheet.flatten(renderer!.root.findByType(ScrollView).props.style).height).toBeCloseTo(width * 1008 / 2048);
  await act(async () => renderer!.root.findByType(ScrollView).props.onScroll({ nativeEvent: { contentOffset: { x: width / 2 } } }));
  expect(StyleSheet.flatten(renderer!.root.findByType(ScrollView).props.style).height).toBeCloseTo(width * 900 / 720);
  await act(async () => renderer!.root.findByType(ScrollView).props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: width } } }));
  expect(StyleSheet.flatten(renderer!.root.findByType(ScrollView).props.style).height).toBeCloseTo(width * 900 / 720);
});

it.each([360, 375, 390, 412])('fits single, grid_2 and grid_3 to their measured container at width %s', async width => {
  mockWidth = width;
  for (const mode of ['single', 'grid_2', 'grid_3']) {
    await act(async () => {
      if (renderer) renderer.update(<CmsBannerGallery banner={banner(width, mode)} fallbackRatio={2} inset={16} />);
      else renderer = create(<CmsBannerGallery banner={banner(width, mode)} fallbackRatio={2} inset={16} />);
    });
    const tiles = renderer!.root.findAllByType(TouchableOpacity);
    const columns = mode === 'single' ? 1 : mode === 'grid_2' ? 2 : 3;
    expect(tiles).toHaveLength(mode === 'single' ? 1 : 2);
    expect(tiles[0].props.style.width).toBeCloseTo((width - 32 - (columns - 1) * 8) / columns);
  }
});

it('keeps zone fallbacks independent when dimensions are unavailable', async () => {
  jest.mocked(Image.getSize).mockImplementation((_uri, _success, failure) => { failure?.(new Error('offline')); });
  for (const ratio of [2048 / 1008, 2, 720 / 900]) {
    await act(async () => {
      const element = <CmsBannerGallery banner={banner(390, 'single', `fallback-${ratio}`)} fallbackRatio={ratio} />;
      if (renderer) renderer.update(element); else renderer = create(element);
    });
    expect(renderer!.root.findByType(TouchableOpacity).props.style.aspectRatio).toBe(ratio);
  }
});

it('does not reload metadata on rotation and measures parent widths', async () => {
  mockWidth = 390;
  const entry = banner(999, 'single');
  await act(async () => { renderer = create(<CmsBannerGallery banner={entry} fallbackRatio={2} />); });
  const calls = jest.mocked(Image.getSize).mock.calls.length;
  mockWidth = 412;
  await act(async () => renderer!.update(<CmsBannerGallery banner={entry} fallbackRatio={2} />));
  const measured = renderer!.root.findAllByType(View).find(view => view.props.onLayout)!;
  await act(async () => measured.props.onLayout({ nativeEvent: { layout: { width: 412 } } }));
  expect(renderer!.root.findByType(TouchableOpacity).props.style.width).toBe(412);
  expect(jest.mocked(Image.getSize).mock.calls).toHaveLength(calls);
});

it('fills exactly the navbar parent without an image-derived height, shadow or rounded seam', async () => {
  await act(async () => { renderer = create(<NavbarBackground activeTab={'Product' as any}
    banners={{ Product: { imageUrl: 'navbar-art', bgColor: '#FFCC00' } } as any}
    insetsTop={47} isDark={false} scrollY={new Animated.Value(0)} />); });
  const image = renderer!.root.findByType(Image);
  expect(image.props.resizeMode).toBe('cover');
  expect(StyleSheet.flatten(image.props.style)).toMatchObject({ top: 0, bottom: 0, left: 0, right: 0 });
  for (const view of renderer!.root.findAllByType(View)) {
    const style = StyleSheet.flatten(view.props.style) || {};
    expect(style.height).toBeUndefined();
    expect(style.shadowOpacity).toBeUndefined();
    expect(style.elevation).toBeUndefined();
    expect(style.borderBottomLeftRadius).toBeUndefined();
  }
});


it('does not reserve height for an offscreen tall slide during a swipe', async () => {
  mockWidth = 390;
  jest.mocked(Image.getSize).mockImplementation((uri, success) => success(1000, uri.endsWith('tall') ? 3000 : 500));
  const entry = banner(777, 'carousel', 'adjacent');
  entry.images = [
    { image_id: 1, image_url: 'adjacent-one', sort_order: 1, is_active: 1 },
    { image_id: 2, image_url: 'adjacent-two', sort_order: 2, is_active: 1 },
    { image_id: 3, image_url: 'adjacent-tall', sort_order: 3, is_active: 1 },
  ];
  await act(async () => { renderer = create(<CmsBannerGallery banner={entry} fallbackRatio={2} />); });
  await act(async () => renderer!.root.findByType(ScrollView).props.onScroll({ nativeEvent: { contentOffset: { x: 195 } } }));
  expect(StyleSheet.flatten(renderer!.root.findByType(ScrollView).props.style).height).toBe(195);
  await act(async () => renderer!.root.findByType(ScrollView).props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 780 } } }));
  expect(StyleSheet.flatten(renderer!.root.findByType(ScrollView).props.style).height).toBe(1170);
});

it.each([2, 3])('shows half of the next offer with %s images and snaps by card width', async count => {
  mockWidth = 390;
  const entry = banner(888 + count, 'carousel', `peek-${count}`);
  entry.images = Array.from({ length: count }, (_, index) => ({
    image_id: index + 1, image_url: `peek-${count}-${index}-wide`, sort_order: index, is_active: 1 as const,
  }));
  await act(async () => {
    renderer = create(<CmsBannerGallery banner={entry} fallbackRatio={2} inset={12} visibleItems={2.5} />);
  });
  const viewport = 390 - 24;
  const visibleItems = count === 2 ? 1.5 : 2.5;
  const gaps = Math.ceil(visibleItems - 1) * 8;
  const tileWidth = renderer!.root.findAllByType(TouchableOpacity)[0].props.style.width;
  expect(tileWidth * visibleItems + gaps).toBeCloseTo(viewport);
  expect(renderer!.root.findByType(ScrollView).props.pagingEnabled).toBe(false);
  expect(renderer!.root.findByType(ScrollView).props.snapToInterval).toBeCloseTo(tileWidth + 8);
  expect(renderer!.root.findAllByType(Image).every(image => image.props.resizeMode === 'contain')).toBe(true);
});

it('includes the tallest visible offer when three cards share the viewport', async () => {
  mockWidth = 390;
  jest.mocked(Image.getSize).mockImplementation((uri, success) => success(1000, uri.includes('middle') ? 2000 : 500));
  const entry = banner(895, 'carousel', 'peek-height');
  entry.images = ['left', 'middle', 'right'].map((name, index) => ({
    image_id: index + 1, image_url: `peek-height-${name}`, sort_order: index, is_active: 1 as const,
  }));
  await act(async () => {
    renderer = create(<CmsBannerGallery banner={entry} fallbackRatio={2} visibleItems={2.5} />);
  });
  const tileWidth = renderer!.root.findAllByType(TouchableOpacity)[0].props.style.width;
  expect(StyleSheet.flatten(renderer!.root.findByType(ScrollView).props.style).height).toBeCloseTo(tileWidth * 2);
  const refreshed = { ...entry, images: entry.images.map(image => ({ ...image, image_url: `${image.image_url}-refreshed` })) };
  await act(async () => {
    renderer!.update(<CmsBannerGallery banner={refreshed} fallbackRatio={2} visibleItems={2.5} />);
  });
  expect(StyleSheet.flatten(renderer!.root.findByType(ScrollView).props.style).height).toBeCloseTo(tileWidth * 2);
});
