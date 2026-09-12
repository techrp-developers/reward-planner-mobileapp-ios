import React from "react";
import { useCmsAppShell } from "../../modules/common/cms/CmsAppShellContext";
import { toNavbarBannerMap, NavbarBannerMap } from "../api/NavbarContentApi";

export function useNavbarBanners() {
  const { navbar } = useCmsAppShell();

  const banners = React.useMemo<NavbarBannerMap>(
    () => toNavbarBannerMap(navbar),
    [navbar],
  );

  return { banners };
}
