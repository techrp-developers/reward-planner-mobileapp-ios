import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../auth/api/axios";
import { splashLog } from "./splashDiagnostics";
import type {
  SplashCampaign, SplashFrequencyRule, SplashNavigationTarget, SplashPageKey,
  SplashResolvedData, SplashSlotKey, SplashSource,
} from "./splashTypes";

const SOURCES: SplashSource[] = ["scheduled_campaign", "default", "none"];
const RULES: SplashFrequencyRule[] = ["once_per_session", "once_per_day", "every_visit"];
const REQUEST_TIMEOUT_MS = 4000;
const CACHE_PREFIX = "@rp_cms_splash_cache:v1:";

const time = (value: unknown): number | null => {
  if (typeof value !== "string" || !value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const positiveInt = (value: unknown): number | null =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

function parseNavigation(value: any): SplashNavigationTarget | null {
  if (!value || typeof value !== "object" || typeof value.destination !== "string") return null;
  const ids = Array.isArray(value.targetIds) ? value.targetIds.map(positiveInt).filter(Boolean) as number[] : undefined;
  return {
    destination: value.destination,
    ...(positiveInt(value.targetId) ? { targetId: positiveInt(value.targetId)! } : {}),
    ...(ids?.length ? { targetIds: ids } : {}),
    ...(positiveInt(value.contentId) ? { contentId: positiveInt(value.contentId)! } : {}),
  };
}

function parseCampaign(value: any): SplashCampaign | null {
  if (!value || typeof value !== "object") return null;
  const contentId = positiveInt(value.content_id);
  const imageUrl = typeof value.image_url === "string" ? value.image_url.trim() : "";
  if (!contentId || !/^https:\/\/[^\s]+$/i.test(imageUrl)) return null;
  const display = value.display && typeof value.display === "object" ? value.display : {};
  const seconds = Number(display.display_seconds);
  return {
    content_id: contentId,
    placement_id: positiveInt(value.placement_id),
    title: typeof value.title === "string" ? value.title : "",
    cta_text: typeof value.cta_text === "string" && value.cta_text.trim() ? value.cta_text : null,
    image_url: imageUrl,
    display_mode: typeof value.display_mode === "string" ? value.display_mode : "single",
    motion: value.motion && typeof value.motion === "object" ? value.motion : null,
    navigation: parseNavigation(value.navigation),
    link: typeof value.link === "string" && value.link ? value.link : null,
    priority: Number(value.priority) || 0,
    starts_at: typeof value.starts_at === "string" ? value.starts_at : null,
    expires_at: typeof value.expires_at === "string" ? value.expires_at : null,
    display: {
      // An unknown rule is treated as the strictest common one.
      frequency_rule: RULES.includes(display.frequency_rule) ? display.frequency_rule : "once_per_day",
      // 3 seconds is the backend default; keep it between 1 and 15.
      display_seconds: Number.isFinite(seconds) && seconds > 0 ? Math.min(Math.max(seconds, 1), 15) : 3,
      auto_dismiss: display.auto_dismiss !== false,
      dismissible: display.dismissible !== false,
    },
  };
}

/** Returns null for anything that is not a well-formed resolved response. */
export function parseSplashResponse(body: any): SplashResolvedData | null {
  const data = body?.success === true ? body.data : null;
  if (!data || typeof data !== "object" || !SOURCES.includes(data.source)) return null;
  if (time(data.server_time) === null) return null;
  const campaign = data.source === "none" ? null : parseCampaign(data.campaign);
  return {
    source: campaign ? data.source : "none",
    page_key: String(data.page_key ?? ""),
    slot_key: String(data.slot_key ?? ""),
    platform: String(data.platform ?? ""),
    audience: String(data.audience ?? ""),
    server_time: data.server_time,
    expires_at: typeof data.expires_at === "string" ? data.expires_at : null,
    next_change_at: typeof data.next_change_at === "string" ? data.next_change_at : null,
    cache_ttl_seconds: Math.max(0, Number(data.cache_ttl_seconds) || 0),
    campaign,
  };
}

export type ResolvedSplash = {
  data: SplashResolvedData;
  // serverNow ≈ Date.now() + offsetMs. Used instead of trusting the device clock.
  offsetMs: number;
};

/** Latest moment (server time) this result may still be used. */
export function validUntil(data: SplashResolvedData): number {
  const server = time(data.server_time)!;
  return Math.min(
    server + data.cache_ttl_seconds * 1000,
    time(data.expires_at) ?? Infinity,
    time(data.next_change_at) ?? Infinity,
    time(data.campaign?.expires_at) ?? Infinity,
  );
}

/** True when the campaign may be shown at `serverNow`. */
export function isCampaignLive(campaign: SplashCampaign, serverNow: number): boolean {
  const starts = time(campaign.starts_at);
  const expires = time(campaign.expires_at);
  return (starts === null || starts <= serverNow) && (expires === null || serverNow < expires);
}

const cacheKey = (scope: string, pageKey: string, slotKey: string, platform: string) =>
  `${CACHE_PREFIX}${scope}:${pageKey}:${slotKey}:${platform}`;

async function writeCache(key: string, value: ResolvedSplash): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ...value, validUntil: validUntil(value.data) }));
  } catch {
    // Caching is optional.
  }
}

