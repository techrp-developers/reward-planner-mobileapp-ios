import i18n from "./index";

const MODULE_KEYS: Record<string, string> = {
  ProductModule: "common:modules.product",
  ServicesModule: "common:modules.services",
  PaymentsModule: "common:modules.payments",
  DineOutModule: "common:modules.dineOut",
};

/**
 * Module names come from the CMS. English keeps the CMS text exactly; other
 * languages use the app translation for the four known modules until the CMS
 * returns localized labels itself.
 */
export function localizedModuleLabel(module: { route_key?: string | null; label?: string | null }): string {
  const key = module.route_key ? MODULE_KEYS[module.route_key] : undefined;
  if (!key || i18n.language === "en") return module.label ?? "";
  return i18n.t(key);
}
