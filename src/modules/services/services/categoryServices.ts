import { getServiceByCategory } from '../api/ServiceAPI';

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

export type CategoryServiceItem = {
  id: number;
  name: string;
  description: string;
  price: string;
  estimated_days: number;
  service_image: string;
};

export type CategoryServicesResult =
  | {
      kind: 'direct';
      serviceId: number;
      title?: string;
      categoryId: number;
    }
  | {
      kind: 'list';
      services: CategoryServiceItem[];
      categoryId: number;
    };

type CachedCategoryResponse = {
  timestamp: number;
  result: CategoryServicesResult;
};

const categoryCache = new Map<number, CachedCategoryResponse>();

function normalizeListPayload(response: any, categoryId: number): CategoryServicesResult {
  const servicesFromList = Array.isArray(response?.services) ? response.services : [];

  if (servicesFromList.length > 0) {
    const services: CategoryServiceItem[] = servicesFromList.map((s: any) => ({
      id: Number(s?.id) || 0,
      name: s?.name || 'Service',
      description: s?.description || '',
      price: String(s?.price || '0'),
      estimated_days: Number(s?.estimated_days || 0),
      service_image: s?.service_image || response?.category?.icon || '',
    }));

    return {
      kind: 'list',
      services,
      categoryId,
    };
  }

  const variants = Array.isArray(response?.variants) ? response.variants : [];
  const services: CategoryServiceItem[] = variants.map((v: any) => ({
    id: Number(v?.id) || 0,
    name: v?.title || v?.variant_name || response?.service?.name || 'Service',
    description: v?.short_description || response?.service?.description || '',
    price: String(v?.price || '0'),
    estimated_days: Number(v?.estimated_days || 0),
    service_image: response?.service?.service_image || response?.category?.icon || '',
  }));

  return {
    kind: 'list',
    services,
    categoryId,
  };
}

export function getCachedCategoryServices(categoryId: number): CategoryServicesResult | null {
  const cached = categoryCache.get(categoryId);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CATEGORY_CACHE_TTL_MS) {
    categoryCache.delete(categoryId);
    return null;
  }

  return cached.result;
}

export async function getCategoryServices(categoryId: number): Promise<CategoryServicesResult> {
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return {
      kind: 'list',
      services: [],
      categoryId,
    };
  }

  const cached = getCachedCategoryServices(categoryId);
  if (cached) return cached;

  const response = await getServiceByCategory(categoryId);

  let result: CategoryServicesResult;

  if (response?.success && response?.type === 'direct') {
    const serviceId = Number(response?.service?.id || 0);
    result = {
      kind: 'direct',
      serviceId,
      title: response?.category?.name,
      categoryId,
    };
  } else {
    result = normalizeListPayload(response, categoryId);
  }

  categoryCache.set(categoryId, {
    timestamp: Date.now(),
    result,
  });

  return result;
}

export function invalidateCategoryServices(categoryId: number): void {
  categoryCache.delete(categoryId);
}
