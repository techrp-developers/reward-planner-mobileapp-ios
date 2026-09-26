import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppState, NativeModules, Platform } from 'react-native';
import axios from 'axios';
import { IconService, resolveIconName } from '../src/services/iconService';
import { useFestivalIcon } from '../src/hooks/useFestivalIcon';

jest.mock('axios', () => ({ get: jest.fn() }));

const get = axios.get as jest.Mock;
const bridge = {
  isSupported: jest.fn().mockResolvedValue(true),
  getCurrentIcon: jest.fn().mockResolvedValue('Default'),
  setIcon: jest.fn().mockResolvedValue(true),
};
let renderer: ReactTestRenderer | undefined;
let listener: (state: string) => void;
const remove = jest.fn();
const originalOS = Platform.OS;
const originalState = AppState.currentState;

function Root() {
  useFestivalIcon();
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'ios';
  AppState.currentState = 'active';
  NativeModules.AppIconSwitcher = bridge;
  bridge.isSupported.mockResolvedValue(true);
  bridge.getCurrentIcon.mockResolvedValue('Default');
  bridge.setIcon.mockResolvedValue(true);
  get.mockResolvedValue({ data: { success: true, data: { platform: 'ios', icon_key: 'diwali' } } });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    listener = callback;
    return { remove };
  });
});

afterEach(async () => {
  if (renderer) await act(async () => renderer?.unmount());
  renderer = undefined;
  Platform.OS = originalOS;
  AppState.currentState = originalState;
  delete NativeModules.AppIconSwitcher;
  jest.restoreAllMocks();
});

it('maps known keys and safely defaults unknown/prototype keys', () => {
  expect(resolveIconName('diwali')).toBe('DiwaliIcon');
  expect(resolveIconName('independence_day')).toBe('IndependenceDayIcon');
  expect(resolveIconName('default')).toBe('Default');
  expect(resolveIconName('new_festival')).toBe('Default');
  expect(resolveIconName('toString')).toBe('Default');
});

it('restores with null and absorbs native failures or a missing module', async () => {
  expect(await IconService.setIcon('Default')).toBe(true);
  expect(bridge.setIcon).toHaveBeenCalledWith(null);
  bridge.setIcon.mockRejectedValueOnce(new Error('Missing asset'));
  expect(await IconService.setIcon('DiwaliIcon')).toBe(false);
  delete NativeModules.AppIconSwitcher;
  expect(await IconService.getCurrentIcon()).toBe('Default');
  expect(await IconService.isSupported()).toBe(false);
});

it('does no native or network work on Android', async () => {
  Platform.OS = 'android';
  await act(async () => { renderer = create(<Root />); });
  expect(await IconService.setIcon('DiwaliIcon')).toBe(false);
  expect(await IconService.getCurrentIcon()).toBe('Default');
  expect(get).not.toHaveBeenCalled();
  expect(bridge.setIcon).not.toHaveBeenCalled();
});

it('fetches on mount/foreground, skips an unchanged icon and cleans up', async () => {
  await act(async () => { renderer = create(<Root />); });
  expect(get).toHaveBeenCalledWith(expect.stringContaining('/content/resolved/app-icon?platform=ios'), expect.any(Object));
  expect(bridge.setIcon).toHaveBeenCalledTimes(1);
  bridge.getCurrentIcon.mockResolvedValue('DiwaliIcon');
  await act(async () => { listener('background'); listener('active'); });
  expect(get).toHaveBeenCalledTimes(2);
  expect(bridge.setIcon).toHaveBeenCalledTimes(1);
  const signal = get.mock.calls[0][1].signal;
  await act(async () => renderer?.unmount());
  renderer = undefined;
  expect(remove).toHaveBeenCalledTimes(1);
  expect(signal.aborted).toBe(true);
});

it('leaves the icon alone on invalid and failed network responses', async () => {
  get.mockResolvedValueOnce({ data: { success: false } });
  await act(async () => { renderer = create(<Root />); });
  get.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => { listener('inactive'); listener('active'); });
  expect(bridge.setIcon).not.toHaveBeenCalled();
  expect(console.warn).toHaveBeenCalledTimes(2);
});

it('does not apply a response after unmount', async () => {
  let finish!: (value: unknown) => void;
  get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await act(async () => { renderer = create(<Root />); });
  await act(async () => renderer?.unmount());
  renderer = undefined;
  await act(async () => { finish({ data: { success: true, data: { platform: 'ios', icon_key: 'diwali' } } }); });
  expect(bridge.setIcon).not.toHaveBeenCalled();
});
