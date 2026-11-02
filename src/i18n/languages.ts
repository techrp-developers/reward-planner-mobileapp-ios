/**
 * Supported app languages. Adding another Indian language only needs an entry
 * here plus its locale files registered in ./resources.ts.
 */
export const LANGUAGES = [
  { code: "en", nativeName: "English", englishName: "English", intlLocale: "en-IN" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", intlLocale: "hi-IN" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi", intlLocale: "mr-IN" },
] as const;

export type AppLanguage = (typeof LANGUAGES)[number]["code"];
export type LanguageOption = (typeof LANGUAGES)[number];

/** English is always the default; the device language never overrides it. */
export const DEFAULT_LANGUAGE: AppLanguage = "en";

export const SUPPORTED_LANGUAGES: readonly AppLanguage[] = LANGUAGES.map(
  (language) => language.code
);

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function getLanguageOption(code: string | undefined): LanguageOption {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}
