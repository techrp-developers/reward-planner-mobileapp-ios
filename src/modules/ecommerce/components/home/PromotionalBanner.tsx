import React from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Animated, ImageLoadEvent } from "react-native";
import { normalizeLocalCmsImageUrl } from "../../../../config/apiConfig";
import { fetchResolvedZones } from "../../../common/cms/cmsContentApi";
import type { CmsModuleKey } from "../../../common/cms/cmsContentApi";
import { useModuleContent, moduleContentQueryKey } from "../../../common/cms/useModuleContent";
import { queryClient } from "../../../../query/queryClient";

// Matches the old fixed `width * 0.92` banner proportions — used both as the
// pure color fallback ratio (no image to measure) and as the placeholder
// ratio shown for the brief moment before a real image's natural dimensions
// are known.
const FALLBACK_ASPECT_RATIO = 1 / 0.92;
const MIN_ASPECT_RATIO = 0.45;
const MAX_ASPECT_RATIO = 2.2;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Props = {
  module?: CmsModuleKey;
};

function PromotionalBanner({ module = "product" }: Props) {
  const { moduleContent, isLoading, isError } = useModuleContent(module);
  const banner = moduleContent?.promotional_banner ?? null;

  const rawBannerImageUrl = banner?.content_type === "image" ? banner.image_url : null;
  const bannerImageUrl = React.useMemo(
    () => normalizeLocalCmsImageUrl(rawBannerImageUrl),
    [rawBannerImageUrl]
  );

  const [imageAspectRatio, setImageAspectRatio] = React.useState<number | null>(null);
  const [imageFailed, setImageFailed] = React.useState(false);

  // A newly published campaign (or one that previously failed) gets a fresh
  // chance to load and measure its own ratio.
  React.useEffect(() => {
    setImageAspectRatio(null);
    setImageFailed(false);
  }, [bannerImageUrl]);

  React.useEffect(() => {
    if (!__DEV__) return;
    console.log(`[CMS] Promotional banner (${module}):`, { isLoading, isError, banner, bannerImageUrl });
  }, [module, banner, bannerImageUrl, isLoading, isError]);

  const handlePress = React.useCallback(() => {
    if (banner?.redirect_link) {
      Linking.openURL(banner.redirect_link).catch(() => undefined);
    }
  }, [banner?.redirect_link]);

  const handleImageLoad = React.useCallback(
    (event: ImageLoadEvent) => {
      const { width, height } = event.nativeEvent.source;
      if (width && height) {
        setImageAspectRatio(clamp(width / height, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO));
      }
      if (__DEV__) {
        console.log("[CMS] Promotional banner image loaded", { url: bannerImageUrl, width, height });
      }
    },
    [bannerImageUrl]
  );

  const handleImageError = React.useCallback(() => {
    setImageFailed(true);
    if (__DEV__) {
      console.error("[CMS] Promotional banner image failed", { url: bannerImageUrl });
    }
  }, [bannerImageUrl]);

  const showRemoteImage = !!bannerImageUrl && !imageFailed;
  const showColor = !showRemoteImage && !!banner?.color_value;
  const Wrapper = banner?.redirect_link ? TouchableOpacity : View;
  // Full height once the real image has loaded and reported its own ratio;
  // the fixed ratio otherwise (no image, or still loading it).
  const bannerAspectRatio = showRemoteImage && imageAspectRatio ? imageAspectRatio : FALLBACK_ASPECT_RATIO;

  // No CMS entry for this zone (nothing published, or the fetch hasn't
  // resolved yet) — render nothing so the home screen flows straight from
  // the navbar into the categories section instead of showing a placeholder.
  if (!showRemoteImage && !showColor) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Wrapper
        activeOpacity={0.9}
        onPress={banner?.redirect_link ? handlePress : undefined}
        style={[styles.bannerBox, { aspectRatio: bannerAspectRatio }]}
      >
        {showColor ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: banner!.color_value! }]} />
        ) : null}

        {showRemoteImage ? (
          <Animated.Image
            source={{ uri: bannerImageUrl! }}
            style={[StyleSheet.absoluteFill, imageAspectRatio === null ? styles.imageLoading : null]}
            resizeMode="cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : null}
      </Wrapper>
    </View>
  );
}

export default React.memo(PromotionalBanner);

export const prefetchPromotionalBanner = (module: CmsModuleKey = "product") =>
  queryClient.prefetchQuery({
    queryKey: moduleContentQueryKey(module),
    queryFn: () => fetchResolvedZones(module),
    staleTime: 5 * 60 * 1000,
  });

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 8,
  },

  bannerBox: {
    width: "100%",
    justifyContent: "flex-end",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  // Dims the image slightly while it's still sized to the placeholder ratio
  // (before its own dimensions are known), so the crop/reflow the instant
  // it loads reads as a fade-in rather than a visible jump.
  imageLoading: {
    opacity: 0.85,
  },
});
