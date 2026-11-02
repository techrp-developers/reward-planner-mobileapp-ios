import axios from "axios";
import { Platform } from "react-native";

import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
import { api } from "../../common/auth/api/axios";
import { BASE_API_URL } from "../../services/api/api";

export const NOTIFICATION_PAGE_SIZE = 20;

export type NotificationItem = {
  notification_id: number;
  module: string;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  reference_type: string | null;
  reference_id: string | null;
  action_url: string | null;
  metadata: Record<string, any> | null;
  priority: "low" | "normal" | "high" | string;
  is_read: number | boolean;
  created_at: string;
};

export type NotificationResponse = {
  success: boolean;
  data: NotificationItem[];
  message?: string;
};

export type NotificationBadgeResponse = {
  success: boolean;
  count: number;
  message?: string;
};

export const getMyNotifications = async (beforeId?: number): Promise<NotificationResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(`${BASE_API_URL}/notification/my-notification`, {
      headers,
      params: {
        limit: NOTIFICATION_PAGE_SIZE,
        ...(beforeId ? { before_id: beforeId } : {}),
      },
    });

    return {
      success: Boolean(res.data?.success),
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      message: res.data?.message,
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    // Status and message only: the full response carries the Authorization header.
    console.error("Get Notifications Error:", error?.response?.status, error?.response?.data?.message || error?.message);
    throw error?.response?.data || error;
  }
};

export const getNotificationBadge = async (): Promise<NotificationBadgeResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(`${BASE_API_URL}/notification/notification-badge`, {
      headers,
    });

    return {
      success: Boolean(res.data?.success),
      count: Number(res.data?.count || 0),
      message: res.data?.message,
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Get Notification Badge Error:", error?.response?.status, error?.response?.data?.message || error?.message);
    throw error?.response?.data || error;
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.put(
      `${BASE_API_URL}/notification/read/${notificationId}`,
      {},
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Mark Notification Read Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.put(
      `${BASE_API_URL}/notification/read-all`,
      {},
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Mark All Notifications Read Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

export type NotificationAppState = "foreground" | "background" | "terminated" | "inbox";

export type NotificationOpenedReport = {
  app_state: NotificationAppState;
  outcome: "opened_target" | "fallback" | "login_required";
  destination_type?: string;
};

// Fire and forget: callers must not delay navigation on this.
export const recordNotificationOpened = async (
  notificationId: number,
  report: NotificationOpenedReport,
) => {
  const res = await api.post(`/v1/notification/${notificationId}/opened`, report);
  return res.data;
};

export type FCMRegistrationResponse = {
  success: boolean;
  message?: string;
  firebase_project_id: string | null;
};

// Associate this device's FCM token with the signed-in user. Failures propagate
// so FCMService keeps the token unregistered and retries it. Never log the
// response or request here: both carry the token.
export const registerFCMToken = async (
  fcmToken: string,
  firebaseProjectId: string | undefined,
): Promise<FCMRegistrationResponse> => {
  const res = await api.post("/v1/auth/update-fcm-token", {
    fcm_token: fcmToken,
    device_platform: Platform.OS,
    ...(firebaseProjectId ? { firebase_project_id: firebaseProjectId } : {}),
  });
  if (!res.data?.success) throw new Error("FCM registration was not accepted");
  return {
    success: true,
    message: res.data?.message,
    firebase_project_id: res.data?.firebase_project_id ?? null,
  };
};

export const deleteNotification = async (notificationId: number) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.delete(
      `${BASE_API_URL}/notification/${notificationId}`,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Delete Notification Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};
