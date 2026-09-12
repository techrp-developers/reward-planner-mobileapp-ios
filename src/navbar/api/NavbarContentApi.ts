import type { CmsNavbarBackgroundMap, CmsZoneEntry } from "../../modules/common/cms/cmsContentApi";
import { TAB_MODULE_MAP, TopTab } from "../navbarConstants";

export interface NavbarBanner {
  imageUrl: string | null;
  bgColor: string | null;
}

export type NavbarBannerMap = Record<TopTab, NavbarBanner>;

const toNavbarBanner = (entry: CmsZoneEntry | null | undefined): NavbarBanner => ({
  imageUrl: entry?.content_type === "image" && entry.image_url ? entry.image_url : null,
  bgColor: entry?.content_type === "color" && entry.color_value ? entry.color_value : null,
});

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
