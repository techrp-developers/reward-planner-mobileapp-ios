import api from '../../common/auth/api/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchResultNavigation = {
  destination: 'category_products' | 'subcategory_products' | 'product_details' | 'service_details';
  category_id?: number;
  subcategory_id?: number;
  product_id?: number;
  service_id?: number;
};

export type SearchResultItem = {
  id:    number;
  title: string;
  image: string;
  type:  'product' | 'category' | 'subcategory' | 'service';
  category_id?: number;
  category_name?: string;
  subcategory_id?: number;
  subcategory_name?: string;
  navigation?: SearchResultNavigation;
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
