import axios from 'axios';

export const BASE_API_URL = 'https://rewardplanners.com/api/crm/v1/';

const api = axios.create({
  baseURL: BASE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});



api.interceptors.response.use(
  response => {
    __DEV__ && console.log('[MF-API] <-- RESPONSE:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('[MF-API] <-- ERROR STATUS:', error.response?.status);
    console.error('[MF-API] <-- ERROR URL:', error.config?.url);
    console.error('[MF-API] <-- ERROR BASE:', error.config?.baseURL);
    console.error('[MF-API] <-- ERROR FULL URL:', (error.config?.baseURL ?? '') + (error.config?.url ?? ''));
    console.error('[MF-API] <-- ERROR BODY:', JSON.stringify(error.response?.data));
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────────
// CATEGORY TREE MODELS
// Shapes returned by GET /mutual-fund/category-tree/4
// ─────────────────────────────────────────────────────────────────

/** Lightweight article record embedded in the category tree. */
export interface MFArticleSummary {
  id: number;
  title: string;
  short_description: string;
  thumbnail: string;
}

/** A child section under a top-level category, containing article summaries. */
export interface MFChildCategory {
  id: number;
  title: string;
  sort_order: number;
  article_count: number;
  articles: MFArticleSummary[];
}

/** Top-level Mutual Fund category returned by the category-tree endpoint. */
export interface MFCategory {
  id: number;
  title: string;
  icon: string | null;
  sort_order: number;
  has_children: boolean;
  children: MFChildCategory[];
}

// ─────────────────────────────────────────────────────────────────
// SECTION CONTENT MODELS
// Shapes returned by GET /mutual-fund/section-content/:sectionId
// ─────────────────────────────────────────────────────────────────

/** Section metadata returned alongside articles in section-content. */
export interface MFSection {
  id: number;
  category_id: number;
  title: string;
  icon: string | null;
  sort_order: number;
  parent_section_id: number | null;
}

/** Full article record with HTML content, banner image, and CTA text. */
export interface MFArticleDetails {
  id: number;
  title: string;
  short_description: string;
  article_content: string;
  thumbnail: string;
  banner_image: string;
  cta_text: string;
  sort_order: number;
}

/** Top-level response shape from section-content endpoint. */
export interface MFSectionContentResponse {
  section: MFSection;
  articles: MFArticleDetails[];
}

// ─────────────────────────────────────────────────────────────────
// API METHODS
// ─────────────────────────────────────────────────────────────────

/**
 * Fetch the full Mutual Fund category tree.
 * Category group 4 covers all MF education content.
 */
export const getMutualFundCategories = async (): Promise<MFCategory[]> => {
  const response = await api.get('mutual-fund/category-tree/4');
  
  return response.data.data;
};

/**
 * Find a single top-level category by its ID.
 * Returns undefined if not found.
 */
export const getCategoryById = async (
  categoryId: number,
): Promise<MFCategory | undefined> => {
  const categories = await getMutualFundCategories();
  return categories.find(c => c.id === categoryId);
};

/**
 * Get article summaries for a specific child section within a category.
 * Uses the category tree — no full article content (use getSectionContent for that).
 */
export const getArticlesByChildCategory = async (
  categoryId: number,
  childId: number,
): Promise<MFArticleSummary[]> => {
  const category = await getCategoryById(categoryId);
  const child = category?.children.find(c => c.id === childId);
  return child?.articles ?? [];
};

/**
 * Fetch a section's full content including HTML article bodies, banners, and CTAs.
 * sectionId corresponds to a MFChildCategory id from the category tree.
 */
export const getSectionContent = async (
  sectionId: number,
): Promise<MFSectionContentResponse> => {
  const response = await api.get(`/mutual-fund/section-content/${sectionId}`);
  
  return response.data.data;
};

/**
 * Fetch a single article with full details from a known section.
 * Avoids a separate per-article endpoint by reusing the section-content response.
 */
export const getArticleDetails = async (
  sectionId: number,
  articleId: number,
): Promise<MFArticleDetails | null> => {
  const content = await getSectionContent(sectionId);
  return content.articles.find(a => a.id === articleId) ?? null;
};

export default api;
