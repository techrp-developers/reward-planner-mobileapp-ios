import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, NAMESPACES, type AppNamespace } from "./resources";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, isAppLanguage, type AppLanguage } from "./languages";

/**
 * The single i18next instance for the whole app. Imported once from index.js
 * before App renders. Every translation is bundled, so initialisation is
 * synchronous, works offline and never races the first render.
 */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    ns: [...NAMESPACES],
    defaultNS: "common",
    fallbackNS: "common",
    initAsync: false,
    returnNull: false,
    returnEmptyString: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    showSupportNotice: false,
    // Untranslated keys show English instead of a raw key in production.
    parseMissingKeyHandler: (key: string) => {
      if (__DEV__) console.warn(`[i18n] Missing translation: ${key}`);
      return key.split(".").pop() ?? key;
    },
  });
}

export function currentLanguage(): AppLanguage {
  return isAppLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

/** Switches the whole UI. Mounted screens using useTranslation re-render in place. */
export async function applyLanguage(language: AppLanguage): Promise<void> {
  if (i18n.language === language) return;
  await i18n.changeLanguage(language);
}

/** For code outside React components (alerts, helpers, services). */
export const t = i18n.t.bind(i18n);

export type { AppNamespace };
export default i18n;
