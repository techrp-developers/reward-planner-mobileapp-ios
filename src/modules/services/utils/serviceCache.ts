/**
 * Module-level in-memory service cache.
 *
 * Stores normalised ServiceData keyed by serviceId with a 5-minute TTL.
 * Because this module is a singleton, any component that calls
 * `prefetchService(id)` before navigating will warm the cache so that
 * `useServiceDetails(id)` inside the destination screen returns
 * immediately — no loader required.
 */

import { getServiceDetails } from '../api/ServiceAPI';
import { normalizeServiceData } from './normalizeServiceData';
import type { NormalizedServiceData } from '../types/ServiceTypes';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  data: NormalizedServiceData;
  timestamp: number;
};

const cache = new Map<number, CacheEntry>();
const inFlight = new Map<number, Promise<NormalizedServiceData | null>>();

let prefetchAttempts = 0;
let prefetchCacheHits = 0;
let prefetchNetworkFetches = 0;

/** Read a valid (non-expired) entry or return null. */
export function getCachedService(serviceId: number): NormalizedServiceData | null {
  const entry = cache.get(serviceId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(serviceId);
    return null;
  }
  return entry.data;
}

/** Write an entry into the cache. */
export function setCachedService(serviceId: number, data: NormalizedServiceData): void {
  cache.set(serviceId, { data, timestamp: Date.now() });
}

/** Remove a specific entry (force-refresh on next access). */
export function invalidateCachedService(serviceId: number): void {
  cache.delete(serviceId);
}

/**
 * Prefetch and return normalised service details.
 * - Returns cached data when available.
 * - Deduplicates concurrent requests by serviceId.
 */
export async function prefetchServiceDetails(
  serviceId: number,
): Promise<NormalizedServiceData | null> {
  prefetchAttempts += 1;

  if (!Number.isFinite(serviceId) || serviceId <= 0) {
    console.log('[serviceCache] prefetch skipped (invalid id):', serviceId);
    return null;
  }

  const cached = getCachedService(serviceId);
  if (cached) {
    prefetchCacheHits += 1;
    console.log(
      '[serviceCache] cache hit for',
      serviceId,
      '| attempts:',
      prefetchAttempts,
      '| cacheHits:',
      prefetchCacheHits,
      '| networkFetches:',
      prefetchNetworkFetches,
    );
    return cached;
  }

  const running = inFlight.get(serviceId);
  if (running) {
    console.log('[serviceCache] using in-flight prefetch for', serviceId);
    return running;
  }

  prefetchNetworkFetches += 1;
  const request = getServiceDetails(serviceId)
    .then((res) => {
      const normalized = normalizeServiceData(res);
      setCachedService(serviceId, normalized);
      console.log(
        '[serviceCache] network fetch complete for',
        serviceId,
        '| attempts:',
        prefetchAttempts,
        '| cacheHits:',
        prefetchCacheHits,
        '| networkFetches:',
        prefetchNetworkFetches,
      );
      return normalized;
    })
    .catch((err) => {
      console.log('[serviceCache] prefetch failed for', serviceId, err);
      return null;
    })
    .finally(() => {
      inFlight.delete(serviceId);
    });

  inFlight.set(serviceId, request);
  return request;
}

/**
 * Fire-and-forget prefetch.
 * Call this BEFORE navigating so CartScreen finds data in the cache.
 * Safe to call multiple times — repeated calls are no-ops if cache is warm.
 */
export async function prefetchService(serviceId: number): Promise<void> {
  await prefetchServiceDetails(serviceId);
}
