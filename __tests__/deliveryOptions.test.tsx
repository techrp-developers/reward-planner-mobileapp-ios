import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import DeliveryOptions from '../src/modules/ecommerce/components/checkout/DeliveryOptions';
import CheckoutItemCart from '../src/modules/ecommerce/components/checkout/CheckoutItemCart';
let mockIsDark = false;
jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: mockIsDark,
  theme: mockIsDark ? require('../src/theme/colors').DarkTheme : require('../src/theme/colors').LightTheme }) }));
jest.mock('../src/modules/ecommerce/api/ProductApi', () => ({ getProductImageUrl: (uri: string) => uri }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
let renderer: ReactTestRenderer;
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); mockIsDark = false; });
const choices = [{ preference: 'cheapest' as const, shipping_total: 40 }, { preference: 'fastest' as const, shipping_total: 90 }];
it.each([false, true])('renders disabled backend choices in theme dark=%s without selecting them', async dark => {
  mockIsDark = dark;
  const select = jest.fn();
  await act(async () => { renderer = create(<DeliveryOptions choices={choices} preference="cheapest" loading={false} supported={false} onSelect={select} />); });
  const cards = renderer.root.findAllByType(TouchableOpacity);
  expect(cards).toHaveLength(2);
  expect(cards.every(card => card.props.disabled)).toBe(true);
  expect(cards[0].props.accessibilityState.checked).toBe(true);
  expect(select).not.toHaveBeenCalled();
});
it('can select a quoted preference in the presentation component only when supported', async () => {
  const select = jest.fn();
  await act(async () => { renderer = create(<DeliveryOptions choices={choices} preference="cheapest" loading={false} supported onSelect={select} />); });
  await act(async () => renderer.root.findAllByType(TouchableOpacity)[1].props.onPress());
  expect(select).toHaveBeenCalledWith('fastest');
});
it('hides quote prices and selection controls while recalculating', async () => {
  await act(async () => { renderer = create(<DeliveryOptions choices={choices} preference="cheapest" loading supported onSelect={jest.fn()} />); });
  expect(renderer.root.findAllByType(TouchableOpacity)).toHaveLength(0);
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === 'Updating delivery and total…')).toBe(true);
});
it.each([undefined, null, 'invalid-date'])('does not fabricate a date when the item estimate is %s', async estimate => {
  await act(async () => { renderer = create(<CheckoutItemCart item={{ product_name: 'Product', price: 100, estimated_delivery_date: estimate }}
    onIncrease={jest.fn()} onDecrease={jest.fn()} onRemove={jest.fn()} />); });
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === 'Estimated delivery date will be confirmed')).toBe(true);
});
