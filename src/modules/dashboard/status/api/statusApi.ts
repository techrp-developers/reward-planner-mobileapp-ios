import api from '../../../common/auth/api/axios';
import { getAuthHeaders } from '../../../common/auth/api/AuthAPI';
import { API_V1_URL } from '../../../../config/apiConfig';
import type { AxiosError } from 'axios';
import type { StatusAudienceCompany, StatusAudiencePerson, StatusComment, StatusFeedGroup, StatusLike, StatusMediaInput, StatusType, StatusViewer, StatusVisibility, UserStatus } from '../types';

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
  /** Used with visibility "all_except_companies". */
  excludedCompanyIds?: number[];
  /** Used with visibility "custom_people". */
  allowedUserIds?: number[];
  /** Client-only: receives upload progress from 0 to 1. Not sent to the API. */
  onUploadProgress?: (fraction: number) => void;
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
  form.append('excluded_company_ids', JSON.stringify(input.excludedCompanyIds ?? []));
  form.append('allowed_user_ids', JSON.stringify(input.allowedUserIds ?? []));
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
    statusUrl(''), form, {
      headers: { ...await statusAuthHeaders(), 'Content-Type': 'multipart/form-data' },
      onUploadProgress: input.onUploadProgress
        ? event => { if (event.total) input.onUploadProgress?.(Math.min(1, event.loaded / event.total)); }
        : undefined,
    },
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

// React Native stores the underlying connection error on its XHR object.
// Axios's generic "Network Error" otherwise hides that diagnostic.
export const statusNetworkDiagnostics = (error: AxiosError) => {
  const request = error.request as {
    _hasError?: boolean; _timedOut?: boolean; _response?: unknown;
  } | undefined;
  const nativeError = !error.response && request?._hasError && typeof request._response === 'string'
    ? request._response
        .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
        .replace(/https?:\/\/[^\s"']+/gi, '[URL]')
        .slice(0, 500)
    : undefined;
  return { code: error.code, timedOut: Boolean(request?._timedOut), nativeError };
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

export async function fetchStatusFeed(userIds?: number[]): Promise<StatusFeedGroup[]> {
  const ids = [...new Set((userIds ?? []).filter(id => Number.isInteger(id) && id > 0))];
  const url = statusUrl('/feed');
  if (__DEV__) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [STATUS API] GET STATUS FEED');
    console.log('➡️ Method:', 'GET');
    console.log('➡️ URL:', ids.length ? `${url}?user_ids=${ids.join(',')}` : url);
    console.log('➡️ Parameters:', ids.length ? { user_ids: ids.join(',') } : 'None');
    console.log('➡️ Body:', 'None');
    console.log('🔐 Auth:', Boolean((await statusAuthHeaders()).Authorization));
  }

  try {
    const response = await api.get<StatusFeedResponse>(url, {
      params: ids.length ? { user_ids: ids.join(',') } : undefined,
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
      console.error('[STATUS API] Network diagnostics:', statusNetworkDiagnostics(requestError));
    }
    throw error;
  }
}

export async function fetchDashboardStatuses(): Promise<StatusFeedGroup[]> {
  const [feedResult, mineResult] = await Promise.allSettled([
    fetchStatusFeed(),
    fetchMyStatuses(),
  ]);
  if (feedResult.status === 'rejected' && mineResult.status === 'rejected') {
    throw feedResult.reason;
  }
  const feed = feedResult.status === 'fulfilled' ? feedResult.value : [];
  const mine = mineResult.status === 'fulfilled' ? mineResult.value : [];
  return mergeOwnStatuses(feed, mine);
}

/** Compares user/status IDs that may arrive as numbers or numeric strings. */
export const sameStatusId = (a: unknown, b: unknown): boolean => {
  if (a == null || b == null || a === '') return false;
  const left = Number(a);
  const right = Number(b);
  return Number.isSafeInteger(left) && left > 0 && left === right;
};

/**
 * GET /status/mine is the source of truth for ownership. Its statuses become
 * the single own group (flagged is_own), and the same author or status IDs are
 * removed from the public feed so the user never appears twice.
 */
export function mergeOwnStatuses(feed: StatusFeedGroup[], mine: UserStatus[]): StatusFeedGroup[] {
  const ownGroup = groupStatuses(mine)[0];
  if (!ownGroup) return feed;
  const ownStatusIds = new Set(mine.map(status => String(status.id)));
  const others = feed.flatMap(group => {
    if (sameStatusId(group.user.id, ownGroup.user.id)) return [];
    const statuses = group.statuses.filter(status =>
      !ownStatusIds.has(String(status.id)) && !sameStatusId(status.user?.id, ownGroup.user.id));
    return statuses.length ? [{ ...group, statuses }] : [];
  });
  return [{ ...ownGroup, has_unviewed: false, is_own: true }, ...others];
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
      console.error('[STATUS API] Network diagnostics:', statusNetworkDiagnostics(requestError));
    }
    throw error;
  }
}

export async function deleteStatus(statusId: number): Promise<void> {
  await api.delete(statusUrl(`/${statusId}`), {
    headers: await statusAuthHeaders(),
  });
}

export type StatusViewersResult = {
  viewers: StatusViewer[];
  viewCount: number;
};

export async function fetchStatusViewers(statusId: number): Promise<StatusViewersResult> {
  const response = await api.get<{ success: boolean; data: StatusViewer[]; view_count?: number; message?: string }>(
    statusUrl(`/${statusId}/views`),
    { headers: await statusAuthHeaders() },
  );
  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error(response.data?.message || 'Could not load status views.');
  }
  const viewers = response.data.data;
  return { viewers, viewCount: Number(response.data.view_count ?? viewers.length) };
}

