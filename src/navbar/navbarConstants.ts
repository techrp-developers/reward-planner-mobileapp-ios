import {
  MODULE_BY_TOP_TAB,
  TopTab,
  CmsModuleKey,
  isTopTab,
} from "../modules/common/cms/moduleMapping";

export type { TopTab } from "../modules/common/cms/moduleMapping";
export type NavbarModule = CmsModuleKey;

export const TAB_MODULE_MAP: Record<TopTab, NavbarModule> = MODULE_BY_TOP_TAB;

export { isTopTab };
