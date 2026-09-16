import api from '../../../common/auth/api/axios';
import { getAuthToken } from '../../../common/auth/api/AuthAPI';
import { API_V1_URL } from '../../../../config/apiConfig';
import type { AxiosError } from 'axios';
import type { StatusFeedGroup } from '../types';

type StatusFeedResponse = {
  success: boolean;
  data?: StatusFeedGroup[] | { groups?: StatusFeedGroup[] };
};

export const STATUS_FEED_QUERY_KEY = ['dashboard', 'status-feed'] as const;

// Status debug output is limited to development and never includes credentials.
export const sanitizeStatusDebugData = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeStatusDebugData);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /^(authorization|token|access_?token|refresh_?token)$/i.test(key)
          ? '[REDACTED]'
          : sanitizeStatusDebugData(item),
      ]),
    );
  }
  return value;
};

export async function fetchStatusFeed(): Promise<StatusFeedGroup[]> {
  if (__DEV__) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [STATUS API] GET STATUS FEED');
    console.log('➡️ Method:', 'GET');
    console.log('➡️ URL:', `${API_V1_URL}/status/feed`);
    console.log('➡️ Parameters:', 'None');
    console.log('➡️ Body:', 'None');
    console.log('🔐 Auth:', Boolean(getAuthToken()));
  }

  try {
    const response = await api.get<StatusFeedResponse>('/v1/status/feed');
    if (__DEV__) {
      console.log('✅ [STATUS API] STATUS FEED RESPONSE');
      console.log('📊 HTTP Status:', response.status);
      console.log('📦 Response:', sanitizeStatusDebugData(response.data));
    }
    const data = response.data.data;
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.groups) ? data.groups : [];
  } catch (error) {
    if (__DEV__) {
      const requestError = error as AxiosError;
      console.error('❌ [STATUS API] STATUS FEED ERROR');
      console.error('📊 HTTP Status:', requestError.response?.status);
      console.error('📦 Error Response:', sanitizeStatusDebugData(requestError.response?.data));
      console.error('💬 Error Message:', requestError.message);
    }
    throw error;
  }
}

export async function markStatusViewed(statusId: number): Promise<void> {
  if (__DEV__) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👁️ [STATUS API] MARK STATUS VIEWED');
    console.log('➡️ Method:', 'POST');
    console.log('➡️ URL:', `${API_V1_URL}/status/${statusId}/view`);
    console.log('🆔 statusId:', statusId);
    console.log('➡️ Body:', 'None');
    console.log('🔐 Auth:', Boolean(getAuthToken()));
  }

  try {
    const response = await api.post(`/v1/status/${statusId}/view`);
    if (__DEV__) {
      console.log('✅ [STATUS API] MARK VIEWED RESPONSE');
      console.log('📊 HTTP Status:', response.status);
      console.log('📦 Response:', sanitizeStatusDebugData(response.data));
    }
  } catch (error) {
    if (__DEV__) {
      const requestError = error as AxiosError;
      console.error('❌ [STATUS API] MARK VIEWED ERROR');
      console.error('🆔 statusId:', statusId);
      console.error('📊 HTTP Status:', requestError.response?.status);
      console.error('📦 Error Response:', sanitizeStatusDebugData(requestError.response?.data));
      console.error('💬 Error Message:', requestError.message);
    }
    throw error;
  }
}
