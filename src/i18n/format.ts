import i18n, { currentLanguage } from "./index";
import { getLanguageOption } from "./languages";

/**
 * Locale-aware display formatting. Only presentation changes with the
 * language: amounts stay in INR with the ₹ symbol, and Latin digits are kept
 * (Marathi would otherwise default to Devanagari numerals) so figures, IDs and
 * amounts read the same in every language.
 */
function locale(): string {
  return `${getLanguageOption(currentLanguage()).intlLocale}-u-nu-latn`;
}

function safeDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatDate(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  const date = safeDate(value);
  if (!date) return "";
  try {
    return date.toLocaleDateString(locale(), options);
  } catch {
    return date.toLocaleDateString("en-IN", options);
  }
}

export function formatTime(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" }
): string {
  const date = safeDate(value);
  if (!date) return "";
  try {
    return date.toLocaleTimeString(locale(), options);
  } catch {
    return date.toLocaleTimeString("en-IN", options);
  }
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }
): string {
  const date = safeDate(value);
  if (!date) return "";
  try {
    return date.toLocaleString(locale(), options);
  } catch {
    return date.toLocaleString("en-IN", options);
  }
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(value)) return "0";
  try {
    return value.toLocaleString(locale(), options);
  } catch {
    return value.toLocaleString("en-IN", options);
  }
}

/**
 * Always INR. Language changes only the separators' presentation, never the
 * value: paise are kept (up to 2 decimals) and nothing is rounded to rupees.
 */
export function formatINR(value: number, minimumFractionDigits = 0): string {
  return `₹${formatNumber(Number.isFinite(value) ? value : 0, {
    minimumFractionDigits,
    maximumFractionDigits: Math.max(2, minimumFractionDigits),
  })}`;
}

/**
 * "Just now", "5 mins ago", "Yesterday", then a short date. Shared by
 * notifications, chat and status so relative times read the same everywhere.
 */
export function formatRelativeTime(value: Date | string | number | null | undefined): string {
  const normalized = typeof value === "string" && !value.includes("T") ? value.replace(" ", "T") : value;
  const date = safeDate(normalized);
  if (!date) return typeof value === "string" ? value : "";
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return i18n.t("common:time.justNow");
  if (diff < hour) return i18n.t("common:time.minutesAgo", { count: Math.floor(diff / minute) });
  if (diff < day) return i18n.t("common:time.hoursAgo", { count: Math.floor(diff / hour) });
  if (diff < 2 * day) return i18n.t("common:time.yesterday");
  return formatDate(date, { day: "numeric", month: "short" });
}

/** Localized month name for a 0-based month index (calendars, date pickers). */
export function monthName(index: number, style: "long" | "short" = "long"): string {
  return formatDate(new Date(2024, index, 1), { month: style });
}

/** Localized weekday labels starting Sunday, e.g. ["Su", "Mo", …] in English. */
export function weekdayNames(style: "narrow" | "short" | "long" = "short"): string[] {
  // 7 Jan 2024 was a Sunday.
  return Array.from({ length: 7 }, (_, i) => {
    const label = formatDate(new Date(2024, 0, 7 + i), { weekday: style });
    return style === "short" && currentLanguage() === "en" ? label.slice(0, 2) : label;
  });
}
