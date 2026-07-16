import api from '../../common/auth/api/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchResultItem = {
  id:    number;
  title: string;
  image: string;
  type:  'product' | 'service';
};

export type SearchData = {
  products: SearchResultItem[];
  services: SearchResultItem[];
};

// ─── API ──────────────────────────────────────────────────────────────────────

export async function fetchSearchSuggestions(
  q: string,
  signal?: AbortSignal,
): Promise<SearchData> {
  const res = await api.get('/v1/global/search/suggestions', {
    params: { q },
    signal,
  });

  const data = res.data?.data;
  return {
    products: Array.isArray(data?.products) ? data.products : [],
    services: Array.isArray(data?.services) ? data.services : [],
  };
}
