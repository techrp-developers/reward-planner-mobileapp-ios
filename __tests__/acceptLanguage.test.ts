import axios, { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import i18n from '../src/i18n';
import api, { setSessionHandlers } from '../src/modules/common/auth/api/axios';

const seen: Array<{ url?: string; language: unknown }> = [];
let onRequest: (config: InternalAxiosRequestConfig) => Promise<{ status: number; data: unknown }>;

const adapter: AxiosAdapter = async (config) => {
  seen.push({ url: config.url, language: config.headers.get('Accept-Language') });
  const { status, data } = await onRequest(config);
  const response = { data, status, statusText: String(status), headers: {}, config };
  if (status >= 400) {
    throw new axios.AxiosError('Request failed', String(status), config, null, response);
  }
  return response;
};

beforeEach(async () => {
  seen.length = 0;
  api.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;
  await i18n.changeLanguage('en');
});
afterAll(() => setSessionHandlers(null));

it('sends the current language on every request', async () => {
  onRequest = async () => ({ status: 200, data: {} });
  await api.get('/v1/products');
  await i18n.changeLanguage('mr');
  await api.get('/v1/products');
  expect(seen.map((r) => r.language)).toEqual(['en', 'mr']);
});

it('does not reuse a stale language when a 401 is retried after a refresh', async () => {
  let token = 'old-access';
  setSessionHandlers({
    getAccessToken: () => token,
    getRefreshToken: async () => 'refresh',
    onSessionRefresh: async (next) => { token = next; },
    onLogout: async () => undefined,
  });
  onRequest = async (config) => {
    if (config.url?.endsWith('/v1/auth/refresh')) {
      return { status: 200, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } };
    }
    if (config.headers.get('Authorization') === 'Bearer old-access') {
      // The user switches language while the first attempt is in flight.
      await i18n.changeLanguage('hi');
      return { status: 401, data: {} };
    }
    return { status: 200, data: { ok: true } };
  };
  const response = await api.get('/v1/orders');
  expect(response.data).toEqual({ ok: true });
  const orders = seen.filter((r) => r.url === '/v1/orders');
  expect(orders.map((r) => r.language)).toEqual(['en', 'hi']);
});

it('keeps an explicit caller override', async () => {
  onRequest = async () => ({ status: 200, data: {} });
  await i18n.changeLanguage('hi');
  await api.get('/geocode', { headers: { 'Accept-Language': 'en' } });
  expect(seen[0].language).toBe('en');
});
