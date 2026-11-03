import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import SplashScreen from "../../auth/screens/SplashScreen";
import PromotionalSplashScreen from "./PromotionalSplashScreen";
import { getResolvedSplash, isCampaignLive } from "./splashApi";
import { isSplashDue, markSplashShown, resetSplashHistoryForDev, splashSeenKey } from "./splashFrequency";
import { registerSplashDevMenu, splashLog } from "./splashDiagnostics";
import { cachedArtwork, downloadArtwork } from "./splashArtworkCache";
import { runSplashActionWhenReady, splashAction } from "./splashNavigation";
import type { SplashCampaign } from "./splashTypes";

const PAGE_KEY = "app_launch";
const SLOT_KEY = "promo_splash";
// Extra time the launch screen may wait, once startup is done, for artwork
// that is still downloading. The request and the download start much earlier,
// as soon as the employee is known, so most launches never wait at all.
export const LAUNCH_PROMO_BUDGET_MS = 1500;

/*
 * One launch presentation, on the Splash route:
 *   initializing        startup gates still running; the logo is shown
 *   resolving_campaign  startup done, artwork not ready yet (bounded wait)
 *   campaign_ready      artwork prefetched; it fades in over the logo
 *   campaign_visible    artwork on screen; its timer is running
 *   finished            the app (or Login, language, terms) takes over
 */
export type LaunchPhase =
  | "initializing" | "resolving_campaign" | "campaign_ready" | "campaign_visible" | "finished";

// imageUri: the artwork's local file when cached on disk, else its CDN URL.
type Prepared = { campaign: SplashCampaign; offsetMs: number; seenKey: string; imageUri: string };

export type LaunchPresentation = {
  phase: LaunchPhase;
  /** Keep the Splash route mounted even though showSplash is false. */
  holding: boolean;
  campaign: Prepared | null;
  onShown: () => void;
  finish: (withAction?: boolean) => void;
};

// One attempt per employee per app launch: auth refreshes, language changes,
// re-logins and remounts never show it again until the app is relaunched.
const attempted = new Set<string>();

splashLog("LAUNCH_STARTED");
registerSplashDevMenu(async () => {
  attempted.clear();
  await resetSplashHistoryForDev();
});

/**
 * Per-employee scope for display history and caching ("u<id>"), or null.
 * /v1/auth/user-info returns the id as "userId"; "user_id" is the database
 * name some payloads still use. Reading only "user_id" left the scope null,
 * so the launch campaign was never requested.
 */
export function employeeScope(
  authenticated: boolean,
  user: { userId?: unknown; user_id?: unknown } | null | undefined,
): string | null {
  const id = Number(user?.userId ?? user?.user_id);
  return authenticated && Number.isSafeInteger(id) && id > 0 ? `u${id}` : null;
}

/** Fetch, check and download the artwork. Null means "no promotion". */
async function prepare(scope: string, signal: AbortSignal): Promise<Prepared | null> {
  const startedAt = Date.now();
  const skip = (reason: string) => {
    splashLog("CAMPAIGN_SKIPPED", { reason, elapsedMs: Date.now() - startedAt });
    return null;
  };
  const resolved = await getResolvedSplash({ pageKey: PAGE_KEY, slotKey: SLOT_KEY, scope, signal });
  if (signal.aborted) return skip("aborted");
  if (!resolved) return skip("no_response");
  const campaign = resolved.data.campaign;
  if (!campaign) return skip(`source_${resolved.data.source}`);
  const serverNow = Date.now() + resolved.offsetMs;
  if (!isCampaignLive(campaign, serverNow)) return skip("not_live");
  const seenKey = splashSeenKey(scope, PAGE_KEY, SLOT_KEY, campaign);
  // A campaign already seen today stays hidden; the backend's choice is never
  // swapped for another default.
  const due = await isSplashDue(seenKey, campaign.display.frequency_rule, serverNow);
  splashLog("FREQUENCY_CHECK", { rule: campaign.display.frequency_rule, due });
  if (!due) return skip("already_seen");
  const prefetchStarted = Date.now();
  // Disk first: instant on every launch after the first download.
  let imageUri = await cachedArtwork(campaign.image_url).catch(() => null);
  let source = "disk";
  if (!imageUri) {
    source = "network";
    splashLog("IMAGE_PREFETCH_STARTED", { source });
    // Not cancelled by a timeout: the file is kept for the next launch.
    imageUri = await downloadArtwork(campaign.image_url).catch(() => null);
  }
  if (!imageUri) {
    // Disk cache unavailable: fall back to the platform image cache.
    source = "platform_cache";
    const loaded = await Image.prefetch(campaign.image_url).catch(() => false);
    imageUri = loaded ? campaign.image_url : null;
  }
  splashLog("IMAGE_PREFETCH_FINISHED", { ok: Boolean(imageUri), source, elapsedMs: Date.now() - prefetchStarted });
  if (signal.aborted) return skip("aborted");
  if (!imageUri) return skip("image_prefetch_failed");
  splashLog("CAMPAIGN_READY", { contentId: campaign.content_id, totalMs: Date.now() - startedAt });
  return { campaign, offsetMs: resolved.offsetMs, seenKey, imageUri };
}

