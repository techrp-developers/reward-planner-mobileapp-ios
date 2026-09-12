import React from "react";
import { useCmsAppShell } from "../../modules/common/cms/CmsAppShellContext";
import { ApiModuleIcon } from "../api/ModuleIconsApi";
import { TAB_MODULE_MAP } from "../navbarConstants";

export const DEFAULT_MODULE_NORMAL_COLOR = "#28282B";

const fallbackModules: ApiModuleIcon[] = [
  {
    module_key: TAB_MODULE_MAP.Product,
    label: "Product",
    icon_url: null,
    active_icon_url: null,
    dashboard_icon_url: null,
    normal_color: DEFAULT_MODULE_NORMAL_COLOR,
    active_color: null,
    gradient_start_color: null,
    gradient_end_color: null,
    route_key: "ProductModule",
    sort_order: 0,
    is_active: 1,
  },
  {
    module_key: TAB_MODULE_MAP.Services,
    label: "Services",
    icon_url: null,
    active_icon_url: null,
    dashboard_icon_url: null,
    normal_color: DEFAULT_MODULE_NORMAL_COLOR,
    active_color: null,
    gradient_start_color: null,
    gradient_end_color: null,
    route_key: "ServicesModule",
    sort_order: 1,
    is_active: 1,
  },
  {
    module_key: TAB_MODULE_MAP.Payments,
    label: "Payments",
    icon_url: null,
    active_icon_url: null,
    dashboard_icon_url: null,
    normal_color: DEFAULT_MODULE_NORMAL_COLOR,
    active_color: null,
    gradient_start_color: null,
    gradient_end_color: null,
    route_key: "PaymentsModule",
    sort_order: 2,
    is_active: 1,
  },
  {
    module_key: TAB_MODULE_MAP.DineOut,
    label: "DineOut",
    icon_url: null,
    active_icon_url: null,
    dashboard_icon_url: null,
    normal_color: DEFAULT_MODULE_NORMAL_COLOR,
    active_color: null,
    gradient_start_color: null,
    gradient_end_color: null,
    route_key: "DineOutModule",
    sort_order: 3,
    is_active: 1,
  },
];

export const useModuleIcons = () => {
  const { modules: rawModules } = useCmsAppShell();

  const modules = React.useMemo(() => {
    const nextModules = rawModules
      .filter((module) => Number(module.is_active) === 1)
      .slice()
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));

    return nextModules.length > 0 ? nextModules : fallbackModules;
  }, [rawModules]);

  return { modules };
};
