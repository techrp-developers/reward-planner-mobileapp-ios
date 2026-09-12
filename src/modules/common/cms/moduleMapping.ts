export type TopTab = 'Product' | 'Services' | 'Payments' | 'DineOut';

// 'mobile_dashboard' is a valid backend CMS module key but is NOT one of the
// bottom-tab TopTabs — it's the standalone Mobile Dashboard screen. It must
// stay out of TopTab/MODULE_BY_TOP_TAB so it never appears as a 5th tab.
export type CmsModuleKey = 'product' | 'service' | 'payment' | 'dineout' | 'mobile_dashboard';
export type ModuleRouteKey =
  | 'ProductModule'
  | 'ServicesModule'
  | 'PaymentsModule'
  | 'DineOutModule';

export const MODULE_BY_TOP_TAB: Record<TopTab, CmsModuleKey> = {
  Product: 'product',
  Services: 'service',
  Payments: 'payment',
  DineOut: 'dineout',
};

export const TOP_TAB_BY_MODULE: Record<Exclude<CmsModuleKey, 'mobile_dashboard'>, TopTab> = {
  product: 'Product',
  service: 'Services',
  payment: 'Payments',
  dineout: 'DineOut',
};

export const ROUTE_BY_TOP_TAB: Record<TopTab, ModuleRouteKey> = {
  Product: 'ProductModule',
  Services: 'ServicesModule',
  Payments: 'PaymentsModule',
  DineOut: 'DineOutModule',
};

export const TOP_TAB_BY_ROUTE: Record<ModuleRouteKey, TopTab> = {
  ProductModule: 'Product',
  ServicesModule: 'Services',
  PaymentsModule: 'Payments',
  DineOutModule: 'DineOut',
};

export const TOP_TABS = Object.keys(MODULE_BY_TOP_TAB) as TopTab[];

// All backend CMS module keys, including 'mobile_dashboard' (which has no
// TopTab / bottom-tab counterpart) — this drives fetchResolvedNavbar()'s
// per-module map, so it must list every module the CMS can return content for.
export const CMS_MODULE_KEYS: CmsModuleKey[] = [
  ...(Object.values(MODULE_BY_TOP_TAB) as CmsModuleKey[]),
  'mobile_dashboard',
];

export const isTopTab = (value: unknown): value is TopTab =>
  TOP_TABS.includes(value as TopTab);

export const isCmsModuleKey = (value: unknown): value is CmsModuleKey =>
  CMS_MODULE_KEYS.includes(value as CmsModuleKey);
