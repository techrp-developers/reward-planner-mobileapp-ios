import React from 'react';
import { Switch } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import i18n from '../src/i18n';

jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: false }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: any) => children }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));
jest.mock('../src/modules/ecommerce/constants/heading/OrderHeading', () => () => null);
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => () => null);
jest.mock('../src/modules/notifications/FCMService', () => ({
  getNotificationPermissionDetail: jest.fn(async () => ({ status: 'blocked', provisional: false })),
  getPushDiagnostics: jest.fn(() => ({ fcmToken: 'abc...wxyz' })),
  isPermissionGranted: (status: string) => status === 'granted',
  openDeviceNotificationSettings: jest.fn(async () => undefined),
  requestPushPermission: jest.fn(async () => 'granted'),
}));
jest.mock('../src/modules/dashboard/notification/notificationPreferencesAPI', () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

import NotificationSettings from '../src/modules/dashboard/notification/NotificationSettings';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../src/modules/dashboard/notification/notificationPreferencesAPI';
import {
  getNotificationPermissionDetail,
  openDeviceNotificationSettings,
  requestPushPermission,
} from '../src/modules/notifications/FCMService';
import { Alert, Platform, TouchableOpacity } from 'react-native';

const defaults = {
  language: 'en', marketing_enabled: false, engagement_enabled: false,
  quiet_hours_start: null, quiet_hours_end: null, stored: false,
};

async function renderScreen() {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(<NotificationSettings />);
  });
  return tree;
}
const allText = (tree: ReactTestRenderer) => JSON.stringify(tree.toJSON());

beforeEach(() => {
  jest.clearAllMocks();
  (getNotificationPreferences as jest.Mock).mockResolvedValue(defaults);
});
afterEach(() => i18n.changeLanguage('en'));

it('treats stored:false as no consent and saves nothing on load', async () => {
  const tree = await renderScreen();
  const [offers, engagement, quiet] = tree.root.findAllByType(Switch);
  expect(offers.props.value).toBe(false);
  expect(engagement.props.value).toBe(false);
  expect(quiet.props.value).toBe(false);
  expect(updateNotificationPreferences).not.toHaveBeenCalled();
});

it('saves marketing only on an explicit toggle', async () => {
  (updateNotificationPreferences as jest.Mock).mockResolvedValue({ ...defaults, marketing_enabled: true, stored: true });
  const tree = await renderScreen();
  await act(async () => tree.root.findAllByType(Switch)[0].props.onValueChange(true));
  expect(updateNotificationPreferences).toHaveBeenCalledWith({ marketing_enabled: true });
});

it('sends quiet hours as a pair', async () => {
  (updateNotificationPreferences as jest.Mock).mockResolvedValue({ ...defaults, stored: true });
  const tree = await renderScreen();
  await act(async () => tree.root.findAllByType(Switch)[2].props.onValueChange(true));
  expect(updateNotificationPreferences).toHaveBeenCalledWith({ quiet_hours_start: '22:00', quiet_hours_end: '07:00' });
});

it.each([
  ['en', 'Notification language'],
  ['hi', 'नोटिफ़िकेशन की भाषा'],
  ['mr', 'सूचनांची भाषा'],
])('renders in %s', async (language, heading) => {
  await i18n.changeLanguage(language);
  expect(allText(await renderScreen())).toContain(heading);
});

const permissionIs = (status: string, provisional = false) =>
  (getNotificationPermissionDetail as jest.Mock).mockResolvedValue({ status, provisional });
const byTestId = (tree: ReactTestRenderer, id: string) =>
  tree.root.findAll((node) => node.props.testID === id && typeof node.type !== 'string')[0];
const buttonWithText = (tree: ReactTestRenderer, label: string) =>
  tree.root.findAllByType(TouchableOpacity).find((node) =>
    node.findAll((child) => child.props.children === label).length > 0)!;

