import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import api, { API_BASE_URL, setSessionHandlers } from "../api/axios";
import { setAuthToken as setLegacyAuthToken } from "../api/AuthAPI";
import { fetchTermsStatus } from "../../../ecommerce/api/TermsConditionAPI";
import { isTokenExpiringSoon } from "../utils/jwtUtils";

const REFRESH_TOKEN_KEY = "@rewardsplanners_refresh_token";
const DEVICE_ID_KEY = "@rewardsplanners_device_id";

type AuthUser = {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: number;
  is_verified?: number;
};

type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  cpassword: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  loading: boolean;
  // null = not yet checked; false = must accept; true = already accepted
  termsAccepted: boolean | null;
  setTermsAccepted: (v: boolean) => void;
  // null = no pending popup; number = reward coins to show once, post-login.
  firstLoginReward: number | null;
  markFirstLoginRewardShown: () => void;
  register: (payload: RegisterPayload) => Promise<any>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<any>;
  login: (payload: LoginPayload) => Promise<any>;
  bootstrapSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const loadSecureStore = () => {
  try {
    const SecureStore = require("expo-secure-store");

    if (
      SecureStore &&
      typeof SecureStore.getItemAsync === "function" &&
      typeof SecureStore.setItemAsync === "function" &&
      typeof SecureStore.deleteItemAsync === "function"
    ) {
      return SecureStore;
    }

    return null;
  } catch {
    return null;
  }
};

const secureStore = loadSecureStore();

const secureSetItem = async (key: string, value: string) => {
  if (secureStore) {
    await secureStore.setItemAsync(key, value);
    return;
  }

  await AsyncStorage.setItem(key, value);
};

const secureGetItem = async (key: string) => {
  if (secureStore) {
    return secureStore.getItemAsync(key);
  }

  return AsyncStorage.getItem(key);
};

const secureDeleteItem = async (key: string) => {
  if (secureStore) {
    await secureStore.deleteItemAsync(key);
    return;
  }

  await AsyncStorage.removeItem(key);
};

const extractUser = (payload: any): AuthUser | null => {
  const user = payload?.user || payload?.data?.user || payload?.data || null;

  if (!user) return null;

  return user;
};

const generateDeviceId = () => {
  const randomPart = Math.random().toString(36).substring(2, 12);
  const timePart = Date.now().toString(36);

  return `rp-${Platform.OS}-${timePart}-${randomPart}`;
};

const getDeviceName = () => {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  return "unknown";
};

