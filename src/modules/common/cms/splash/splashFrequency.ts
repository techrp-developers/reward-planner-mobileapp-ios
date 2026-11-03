import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SplashCampaign, SplashFrequencyRule } from "./splashTypes";

// The backend does not know what this device has shown, so the display
// frequency is enforced here. Keys hold the employee id (or "guest"), never a
// token, so one account's history never hides a campaign from another.
const STORAGE_PREFIX = "@rp_cms_splash_seen:v1:";
const IST_OFFSET_MS = 330 * 60 * 1000;

// Cleared only when the JS runtime restarts, i.e. a new app launch.
const seenThisSession = new Set<string>();

export function splashSeenKey(scope: string, pageKey: string, slotKey: string, campaign: SplashCampaign): string {
  const placement = campaign.placement_id ?? `default-${pageKey}-${slotKey}`;
  return `${scope}|${pageKey}|${slotKey}|${placement}|${campaign.content_id}`;
}

/** Campaign days run on India time, from server time rather than the device clock. */
export function istDay(serverNow: number): string {
  return new Date(serverNow + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export async function isSplashDue(key: string, rule: SplashFrequencyRule, serverNow: number): Promise<boolean> {
  if (rule === "every_visit") return true;
  if (seenThisSession.has(key)) return false;
  if (rule === "once_per_session") return true;
  try {
    return (await AsyncStorage.getItem(STORAGE_PREFIX + key)) !== istDay(serverNow);
  } catch {
    // Storage unavailable: still at most once per launch.
    return true;
  }
}

/** Call only once the artwork is actually on screen. */
export async function markSplashShown(key: string, rule: SplashFrequencyRule, serverNow: number): Promise<void> {
  seenThisSession.add(key);
  if (rule !== "once_per_day") return;
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + key, istDay(serverNow));
  } catch {
    // The in-memory record still prevents a repeat this launch.
  }
}

/** Test helper. */
export function resetSplashSessionForTests(): void {
  seenThisSession.clear();
}
