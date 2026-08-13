import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setSessionHandlers } from "../api/axios";
import {
  fetchUserInfo,
  isOnboardingComplete,
  logout as logoutRequest,
  restoreSession as restoreAuthSession,
  VerifyOtpResponse,
} from "../api/AuthAPI";
import {
  clearSession,
  getRefreshToken,
  updateAccessToken as persistAccessTokenInKeychain,
} from "../../../../utils/tokenStorage";
import { isTokenExpiringSoon } from "../utils/jwtUtils";

type AuthUser = {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: number;
  is_verified?: number;
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
  authenticateWithTokens: (result: VerifyOtpResponse) => Promise<void>;
  bootstrapSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const extractUser = (payload: any): AuthUser | null => {
  const user = payload?.user || payload?.data?.user || payload?.data || null;

  if (!user) return null;

  return user;
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
    setTermsAccepted(null);
    setFirstLoginReward(null);
    await clearSession();
  }, [updateAccessToken]);

  const fetchProfile = useCallback(async () => {
    const profileRes = await fetchUserInfo();
    const nextUser = extractUser(profileRes || {});
    setUser(nextUser);
    return nextUser;
  }, []);

  const syncOnboardingState = useCallback(async (payload: any) => {
    const user = extractUser(payload);
    setUser(user);
    setTermsAccepted(isOnboardingComplete(user));
    return user;
  }, []);

  const authenticateWithTokens = useCallback(
    async (result: VerifyOtpResponse) => {
      setLoading(true);
      try {
        if (!result?.accessToken || !result?.refreshToken) {
          throw new Error("Invalid OTP verification response");
        }

        // verifyOtp() already persisted the session (Keychain + cached
        // username) — this just brings in-memory state up to match. Do NOT
        // call clearSession() here: it wipes the tokens verifyOtp just saved.
        updateAccessToken(result.accessToken);
        await syncOnboardingState(result);
      } finally {
        setLoading(false);
      }
    },
    [syncOnboardingState, updateAccessToken],
  );

  const markFirstLoginRewardShown = useCallback(() => {
    setFirstLoginReward(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const currentAccessToken = accessTokenRef.current;

    if (currentAccessToken && !isTokenExpiringSoon(currentAccessToken)) {
      await fetchProfile();
      return;
    }

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      updateAccessToken(null);
      setUser(null);
      setTermsAccepted(null);
      return;
    }

    try {
      const refreshRes = await restoreAuthSession();
      const nextAccessToken = refreshRes?.accessToken || null;

      if (!nextAccessToken) {
        throw new Error("Missing access token from refresh");
      }

      updateAccessToken(nextAccessToken);
      await persistAccessTokenInKeychain(nextAccessToken);
      const profile = await fetchProfile();
      setTermsAccepted(isOnboardingComplete(profile as any));
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        await clearLocalSession();
      }
      throw error;
    }
  }, [clearLocalSession, fetchProfile, updateAccessToken]);

  const bootstrapSession = useCallback(async () => {
    try {
      await restoreSession();
    } catch (error) {
      // Fallback to AuthStack on restore failure.
      if (__DEV__) console.log("[AuthContext] bootstrapSession restore failed", error);
    } finally {
      setIsInitializing(false);
    }
  }, [restoreSession]);

  useEffect(() => {
    setSessionHandlers({
      getAccessToken: () => accessTokenRef.current,

      getRefreshToken: async () => getRefreshToken(),

      onAccessTokenRefresh: async (nextAccessToken) => {
        updateAccessToken(nextAccessToken);
        await persistAccessTokenInKeychain(nextAccessToken);
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
      await logoutRequest();
    } catch (error) {
      if (__DEV__) console.log("[AuthContext] logout failed, clearing local session anyway", error);
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
      authenticateWithTokens,
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
      authenticateWithTokens,
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
