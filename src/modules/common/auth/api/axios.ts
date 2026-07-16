import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL = "https://rewardplanners.com/api/crm";

type SessionHandlers = {
  getAccessToken: () => string | null;
  getRefreshToken: () => Promise<string | null>;
  onAccessTokenRefresh: (nextAccessToken: string) => Promise<void> | void;
  onLogout: (reason: "refresh_failed" | "missing_refresh") => Promise<void> | void;
};

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

let sessionHandlers: SessionHandlers | null = null;

let isRefreshing = false;
let queuedRequests: Array<{
  resolve: (value: AxiosResponse) => void;
  reject: (error: unknown) => void;
  config: RetryableRequestConfig;
}> = [];

export const setSessionHandlers = (handlers: SessionHandlers | null) => {
  sessionHandlers = handlers;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const applyNoStoreHeaders = (config: InternalAxiosRequestConfig) => {
  const nextConfig = config;
  const headers: any = nextConfig.headers || {};

  if (typeof headers.set === "function") {
    headers.set("Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
    if (typeof headers.delete === "function") {
      headers.delete("If-None-Match");
      headers.delete("If-Modified-Since");
    }
  } else {
    headers["Cache-Control"] = "no-store";
    headers.Pragma = "no-cache";
    delete headers["If-None-Match"];
    delete headers["if-none-match"];
    delete headers["If-Modified-Since"];
    delete headers["if-modified-since"];
  }

  nextConfig.headers = headers;
  return nextConfig;
};

axios.interceptors.request.use((config) => applyNoStoreHeaders(config));

const flushQueuedRequests = (
  error: unknown,
  accessToken: string | null,
) => {
  const pending = [...queuedRequests];
  queuedRequests = [];

  pending.forEach(({ resolve, reject, config }) => {
    if (error || !accessToken) {
      reject(error || new Error("Session refresh failed"));
      return;
    }

    const nextHeaders = {
      ...(config.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };

    api({ ...config, headers: nextHeaders })
      .then(resolve)
      .catch(reject);
  });
};

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/v1/auth/login") ||
    url.includes("/v1/auth/register") ||
    url.includes("/v1/auth/refresh") ||
    url.includes("/v1/auth/logout") ||
    url.includes("/v1/auth/verify-email")
  );
};

// Attach the in-memory access token to protected requests.
api.interceptors.request.use((config) => {
  const nextConfig = applyNoStoreHeaders(config);
  const token = sessionHandlers?.getAccessToken?.();

  if (token) {
    const headers: any = nextConfig.headers;
    if (headers && typeof headers.set === "function") {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      nextConfig.headers = {
        ...(nextConfig.headers || {}),
        Authorization: `Bearer ${token}`,
      } as any;
    }
  }

  return nextConfig;
});

// On 401, refresh token once and retry pending requests.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = (error.config || {}) as RetryableRequestConfig;

    if (!status || status !== 401 || originalConfig._retry || isAuthEndpoint(originalConfig.url)) {
      return Promise.reject(error);
    }

    if (!sessionHandlers) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        queuedRequests.push({ resolve, reject, config: originalConfig });
      });
    }

    originalConfig._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await sessionHandlers.getRefreshToken();

      if (!refreshToken) {
        await sessionHandlers.onLogout("missing_refresh");
        flushQueuedRequests(new Error("Missing refresh token"), null);
        return Promise.reject(error);
      }

      const refreshResponse = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
        refreshToken,
      });

      const nextAccessToken = (refreshResponse.data as any)?.accessToken;

      if (!nextAccessToken) {
        throw new Error("Refresh endpoint did not return access token");
      }

      await sessionHandlers.onAccessTokenRefresh(nextAccessToken);
      flushQueuedRequests(null, nextAccessToken);

      const retriedHeaders = {
        ...(originalConfig.headers || {}),
        Authorization: `Bearer ${nextAccessToken}`,
      };

      return api({ ...originalConfig, headers: retriedHeaders });
    } catch (refreshError) {
      flushQueuedRequests(refreshError, null);
      await sessionHandlers.onLogout("refresh_failed");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;