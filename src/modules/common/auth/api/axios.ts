import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./env";

export { API_BASE_URL };

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
  retryRequest: (config: RetryableRequestConfig) => Promise<AxiosResponse>;
}> = [];

export const setSessionHandlers = (handlers: SessionHandlers | null) => {
  sessionHandlers = handlers;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Diagnostic-only request/response logging, gated behind __DEV__ so it
// never ships to production. Registered FIRST on both the bare `axios`
// singleton and the `api` instance (below), so it observes the raw
// request/response/error before the token-attach and refresh-retry
// interceptors touch anything — this distinguishes three failure modes
// that otherwise all look identical from the UI ("nothing happens"):
// server responded with an error, request sent but no response at all
// (wrong IP/port, cleartext blocked, server down), or the request never
// left the device (bug before the network call).
const logRequest = (config: InternalAxiosRequestConfig) => {
  if (__DEV__) {
    console.log(`[API →] ${config.method?.toUpperCase()} ${config.baseURL ?? ""}${config.url}`, {
      data: config.data,
    });
  }
  return config;
};

const logRequestError = (error: unknown) => {
  if (__DEV__) {
    console.log("[API → ERROR]", error);
  }
  return Promise.reject(error);
};

const logResponse = (response: AxiosResponse) => {
  if (__DEV__) {
    console.log(`[API ←] ${response.status} ${response.config.url}`, response.data);
  }
  return response;
};

const logResponseError = (error: AxiosError) => {
  if (__DEV__) {
    if (error.response) {
      console.log(`[API ← ERROR] ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.log("[API ← NO RESPONSE] request sent but no response received", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
      });
    } else {
      console.log("[API ← SETUP ERROR] request never sent", error.message);
    }
  }
  return Promise.reject(error);
};

axios.interceptors.request.use(logRequest, logRequestError);
axios.interceptors.response.use(logResponse, logResponseError);
api.interceptors.request.use(logRequest, logRequestError);
api.interceptors.response.use(logResponse, logResponseError);

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

  pending.forEach(({ resolve, reject, config, retryRequest }) => {
    if (error || !accessToken) {
      reject(error || new Error("Session refresh failed"));
      return;
    }

    const nextHeaders = {
      ...(config.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };

    retryRequest({ ...config, headers: nextHeaders })
      .then(resolve)
      .catch(reject);
  });
};

// Unified passwordless OTP auth (v5) — pre-session calls that must never
// carry a stale Authorization header or trigger the refresh-token dance on
// a 401/404 (e.g. /check 404s on purpose for unregistered identifiers).
// The old password system (/login, /register, /verify-email) and the old
// split mobile/email routes all 404 on the backend now and nothing in this
// app calls them — not whitelisted here since they're genuinely dead.
const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/v1/auth/login") ||
    url.includes("/v1/auth/request-otp") ||
    url.includes("/v1/auth/verify-otp") ||
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

const handleUnauthorizedResponse = async (
  error: AxiosError,
  retryRequest: (config: RetryableRequestConfig) => Promise<AxiosResponse>,
) => {
    const status = error.response?.status;
    const originalConfig = (error.config || {}) as RetryableRequestConfig;

    if (!status || status !== 401 || originalConfig._retry || isAuthEndpoint(originalConfig.url)) {
      return Promise.reject(error);
    }

    if (!sessionHandlers) {
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        queuedRequests.push({ resolve, reject, config: originalConfig, retryRequest });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await sessionHandlers.getRefreshToken();

      if (!refreshToken) {
        await sessionHandlers.onLogout("missing_refresh");
        flushQueuedRequests(new Error("Missing refresh token"), null);
        return Promise.reject(error);
      }

      const refreshResponse = await axios.post(`${API_BASE_URL}/v1/auth/refresh-token`, {
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

      return retryRequest({ ...originalConfig, headers: retriedHeaders });
    } catch (refreshError) {
      flushQueuedRequests(refreshError, null);
      await sessionHandlers.onLogout("refresh_failed");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
};

export const attachSessionRefreshInterceptor = (client: AxiosInstance) =>
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => handleUnauthorizedResponse(error, (config) => client(config)),
  );

// Handle 401s from the shared client.
attachSessionRefreshInterceptor(api);

// A number of older module APIs still use the default axios export directly.
// Give those requests the same refresh-and-retry behavior until all modules
// have migrated to the shared client.
axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleUnauthorizedResponse(error, (config) => axios(config)),
);

export default api;
