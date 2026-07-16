  import axios from "axios";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import api from "./axios";

  const API_BASE_URL = "https://rewardplanners.com/api/crm";
  const AUTH_TOKEN_KEY = "@rewardsplanners_auth_token";
  const AUTH_USER_NAME_KEY = "@rewardsplanners_user_name";

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

  const extractToken = (responseData: any) => {
    return (
      responseData?.token ||
      responseData?.accessToken ||
      responseData?.access_token ||
      responseData?.data?.token ||
      responseData?.data?.accessToken ||
      responseData?.data?.access_token ||
      responseData?.data?.jwt ||
      responseData?.jwt ||
      responseData?.data?.tokens?.access?.token ||
      responseData?.tokens?.access?.token ||
      null
    );
  };

  const extractUserName = (responseData: any) => {
    return (
      responseData?.name ||
      responseData?.user?.name ||
      responseData?.user?.full_name ||
      responseData?.user?.username ||
      responseData?.data?.name ||
      responseData?.data?.user?.name ||
      responseData?.data?.user?.full_name ||
      responseData?.data?.user?.username ||
      null
    );
  };

  export const setAuthToken = (token?: string | null) => {
    authToken = normalizeToken(token);
    applyAuthHeader(authToken);
  };

  export const persistAuthToken = async (token?: string | null) => {
    const normalizedToken = normalizeToken(token);
    setAuthToken(normalizedToken);

    if (normalizedToken) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, normalizedToken);
      return;
    }

    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  };

  export const hydrateAuthToken = async () => {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const normalizedToken = normalizeToken(storedToken);

    if (!normalizedToken && storedToken) {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }

    setAuthToken(normalizedToken);
    return normalizedToken;
  };

  export const clearAuthToken = async () => {
    await persistAuthToken(null);
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
    const storedName = await AsyncStorage.getItem(AUTH_USER_NAME_KEY);
    const normalizedName = String(storedName || "").trim();
    return normalizedName || null;
  };

  export const getAuthToken = () => authToken;
  export const isAuthenticated = () => Boolean(authToken);

  export const getAuthHeaders = async () => {
    const token =
      getAuthToken() || normalizeToken(await AsyncStorage.getItem(AUTH_TOKEN_KEY));

    if (!token) {
      applyAuthHeader(null);
      return {};
    }

    setAuthToken(token);

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  export type RegisterPayload = {
    name: string;
      email: string;
      phone: string;
      password: string;
      cpassword: string;
  };

  export const register = async (payload: RegisterPayload) => {
    console.log("📦 Sending Register payload:", payload);

    const res = await axios.post(`${API_BASE_URL}/v1/auth/register`, payload);

    console.log("✅ Register response:", res.data);

    const token = extractToken(res.data);
    if (token) {
      await persistAuthToken(token);
    }

    const userName = extractUserName(res.data) || payload?.name;
    if (userName) {
      await setStoredUserName(userName);
    }

    return res.data;
  };

  export type LoginPayload = {
      email: string;
      password: string;
  };

  export const login = async (payload: LoginPayload) => {
    console.log("📦 Sending Login payload:", payload);
    const res = await axios.post(`${API_BASE_URL}/v1/auth/login`, payload);
    console.log("✅ Login response:", res.data);

    const token = extractToken(res.data);

    if (token) {
      await persistAuthToken(token);
    } else {
      await clearAuthToken();
    }

    const userName = extractUserName(res.data);
    if (userName) {
      await setStoredUserName(userName);
    }

    return res.data;
  };
  export const fetchUserInfo = async () => {
    // Fast-path: check in-memory token synchronously before any async work.
    // This prevents the 5-second polling in home_chart.tsx from hammering
    // AsyncStorage and filling the log with "no auth token" messages on every tick.
    if (!isAuthenticated()) {
      return null;
    }

    try {
      const headers = await getAuthHeaders();

      if (!headers.Authorization) {
        // Token was present in memory but cleared by getAuthHeaders (invalid/expired)
        return null;
      }

      const res = await api.get("/v1/auth/user-info", { headers });

      const responseData = res?.data || {};
      const user =
        responseData?.user ||
        responseData?.data?.user ||
        responseData?.data ||
        null;

      const fullName = user?.name || user?.full_name || user?.username || null;
      const nameParts = fullName ? fullName.trim().split(/\s+/) : [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(" ") || null;

      const defaultAddress = user?.defaultAddress || null;
      const city = defaultAddress?.city || null;
      const pincode = defaultAddress?.zipcode || null;
      const state = defaultAddress?.state || null;

      const result = {
        ...responseData,
        user: {
          ...user,
          first_name: firstName,
          last_name: lastName,
          city,
          pincode,
          state,
        },
        name: fullName,
      };

      return result;
    } catch (error: any) {
      const status = error?.response?.status;
      
      if (status === 401) {
        console.debug('User info fetch: Unauthorized (token may be expired)');
        await clearAuthToken();
        return null;
      }
      
      if (status >= 500) {
        console.warn('User info fetch: Server error', status);
        return null;
      }
      
      console.debug('User info fetch failed:', error?.message || error);
      return null;
    }
  };

  export const deleteCustomer = async () => {
    try {
      const res = await api.delete("/v1/auth/delete-customer");

      return res.data;
    } catch (error) {
      console.error('Delete customer API failed', error);
      throw error;
    }
  };

  export const updateProfile = async (formData: FormData) => {
    const res = await api.put("/v1/auth/profile", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  };

  export type ActivateAccountPayload = {
    email: string;
  };

  export const activateAccount = async (payload: ActivateAccountPayload) => {
    console.log("📦 Sending Activate Account payload:", payload);
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/activate-account`,
      payload
    );
    console.log("✅ Activate Account response:", res.data);
    return res.data;
  };

  export type VerifyActivationOtpPayload = {
    email: string;
    otp: string | number;
  };

  export const verifyActivationOtp = async (
    payload: VerifyActivationOtpPayload
  ) => {
    console.log("📦 Sending Verify Activation OTP payload:", payload);
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/verify-activation-otp`,
      payload
    );
    console.log("✅ Verify Activation OTP response:", res.data);

    const token = extractToken(res.data);
    if (token) {
      await persistAuthToken(token);
    }

    const userName = extractUserName(res.data);
    if (userName) {
      await setStoredUserName(userName);
    }

    return res.data;
  };

  export type SetPasswordPayload = {
    email: string;
    password: string;
  };

  export const setPassword = async (payload: SetPasswordPayload) => {
    console.log("📦 Sending Set Password payload:", {
      ...payload,
      password: "***",
    });
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/set-password`,
      payload
    );
    console.log("✅ Set Password response:", res.data);

    const token = extractToken(res.data);
    if (token) {
      await persistAuthToken(token);
    }

    const userName = extractUserName(res.data);
    if (userName) {
      await setStoredUserName(userName);
    }

    return res.data;
  };

  // =============================== Forgot Password ==============================

  export type ForgotPasswordPayload = {
    email: string;
  };

  export const forgotPassword = async (payload: ForgotPasswordPayload) => {
    console.log("📦 Sending Forgot Password payload:", payload);
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/forgot-password`,
      payload
    );
    console.log("✅ Forgot Password response:", res.data);
    return res.data;
  };

  // =============================== Resend OTP ==============================

  export type ResendOtpPayload = {
    email: string;
  };

  export const resendOtp = async (payload: ResendOtpPayload) => {
    console.log("📦 Sending Resend OTP payload:", payload);
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/resend-otp`,
      payload
    );
    console.log("✅ Resend OTP response:", res.data);
    return res.data;
  };

  // =============================== Verify Forgot Password OTP ==============================

  export type VerifyForgotPasswordOtpPayload = {
    email: string;
    otp: string;
  };

  export const verifyForgotPasswordOtp = async (
    payload: VerifyForgotPasswordOtpPayload
  ) => {
    console.log("📦 Sending Verify Forgot Password OTP payload:", payload);
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/verify-forgot-password-otp`,
      payload
    );
    console.log("✅ Verify Forgot Password OTP response:", res.data);
    return res.data;
  };

  // =============================== Reset Password ==============================

  export type ResetPasswordPayload = {
    email: string;
    newPassword: string;
  };

  export const resetPassword = async (payload: ResetPasswordPayload) => {
    console.log("📦 Sending Reset Password payload:", {
      ...payload,
      newPassword: "***",
    });
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/reset-password`,
      payload
    );
    console.log("✅ Reset Password response:", res.data);
    return res.data;
  };

  // =============================== Resend Activation OTP ==============================

  export type ResendActivationOtpPayload = {
    email: string;
  };

  export const resendActivationOtp = async (
    payload: ResendActivationOtpPayload
  ) => {
    console.log("📦 Sending Resend Activation OTP payload:", payload);
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/resend-activation-otp`,
      payload
    );
    console.log("✅ Resend Activation OTP response:", res.data);
    return res.data;
  };

  // =============================== Change Password ==============================

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const changePassword = async (
  payload: ChangePasswordPayload
) => {
  console.log("📦 Sending Change Password payload:", {
    currentPassword: "***",
    newPassword: "***",
  });

  const res = await api.put("/v1/auth/change-password", payload);

  console.log("✅ Change Password response:", res.data);

  return res.data;
};
