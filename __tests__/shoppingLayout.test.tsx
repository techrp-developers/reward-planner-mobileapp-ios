import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import BuySection from '../src/modules/ecommerce/components/cart/buysections';
import { useStickyBottomCTA } from '../src/bottombar/hooks/useStickyBottomCTA';
import { shouldShowBottomTabs } from '../src/navigation/shoppingChrome';

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('@react-navigation/bottom-tabs', () => ({ BottomTabBarHeightContext: require('react').createContext(0) }));
jest.mock('../src/bottombar/BottomTabs', () => ({ TAB_BAR_HEIGHT: 60 }));
let mockBottomInset = 34;
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: mockBottomInset }) }));
jest.mock('react-native-linear-gradient', () => 'Gradient');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: false, theme: {} }) }));
jest.mock('../src/modules/ecommerce/navigation/navigationPerformance', () => ({ prefetchCartScreenData: jest.fn() }));
let renderer: ReactTestRenderer;
beforeEach(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); mockBottomInset = 34; });
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); jest.restoreAllMocks(); });

it.each(['Home', 'SearchScreen', 'Profile'])('preserves browsing navigation on %s', leaf => {
  expect(shouldShowBottomTabs('Product', ['Home', 'ProductModule', leaf])).toBe(true);
});
it.each(['ProductDescription', 'ProductDetails', 'Cart', 'OrderStepUI', 'Checkout', 'AddressSelect'])('removes navigation chrome on %s', leaf => {
  expect(shouldShowBottomTabs('Product', ['Home', 'ProductModule', leaf])).toBe(false);
});

it('reserves measured footer height plus safe area and spacing after rotation', async () => {
  let sticky!: ReturnType<typeof useStickyBottomCTA>;
  function Screen() { sticky = useStickyBottomCTA({ tabBarAware: false, extraSpacing: 16 }); return null; }
  await act(async () => { renderer = create(<Screen />); });
  await act(async () => { sticky.onCtaLayout({ nativeEvent: { layout: { height: 156 } } } as any); });
  expect(sticky.bottomOffset).toBe(34);
  expect(sticky.scrollContentPaddingBottom).toBe(206);
  mockBottomInset = 21;
  await act(async () => renderer.update(<Screen />));
  expect(sticky.bottomOffset).toBe(21);
  expect(sticky.scrollContentPaddingBottom).toBe(193);
});

it('keeps product footer buttons wired and disables both during Buy Now', async () => {
  const add = jest.fn(); const buy = jest.fn();
  const props = { offPercent: '10%', price: '₹949', mrp: '₹999', points: 0, qty: 1,
    stock: 5, inStock: true, onQtyChange: jest.fn(), onAddToCart: add, onBuyNow: buy, showDetails: false };
  await act(async () => { renderer = create(<BuySection {...props} />); });
  const buttons = renderer.root.findAllByType(TouchableOpacity);
  expect(buttons).toHaveLength(2);
  await act(async () => { buttons[0].props.onPress(); buttons[1].props.onPress(); });
  expect(add).toHaveBeenCalledTimes(1);
  expect(buy).toHaveBeenCalledTimes(1);
  await act(async () => renderer.update(<BuySection {...props} isBuyingNow />));
  expect(renderer.root.findAllByType(TouchableOpacity).every(button => button.props.disabled)).toBe(true);
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({ Navigator: 'StackNavigator', Screen: 'StackScreen' }),
}));

it('keeps browsing, cart and checkout in the same native push stack', async () => {
  const HomeStack = require('../src/modules/ecommerce/navigation/HomeStack').default;
  await act(async () => { renderer = create(<HomeStack />); });
  const screens = renderer.root.findAll(node => node.type === 'StackScreen');
  // A modal anywhere in the browsing history can cover a later checkout push.
  for (const screen of screens) {
    if (screen.props.name === 'AddressDetails') continue;
    expect(screen.props.options?.presentation ?? 'card').toBe('card');
  }
  expect(screens.map(screen => screen.props.name)).toEqual(expect.arrayContaining([
    'Cart', 'ProductDescription', 'OrderStepUI',
  ]));
});