describe('device permission', () => {
  const originalOS = Platform.OS;
  afterEach(() => { (Platform as { OS: string }).OS = originalOS; });

  it('shows enabled without an action', async () => {
    permissionIs('granted');
    const text = allText(await renderScreen());
    expect(text).toContain('Notifications are enabled.');
    expect(text).not.toContain('Open Device Settings');
  });

  it('shows a provisional grant as allowed quietly, with a settings link', async () => {
    permissionIs('granted', true);
    const tree = await renderScreen();
    expect(allText(tree)).toContain('Allowed quietly');
    await act(async () => buttonWithText(tree, 'Open Device Settings').props.onPress());
    expect(openDeviceNotificationSettings).toHaveBeenCalledTimes(1);
    expect(requestPushPermission).not.toHaveBeenCalled();
  });

  it('asks the system on iOS only while it has never been asked', async () => {
    (Platform as { OS: string }).OS = 'ios';
    permissionIs('denied');
    const tree = await renderScreen();
    expect(allText(tree)).toContain('Notifications are not enabled yet.');
    await act(async () => buttonWithText(tree, 'Enable Notifications').props.onPress());
    expect(requestPushPermission).toHaveBeenCalledTimes(1);
    expect(openDeviceNotificationSettings).not.toHaveBeenCalled();
  });

  it.each(['ios', 'android'])('sends a refusal on %s to the device settings instead of asking again', async (os) => {
    (Platform as { OS: string }).OS = os;
    permissionIs(os === 'ios' ? 'blocked' : 'denied');
    const tree = await renderScreen();
    expect(allText(tree)).toContain('Notifications are turned off for Reward Planners.');
    await act(async () => buttonWithText(tree, 'Open Device Settings').props.onPress());
    expect(requestPushPermission).not.toHaveBeenCalled();
    expect(openDeviceNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it('always offers the device notification settings row', async () => {
    permissionIs('granted');
    const tree = await renderScreen();
    await act(async () => byTestId(tree, 'device-settings').props.onPress());
    expect(openDeviceNotificationSettings).toHaveBeenCalledTimes(1);
  });
});

describe('preferences', () => {
  it('explains order and booking updates without a fake switch', async () => {
    const tree = await renderScreen();
    expect(allText(tree)).toContain('Order and booking updates');
    expect(allText(tree)).toContain('Always on');
    expect(tree.root.findAllByType(Switch)).toHaveLength(3);
  });

  it('confirms a save, and restores the old value when it fails', async () => {
    (updateNotificationPreferences as jest.Mock).mockResolvedValueOnce({ ...defaults, engagement_enabled: true, stored: true });
    const tree = await renderScreen();
    await act(async () => tree.root.findAllByType(Switch)[1].props.onValueChange(true));
    expect(allText(tree)).toContain('Saved');
    expect(tree.root.findAllByType(Switch)[1].props.value).toBe(true);

    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (updateNotificationPreferences as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await act(async () => tree.root.findAllByType(Switch)[0].props.onValueChange(true));
    expect(tree.root.findAllByType(Switch)[0].props.value).toBe(false);
    expect(alert).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('lets the employee choose quiet-hour times and rejects equal times', async () => {
    const quiet = { ...defaults, quiet_hours_start: '22:00', quiet_hours_end: '07:00', stored: true };
    (getNotificationPreferences as jest.Mock).mockResolvedValue(quiet);
    (updateNotificationPreferences as jest.Mock).mockResolvedValue({ ...quiet, quiet_hours_start: '23:30' });
    const tree = await renderScreen();

    await act(async () => byTestId(tree, 'quiet-start').props.onPress());
    await act(async () => byTestId(tree, 'quiet-option-23:30').props.onPress());
    expect(updateNotificationPreferences).toHaveBeenLastCalledWith({ quiet_hours_start: '23:30', quiet_hours_end: '07:00' });

    (updateNotificationPreferences as jest.Mock).mockClear();
    await act(async () => byTestId(tree, 'quiet-end').props.onPress());
    await act(async () => byTestId(tree, 'quiet-option-23:30').props.onPress());
    expect(updateNotificationPreferences).not.toHaveBeenCalled();
    expect(allText(tree)).toContain('Start and end must be different times.');
  });
});
