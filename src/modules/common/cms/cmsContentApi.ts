import { cmsApi } from '../../../config/cmsApiClient';
import { API_BASE_URL, normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
import { CMS_MODULE_KEYS, type CmsModuleKey } from './moduleMapping';

export type { CmsModuleKey } from './moduleMapping';

export interface CmsModule {
  module_key: CmsModuleKey | string;
  label: string;
  icon_url: string | null;
  active_icon_url: string | null;
  dashboard_icon_url: string | null;
  normal_color: string | null;
  active_color: string | null;
  gradient_start_color: string | null;
  gradient_end_color: string | null;
  route_key: string | null;
  sort_order: number;
  is_active: 0 | 1;
}

export interface CmsZoneEntry {
  content_id: number;
  content_type: 'color' | 'image';
  color_value: string | null;
  text_color: string | null;
  image_url: string | null;
  title: string;
  cta_text: string | null;
  redirect_link: string | null;
  is_default: 0 | 1;
  status: 'default' | 'draft' | 'scheduled' | 'active' | 'expired';
}

export interface CmsOfferImage {
  image_id: number;
  image_url: string;
  sort_order: number;
  is_active: 0 | 1;
}

export interface CmsOffersBannerEntry extends CmsZoneEntry {
  images?: CmsOfferImage[];
}

export interface CmsResolvedZones {
  navbar_background?: CmsZoneEntry | null;
  promotional_banner?: CmsZoneEntry | null;
  offers_banner?: CmsOffersBannerEntry | null;
}

interface CmsModulesResponse {
  success: boolean;
  message?: string;
  data?: CmsModule[];
}

interface CmsResolvedZonesResponse {
  success: boolean;
  message?: string;
  data?: CmsResolvedZones;
}

export type CmsNavbarBackgroundMap = Partial<Record<CmsModuleKey, CmsZoneEntry | null>>;

interface CmsResolvedNavbarResponse {
  success: boolean;
  message?: string;
  data?: Record<string, CmsZoneEntry | null>;
}

const normalizeModule = (module: CmsModule): CmsModule => ({
  ...module,
  icon_url: normalizeLocalCmsImageUrl(module.icon_url),
  active_icon_url: normalizeLocalCmsImageUrl(module.active_icon_url),
  dashboard_icon_url: normalizeLocalCmsImageUrl(module.dashboard_icon_url),
});

const normalizeOfferImage = (image: CmsOfferImage): CmsOfferImage => ({
  ...image,
  image_url: normalizeLocalCmsImageUrl(image.image_url) || '',
});

const normalizeZoneEntry = <T extends CmsZoneEntry | CmsOffersBannerEntry>(
  entry: T | null | undefined,
): T | null => {
  if (!entry) {
    return null;
  }

  const normalizedImageUrl = normalizeLocalCmsImageUrl(entry.image_url);
  console.log('[CMS] Image URL before normalize:', entry.image_url);
  console.log('[CMS] Image URL after normalize:', normalizedImageUrl);

  return {
    ...entry,
    image_url: normalizedImageUrl,
    images: Array.isArray((entry as CmsOffersBannerEntry).images)
      ? (entry as CmsOffersBannerEntry).images?.map(normalizeOfferImage)
      : (entry as CmsOffersBannerEntry).images,
  } as T;
};

const normalizeResolvedZones = (
  zones: CmsResolvedZones | null | undefined,
): CmsResolvedZones => ({
  navbar_background: normalizeZoneEntry(zones?.navbar_background),
  promotional_banner: normalizeZoneEntry(zones?.promotional_banner),
  offers_banner: normalizeZoneEntry(zones?.offers_banner) as CmsOffersBannerEntry | null,
});

export const fetchResolvedModules = async (): Promise<CmsModule[]> => {
  const path = '/content/resolved/modules';
  console.log('[CMS] Fetching modules from:', `${API_BASE_URL}${path}`);
  try {
    const response = await cmsApi.get<CmsModulesResponse>(path);
    console.log('[CMS] Raw modules response:', JSON.stringify(response.data));
    const mapped = Array.isArray(response.data.data) ? response.data.data.map(normalizeModule) : [];
    console.log('[CMS] Mapped modules result:', JSON.stringify(mapped));
    return mapped;
  } catch (error: any) {
    console.log('[CMS] Fetch failed:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      url: error?.config?.url,
    });
    throw error;
  }
};

export const fetchResolvedNavbar = async (): Promise<CmsNavbarBackgroundMap> => {
  const path = '/content/resolved/navbar';
  console.log('[CMS] Fetching navbar from:', `${API_BASE_URL}${path}`);
  try {
    const response = await cmsApi.get<CmsResolvedNavbarResponse>(path);
    console.log('[CMS] Raw navbar response:', JSON.stringify(response.data));
    const raw = response.data.data ?? {};

    const map: CmsNavbarBackgroundMap = {};
    CMS_MODULE_KEYS.forEach((key) => {
      const entry = raw[key] ?? null;
      console.log(`[CMS] ${key} raw entry:`, JSON.stringify(entry));
      map[key] = normalizeZoneEntry(entry);
      console.log(`[CMS] ${key} normalized entry:`, JSON.stringify(map[key]));
    });

    console.log('[CMS] Mapped navbar result:', JSON.stringify(map));
    return map;
  } catch (error: any) {
    console.log('[CMS] Fetch failed:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      url: error?.config?.url,
    });
    throw error;
  }
};

export const fetchResolvedZones = async (
  module: CmsModuleKey,
): Promise<CmsResolvedZones> => {
  const { data } = await cmsApi.get<CmsResolvedZonesResponse>(
    `/content/resolved/${module}`,
  );
  return normalizeResolvedZones(data.data);
};
