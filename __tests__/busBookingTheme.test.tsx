import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { StyleSheet, Text, View } from 'react-native';
import { DarkTheme } from '../src/theme/colors';
import AboutBusScreen from '../src/modules/busbooking/components/screens/AboutBusScreen';
import BusBookingStatusPopup from '../src/modules/busbooking/components/BusBookingStatusPopup';

let mockIsDark = false;
jest.mock('../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({
    isDark: mockIsDark,
    theme: mockIsDark
      ? require('../src/theme/colors').DarkTheme
      : require('../src/theme/colors').LightTheme,
  }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({ params: { bus: {
    operator: 'Test operator', from: 'Mumbai', to: 'Pune', features: ['Wi-Fi'],
  } } }),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

let renderer: ReactTestRenderer;
beforeEach(() => { mockIsDark = false; });
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

it('updates a mounted bus screen and its shared rows when switching light and dark themes', async () => {
  await act(async () => { renderer = create(<AboutBusScreen />); });
  const background = () => StyleSheet.flatten(renderer.root.findByType('SafeAreaView' as any).props.style).backgroundColor;
  const textColor = (label: string) => StyleSheet.flatten(
    renderer.root.findAllByType(Text).find(node => node.props.children === label)!.props.style,
  ).color;
  expect(background()).toBe('#FBF8F4');
  expect(textColor('Amenities')).toBe('#3B3740');

  mockIsDark = true;
  await act(async () => renderer.update(<AboutBusScreen />));
  expect(background()).toBe(DarkTheme.background);
  expect(textColor('Test operator')).toBe('#F4F4F5');
  expect(textColor('Amenities')).toBe('#F4F4F5');

  mockIsDark = false;
  await act(async () => renderer.update(<AboutBusScreen />));
  expect(background()).toBe('#FBF8F4');
  expect(textColor('Amenities')).toBe('#3B3740');
});

it('uses a dark popup surface while preserving the action button contrast', async () => {
  mockIsDark = true;
  await act(async () => { renderer = create(
    <BusBookingStatusPopup visible title="Booking confirmed" message="Your ticket is ready" />,
  ); });
  const backgrounds = renderer.root.findAllByType(View).map(node => StyleSheet.flatten(node.props.style)?.backgroundColor);
  expect(backgrounds).toContain(DarkTheme.card);
  const title = renderer.root.findAllByType(Text).find(node => node.props.children === 'Booking confirmed')!;
  expect(StyleSheet.flatten(title.props.style).color).toBe('#F4F4F5');
  const button = renderer.root.findAllByType(Text).find(node => node.props.children === 'OK')!;
  expect(StyleSheet.flatten(button.props.style).color).toBe('#FFFFFF');
});
