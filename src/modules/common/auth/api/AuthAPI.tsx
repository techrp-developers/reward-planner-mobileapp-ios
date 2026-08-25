import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./axios";
import { API_BASE_URL } from "../../../../config/apiConfig";
import {
  AUTH_USER_NAME_KEY,
  clearAccessToken,
  clearSession,
  getAccessToken,
  getCachedUserName,
  getRefreshToken,
  saveSession,
  updateAccessToken,
} from "../../../../utils/tokenStorage";

let authToken: string | null = null;

const normalizeToken = (token?: string | null) => {
  const cleaned = String(token || "").trim();

  if (!cleaned || cleaned === "logged-in-session") {
    return null;
  }

  if (cleaned.toLowerCase().startsWith("bearer ")) {
    return cleaned.slice(7).trim() || null;
  }

  return cleaned;
};

const applyAuthHeader = (token?: string | null) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

export const setAuthToken = (token?: string | null) => {
  authToken = normalizeToken(token);
  applyAuthHeader(authToken);
};

export const persistAuthToken = async (token?: string | null) => {
  const normalizedToken = normalizeToken(token);
  setAuthToken(normalizedToken);

  if (normalizedToken) {
    await updateAccessToken(normalizedToken);
    return;
  }

  await clearAccessToken();
};

export const hydrateAuthToken = async () => {
  const storedToken = await getAccessToken();
  const normalizedToken = normalizeToken(storedToken);

  if (!normalizedToken && storedToken) {
    await clearAccessToken();
  }

  setAuthToken(normalizedToken);
  return normalizedToken;
};

export const clearAuthToken = async () => {
  setAuthToken(null);
  await clearAccessToken();
};

export const setStoredUserName = async (name?: string | null) => {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    await AsyncStorage.removeItem(AUTH_USER_NAME_KEY);
    return;
  }

  await AsyncStorage.setItem(AUTH_USER_NAME_KEY, normalizedName);
};

export const getStoredUserName = async () => {
  const storedName = await getCachedUserName();
  const normalizedName = String(storedName || "").trim();
  return normalizedName || null;
};

export const getAuthToken = () => authToken;
export const isAuthenticated = () => Boolean(authToken);

export const getAuthHeaders = async () => {
  const token = getAuthToken() || (await hydrateAuthToken());

  if (!token) {
    applyAuthHeader(null);
    return {};
  }

  setAuthToken(token);

  return {
    Authorization: `Bearer ${token}`,
  };
};

export interface ApiUser {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  terms_accepted: 0 | 1;
  fitness_onboarding_done: 0 | 1;
}

export interface AuthSuccessResponse {
  success: true;
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export interface CheckIdentifierResponse {
  success: true;
  registered: true;
  type: "phone" | "email";
}

export const isOnboardingComplete = (user?: Partial<ApiUser> | null) => {
  return Boolean(user?.terms_accepted && user?.fitness_onboarding_done);
};

export const fetchUserInfo = async () => {
  const hasInMemoryToken = isAuthenticated();

  if (!hasInMemoryToken) {
    const token = await hydrateAuthToken();
    if (!token) {
      return null;
    }
  }

  try {
    const headers = await getAuthHeaders();

    if (!headers.Authorization) {
      return null;
    }

    const res = await api.get("/v1/auth/user-info", { headers });
    const responseData = res?.data || {};
    const user = responseData?.user || responseData?.data?.user || responseData?.data || null;

    const fullName = user?.name || user?.full_name || user?.username || null;
    const nameParts = fullName ? fullName.trim().split(/\s+/) : [];
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(" ") || null;

    const defaultAddress = user?.defaultAddress || null;
    const city = defaultAddress?.city || null;
    const pincode = defaultAddress?.zipcode || null;
    const state = defaultAddress?.state || null;

    return {
      ...responseData,
      user: {
        ...(user || {}),
        first_name: firstName,
        last_name: lastName,
        city,
        pincode,
        state,
      },
      name: fullName,
    };
  } catch (error: any) {
    const status = error?.response?.status;

    if (status === 401) {
      console.debug("User info fetch: Unauthorized (token may be expired)");
      await clearAuthToken();
      return null;
    }

    if (status >= 500) {
      console.warn("User info fetch: Server error", status);
      return null;
    }

    console.debug("User info fetch failed:", error?.message || error);
    return null;
  }
};

export const deleteCustomer = async () => {
  try {
    const res = await api.delete("/v1/auth/delete-customer");
    return res.data;
  } catch (error) {
    console.error("Delete customer API failed", error);
    throw error;
  }
};

export const updateProfile = async (formData: FormData) => {
  const res = await api.put("/v1/auth/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

const withLog = <A extends any[], R>(label: string, fn: (...args: A) => Promise<R>) => {
  return async (...args: A): Promise<R> => {
    if (__DEV__) console.log(`[${label}] called with`, ...args);
    try {
      const result = await fn(...args);
      if (__DEV__) console.log(`[${label}] success`, result);
      return result;
    } catch (err) {
      if (__DEV__) console.log(`[${label}] failed`, err);
      throw err;
    }
  };
};

export type CheckExistenceResponse = {
  success: boolean;
  registered: boolean;
  type?: "phone" | "email";
};

export type SendOtpResponse = {
  success: boolean;
  message: string;
};

export type OtpUser = ApiUser;

export type VerifyOtpResponse = AuthSuccessResponse;

export const checkIdentifier = withLog("checkIdentifier", async (
  identifier: string,
): Promise<CheckIdentifierResponse> => {
  const { data } = await api.post<CheckIdentifierResponse>("/v1/auth/check", { identifier });
  return data;
});

export const sendOtp = withLog("sendOtp", async (
  identifier: string,
): Promise<SendOtpResponse> => {
  const { data } = await api.post<SendOtpResponse>("/v1/auth/send-otp", { identifier });
  return data;
});

export const verifyOtp = withLog("verifyOtp", async (
  identifier: string,
  otp: string,
): Promise<VerifyOtpResponse> => {
  const { data } = await api.post<AuthSuccessResponse>("/v1/auth/verify-otp", { identifier, otp });
  await saveSession(data.accessToken, data.refreshToken, data.user.name);
  setAuthToken(data.accessToken);
  return data;
});

export const refreshAccessToken = withLog("refreshAccessToken", async (
  refreshToken: string,
): Promise<{ success: boolean; accessToken: string }> => {
  const { data } = await api.post<{ success: boolean; accessToken: string }>("/v1/auth/refresh-token", { refreshToken });
  return data;
});

export const logout = withLog("logout", async (): Promise<void> => {
  try {
    await api.post("/v1/auth/logout");
  } catch (err) {
    console.log("[logout] server call failed (clearing local session anyway)", err);
  } finally {
    await clearSession();
    setAuthToken(null);
  }
});

export const restoreSession = async (): Promise<{ accessToken: string } | null> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await api.post<{ success: boolean; accessToken: string }>("/v1/auth/refresh-token", { refreshToken });
    return data;
  } catch (err) {
    console.log("[restoreSession] failed, session invalid", err);
    return null;
  }
};

export const completeOnboarding = withLog("completeOnboarding", async () => {
  const { data } = await api.post<{ success: boolean }>('/v1/auth/complete-onboarding');
  return data;
});
