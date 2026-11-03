import { Linking } from "react-native";
import { openNotificationRoute, parseExternalUrl } from "../../../notifications/notificationRouting";
import { navigationRef } from "../../../../navigation/navigationRef";
import type { SplashCampaign } from "./splashTypes";

type Route = { path: string[]; params: Record<string, unknown> };
export type SplashAction = { kind: "route"; route: Route } | { kind: "external"; url: string };

const PRODUCT = ["App", "Home", "ProductModule"];
const SERVICES = ["App", "Home", "ServicesModule"];

// server/utils/contentNavigation.js destination keys → existing app routes.
// Keys without an app screen here (subcategory, service_offer,
// service_category, service_bundle_details) do nothing on tap.
export function splashAction(campaign: SplashCampaign): SplashAction | null {
  const url = parseExternalUrl(campaign.link);
  if (url) return { kind: "external", url };

  const nav = campaign.navigation;
  if (!nav) return null;
  const title = campaign.title || "";
  switch (nav.destination) {
    case "product_details":
      return nav.targetId ? { kind: "route", route: { path: ["App", "ProductDetails"], params: { productId: nav.targetId } } } : null;
    case "product_offer":
      // The CMS entry lists its products; the same screen promotional banners use.
      return nav.contentId
        ? { kind: "route", route: { path: [...PRODUCT, "CampaignProducts"], params: { contentId: nav.contentId, title } } }
        : null;
    case "category":
      return nav.targetId
        ? { kind: "route", route: { path: [...PRODUCT, "Category"], params: { categoryId: nav.targetId, title } } }
        : null;
    case "service_details":
      return nav.targetId
        ? { kind: "route", route: { path: [...SERVICES, "ServiceDescription"], params: { serviceId: nav.targetId } } }
        : null;
    default:
      return null;
  }
}

const APP_MOUNT_WAIT_MS = 5000;

/**
 * Runs the action through the same allow-listed opener as push taps. The
 * launch screen closes first, so the app navigator may not be mounted yet:
 * wait for it, open the destination once, and give up quietly (staying on
 * the dashboard) if it never becomes possible.
 */
export function runSplashActionWhenReady(action: SplashAction): void {
  if (action.kind === "external") {
    Linking.openURL(action.url).catch(() => {});
    return;
  }
  if (openNotificationRoute(action.route)) return;
  let done = false;
  const stop = () => {
    done = true;
    clearTimeout(timer);
    unsubscribe();
  };
  const unsubscribe = navigationRef.addListener("state", () => {
    if (!done && openNotificationRoute(action.route)) stop();
  });
  const timer = setTimeout(stop, APP_MOUNT_WAIT_MS);
}
