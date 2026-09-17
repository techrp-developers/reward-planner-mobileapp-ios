import api from '../../../common/auth/api/axios';
import { getAuthHeaders } from '../../../common/auth/api/AuthAPI';
import { API_V1_URL } from '../../../../config/apiConfig';
import type { AxiosError } from 'axios';
import type { StatusFeedGroup, StatusMediaInput, StatusType, StatusVisibility, UserStatus } from '../types';

type StatusFeedResponse = {
  success: boolean;
  data?: StatusFeedGroup[] | UserStatus[] | { groups?: StatusFeedGroup[]; statuses?: UserStatus[] };
};

type MineResponse = { success: boolean; data: UserStatus[] };

const statusAuthHeaders = async () => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) throw new Error('Please sign in to use statuses.');
  return headers;
};

const statusUrl = (path: string) => `${API_V1_URL}/status${path}`;

export type CreateStatusInput = {
  type: StatusType;
  text?: string;
  visibility: StatusVisibility;
  background_color?: string;
  font_style?: string;
  media?: StatusMediaInput;
};

const groupStatuses = (statuses: UserStatus[]): StatusFeedGroup[] => {
  const groups = new Map<number, StatusFeedGroup>();
  statuses.forEach(status => {
    if (!status?.user?.id) return;
    const group = groups.get(status.user.id) ?? {
      user: status.user,
      has_unviewed: false,
      statuses: [],
    };
    group.statuses.push(status);
    group.has_unviewed ||= !status.viewed;
    groups.set(status.user.id, group);
  });
  return [...groups.values()];
};

export async function createStatus(input: CreateStatusInput): Promise<UserStatus> {
  const form = new FormData();
  form.append('type', input.type);
  form.append('visibility', input.visibility);
  if (input.text) form.append('text', input.text);
  if (input.type === 'text') {
    if (input.background_color) form.append('background_color', input.background_color);
    if (input.font_style) form.append('font_style', input.font_style);
  }
  if (input.media) {
    form.append('media', {
      uri: input.media.uri,
      type: input.media.type,
      name: input.media.fileName,
    } as any);
  }
  const response = await api.post<{ success: boolean; data: UserStatus; message?: string }>(
    statusUrl(''), form, { headers: { ...await statusAuthHeaders(), 'Content-Type': 'multipart/form-data' } },
  );
  if (!response.data?.success || !response.data.data?.id) {
    throw new Error(response.data?.message || 'Could not publish status.');
  }
  return response.data.data;
}

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

export async function fetchMyStatuses(): Promise<UserStatus[]> {
  const response = await api.get<MineResponse>(statusUrl('/mine'), {
    headers: await statusAuthHeaders(),
  });
  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error('Could not load your statuses.');
  }
  return response.data.data;
}

export async function fetchStatusFeed(userIds: number[]): Promise<StatusFeedGroup[]> {
  const ids = [...new Set(userIds.filter(id => Number.isInteger(id) && id > 0))];
  if (!ids.length) return [];
  const url = statusUrl('/feed');
  if (__DEV__) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [STATUS API] GET STATUS FEED');
    console.log('➡️ Method:', 'GET');
    console.log('➡️ URL:', `${url}?user_ids=${ids.join(',')}`);
    console.log('➡️ Parameters:', { user_ids: ids.join(',') });
    console.log('➡️ Body:', 'None');
    console.log('🔐 Auth:', Boolean((await statusAuthHeaders()).Authorization));
  }

  try {
    const response = await api.get<StatusFeedResponse>(url, {
      params: { user_ids: ids.join(',') },
      headers: await statusAuthHeaders(),
    });
    if (__DEV__) {
      console.log('✅ [STATUS API] STATUS FEED RESPONSE');
      console.log('📊 HTTP Status:', response.status);
      console.log('📦 Response:', sanitizeStatusDebugData(response.data));
    }
    const data = response.data.data;
    const items = Array.isArray(data) ? data : (data?.groups ?? data?.statuses ?? []);
    if (!Array.isArray(items)) return [];
    if (items.length && 'statuses' in items[0]) return items as StatusFeedGroup[];
    return groupStatuses(items as UserStatus[]);
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

export async function fetchDashboardStatuses(userIds: number[]): Promise<StatusFeedGroup[]> {
  const [feedResult, mineResult] = await Promise.allSettled([
    fetchStatusFeed(userIds),
    fetchMyStatuses(),
  ]);
  if (feedResult.status === 'rejected' && mineResult.status === 'rejected') {
    throw feedResult.reason;
  }
  const feed = feedResult.status === 'fulfilled' ? feedResult.value : [];
  const mine = mineResult.status === 'fulfilled' ? mineResult.value : [];
  if (!mine.length) return feed;
  const ownGroup = groupStatuses(mine)[0];
  if (!ownGroup) return feed;
  return [ownGroup, ...feed.filter(group => group.user.id !== ownGroup.user.id)];
}

export type StatusViewResult = {
  id: number;
  viewed: boolean;
  view_count: number;
};

export async function markStatusViewed(statusId: number): Promise<StatusViewResult> {
  const url = statusUrl(`/${statusId}/view`);
  if (__DEV__) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👁️ [STATUS API] MARK STATUS VIEWED');
    console.log('➡️ Method:', 'POST');
    console.log('➡️ URL:', url);
    console.log('🆔 statusId:', statusId);
    console.log('➡️ Body:', 'None');
    console.log('🔐 Auth:', Boolean((await statusAuthHeaders()).Authorization));
  }

  try {
    const response = await api.post<{ success: boolean; data: StatusViewResult }>(
      url, undefined, { headers: await statusAuthHeaders() },
    );
    if (__DEV__) {
      console.log('✅ [STATUS API] MARK VIEWED RESPONSE');
      console.log('📊 HTTP Status:', response.status);
      console.log('📦 Response:', sanitizeStatusDebugData(response.data));
    }
    if (!response.data?.success || !response.data.data) {
      throw new Error('Could not mark status as viewed.');
    }
    return response.data.data;
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
