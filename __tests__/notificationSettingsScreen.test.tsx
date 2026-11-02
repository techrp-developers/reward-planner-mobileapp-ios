import React from 'react';
import { Switch } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import i18n from '../src/i18n';

jest.mock('../src/theme/ThemeContext', () => ({ useAppTheme: () => ({ isDark: false }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: ({ children }: any) => children }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));
jest.mock('../src/modules/ecommerce/constants/heading/OrderHeading', () => () => null);
jest.mock('../src/modules/notifications/FCMService', () => ({
  getNotificationPermissionStatus: jest.fn(async () => 'blocked'),
  getPushDiagnostics: jest.fn(() => ({ fcmToken: 'abc...wxyz' })),
  isPermissionGranted: (status: string) => status === 'granted',
  openNotificationSettings: jest.fn(async () => undefined),
  requestPushPermission: jest.fn(),
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
