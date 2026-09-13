import React from 'react';
import {
  fetchResolvedModules,
  fetchResolvedNavbar,
  type CmsModule,
  type CmsNavbarBackgroundMap,
} from './cmsContentApi';

type CmsAppShellState = {
  modules: CmsModule[];
  navbar: CmsNavbarBackgroundMap;
  isLoading: boolean;
  error: unknown;
};

const defaultState: CmsAppShellState = {
  modules: [],
  navbar: {},
  isLoading: false,
  error: null,
};

const CmsAppShellContext = React.createContext<CmsAppShellState>(defaultState);

export const CmsAppShellProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = React.useState<CmsAppShellState>({
    ...defaultState,
    isLoading: true,
  });

  React.useEffect(() => {
    let cancelled = false;

    // A one-shot fetch with no retry would permanently blank the app shell
    // if it happens to land during a transient network blip (e.g. the adb
    // reverse tunnel dropping on a USB reconnect) — retry a few times
    // before giving up, since nothing else re-triggers this effect.
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 1500;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const loadWithRetry = async <T,>(fetcher: () => Promise<T>) => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
          return { data: await fetcher(), error: null };
        } catch (error) {
          if (cancelled) return { data: null, error };
          if (attempt === MAX_ATTEMPTS) {
            return { data: null, error };
          }
          await delay(RETRY_DELAY_MS * attempt);
        }
      }
      return { data: null, error: null };
    };

    const load = async () => {
      const [modulesResult, navbarResult] = await Promise.all([
        loadWithRetry(fetchResolvedModules),
        loadWithRetry(fetchResolvedNavbar),
      ]);
      if (cancelled) return;
      setState({
        modules: modulesResult.data ?? [],
        navbar: navbarResult.data ?? {},
        isLoading: false,
        error: modulesResult.error ?? navbarResult.error,
      });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CmsAppShellContext.Provider value={state}>
      {children}
    </CmsAppShellContext.Provider>
  );
};

export const useCmsAppShell = () => React.useContext(CmsAppShellContext);
