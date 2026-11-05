import { saveCmsSnapshot } from './cmsSnapshotCache';
import { warmCmsImages } from './cmsImageCache';
import { cmsApi } from '../../../config/cmsApiClient';
import { normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
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
  display_mode?: "single" | "carousel" | "grid_2" | "grid_3";
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
  brand_promotional_banner?: CmsOffersBannerEntry | null;
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
  brand_promotional_banner: normalizeZoneEntry(zones?.brand_promotional_banner) as CmsOffersBannerEntry | null,
});

const pending = new Map<string, Promise<unknown>>();
function fetchCms<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const request = load().then(data => {
    saveCmsSnapshot(key, data);
    return data;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export const fetchResolvedModules = (): Promise<CmsModule[]> => fetchCms('modules', async () => {
  const { data } = await cmsApi.get<CmsModulesResponse>('/content/resolved/modules');
  if (data.success === false) throw new Error(data.message || 'Unable to load CMS modules');
  const modules = Array.isArray(data.data) ? data.data.map(normalizeModule) : [];
  warmCmsImages(modules.filter(module => Number(module.is_active) === 1).flatMap(module =>
    [module.icon_url, module.active_icon_url, module.dashboard_icon_url]));
  return modules;
});

export const fetchResolvedNavbar = (): Promise<CmsNavbarBackgroundMap> => fetchCms('navbar', async () => {
  const { data } = await cmsApi.get<CmsResolvedNavbarResponse>('/content/resolved/navbar');
  if (data.success === false) throw new Error(data.message || 'Unable to load CMS navbar');
  const map: CmsNavbarBackgroundMap = {};
  CMS_MODULE_KEYS.forEach(key => { map[key] = normalizeZoneEntry(data.data?.[key]); });
  warmCmsImages(Object.values(map).map(entry => entry?.image_url));
  return map;
});

export const fetchResolvedZones = (module: CmsModuleKey): Promise<CmsResolvedZones> =>
  fetchCms(`resolved:${module}`, async () => {
    const { data } = await cmsApi.get<CmsResolvedZonesResponse>(`/content/resolved/${module}`);
    if (data.success === false) throw new Error(data.message || 'Unable to load CMS content');
    const zones = normalizeResolvedZones(data.data);
    // Warm the first image in each zone. Visible galleries request the rest.
    warmCmsImages(Object.values(zones).map(entry => entry?.images?.find(image => Number(image.is_active) === 1)?.image_url || entry?.image_url));
    return zones;
  });
