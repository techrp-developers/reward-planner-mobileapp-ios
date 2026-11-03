import { DevSettings } from "react-native";
import { API_ENVIRONMENT, SERVER_URL } from "../../../../config/apiConfig";

// TEMPORARY, development builds only: structured "[RP_SPLASH]" events for the
// launch campaign, to diagnose why it does or does not appear on a device.
// Release builds log nothing. Events carry no ids, tokens or personal data.
//
// While debugging a phone, events are also posted to a local listener on the
// Mac (port 8097) so they can be read without the device console. Nothing
// listens there unless a developer starts it; failures are ignored.
// Off under Jest, so test runs neither log nor reach the network.
const ENABLED = __DEV__ && typeof process !== "undefined" && !process.env?.JEST_WORKER_ID;
const SINK_PORT = 8097;
const startedAt = Date.now();
// Correlates the events of one app launch.
export const SPLASH_LAUNCH_ID = Math.random().toString(36).slice(2, 8);

const sinkUrl = (() => {
  if (!ENABLED || API_ENVIRONMENT !== "local") return null;
  const host = SERVER_URL.match(/^https?:\/\/([^/:]+)/i)?.[1];
  return host ? `http://${host}:${SINK_PORT}/rp-splash` : null;
})();

export type SplashEvent =
  | "LAUNCH_STARTED" | "AUTH_SCOPE_READY" | "STARTUP_GATES" | "API_REQUEST_STARTED"
  | "API_RESPONSE_RECEIVED" | "API_REQUEST_FAILED" | "FREQUENCY_CHECK" | "IMAGE_PREFETCH_STARTED"
  | "IMAGE_PREFETCH_FINISHED" | "CAMPAIGN_READY" | "LAUNCH_HOLDING" | "ARTWORK_IMAGE_LOADED"
  | "FADE_COMPLETED" | "CAMPAIGN_SHOWN" | "CAMPAIGN_CLOSED" | "CAMPAIGN_SKIPPED" | "MAIN_APP_OPENED"
  | "DEV_HISTORY_RESET";

export function splashLog(event: SplashEvent, details: Record<string, unknown> = {}): void {
  if (!ENABLED) return;
  const entry = { launch: SPLASH_LAUNCH_ID, ms: Date.now() - startedAt, event, ...details };
  console.log("[RP_SPLASH]", event, JSON.stringify(entry));
  if (sinkUrl) {
    fetch(sinkUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })
      .catch(() => {});
  }
}

/** Development only: a dev-menu item that clears the launch splash history. */
export function registerSplashDevMenu(reset: () => Promise<void>): void {
  if (!ENABLED || typeof DevSettings?.addMenuItem !== "function") return;
  DevSettings.addMenuItem("RP: reset launch splash history", () => {
    reset()
      .then(() => splashLog("DEV_HISTORY_RESET"))
      .catch(() => {});
  });
}