export function useLaunchPresentation({ scope, startupDone, eligible }: {
  /** "u<employee id>" once the session is restored; null when signed out. */
  scope: string | null;
  /** The existing startup gates (session, terms check, language) are done. */
  startupDone: boolean;
  /** The next screen is the app itself, with no update prompt over it. */
  eligible: boolean;
}): LaunchPresentation {
  const [phase, setPhase] = useState<LaunchPhase>("initializing");
  const [campaign, setCampaign] = useState<Prepared | null>(null);
  const requestRef = useRef<{ scope: string; promise: Promise<Prepared | null>; abort: AbortController } | null>(null);
  const campaignRef = useRef<Prepared | null>(null);
  const finishedRef = useRef(false);

  // Start as soon as the employee is known: this runs during the logo splash.
  useEffect(() => {
    if (scope) splashLog("AUTH_SCOPE_READY", { signedIn: true, alreadyAttempted: attempted.has(scope) });
    if (!scope) {
      requestRef.current?.abort.abort();
      requestRef.current = null;
      campaignRef.current = null;
      finishedRef.current = false;
      setCampaign(null);
      setPhase("initializing");
      return;
    }
    if (attempted.has(scope) || requestRef.current?.scope === scope) return;
    requestRef.current?.abort.abort();
    const abort = new AbortController();
    requestRef.current = { scope, abort, promise: prepare(scope, abort.signal).catch(() => null) };
  }, [scope]);

  useEffect(() => {
    splashLog("STARTUP_GATES", { startupDone, eligible, signedIn: Boolean(scope), phase });
    if (!startupDone || !scope || phase !== "initializing") return undefined;
    // Login, language or terms come next, or this launch already had its turn:
    // never hold them back and never show the promotion later.
    if (!eligible || attempted.has(scope)) {
      splashLog("CAMPAIGN_SKIPPED", { reason: !eligible ? "not_eligible_next_screen" : "already_attempted_this_launch" });
      if (scope) attempted.add(scope);
      requestRef.current?.abort.abort();
      setPhase("finished");
      return undefined;
    }
    attempted.add(scope);
    const request = requestRef.current?.scope === scope ? requestRef.current : null;
    let live = true;
    const waitStarted = Date.now();
    const giveUp = (reason: string) => {
      if (!live) return;
      live = false;
      if (reason !== "not_prepared") splashLog("CAMPAIGN_SKIPPED", { reason, waitedMs: Date.now() - waitStarted });
      request?.abort.abort();
      setPhase("finished");
    };
    const budget = setTimeout(() => giveUp("startup_budget_exceeded"), LAUNCH_PROMO_BUDGET_MS);
    setPhase("resolving_campaign");
    (request?.promise ?? Promise.resolve(null)).then((prepared) => {
      if (!live) return;
      clearTimeout(budget);
      if (!prepared) return giveUp("not_prepared");
      splashLog("LAUNCH_HOLDING", { waitedMs: Date.now() - waitStarted });
      live = false;
      campaignRef.current = prepared;
      setCampaign(prepared);
      setPhase("campaign_ready");
    });
    // Interrupted while waiting (signed out, or an update prompt opened):
    // give up for this launch rather than leave the Splash route held.
    return () => {
      clearTimeout(budget);
      giveUp("interrupted");
    };
    // phase is read only to start once; transitions are driven from here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startupDone, eligible, scope]);

  // Counted only once the artwork is actually on screen.
  const onShown = useCallback(() => {
    const prepared = campaignRef.current;
    if (!prepared || finishedRef.current) return;
    splashLog("CAMPAIGN_SHOWN", { contentId: prepared.campaign.content_id });
    setPhase("campaign_visible");
    markSplashShown(prepared.seenKey, prepared.campaign.display.frequency_rule, Date.now() + prepared.offsetMs)
      .catch(() => {});
  }, []);

  const finish = useCallback((withAction = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const prepared = campaignRef.current;
    const action = withAction && prepared ? splashAction(prepared.campaign) : null;
    setPhase("finished");
    // The app navigator mounts after this render; the action waits for it.
    if (action) runSplashActionWhenReady(action);
  }, []);

  const active = phase === "resolving_campaign" || phase === "campaign_ready" || phase === "campaign_visible";

  // Eligibility can change after the artwork is ready or on screen (an update
  // prompt opens, a gate re-runs). End the launch presentation then: it is
  // never restarted, because this launch's attempt is already used.
  useEffect(() => {
    if (active && (!eligible || !startupDone)) finish(false);
  }, [active, eligible, finish, startupDone]);

  // Signed in, startup done, eligible and not yet attempted: hold the Splash
  // route from the very first render, so the app never flashes before the art.
  // Every condition is re-checked on each render, so the hold is released in
  // the same render that eligibility is lost, never later.
  const pendingStart = phase === "initializing" && !attempted.has(scope ?? "");
  const holding = Boolean(scope) && eligible && startupDone && (pendingStart || active);

  return { phase, holding, campaign, onShown, finish };
}

const LaunchPresentationContext = createContext<LaunchPresentation | null>(null);
export const LaunchPresentationProvider = LaunchPresentationContext.Provider;

/**
 * The Splash route. Shows the existing logo while startup runs, and the CMS
 * artwork in its place once ready: one launch layer, never two screens in a row.
 */
export function LaunchScreen() {
  const launch = useContext(LaunchPresentationContext);
  const showArtwork = Boolean(launch?.campaign) &&
    (launch?.phase === "campaign_ready" || launch?.phase === "campaign_visible");

  return (
    <View style={styles.screen}>
      <SplashScreen />
      {showArtwork && launch?.campaign ? (
        // Fades in over the logo; it counts as shown once the fade completes.
        <View testID="launch-artwork-layer" style={StyleSheet.absoluteFill}>
          <PromotionalSplashScreen
            campaign={launch.campaign.campaign}
            imageUri={launch.campaign.imageUri}
            offsetMs={launch.campaign.offsetMs}
            onShown={launch.onShown}
            onClose={() => launch.finish(false)}
            onAction={splashAction(launch.campaign.campaign) ? () => launch.finish(true) : undefined}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});

/** Test helper. */
export function resetLaunchPresentationForTests(): void {
  attempted.clear();
}
