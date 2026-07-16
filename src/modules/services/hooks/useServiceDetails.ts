import { InteractionManager } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  getCachedService,
  prefetchServiceDetails,
  setCachedService,
} from '../utils/serviceCache';
import type { NormalizedServiceData } from '../types/ServiceTypes';

export type ServiceDetailsState = {
  data: NormalizedServiceData | null;
  loading: boolean;
  error: string | null;
};

let cartFetchCallCount = 0;

/**
 * Hook that returns normalised service data for a given serviceId.
 *
 * Priority:
 *   1. Cache (populated by prefetchService before navigation) → instant, no loader
 *   2. Live API call with normalisation + cache write
 *
 * The loading flag is initialised to `false` when the cache is already warm,
 * so the screen renders content immediately on mount.
 */
export function useServiceDetails(
  serviceId: number,
  initialData?: NormalizedServiceData | null,
): ServiceDetailsState {
  const [state, setState] = useState<ServiceDetailsState>(() => {
    const seededId = Number(initialData?.service?.id || 0);
    if (initialData && seededId === serviceId) {
      setCachedService(serviceId, initialData);
      return { data: initialData, loading: false, error: null };
    }

    const cached =
      Number.isFinite(serviceId) && serviceId > 0
        ? getCachedService(serviceId)
        : null;

    if (cached) {
      return { data: cached, loading: false, error: null };
    }
    return { data: null, loading: true, error: null };
  });

  // Track the latest serviceId to discard stale responses
  const latestIdRef = useRef<number>(serviceId);

  useEffect(() => {
    latestIdRef.current = serviceId;

    if (!Number.isFinite(serviceId) || serviceId <= 0) {
      setState({ data: null, loading: false, error: 'Invalid service ID' });
      return;
    }

    // Check cache again inside the effect — it may have been warmed between
    // the initial render and this effect running (e.g. fast prefetch).
    const seededId = Number(initialData?.service?.id || 0);
    if (initialData && seededId === serviceId) {
      console.log('[useServiceDetails] using route-seeded data for service', serviceId);
      setCachedService(serviceId, initialData);
      setState({ data: initialData, loading: false, error: null });
      return;
    }

    const cached = getCachedService(serviceId);
    if (cached) {
      console.log('[useServiceDetails] cache hit for service', serviceId);
      setState({ data: cached, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState(prev => ({ ...prev, loading: true, error: null }));

    cartFetchCallCount += 1;
    console.log('[useServiceDetails] fetch call #', cartFetchCallCount, 'for service', serviceId);

    prefetchServiceDetails(serviceId)
      .then((normalized) => {
        if (cancelled || latestIdRef.current !== serviceId) return;

        const interactionTask = InteractionManager.runAfterInteractions(() => {
          if (cancelled || latestIdRef.current !== serviceId) return;
          if (normalized) {
            setState({ data: normalized, loading: false, error: null });
            return;
          }

          setState({
            data: null,
            loading: false,
            error: 'Failed to load service details. Please try again.',
          });
        });

        if (cancelled) {
          interactionTask.cancel();
        }
      })
      .catch(() => {
        if (cancelled || latestIdRef.current !== serviceId) return;
        setState({
          data: null,
          loading: false,
          error: 'Failed to load service details. Please try again.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [initialData, serviceId]);

  return state;
}
