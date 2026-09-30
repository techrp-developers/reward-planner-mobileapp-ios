import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AppState, NativeModules, Platform, Text, TextInput, TouchableOpacity } from 'react-native';
import OTPScreen from '../src/modules/common/auth/screens/OTPScreen';
import LoginScreen from '../src/modules/common/auth/screens/LoginScreen';
import { AuthButton } from '../src/modules/common/auth/components/AuthLayout';
import { normalizeIndianMobile, parseLoginIdentifier } from '../src/modules/common/auth/utils/loginIdentifier';
import { emptyOtp, rateLimitDelay, updateOtpDigits } from '../src/modules/common/auth/utils/otpInput';
import { getPhoneNumberHint } from '../src/modules/common/auth/hooks/usePhoneHint';
import { OTP_LENGTH } from '../src/modules/common/auth/constants/otp';

jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

const mockVerify = jest.fn();
const mockRequest = jest.fn();
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => ({ verifyLoginOtp: mockVerify, requestLoginOtp: mockRequest }),
}));
jest.mock('../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({ isDark: false, theme: { text: '#000', secondaryText: '#555', card: '#fff', border: '#ddd', primary: '#852BAF' } }),
}));
jest.mock('../src/modules/common/auth/components/AuthLayout', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    AuthLayout: ({ children }: any) => <View>{children}</View>,
    AuthButton: ({ title, onPress, disabled, busy }: any) => <TouchableOpacity onPress={onPress} disabled={disabled || busy}><Text>{title}</Text></TouchableOpacity>,
    authStyles: {},
  };
});

let renderer: ReactTestRenderer;
const navigation = { goBack: jest.fn(), setOptions: jest.fn(), navigate: jest.fn() };
const originalOS = Platform.OS;
let appStateListeners: Array<(state: string) => void>;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  appStateListeners = [];
  mockVerify.mockResolvedValue({});
  mockRequest.mockResolvedValue({ success: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    appStateListeners.push(handler);
    return { remove: jest.fn() };
  });
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  Platform.OS = originalOS;
  delete NativeModules.PhoneNumberHint;
  jest.useRealTimers();
  jest.restoreAllMocks();
});
async function renderOtp(identifier = '9876543210') {
  await act(async () => {
    renderer = create(<OTPScreen navigation={navigation as any} route={{ params: { identifier } } as any} />);
  });
}
const field = (index: number) => renderer.root.findAllByType(TextInput)[index];
const action = (text: string) => renderer.root.findAllByType(TouchableOpacity).find(node => node.findAllByType(Text).some(label => String(label.props.children).includes(text)))!;

