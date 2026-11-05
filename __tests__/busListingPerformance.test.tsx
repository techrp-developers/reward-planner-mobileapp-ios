import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import BusListingScreen from '../src/modules/busbooking/components/screens/BusListingScreen';

let mockBuses: any[] = [];
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: {
    buses: mockBuses, sourceCity: 'Mumbai', destinationCity: 'Pune',
    journeyDate: '2026-12-01', traceId: 'trace',
  } }),
}));
jest.mock('../src/modules/busbooking/services/busBookingApi', () => ({ getSeatLayoutApi: jest.fn() }));
jest.mock('../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({ isDark: false, theme: require('../src/theme/colors').LightTheme }),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
let renderer: ReactTestRenderer;
beforeEach(() => { jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.restoreAllMocks();
});

it('opens a large result set without mounting every bus card and keeps filters functional', async () => {
  mockBuses = Array.from({ length: 100 }, (_, i) => ({
    id: String(i), operator: `Operator ${i}`, BusType: i % 2 ? 'Non AC Seater' : 'AC Sleeper',
    DepartureTime: '10:00', ArrivalTime: '14:00', DisplayFare: 500, AvailableSeats: 20,
  }));
  await act(async () => { renderer = create(<BusListingScreen />); });
  const list = () => renderer.root.findByType(FlatList);
  expect(list().props.data).toHaveLength(100);
  const mountedOperators = renderer.root.findAllByType(Text).filter(node =>
    typeof node.props.children === 'string' && node.props.children.startsWith('Operator '));
  expect(mountedOperators.length).toBeGreaterThan(0);
  expect(mountedOperators.length).toBeLessThan(100);

  const sleeperText = renderer.root.findAllByType(Text).find(node => node.props.children === 'Sleeper')!;
  const button = sleeperText.parent!;
  // Find the touchable owning this filter label.
  let target = button;
  while (target.type !== TouchableOpacity && target.parent) target = target.parent;
  await act(async () => target.props.onPress());
  expect(list().props.data).toHaveLength(50);
});

it('preserves the empty-results message', async () => {
  mockBuses = [];
  await act(async () => { renderer = create(<BusListingScreen />); });
  expect(renderer.root.findAllByType(Text).some(node => node.props.children === 'No buses found')).toBe(true);
});
