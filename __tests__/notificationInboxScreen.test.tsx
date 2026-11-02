import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

jest.mock('../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({ isDark: false, theme: { text: '#000', secondaryText: '#333' } }),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: any) => children }));
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react');
  return {
    useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
    useFocusEffect: (callback: () => void) => useEffect(callback, [callback]),
  };
});
jest.mock('../src/modules/ecommerce/constants/heading/OrderHeading', () => () => null);
jest.mock('react-native-linear-gradient', () => ({ children }: any) => children);
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => () => null);
jest.mock('../src/modules/notifications/notificationRouting', () => ({
  openNotificationRoute: jest.fn(() => false),
  reportNotificationOpened: jest.fn(),
}));
jest.mock('../src/modules/dashboard/notification/NotificationAPI', () => ({
  NOTIFICATION_PAGE_SIZE: 20,
  getMyNotifications: jest.fn(),
  getNotificationBadge: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  deleteNotification: jest.fn(),
}));

import Notification from '../src/modules/dashboard/notification/Notification';
import { getMyNotifications, getNotificationBadge } from '../src/modules/dashboard/notification/NotificationAPI';
import { notificationEvents } from '../src/modules/notifications/notificationEvents';

const fetchInbox = getMyNotifications as jest.Mock;
const item = {
  notification_id: 7, module: 'common', type: 'test', title: 'Inbox row', message: 'Body', icon: null,
  reference_type: null, reference_id: null, action_url: null, metadata: null, priority: 'normal',
  is_read: 0, created_at: '2026-11-02 10:00:00',
};

let mounted: ReactTestRenderer | null = null;

async function renderScreen() {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(<Notification />);
  });
  mounted = tree;
  return tree;
}
const visibleText = (tree: ReactTestRenderer) =>
  tree.root.findAllByType(Text).flatMap((node) => node.props.children).join(' ');

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  (getNotificationBadge as jest.Mock).mockResolvedValue({ success: true, count: 1 });
  fetchInbox.mockResolvedValue({ success: true, data: [item] });
});

afterEach(async () => {
  await act(async () => mounted?.unmount());
  mounted = null;
});

it('fetches once when the screen opens and shows the rows', async () => {
  const tree = await renderScreen();
  expect(fetchInbox).toHaveBeenCalledTimes(1);
  expect(visibleText(tree)).toContain('Inbox row');
});

it('keeps a legitimate refetch when a push arrives after loading', async () => {
  await renderScreen();
  await act(async () => notificationEvents.emitNotificationReceived());
  expect(fetchInbox).toHaveBeenCalledTimes(2);
});

it('collapses pushes during a load into one follow-up request', async () => {
  let finishFirst!: (value: unknown) => void;
  fetchInbox.mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }));
  await renderScreen();

  await act(async () => {
    notificationEvents.emitNotificationReceived();
    notificationEvents.emitNotificationReceived();
  });
  expect(fetchInbox).toHaveBeenCalledTimes(1);

  await act(async () => finishFirst({ success: true, data: [] }));
  expect(fetchInbox).toHaveBeenCalledTimes(2);
});

it('shows the backend failure with Retry, and Retry recovers', async () => {
  fetchInbox.mockRejectedValueOnce({ success: false, message: 'Failed to fetch notifications' });
  const tree = await renderScreen();
  expect(fetchInbox).toHaveBeenCalledTimes(1);
  expect(visibleText(tree)).toContain('Failed to fetch notifications');

  const retry = tree.root.findAllByType(TouchableOpacity).at(-1)!;
  await act(async () => retry.props.onPress());
  expect(fetchInbox).toHaveBeenCalledTimes(2);
  expect(visibleText(tree)).toContain('Inbox row');
});
