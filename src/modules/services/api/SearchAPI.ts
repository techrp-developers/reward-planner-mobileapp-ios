import axios from 'axios';
import { BASE_API_URL } from './api';

export type SearchSuggestion = {
  id: number;
  title: string;
  image: string;
  type: string;
};

// ─── Suggestions ─────────────────────────────────────────────────────────────

export const getSearchSuggestions = async (q: string): Promise<SearchSuggestion[]> => {
  try {
    const res = await axios.get(`${BASE_API_URL}/service/search/suggestions`, { params: { q } });
    return res.data?.suggestions ?? [];
  } catch (error: any) {
    console.error('❌ getSearchSuggestions error:', error?.response?.data || error.message);
    return [];
  }
};

// ─── History ─────────────────────────────────────────────────────────────────

export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const res = await axios.get(`${BASE_API_URL}/service/search/history`);
    return res.data?.history ?? [];
  } catch (error: any) {
    console.error('❌ getSearchHistory error:', error?.response?.data || error.message);
    return [];
  }
};

export const saveSearchHistory = async (keyword: string): Promise<void> => {
  try {
    await axios.post(`${BASE_API_URL}/service/search/history`, { keyword });
  } catch (error: any) {
    console.error('❌ saveSearchHistory error:', error?.response?.data || error.message);
  }
};

export const clearSearchHistory = async (): Promise<void> => {
  try {
    await axios.delete(`${BASE_API_URL}/service/search/history`);
  } catch (error: any) {
    console.error('❌ clearSearchHistory error:', error?.response?.data || error.message);
  }
};