it.each(['9876543210', '+91 98765 43210', '919876543210', '0091 (98765) 43210'])(
  'normalizes Indian input %s without sending a country prefix', input => {
    expect(normalizeIndianMobile(input)).toBe('9876543210');
  },
);
it.each(['+1 9876543210', '1234567890', '987654321099', '+91987654321', 'hello9876543210'])(
  'rejects foreign or malformed numbers %s', input => expect(normalizeIndianMobile(input)).toBeNull(),
);
it('normalizes email and preserves empty/invalid validation', () => {
  expect(parseLoginIdentifier(' USER@Example.com ')).toEqual({ kind: 'email', normalized: 'user@example.com' });
  expect(parseLoginIdentifier('')).toEqual({ kind: 'empty', normalized: '' });
  expect(parseLoginIdentifier('bad')).toEqual({ kind: 'invalid', normalized: 'bad' });
});
it('distributes a full pasted code starting in any box and sanitizes input', () => {
  expect(updateOtpDigits(emptyOtp(), '12 34-56', 3).digits.join('')).toBe('123456');
  expect(updateOtpDigits(emptyOtp(), 'ab12', 2).digits).toEqual(['', '', '1', '2', '', '']);
});
it('honors server rate limits including HTTP-date Retry-After', () => {
  expect(rateLimitDelay({ response: { status: 429, headers: { 'retry-after': '47' } } })).toBe(47);
  expect(rateLimitDelay({ response: { status: 429, headers: { 'retry-after': new Date(Date.now() + 60000).toUTCString() } } })).toBe(60);
  expect(rateLimitDelay({ response: { status: 429 } })).toBe(300);
  expect(rateLimitDelay({ response: { status: 400 } })).toBeNull();
});
it('uses the actual OTP length and auto-verifies a complete paste once', async () => {
  await renderOtp();
  expect(renderer.root.findAllByType(TextInput)).toHaveLength(OTP_LENGTH);
  await act(async () => {
    field(3).props.onChangeText('123456');
    field(3).props.onChangeText('123456');
  });
  expect(mockVerify).toHaveBeenCalledTimes(1);
  expect(mockVerify).toHaveBeenCalledWith('9876543210', '123456');
  expect(renderer.root.findAllByType(TextInput).map(input => input.props.value).join('')).toBe('123456');
});
it('auto-verifies manual entry only after the last digit', async () => {
  await renderOtp();
  for (let i = 0; i < OTP_LENGTH - 1; i++) await act(async () => field(i).props.onChangeText(String(i + 1)));
  expect(mockVerify).not.toHaveBeenCalled();
  await act(async () => field(OTP_LENGTH - 1).props.onChangeText('6'));
  expect(mockVerify).toHaveBeenCalledTimes(1);
});
it('deletes the previous digit when backspace is pressed in an empty field', async () => {
  await renderOtp();
  await act(async () => field(0).props.onChangeText('1'));
  await act(async () => field(1).props.onKeyPress({ nativeEvent: { key: 'Backspace' } }));
  expect(field(0).props.value).toBe('');
  expect(mockVerify).not.toHaveBeenCalled();
});
it('blocks duplicate verification, resend and change destination while verifying', async () => {
  let resolve!: () => void;
  mockVerify.mockImplementation(() => new Promise<void>(done => { resolve = done; }));
  await renderOtp();
  await act(async () => jest.advanceTimersByTime(30000));
  await act(async () => field(0).props.onChangeText('123456'));
  await act(async () => {
    renderer.root.findByType(AuthButton).props.onPress();
    action('Resend OTP').props.onPress();
    action('Change Mobile Number').props.onPress();
  });
  expect(mockVerify).toHaveBeenCalledTimes(1);
  expect(mockRequest).not.toHaveBeenCalled();
  expect(navigation.goBack).not.toHaveBeenCalled();
  await act(async () => resolve());
});
it('shows backend invalid/expired errors without looping and allows corrected entry', async () => {
  mockVerify.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Invalid or expired OTP' } } });
  await renderOtp();
  await act(async () => field(0).props.onChangeText('123456'));
  expect(JSON.stringify(renderer.toJSON())).toContain('Invalid or expired OTP');
  await act(async () => jest.advanceTimersByTime(5000));
  await act(async () => field(0).props.onChangeText('123456'));
  expect(mockVerify).toHaveBeenCalledTimes(1);
  await act(async () => field(5).props.onChangeText('7'));
  expect(mockVerify).toHaveBeenLastCalledWith('9876543210', '123457');
});
it('allows an explicit Verify retry after a network error', async () => {
  mockVerify.mockRejectedValueOnce(new Error('Network Error'));
  await renderOtp();
  await act(async () => field(0).props.onChangeText('123456'));
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(mockVerify).toHaveBeenCalledTimes(2);
});
it('resends through the existing API and clears the old code', async () => {
  await renderOtp('employee@example.com');
  await act(async () => field(0).props.onChangeText('1'));
  expect(action('Resend in').props.disabled).toBe(true);
  await act(async () => jest.advanceTimersByTime(30000));
  await act(async () => action('Resend OTP').props.onPress());
  expect(mockRequest).toHaveBeenCalledWith('employee@example.com');
  expect(field(0).props.value).toBe('');
  expect(JSON.stringify(renderer.toJSON())).toContain('Resend in 30s');
  await act(async () => action('Change Email').props.onPress());
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});
it('reconciles cooldown when returning from WhatsApp', async () => {
  await renderOtp();
  jest.setSystemTime(Date.now() + 45000);
  await act(async () => appStateListeners.forEach(listener => listener('active')));
  expect(action('Resend OTP').props.disabled).toBe(false);
});
it('honors a 429 on verification and prevents a premature retry', async () => {
  mockVerify.mockRejectedValue({ response: { status: 429, headers: { 'retry-after': '90' }, data: { message: 'Too many attempts' } } });
  await renderOtp();
  await act(async () => field(0).props.onChangeText('123456'));
  expect(JSON.stringify(renderer.toJSON())).toContain('Resend in 90s');
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(mockVerify).toHaveBeenCalledTimes(1);
});
it('only enables platform-supported OTP hints on iOS', async () => {
  Platform.OS = 'ios';
  await renderOtp();
  expect(field(0).props.textContentType).toBe('oneTimeCode');
  expect(field(0).props.autoComplete).toBe('one-time-code');
});
it('gets the Android hint and gracefully falls back for cancellation, failure and unavailable services', async () => {
  Platform.OS = 'android';
  NativeModules.PhoneNumberHint = { getPhoneNumberHint: jest.fn().mockResolvedValue('+919876543210') };
  expect(await getPhoneNumberHint()).toBe('+919876543210');
  NativeModules.PhoneNumberHint.getPhoneNumberHint.mockResolvedValueOnce(null);
  expect(await getPhoneNumberHint()).toBeNull();
  NativeModules.PhoneNumberHint.getPhoneNumberHint.mockRejectedValueOnce(new Error('Unavailable'));
  expect(await getPhoneNumberHint()).toBeNull();
  delete NativeModules.PhoneNumberHint;
  expect(await getPhoneNumberHint()).toBeNull();
});
it('does not request a number hint on iOS', async () => {
  Platform.OS = 'ios';
  const nativeHint = jest.fn();
  NativeModules.PhoneNumberHint = { getPhoneNumberHint: nativeHint };
  expect(await getPhoneNumberHint()).toBeNull();
  expect(nativeHint).not.toHaveBeenCalled();
});