const getOrCreateDeviceId = async () => {
  const existingDeviceId = await secureGetItem(DEVICE_ID_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const newDeviceId = generateDeviceId();
  await secureSetItem(DEVICE_ID_KEY, newDeviceId);
  return newDeviceId;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading]         = useState(false);

  // null  = not yet checked (show Splash while waiting)
  // false = API returned terms_accepted: false  → show TermsGate
  // true  = API returned terms_accepted: true   → show App directly
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  // Pending first-login reward popup; set right after login, cleared once
  // the Dashboard has shown it and the user dismissed it.
  const [firstLoginReward, setFirstLoginReward] = useState<number | null>(null);

  const accessTokenRef    = useRef<string | null>(null);
  const isLoggingOutRef   = useRef(false);

  const updateAccessToken = useCallback((nextAccessToken: string | null) => {
    accessTokenRef.current = nextAccessToken;
    setAccessToken(nextAccessToken);
  }, []);

  const clearLocalSession = useCallback(async () => {
    updateAccessToken(null);
    setUser(null);
    setLegacyAuthToken(null);
    setTermsAccepted(null); // reset so next login re-checks
    setFirstLoginReward(null);
    await secureDeleteItem(REFRESH_TOKEN_KEY);
  }, [updateAccessToken]);

  const fetchProfile = useCallback(async () => {
    const profileRes = await api.get("/v1/auth/user-info");
    const nextUser = extractUser(profileRes.data);
    setUser(nextUser);
    return nextUser;
  }, []);

  // Check terms acceptance once after auth is established.
  // On network error: default true — don't block returning users for a failed fetch.
  const checkTerms = useCallback(async () => {
    try {
      const res = await fetchTermsStatus();
      setTermsAccepted(!!res.terms_accepted);
    } catch {
      setTermsAccepted(true);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const response = await api.post("/v1/auth/register", payload);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    if (!token?.trim()) return false;

    const response = await axios.get(`${API_BASE_URL}/v1/auth/verify-email`, {
      params: { token: token.trim() },
      responseType: "text",
    });

    return response.status >= 200 && response.status < 300;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const response = await api.post("/v1/auth/resend-verification", { email });
    return response.data;
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const deviceId   = await getOrCreateDeviceId();
        const deviceName = getDeviceName();

        const response = await api.post("/v1/auth/login", {
          email:       payload.email.trim().toLowerCase(),
          password:    payload.password,
          device_id:   deviceId,
          device_name: deviceName,
        });

        const nextAccessToken  = response.data?.accessToken  || null;
        const nextRefreshToken = response.data?.refreshToken || null;

        if (!nextAccessToken || !nextRefreshToken) {
          throw new Error("Invalid login response");
        }

        updateAccessToken(nextAccessToken);
        setLegacyAuthToken(nextAccessToken);

        await secureSetItem(REFRESH_TOKEN_KEY, nextRefreshToken);
        await fetchProfile();

        // Check terms AFTER profile is loaded so the gate screen
        // already has the user's context available.
        await checkTerms();

        // The backend tracks first-login state itself: `awarded` is only
        // true once, ever, per account — subsequent logins return
        // awarded: false, so no local "already shown" bookkeeping needed.
        const reward = response.data?.firstLoginReward;
        if (reward?.awarded === true && reward?.coins > 0) {
          setFirstLoginReward(reward.coins);
        }

        return response.data;
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile, checkTerms, updateAccessToken],
  );

  const markFirstLoginRewardShown = useCallback(() => {
    setFirstLoginReward(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const currentAccessToken = accessTokenRef.current;

    // If the in-memory token is still valid and not expiring soon, skip the
    // refresh call entirely and just re-validate profile/terms.
    if (currentAccessToken && !isTokenExpiringSoon(currentAccessToken)) {
      await fetchProfile();
      await checkTerms();
      return;
    }

    const refreshToken = await secureGetItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      updateAccessToken(null);
      setUser(null);
      return;
    }

    try {
      const refreshRes = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
        refreshToken,
      });

      const nextAccessToken = refreshRes.data?.accessToken || null;

      if (!nextAccessToken) {
        throw new Error("Missing access token from refresh");
      }

      updateAccessToken(nextAccessToken);
      setLegacyAuthToken(nextAccessToken);

      await fetchProfile();

      // Re-check terms on every session restore so the gate shows
      // correctly if the user was previously mid-onboarding.
      await checkTerms();
    } catch (error: any) {
      const status = error?.response?.status;

      // Only clear the local session on a definitive auth failure
      // (401/403). Network blips and timeouts should not log the user out.
      if (status === 401 || status === 403) {
        await clearLocalSession();
      }
      throw error;
    }
  }, [clearLocalSession, fetchProfile, checkTerms, updateAccessToken]);

  const bootstrapSession = useCallback(async () => {
    try {
      await restoreSession();
    } catch {
      // Fallback to AuthStack on restore failure.
    } finally {
      setIsInitializing(false);
    }
  }, [restoreSession]);

  useEffect(() => {
    setSessionHandlers({
      getAccessToken: () => accessTokenRef.current,

      getRefreshToken: async () => secureGetItem(REFRESH_TOKEN_KEY),

      onAccessTokenRefresh: async (nextAccessToken) => {
        updateAccessToken(nextAccessToken);
        setLegacyAuthToken(nextAccessToken);
      },

      onLogout: async () => {
        await clearLocalSession();
      },
    });

    return () => {
      setSessionHandlers(null);
    };
  }, [clearLocalSession, updateAccessToken]);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return;

    isLoggingOutRef.current = true;
    setLoading(true);

    try {
      const refreshToken = await secureGetItem(REFRESH_TOKEN_KEY);

      await api.post("/v1/auth/logout", {
        refreshToken: refreshToken || undefined,
      });
    } catch {
      // logout local session even if API fails
    } finally {
      await clearLocalSession();
      isLoggingOutRef.current = false;
      setLoading(false);
    }
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isInitializing,
      loading,
      termsAccepted,
      setTermsAccepted,
      firstLoginReward,
      markFirstLoginRewardShown,
      register,
      verifyEmail,
      resendVerification,
      login,
      bootstrapSession,
      restoreSession,
      logout,
    }),
    [
      user,
      accessToken,
      isInitializing,
      loading,
      termsAccepted,
      firstLoginReward,
      markFirstLoginRewardShown,
      register,
      verifyEmail,
      resendVerification,
      login,
      bootstrapSession,
      restoreSession,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
