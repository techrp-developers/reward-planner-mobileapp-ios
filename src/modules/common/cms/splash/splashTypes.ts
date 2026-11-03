// Contract of GET /content/splashscreens/resolved (server/services/splashscreenService.js).
// The backend selects the campaign (schedule, priority, platform, audience,
// default artwork); the app only checks the result is still valid and applies
// the per-device display frequency, which the backend does not track.

export type SplashSource = "scheduled_campaign" | "default" | "none";
export type SplashFrequencyRule = "once_per_session" | "once_per_day" | "every_visit";
export type SplashPageKey =
  | "app_launch" | "dashboard" | "products" | "services" | "bus_booking"
  | "payments" | "step_counter" | "investments" | "insurance" | "rewards";
export type SplashSlotKey = "promo_splash" | "entry_popup" | "hero_banner" | "inline_banner";

export type SplashDisplaySettings = {
  frequency_rule: SplashFrequencyRule;
  display_seconds: number;
  auto_dismiss: boolean;
  dismissible: boolean;
};

export type SplashMotionSettings = {
  effect: string;
  intensity: string;
  speed: string;
};

// server/utils/contentNavigation.js
export type SplashNavigationTarget = {
  destination: string;
  targetId?: number;
  targetIds?: number[];
  contentId?: number;
};

export type SplashCampaign = {
  content_id: number;
  placement_id: number | null;
  title: string;
  cta_text: string | null;
  image_url: string;
  display_mode: string;
  motion: SplashMotionSettings | null;
  navigation: SplashNavigationTarget | null;
  link: string | null;
  priority: number;
  starts_at: string | null;
  expires_at: string | null;
  display: SplashDisplaySettings;
};

export type SplashResolvedData = {
  source: SplashSource;
  page_key: string;
  slot_key: string;
  platform: string;
  audience: string;
  server_time: string;
  expires_at: string | null;
  next_change_at: string | null;
  cache_ttl_seconds: number;
  campaign: SplashCampaign | null;
};

export type SplashResolvedResponse = {
  success: boolean;
  data: SplashResolvedData;
};
