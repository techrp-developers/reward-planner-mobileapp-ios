import i18n from "./index";
import { en } from "./resources";
import type { AppNamespace } from "./index";

/**
 * Translates a known English source string from a namespace, for labels that
 * live in data arrays or arrive from the API as English (statuses, filters).
 * The English text itself is the lookup key; unknown text is returned as-is,
 * so data that isn't part of the UI copy is never altered.
 */
const reverse = new Map<string, Map<string, string>>();

function index(ns: AppNamespace): Map<string, string> {
  let map = reverse.get(ns);
  if (map) return map;
  map = new Map();
  const walk = (node: unknown, path: string) => {
    if (typeof node === "string") {
      if (!map!.has(node)) map!.set(node, path);
    } else if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) walk(value, path ? `${path}.${key}` : key);
    }
  };
  walk(en[ns], "");
  reverse.set(ns, map);
  return map;
}

export function translateSourceText(ns: AppNamespace, text?: string | null): string {
  if (!text) return "";
  const key = index(ns).get(text);
  return key ? i18n.t(`${ns}:${key}`) : text;
}
