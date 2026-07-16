import { useEffect, useState } from 'react';
import {
  getCategoryServices,
  getCachedCategoryServices,
  type CategoryServiceItem,
} from '../services/categoryServices';

type UseCategoryServicesState = {
  loading: boolean;
  error: string | null;
  services: CategoryServiceItem[];
  directServiceId: number | null;
  directTitle?: string;
};

export function useCategoryServices(categoryId: number): UseCategoryServicesState {
  const [state, setState] = useState<UseCategoryServicesState>(() => {
    const cached =
      Number.isFinite(categoryId) && categoryId > 0
        ? getCachedCategoryServices(categoryId)
        : null;

    if (cached?.kind === 'direct') {
      return {
        loading: false,
        error: null,
        services: [],
        directServiceId: cached.serviceId,
        directTitle: cached.title,
      };
    }

    if (cached?.kind === 'list') {
      return {
        loading: false,
        error: null,
        services: cached.services,
        directServiceId: null,
      };
    }

    return {
      loading: true,
      error: null,
      services: [],
      directServiceId: null,
    };
  });

  useEffect(() => {
    let cancelled = false;

    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      setState({
        loading: false,
        error: 'Invalid category.',
        services: [],
        directServiceId: null,
      });
      return;
    }

    const cached = getCachedCategoryServices(categoryId);
    if (cached?.kind === 'direct') {
      setState({
        loading: false,
        error: null,
        services: [],
        directServiceId: cached.serviceId,
        directTitle: cached.title,
      });
      return;
    }

    if (cached?.kind === 'list') {
      setState({
        loading: false,
        error: null,
        services: cached.services,
        directServiceId: null,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    getCategoryServices(categoryId)
      .then(result => {
        if (cancelled) return;

        if (result.kind === 'direct') {
          setState({
            loading: false,
            error: null,
            services: [],
            directServiceId: result.serviceId,
            directTitle: result.title,
          });
          return;
        }

        setState({
          loading: false,
          error: null,
          services: result.services,
          directServiceId: null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          loading: false,
          error: 'Failed to load services. Please try again.',
          services: [],
          directServiceId: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return state;
}