async function renderLogin() {
  await act(async () => { renderer = create(<LoginScreen navigation={navigation as any} route={{} as any} />); });
}
it('opens Android picker on user action, then lets the user confirm the normalized number', async () => {
  Platform.OS = 'android';
  const hint = jest.fn().mockResolvedValue('+91 98765 43210');
  NativeModules.PhoneNumberHint = { getPhoneNumberHint: hint };
  await renderLogin();
  expect(hint).not.toHaveBeenCalled();
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(hint).toHaveBeenCalledTimes(1);
  expect(field(0).props.value).toBe('9876543210');
  expect(mockRequest).not.toHaveBeenCalled();
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(mockRequest).toHaveBeenCalledWith('9876543210');
  expect(navigation.navigate).toHaveBeenCalledWith('LoginOTP', expect.objectContaining({ identifier: '9876543210' }));
});
it('allows manual mobile entry when the Android picker is cancelled', async () => {
  Platform.OS = 'android';
  NativeModules.PhoneNumberHint = { getPhoneNumberHint: jest.fn().mockResolvedValue(null) };
  await renderLogin();
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(field(0).props.editable).toBe(true);
  await act(async () => field(0).props.onChangeText('+919876543210'));
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(mockRequest).toHaveBeenCalledWith('9876543210');
});
it('uses manual mobile entry on iOS with no picker or extra permissions', async () => {
  Platform.OS = 'ios';
  const hint = jest.fn();
  NativeModules.PhoneNumberHint = { getPhoneNumberHint: hint };
  await renderLogin();
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(hint).not.toHaveBeenCalled();
  await act(async () => field(0).props.onChangeText('9876543210'));
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(mockRequest).toHaveBeenCalledWith('9876543210');
});
it('rejects a phone number in email mode and submits a normalized email through AuthContext', async () => {
  await renderLogin();
  await act(async () => action('Continue with Email').props.onPress());
  await act(async () => field(0).props.onChangeText('9876543210'));
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(mockRequest).not.toHaveBeenCalled();
  await act(async () => field(0).props.onChangeText(' Employee@Example.com '));
  await act(async () => renderer.root.findByType(AuthButton).props.onPress());
  expect(mockRequest).toHaveBeenCalledWith('employee@example.com');
});
it('prevents duplicate OTP requests and surfaces send errors', async () => {
  let reject!: (error: unknown) => void;
  mockRequest.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  await renderLogin();
  await act(async () => action('Continue with Email').props.onPress());
  await act(async () => field(0).props.onChangeText('employee@example.com'));
  await act(async () => {
    renderer.root.findByType(AuthButton).props.onPress();
    renderer.root.findByType(AuthButton).props.onPress();
  });
  expect(mockRequest).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('Network Error')));
  expect(JSON.stringify(renderer.toJSON())).toContain('Network Error');
  expect(navigation.navigate).not.toHaveBeenCalled();
});
