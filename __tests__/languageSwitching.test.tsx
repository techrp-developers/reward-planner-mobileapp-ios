import React, { memo } from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../src/i18n';
import { LanguageProvider, useAppLanguage } from '../src/i18n/LanguageContext';
import { loadUserLanguage } from '../src/i18n/languageStorage';

let mockUser: { user_id: number } | null = null;
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: mockUser !== null }),
}));

let ctx: ReturnType<typeof useAppLanguage>;
let renderer: ReactTestRenderer;

// A memoised screen that never receives new props: it must still update.
const MountedTab = memo(() => {
  const { t } = useTranslation();
  return <Text testID="tab">{t('common:tabs.search')}</Text>;
});
function Consumer() {
  ctx = useAppLanguage();
  return <MountedTab />;
}
const tree = () => (
  <LanguageProvider>
    <Consumer />
  </LanguageProvider>
);
const tabText = () => renderer.root.findByProps({ testID: 'tab' }).props.children;

async function mount() {
  await act(async () => {
    renderer = create(tree());
  });
}
async function signIn(userId: number | null) {
  mockUser = userId === null ? null : { user_id: userId };
  await act(async () => {
    renderer.update(tree());
  });
}

beforeEach(async () => {
  mockUser = null;
  await AsyncStorage.clear();
  await i18n.changeLanguage('en');
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.restoreAllMocks();
});

it('defaults to English and asks a first-time user to pick a language', async () => {
  await mount();
  expect(ctx.status).toBe('signed-out');
  expect(ctx.language).toBe('en');
  await signIn(7);
  expect(ctx.status).toBe('needs-selection');
  expect(ctx.language).toBe('en');
  expect(tabText()).toBe('Search');
});

it('switches en → mr → hi → en in place, updating mounted memo screens', async () => {
  mockUser = { user_id: 7 };
  await mount();
  await act(async () => ctx.completeSelection('mr'));
  expect(ctx.status).toBe('ready');
  expect(tabText()).toBe('शोधा');
  await act(async () => ctx.setLanguage('hi'));
  expect(tabText()).toBe('खोजें');
  // Strings read outside React (alerts, validation messages) follow too.
  expect(i18n.t('common:tabs.chat')).toBe('चैट');
  await act(async () => ctx.setLanguage('en'));
  expect(tabText()).toBe('Search');
  expect(await loadUserLanguage(7)).toBe('en');
});

it('restores the saved language after an app restart', async () => {
  mockUser = { user_id: 7 };
  await mount();
  await act(async () => ctx.completeSelection('hi'));
  await act(async () => renderer.unmount());
  await i18n.changeLanguage('en'); // a cold start initialises in English
  await mount();
  expect(ctx.status).toBe('ready');
  expect(ctx.language).toBe('hi');
  expect(tabText()).toBe('खोजें');
});

it('keeps an independent preference per account on a shared phone', async () => {
  mockUser = { user_id: 1 };
  await mount();
  await act(async () => ctx.completeSelection('hi'));
  await signIn(null);
  expect(ctx.language).toBe('en');
  await signIn(2);
  expect(ctx.status).toBe('needs-selection');
  expect(ctx.language).toBe('en');
  await act(async () => ctx.completeSelection('mr'));
  await signIn(1);
  expect(ctx.status).toBe('ready');
  expect(ctx.language).toBe('hi');
  expect(await loadUserLanguage(2)).toBe('mr');
});

it('persists the last of several rapid choices', async () => {
  mockUser = { user_id: 7 };
  await mount();
  await act(async () => {
    await Promise.all([ctx.setLanguage('mr'), ctx.setLanguage('hi'), ctx.setLanguage('en'), ctx.setLanguage('mr')]);
  });
  expect(ctx.language).toBe('mr');
  expect(await loadUserLanguage(7)).toBe('mr');
});

it('does not apply a pending save to the next account', async () => {
  mockUser = { user_id: 1 };
  await mount();
  await act(async () => ctx.completeSelection('en'));
  let release: () => void = () => {};
  const realSet = AsyncStorage.setItem;
  jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(async (key, value) => {
    await new Promise<void>((resolve) => { release = resolve; });
    return realSet(key, value);
  });
  let pending: Promise<void> = Promise.resolve();
  await act(async () => { pending = ctx.setLanguage('hi'); });
  await signIn(2); // switch accounts while user 1's save is still in flight
  await act(async () => { release(); await pending; });
  expect(ctx.status).toBe('needs-selection');
  expect(ctx.language).toBe('en');
  expect(await loadUserLanguage(1)).toBe('hi');
  expect(await loadUserLanguage(2)).toBeNull();
});

it('reverts to the durable language when saving fails', async () => {
  mockUser = { user_id: 7 };
  await mount();
  await act(async () => ctx.completeSelection('mr'));
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
  await act(async () => {
    await expect(ctx.setLanguage('hi')).rejects.toThrow('disk full');
  });
  expect(ctx.language).toBe('mr');
  expect(tabText()).toBe('शोधा');
});

it('ignores a corrupt stored preference', async () => {
  await AsyncStorage.setItem('rp.language.v1.user.7', '{"language":"fr"}');
  mockUser = { user_id: 7 };
  await mount();
  expect(ctx.status).toBe('needs-selection');
  expect(ctx.language).toBe('en');
});
