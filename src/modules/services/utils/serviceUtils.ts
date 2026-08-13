import type { ServiceItem } from '../navigation/type';

export function chunkArray<T>(arr: T[], size = 4): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function getServiceImageSource(item: ServiceItem): { uri: string } | null {
  const url = item.variant_image || item.service_image || item.image;
  return url ? { uri: url } : null;
}

export function getDiscount(item: ServiceItem, fallback?: string): string | undefined {
  if (item.discount_percent && item.discount_percent > 0) {
    return `${item.discount_percent}%`;
  }
  return fallback;
}
