import { Platform } from 'react-native';

export type ApiEnvironment = 'local' | 'live';

// Change only this value to switch every app API call.
export const API_ENVIRONMENT: ApiEnvironment = 'live';

const isLocalEnvironment = (environment: ApiEnvironment) => environment === 'local';
const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);

const LOCAL_SERVER_URL = Platform.select({
  // Physical Android device connected over USB. Run:
  // adb reverse tcp:5000 tcp:5000
  android: 'http://localhost:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
}) as string;

const LIVE_SERVER_URL = 'https://rewardplanners.com';

export const SERVER_URL =
  IS_LOCAL_ENVIRONMENT ? LOCAL_SERVER_URL : LIVE_SERVER_URL;

// Live traffic uses the reverse-proxy prefix; the local Express server does not.
export const API_BASE_URL =
  IS_LOCAL_ENVIRONMENT ? SERVER_URL : `${SERVER_URL}/api/crm`;
export const API_V1_URL = `${API_BASE_URL}/v1`;
export const API_V1_URL_WITH_SLASH = `${API_V1_URL}/`;
export const UPLOADS_URL =
  IS_LOCAL_ENVIRONMENT
    ? `${SERVER_URL}/uploads/`
    : `${API_BASE_URL}/uploads/`;