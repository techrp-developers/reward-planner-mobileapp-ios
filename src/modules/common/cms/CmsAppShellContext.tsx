import React from 'react';
import { fetchResolvedModules, fetchResolvedNavbar, type CmsModule, type CmsNavbarBackgroundMap } from './cmsContentApi';
import { useCmsQuery } from './useCmsQuery';

type CmsAppShellState = {
  modules: CmsModule[];
  navbar: CmsNavbarBackgroundMap;
  isLoading: boolean;
  error: unknown;
};
const EMPTY_MODULES: CmsModule[] = [];
const EMPTY_NAVBAR: CmsNavbarBackgroundMap = {};
const CmsAppShellContext = React.createContext<CmsAppShellState>({
  modules: EMPTY_MODULES, navbar: EMPTY_NAVBAR, isLoading: false, error: null,
});

export const CmsAppShellProvider = ({ children }: { children: React.ReactNode }) => {
  // Publish independently: a slow navbar request cannot hold back module icons.
  const modules = useCmsQuery('modules', fetchResolvedModules);
  const navbar = useCmsQuery('navbar', fetchResolvedNavbar);
  const value = React.useMemo(() => ({
    modules: modules.data ?? EMPTY_MODULES,
    navbar: navbar.data ?? EMPTY_NAVBAR,
    isLoading: modules.isPending || navbar.isPending,
    error: modules.error ?? navbar.error,
  }), [modules.data, navbar.data, modules.isPending, navbar.isPending, modules.error, navbar.error]);
  return <CmsAppShellContext.Provider value={value}>{children}</CmsAppShellContext.Provider>;
};
export const useCmsAppShell = () => React.useContext(CmsAppShellContext);
