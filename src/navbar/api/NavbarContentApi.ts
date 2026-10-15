import type { CmsNavbarBackgroundMap, CmsZoneEntry } from "../../modules/common/cms/cmsContentApi";
import { parseCmsColor, type CmsColorFill } from "../../modules/common/cms/cmsColor";
import { TAB_MODULE_MAP, TopTab } from "../navbarConstants";

export interface NavbarBanner {
  imageUrl: string | null;
  // First stop of the CMS color; drives text contrast and accent colors.
  bgColor: string | null;
  // Full validated fill, painted as a gradient behind the navbar.
  bgFill: CmsColorFill | null;
}

export type NavbarBannerMap = Record<TopTab, NavbarBanner>;

const toNavbarBanner = (entry: CmsZoneEntry | null | undefined): NavbarBanner => {
  const bgFill = entry?.content_type === "color" ? parseCmsColor(entry.color_value) : null;
  return {
    imageUrl: entry?.content_type === "image" && entry.image_url ? entry.image_url : null,
    bgColor: bgFill?.colors[0] ?? null,
    bgFill,
  };
};

// Navbar background data is fetched once via CmsAppShellContext (GET
// /content/resolved/navbar, already normalized); this only reshapes that
// map (keyed by CMS module) into the map the navbar components expect
// (keyed by TopTab).
export const toNavbarBannerMap = (raw: CmsNavbarBackgroundMap): NavbarBannerMap => {
  const map = {} as NavbarBannerMap;

  (Object.entries(TAB_MODULE_MAP) as [TopTab, keyof CmsNavbarBackgroundMap][]).forEach(
    ([tab, module]) => {
      map[tab] = toNavbarBanner(raw[module]);
    },
  );

  return map;
};
