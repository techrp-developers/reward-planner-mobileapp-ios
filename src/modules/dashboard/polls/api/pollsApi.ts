import api from '../../../common/auth/api/axios';
import type { LivePoll } from '../type';

type DataResponse<T> = { success: boolean; data: T; message?: string };

export async function fetchLivePolls() {
  const response = await api.get<DataResponse<LivePoll[]>>('/v1/polls');
  return response.data.data ?? [];
}

export async function submitPollVote(pollId: number, optionIds: number[]) {
  const response = await api.post<DataResponse<LivePoll | null>>(`/v1/polls/${pollId}/votes`, {
    option_ids: optionIds,
  });
  return response.data.data;
}
