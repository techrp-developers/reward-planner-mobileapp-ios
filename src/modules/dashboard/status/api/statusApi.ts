import api from '../../../common/auth/api/axios';
import type { StatusFeedGroup } from '../types';

type StatusFeedResponse = {
  success: boolean;
  data?: StatusFeedGroup[] | { groups?: StatusFeedGroup[] };
};

export const STATUS_FEED_QUERY_KEY = ['dashboard', 'status-feed'] as const;

export async function fetchStatusFeed(): Promise<StatusFeedGroup[]> {
  const response = await api.get<StatusFeedResponse>('/v1/status/feed');
  const data = response.data.data;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.groups) ? data.groups : [];
}

export async function markStatusViewed(statusId: number): Promise<void> {
  await api.post(`/v1/status/${statusId}/view`);
}
