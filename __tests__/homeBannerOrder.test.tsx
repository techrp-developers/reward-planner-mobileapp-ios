import React from 'react';
import { act, create } from 'react-test-renderer';
import { FlatList, InteractionManager, StyleSheet } from 'react-native';
import HomeScreen from '../src/modules/ecommerce/screens/homescreen';
const mockScroll = jest.fn();
const mockReset = jest.fn();
jest.mock('../src/navbar/NavbarScrollContext', () => ({ useNavbarScroll: () => ({ onScroll: mockScroll, resetScroll: mockReset }) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../src/modules/ecommerce/components/home/categories_section', () => 'Categories');
jest.mock('../src/modules/ecommerce/components/home/HomeSectionSkeleton', () => 'Skeleton');
jest.mock('../src/modules/ecommerce/components/home/PromotionalBanner', () => 'MainPromotion');
jest.mock('../src/modules/ecommerce/components/home/BrandPromotionalBanner', () => 'BrandPromotion');
jest.mock('../src/modules/ecommerce/components/home/OfferHome', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/bottombar/BottomTabs', () => ({ TAB_BAR_HEIGHT: 60 }));
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: false }) }));
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ theme: { background: '#fff' } }) }));
it('keeps main → brand → offers → other content in one vertical list without another top inset', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(InteractionManager, 'runAfterInteractions').mockReturnValue({ cancel: jest.fn() } as any);
  let renderer: ReturnType<typeof create>;
  try {
    await act(async () => { renderer = create(<HomeScreen />); });
    const list = renderer!.root.findByType(FlatList);
    expect(list.props.ListHeaderComponent.type).toBe('MainPromotion');
    expect(list.props.data.slice(0, 3).map((item: any) => item.key)).toEqual(['brandPromotionalBanner', 'offerHome', 'categories']);
    expect(list.props.onScroll).toBe(mockScroll);
    expect(list.props.contentInsetAdjustmentBehavior).toBe('never');
    expect(StyleSheet.flatten(list.props.contentContainerStyle).paddingTop || 0).toBe(0);
    expect(list.props.scrollEnabled).not.toBe(false);
    await act(async () => renderer!.unmount());
  } finally { jest.restoreAllMocks(); }
});