/** A cached result, only while it is still valid by the last known server time. */
async function readCache(key: string, now = Date.now()): Promise<ResolvedSplash | null> {
  try {
    const stored = JSON.parse((await AsyncStorage.getItem(key)) ?? "null");
    const data = parseSplashResponse({ success: true, data: stored?.data });
    const offsetMs = Number(stored?.offsetMs);
    if (!data || !Number.isFinite(offsetMs) || !(now + offsetMs < Number(stored?.validUntil))) return null;
    return { data, offsetMs };
  } catch {
    return null;
  }
}

/**
 * The selected campaign for one page/slot. The shared API client sends the
 * employee's access token, so the backend's optionalAuth picks the signed-in
 * audience; it never sends `audience` itself. Reuses a result only within the
 * server's TTL, next-change time and campaign expiry, scoped to the employee.
 */
export async function getResolvedSplash({ pageKey, slotKey, scope, signal }: {
  pageKey: SplashPageKey;
  slotKey: SplashSlotKey;
  scope: string;
  signal?: AbortSignal;
}): Promise<ResolvedSplash | null> {
  const platform = Platform.OS;
  if (platform !== "ios" && platform !== "android") return null;
  const key = cacheKey(scope, pageKey, slotKey, platform);
  // A valid server-bounded snapshot avoids putting a network round trip on
  // every launch. Expired/scheduled changes always resolve against the API.
  const cached = await readCache(key);
  if (signal?.aborted) return null;
  if (cached) {
    splashLog("API_RESPONSE_RECEIVED", { fromCache: true, contentId: cached.data.campaign?.content_id });
    return cached;
  }
  const requestedAt = Date.now();
  try {
    splashLog("API_REQUEST_STARTED", { pageKey, slotKey, platform });
    const response = await api.get("/content/splashscreens/resolved", {
      params: { page_key: pageKey, slot_key: slotKey, platform },
      timeout: REQUEST_TIMEOUT_MS,
      signal,
    });
    const data = parseSplashResponse(response.data);
    splashLog("API_RESPONSE_RECEIVED", {
      status: response.status,
      elapsedMs: Date.now() - requestedAt,
      valid: Boolean(data),
      source: data?.source,
      platform: data?.platform,
      audience: data?.audience,
      contentId: data?.campaign?.content_id,
      frequency: data?.campaign?.display.frequency_rule,
      displaySeconds: data?.campaign?.display.display_seconds,
      cacheTtl: data?.cache_ttl_seconds,
      startsAt: data?.campaign?.starts_at,
      expiresAt: data?.campaign?.expires_at,
      serverTime: data?.server_time,
    });
    if (!data) return null;
    const midpoint = requestedAt + (Date.now() - requestedAt) / 2;
    const resolved = { data, offsetMs: time(data.server_time)! - midpoint };
    await writeCache(key, resolved);
    return resolved;
  } catch (error: any) {
    const cancelled = Boolean(signal?.aborted || error?.name === "CanceledError");
    splashLog("API_REQUEST_FAILED", {
      elapsedMs: Date.now() - requestedAt,
      cancelled,
      status: error?.response?.status ?? null,
      code: error?.code ?? null,
    });
    if (cancelled) return null;
    const fallback = await readCache(key);
    if (fallback) splashLog("API_RESPONSE_RECEIVED", { fromCache: true, contentId: fallback.data.campaign?.content_id });
    return fallback;
  }
}
