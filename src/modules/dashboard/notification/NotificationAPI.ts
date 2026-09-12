import axios from "axios";

import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
import { BASE_API_URL } from "../../services/api/api";

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

export const getMyNotifications = async (): Promise<NotificationResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(`${BASE_API_URL}/notification/my-notification`, {
      headers,
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

    console.error("Get Notifications Error:", error?.response || error);
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

    console.error("Get Notification Badge Error:", error?.response || error);
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
