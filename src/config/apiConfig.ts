import { Platform, TurboModuleRegistry } from 'react-native';

export type ApiEnvironment = 'local' | 'live';

// Change only this value to switch every app API call.
export const API_ENVIRONMENT: ApiEnvironment = 'local';

const isLocalEnvironment = (environment: ApiEnvironment) => environment === 'local';
const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT) &&
  (Platform.OS !== 'ios' || __DEV__);

// Fallback for a physical iPhone when the Metro host is unknown: your Mac's LAN IP.
const IOS_FALLBACK_SERVER_URL = 'http://192.168.1.209:5057';

// A debug iPhone loads its JS from Metro on the Mac that also runs the local
// backend, so reuse that host. This keeps working when the Mac's LAN IP changes.
function metroHost(): string | null {
  if (!__DEV__) return null;
  try {
    const scriptURL = TurboModuleRegistry.get<any>('SourceCode')?.getConstants?.()?.scriptURL;
    const host = typeof scriptURL === 'string' ? scriptURL.match(/^https?:\/\/([^/:]+)/i)?.[1] : null;
    return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
  } catch {
    return null;
  }
}

const IOS_METRO_HOST = Platform.OS === 'ios' ? metroHost() : null;
export const IOS_LOCAL_SERVER_URL = IOS_METRO_HOST ? `http://${IOS_METRO_HOST}:5057` : IOS_FALLBACK_SERVER_URL;

const LOCAL_SERVER_URL = Platform.select({
  // Physical Android device connected over USB. Run:
  // adb reverse tcp:5057 tcp:5057
  android: 'http://localhost:5057',
  ios: IOS_LOCAL_SERVER_URL,
  default: 'http://localhost:5057',
}) as string;

const LIVE_SERVER_URL = 'https://rewardplanners.com';

export const SERVER_URL =
  IS_LOCAL_ENVIRONMENT ? LOCAL_SERVER_URL : LIVE_SERVER_URL;

// Live traffic uses the reverse-proxy prefix; the local Express server does not.
export const API_BASE_URL =
  IS_LOCAL_ENVIRONMENT ? SERVER_URL : `${SERVER_URL}/api/crm`;
// Chat shares the configured API server; sockets use its origin.
export const CHAT_API_BASE_URL = API_BASE_URL;
export const CHAT_SERVER_URL = SERVER_URL;

export const API_V1_URL = `${API_BASE_URL}/v1`;
export const API_V1_URL_WITH_SLASH = `${API_V1_URL}/`;
export const UPLOADS_URL =
  IS_LOCAL_ENVIRONMENT
    ? `${SERVER_URL}/uploads/`
    : `${API_BASE_URL}/uploads/`;

const getCmsCdnBaseUrl = (): string => {
  const envValue =
    (typeof process !== 'undefined' && process?.env && (process.env.CMS_CDN_BASE_URL || process.env.EXPO_PUBLIC_CMS_CDN_BASE_URL)) ||
    'https://cdn.rewardplanners.com/public';

  const baseUrl = (envValue || 'https://cdn.rewardplanners.com/public').trim();
  if (!baseUrl) return 'https://cdn.rewardplanners.com/public';

  const normalized = baseUrl.replace(/\/+$/, '');
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized.replace(/^\/+/, '')}`;
};

export const CMS_CDN_BASE_URL = getCmsCdnBaseUrl();

export const buildCdnImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;

  const value = String(imagePath).trim();
  if (!value || /^(?:null|undefined)$/i.test(value)) return null;

  if (/^data:/i.test(value)) return value;

  if (/^https?:\/\//i.test(value)) {
    const lower = value.toLowerCase();
    if (lower.startsWith('https://cdn.rewardplanners.com/public/')) return value;
    if (lower.startsWith('https://mpsl.rewardplanners.com/uploads/')) {
      const suffix = value.replace(/^https?:\/\/[^/]+\/uploads\//i, '');
      return `${CMS_CDN_BASE_URL.replace(/\/+$/, '')}/${suffix.replace(/^\/+/, '')}`;
    }
    if (lower.startsWith('http://localhost') || lower.startsWith('https://localhost')) {
      const suffix = value.replace(/^https?:\/\/[^/]+(?::\d+)?\//i, '');
      return `${CMS_CDN_BASE_URL.replace(/\/+$/, '')}/${suffix.replace(/^\/+/, '')}`;
    }
    if (lower.startsWith('https://rewardplanners.com/api/crm/uploads/')) {
      const suffix = value.replace(/^https?:\/\/[^/]+\/api\/crm\/uploads\//i, '');
      return `${CMS_CDN_BASE_URL.replace(/\/+$/, '')}/${suffix.replace(/^\/+/, '')}`;
    }
    return value;
  }

  const sanitizedPath = value.replace(/^\/+/, '').replace(/^public\//i, '');
  if (!sanitizedPath) return null;

  return `${CMS_CDN_BASE_URL.replace(/\/+$/, '')}/${sanitizedPath}`;
};

// Keep compatibility with the existing CMS helper name while routing all CMS image URLs through the
// single CDN-based resolver. This preserves existing call sites and only changes the URL-generation layer.
export const resolveCmsImageUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const raw = value.trim();
  if (!raw) return null;
  if (/^(?:null|undefined)$/i.test(raw)) return null;

  const privateLocalUrl = raw.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)?$/i);
  const normalizedPath = privateLocalUrl ? (privateLocalUrl[1] || '/') : raw;

  if (/^https?:\/\//i.test(raw) && !privateLocalUrl) return buildCdnImageUrl(raw);
  if (privateLocalUrl) return buildCdnImageUrl(normalizedPath);

  return buildCdnImageUrl(raw);
};

export const normalizeLocalCmsImageUrl = resolveCmsImageUrl;
