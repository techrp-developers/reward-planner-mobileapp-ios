import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import BottomTabs from '../src/bottombar/BottomTabs';
import HeaderComponent from '../src/modules/dashboard/header/HeaderComponent';

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 24 }) }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({ isDark: false, theme: { background: '#fff' } }),
}));
jest.mock('../src/assets/menu/profile.svg', () => 'Icon');
jest.mock('../src/assets/menu/Home.svg', () => 'Icon');
jest.mock('../src/assets/menu/Cart.svg', () => 'Icon');
jest.mock('../src/assets/menu/Explore.svg', () => 'Icon');
jest.mock('../src/assets/menu/Search.svg', () => 'Icon');
jest.mock('../src/assets/menu/History.svg', () => 'Icon');
jest.mock('../src/utils/responsive', () => ({ rs: (value: number) => value }));
jest.mock('../src/config/apiConfig', () => ({ normalizeLocalCmsImageUrl: (value?: string) => value ?? null }));
jest.mock('../src/modules/dashboard/header/useGlobalSearch', () => {
  const reset = jest.fn();
  return { useGlobalSearch: () => ({ results: null, loading: false, isEmpty: true, reset }) };
});

let renderer: ReactTestRenderer;
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

it('opens Chat from the dashboard footer and keeps Todo List and Home', async () => {
  const onTabPress = jest.fn();
  const onCenterPress = jest.fn();
  await act(async () => {
    renderer = create(<BottomTabs isDashboard activeTabKey="Chat" onTabPress={onTabPress} onCenterPress={onCenterPress} />);
  });
  const buttons = renderer.root.findAllByType(TouchableOpacity);
  for (const [label, key] of [['Todo List', 'Notes'], ['Chat', 'Chat']]) {
    const button = buttons.find(item => item.findAllByType(Text).some(text => text.props.children === label));
    expect(button).toBeDefined();
    await act(async () => button!.props.onPress());
    expect(onTabPress).toHaveBeenLastCalledWith(key);
  }
  expect(renderer.root.findAllByType(Text).map(text => text.props.children)).not.toContain("Profile");
  const center = buttons.find(item => item.findAllByType(Text).length === 0);
  await act(async () => center!.props.onPress());
  expect(onCenterPress).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByType(TouchableOpacity)
    .find(button => button.props.accessibilityLabel === 'Chat')!
    .props.accessibilityState.selected).toBe(false);
});

it('keeps Chat out of the shopping footer', async () => {
  await act(async () => { renderer = create(<BottomTabs activeMode="Product" />); });
  const labels = renderer.root.findAllByType(Text).map(text => text.props.children);
  expect(labels).toEqual(['Home', 'Search', 'Cart', 'Profile']);
});

it('opens Profile from the dashboard header', async () => {
  const onProfilePress = jest.fn();
  await act(async () => {
    renderer = create(<HeaderComponent userName="Aanya" onProfilePress={onProfilePress} />);
  });
  const profile = renderer.root.findAllByType(TouchableOpacity)
    .find(button => button.props.accessibilityLabel === 'Open profile');
  expect(profile).toBeDefined();
  await act(async () => profile!.props.onPress());
  expect(onProfilePress).toHaveBeenCalledTimes(1);
});
