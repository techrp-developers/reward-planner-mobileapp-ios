import api from '../../common/auth/api/axios';
import { API_V1_URL } from '../../../config/apiConfig';

export type QuizRules = { questionCount: number; secondsPerQuestion: number; correctPoints: number; wrongPenalty: number; timeoutPenalty: number };
export type QuizSession = {
  id: string; status: 'playing' | 'completed'; index: number; total: number;
  score: number; correctCount: number; wrongCount: number; deadline: number; serverNow: number;
  attempts: number[]; selected: number | null; feedback: 'correct' | 'timeout' | null;
  question: { question: string; options: string[] }; rules: QuizRules;
};
export type QuizLeader = { user_id: number; name: string; score: number; total_games: number };
const url = `${API_V1_URL}/quiz`;
export async function getQuizLeaderboard(): Promise<{ players: QuizLeader[]; rules: QuizRules }> {
  return (await api.get(`${url}/leaderboard`, { timeout: 15000 })).data.data;
}
export async function startQuiz(): Promise<QuizSession> {
  return (await api.post(`${url}/sessions`, {}, { timeout: 15000 })).data.data;
}
export async function getQuiz(id: string): Promise<QuizSession> {
  return (await api.get(`${url}/sessions/${id}`, { timeout: 15000 })).data.data;
}
export async function answerQuiz(id: string, index: number, option: number): Promise<QuizSession> {
  return (await api.post(`${url}/sessions/${id}/answer`, { index, option }, { timeout: 15000 })).data.data;
}
export async function nextQuizQuestion(id: string, index: number): Promise<QuizSession> {
  return (await api.post(`${url}/sessions/${id}/next`, { index }, { timeout: 15000 })).data.data;
}