export async function addStatusComment(statusId: number, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Write a reply before sending.');
  const response = await api.post<{ success: boolean; message?: string }>(
    statusUrl(`/${statusId}/comments`),
    { text: trimmed },
    { headers: await statusAuthHeaders() },
  );
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Could not send reply.');
  }
}

// Interactions: like/unlike, likes list, replies list and reply deletion.
// Response shapes follow the Android status API contract.
type DataResponse<T> = { success: boolean; data: T; message?: string };

export type StatusLikeResult = { liked: boolean; like_count: number };

export type StatusLikesPage = {
  likes: StatusLike[];
  likeCount: number;
  nextBeforeUserId: number | null;
};

export type StatusCommentsPage = {
  comments: StatusComment[];
  nextBeforeId: number | null;
};

export async function toggleStatusLike(statusId: number): Promise<StatusLikeResult> {
  const response = await api.post<DataResponse<StatusLikeResult>>(
    statusUrl(`/${statusId}/like`), undefined, { headers: await statusAuthHeaders() },
  );
  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.message || 'Could not update like.');
  }
  return response.data.data;
}

export async function fetchStatusLikes(statusId: number, beforeUserId?: number | null): Promise<StatusLikesPage> {
  const response = await api.get<DataResponse<StatusLike[]> & {
    like_count?: number;
    pagination?: { next_before_user_id?: number | null };
  }>(statusUrl(`/${statusId}/likes`), {
    headers: await statusAuthHeaders(),
    params: { limit: 50, ...(beforeUserId != null ? { before_user_id: beforeUserId } : {}) },
  });
  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error(response.data?.message || 'Could not load likes.');
  }
  const likes = response.data.data;
  return {
    likes,
    likeCount: Number(response.data.like_count ?? likes.length),
    nextBeforeUserId: response.data.pagination?.next_before_user_id ?? null,
  };
}

export async function fetchStatusComments(statusId: number, beforeId?: number | null): Promise<StatusCommentsPage> {
  const response = await api.get<DataResponse<StatusComment[]> & {
    pagination?: { next_before_id?: number | null };
  }>(statusUrl(`/${statusId}/comments`), {
    headers: await statusAuthHeaders(),
    params: { limit: 50, ...(beforeId != null ? { before_id: beforeId } : {}) },
  });
  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error(response.data?.message || 'Could not load replies.');
  }
  return {
    comments: response.data.data,
    nextBeforeId: response.data.pagination?.next_before_id ?? null,
  };
}

export async function deleteStatusComment(statusId: number, commentId: number): Promise<void> {
  await api.delete(statusUrl(`/${statusId}/comments/${commentId}`), {
    headers: await statusAuthHeaders(),
  });
}

export async function fetchStatusAudienceOptions(search?: string): Promise<{
  companies: StatusAudienceCompany[];
  people: StatusAudiencePerson[];
}> {
  const response = await api.get<DataResponse<{
    companies?: StatusAudienceCompany[];
    people?: StatusAudiencePerson[];
  }>>(statusUrl('/audience-options'), {
    headers: await statusAuthHeaders(),
    params: search ? { q: search } : undefined,
  });
  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.message || 'Could not load audience options.');
  }
  return { companies: response.data.data.companies ?? [], people: response.data.data.people ?? [] };
}
