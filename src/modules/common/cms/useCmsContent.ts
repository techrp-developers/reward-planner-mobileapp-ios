import React from 'react';
import { CmsModuleKey, CmsResolvedZones, fetchResolvedZones } from './cmsContentApi';

type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  error: unknown;
};

// Tab/module icons now live in CmsAppShellContext (fetched once at the app
// shell); this hook covers Step 3's per-module screen fetch only.
export const useContentZones = (module: CmsModuleKey) => {
  const [state, setState] = React.useState<AsyncState<CmsResolvedZones>>({
    data: {},
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    setState((current) => ({ ...current, isLoading: true, error: null }));

    fetchResolvedZones(module)
      .then((data) => {
        if (!cancelled) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ data: {}, isLoading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [module]);

  return state;
};
