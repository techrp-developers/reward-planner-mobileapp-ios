import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import api from "../../common/auth/api/axios";

/**
 * BBPS diagnostics layer.
 *
 * BillsAPI.ts historically called raw `axios.post(...)` with a manually
 * attached Authorization header, bypassing the shared `api` instance in
 * common/auth/api/axios.ts entirely — which means none of its 401-refresh
 * logic, nor any request/response logging, ever ran for BBPS calls. That is
 * why a failing create-order call for one operator produced no response log
 * at all: the promise rejected before the screen's own console.log ran, and
 * nothing upstream recorded *why*.
 *
 * `apiClient` re-exports the same shared `api` instance (so 401/refresh
 * handling and the bbps API base URL stay centralized) and layers on
 * request/response/error logging + duration timing + error classification,
 * so every BBPS call is now fully observable.
 */

type RequestMetadata = { startTime: number };
type ConfigWithMetadata = InternalAxiosRequestConfig & {
  metadata?: RequestMetadata;
  _dedupeKey?: string;
  _retryCount?: number;
};

// ---- Request de-duplication ------------------------------------------------
// Identical concurrent GETs (same method+url+params) share a single in-flight
// promise instead of firing duplicate network requests — common when a screen
// re-mounts/re-renders while a previous fetch for the same data is still out.
const inFlightRequests = new Map<string, Promise<AxiosResponse>>();

const buildDedupeKey = (config: ConfigWithMetadata) =>
  `${(config.method || "get").toLowerCase()}:${config.baseURL ?? ""}${config.url}:${JSON.stringify(
    config.params ?? {}
  )}`;

const RETRYABLE_BACKOFF_MS = [1000, 2000];

const isRetryableNetworkError = (error: AxiosError) =>
  !error.response &&
  (error.code === "ERR_NETWORK" ||
    error.code === "ECONNABORTED" ||
    error.message === "Network Error" ||
    /timeout/i.test(error.message || ""));

export type ApiErrorKind =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "UNKNOWN_ERROR";

export type NormalizedApiError = {
  success: false;
  status: number | null;
  kind: ApiErrorKind;
  message: string;
  error: any;
};

const isTimeoutError = (error: AxiosError) =>
  error.code === "ECONNABORTED" || /timeout/i.test(error.message || "");

const isNetworkError = (error: AxiosError) =>
  !error.response && (error.code === "ERR_NETWORK" || error.message === "Network Error");

export const classifyAxiosError = (error: AxiosError): NormalizedApiError => {
  if (isTimeoutError(error)) {
    return {
      success: false,
      status: null,
      kind: "TIMEOUT_ERROR",
      message: "The request timed out. Please check your connection and try again.",
      error: { code: error.code, message: error.message },
    };
  }

  if (isNetworkError(error)) {
    return {
      success: false,
      status: null,
      kind: "NETWORK_ERROR",
      message: "Network error. Please check your internet connection and try again.",
      error: { code: error.code, message: error.message },
    };
  }

  const status = error.response?.status ?? null;
  const data: any = error.response?.data;
  const backendMessage = data?.message || data?.error || error.message;

  if (status === 401) {
    return {
      success: false,
      status,
      kind: "UNAUTHORIZED",
      message: backendMessage || "Session expired. Please log in again.",
      error: data,
    };
  }

  if (status === 422) {
    return {
      success: false,
      status,
      kind: "VALIDATION_ERROR",
      message: backendMessage || "The backend rejected this request as invalid.",
      error: data,
    };
  }

  if (status === 400) {
    return {
      success: false,
      status,
      kind: "BAD_REQUEST",
      message: backendMessage || "Invalid request.",
      error: data,
    };
  }

  if (status && status >= 500) {
    return {
      success: false,
      status,
      kind: "SERVER_ERROR",
      message: backendMessage || "Server error. Please try again later.",
      error: data,
    };
  }

  return {
    success: false,
    status,
    kind: "UNKNOWN_ERROR",
    message: backendMessage || "Something went wrong.",
    error: data ?? { code: error.code, message: error.message },
  };
};

// ---- Request: stamp start time + log outgoing request ---------------------
api.interceptors.request.use((config: ConfigWithMetadata) => {
  config.metadata = { startTime: Date.now() };

  if (__DEV__) {
    __DEV__ && console.log(
      `[BBPS API →] ${(config.method || "GET").toUpperCase()} ${config.baseURL ?? ""}${config.url}`,
      {
        payload: config.data,
        params: config.params,
        headers: config.headers,
      }
    );
  }

  return config;
});

// ---- Response: log outcome + duration, normalize errors -------------------
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as ConfigWithMetadata;
    const durationMs = config.metadata ? Date.now() - config.metadata.startTime : undefined;

    if (__DEV__) {
      __DEV__ && console.log(
        `[BBPS API ←] ${(config.method || "GET").toUpperCase()} ${config.url} — ${response.status} (${durationMs}ms)`,
        response.data
      );
    }

    return response;
  },
  (error: AxiosError) => {
    const config = error.config as ConfigWithMetadata | undefined;

    // Retry only network/timeout failures (no response at all) — never 4xx/5xx,
    // since those are real backend answers, not transport hiccups.
    if (config && isRetryableNetworkError(error)) {
      const retryCount = config._retryCount ?? 0;

      if (retryCount < RETRYABLE_BACKOFF_MS.length) {
        config._retryCount = retryCount + 1;
        const delay = RETRYABLE_BACKOFF_MS[retryCount];

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            api.request(config).then(resolve).catch(reject);
          }, delay);
        });
      }
    }

    const durationMs = config?.metadata ? Date.now() - config.metadata.startTime : undefined;
    const normalized = classifyAxiosError(error);

    if (__DEV__) {
      console.error(
        `[BBPS API ✗] ${(config?.method || "GET").toUpperCase()} ${config?.url} — ${normalized.kind} (${durationMs}ms)`,
        {
          status: normalized.status,
          message: normalized.message,
          requestPayload: config?.data,
          requestHeaders: config?.headers,
          responseBody: error.response?.data,
          axiosCode: error.code,
          isAxiosNetworkError: isNetworkError(error),
          isTimeout: isTimeoutError(error),
        }
      );
    }

    return Promise.reject(normalized);
  }
);

// ---- Dedupe identical concurrent GETs --------------------------------------
// Re-mounts/re-renders can fire the same GET (same url+params) while the first
// one is still in flight; share the one promise instead of doubling the load.
const originalRequest = api.request.bind(api);

api.request = ((config: ConfigWithMetadata) => {
  const method = (config.method || "get").toLowerCase();

  if (method !== "get") {
    return originalRequest(config);
  }

  const key = buildDedupeKey({ ...config, method });
  const existing = inFlightRequests.get(key);

  if (existing) {
    return existing;
  }

  const pending = originalRequest(config).finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, pending);
  return pending;
}) as typeof api.request;

export const apiClient = api;
export default api;
