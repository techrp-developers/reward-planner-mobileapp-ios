import api from '../../../common/auth/api/axios';
import type { LivePoll } from '../type';
import i18n from "../../../../i18n";

type DataResponse<T> = { success: boolean; data: T; message?: string };

export async function fetchLivePolls() {
  const response = await api.get<DataResponse<LivePoll[]>>('/v1/polls');
  if (!response.data.success) throw new Error(response.data.message || i18n.t('dashboard:errors.loadPolls'));
  return response.data.data ?? [];
}

export async function submitPollVote(pollId: number, optionIds: number[]) {
  const response = await api.post<DataResponse<LivePoll | null>>(`/v1/polls/${pollId}/votes`, {
    option_ids: optionIds,
  });
  if (!response.data.success) throw new Error(response.data.message || i18n.t('dashboard:errors.submitVote'));
  return response.data.data;
}
