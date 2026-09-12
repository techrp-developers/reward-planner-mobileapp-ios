import React from "react";
import {
  Animated,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NavbarBannerMap } from "./api/NavbarContentApi";
import { TopTab } from "./navbarConstants";
import { rs } from "../utils/responsive";

type Props = {
  activeTab: TopTab;
  banners: NavbarBannerMap;
  insetsTop: number;
  isDark: boolean;
  scrollY: Animated.Value;
};

export const NAVBAR_BACKGROUND_HEIGHT = 230;
// Collapsed state still needs to cover the pinned module-tabs row once the
// profile/search block collapses away above it.
export const NAVBAR_COLLAPSED_BACKGROUND_HEIGHT = 105;
export const NAVBAR_COLLAPSE_DISTANCE = 90;

export default function Navbar_Background({
  activeTab,
  banners,
  insetsTop,
  isDark,
  scrollY,
}: Props) {
  const { width } = useWindowDimensions();
  const animatedHeight = scrollY.interpolate({
    inputRange: [0, NAVBAR_COLLAPSE_DISTANCE],
    outputRange: [
      NAVBAR_BACKGROUND_HEIGHT + insetsTop,
      NAVBAR_COLLAPSED_BACKGROUND_HEIGHT + insetsTop,
    ],
    extrapolate: "clamp",
  });
  const [previousTab, setPreviousTab] = React.useState<TopTab>(activeTab);
  const [failedImages, setFailedImages] = React.useState<Record<string, true>>({});
  const fade = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (previousTab === activeTab) return;

    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPreviousTab(activeTab);
        fade.setValue(1);
      }
    });
  }, [activeTab, fade, previousTab]);

  const currentBanner = banners[activeTab];
  const previousBanner = banners[previousTab];
  // The dark scrim only exists to keep white navbar text legible over a
  // published banner photo — applying it unconditionally muddied the
  // default (no CMS image) background so it never read as pure white/dark.
  const hasVisibleImage = (banner: typeof currentBanner) =>
    Boolean(banner?.imageUrl && !failedImages[banner.imageUrl]);
  const showOverlay = hasVisibleImage(currentBanner) || hasVisibleImage(previousBanner);
  // The CMS only stores a single navbar_background color per module — when
  // no color/image has been published for a module at all, fall back to a
  // theme-aware surface instead of "transparent", which let whatever sits
  // behind Navbar show through and read as a stuck-white bar in dark mode.
  const defaultBgColor = "transparent";

  const renderLayer = (tab: TopTab, opacity?: Animated.Value | number) => {
    const banner = banners[tab];
    const imageUrl = banner?.imageUrl;
    const showImage = Boolean(imageUrl && !failedImages[imageUrl]);
    const bgColor = banner?.bgColor ?? defaultBgColor;

    console.log('[CMS] renderLayer:', {
      tab,
      imageUrl,
      hasFailedBefore: imageUrl ? Boolean(failedImages[imageUrl]) : undefined,
      showImage,
      bgColor,
    });

    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        {bgColor !== "transparent" ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
        ) : null}
        {showImage ? (
          <Image
            source={{ uri: imageUrl as string }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => {
              if (__DEV__) {
                console.log("[CMS] Navbar image failed:", imageUrl);
              }
              setFailedImages((prev) => ({
                ...prev,
                [imageUrl as string]: true,
              }));
            }}
          />
        ) : null}
      </Animated.View>
    );
  };

  const resolvedBgColor =
    currentBanner?.bgColor ?? previousBanner?.bgColor ?? defaultBgColor;
  const hasDynamicBackground =
    resolvedBgColor !== "transparent" || showOverlay;
  const backgroundFrameStyle = React.useMemo(
    () => ({
      width,
      height: animatedHeight,
      backgroundColor: resolvedBgColor,
      shadowOpacity: hasDynamicBackground ? 0.12 : 0,
      elevation: hasDynamicBackground ? 6 : 0,
    }),
    [animatedHeight, hasDynamicBackground, resolvedBgColor, width],
  );

  return (
    // Shadow lives on this outer view (no overflow:hidden — iOS clips away
    // any shadow on a view that also clips its own content) so the rounded
    // bottom edge reads as a soft drop shadow instead of a hard color cutoff.
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shadowWrap,
        backgroundFrameStyle,
      ]}
    >
      <View style={styles.root}>
        {previousTab !== activeTab ? renderLayer(previousTab, 1) : null}
        {renderLayer(activeTab, previousTab === activeTab ? 1 : fade)}

        {showOverlay ? (
          <LinearGradient
            colors={
              isDark
                ? ["rgba(0,0,0,0.12)", "rgba(0,0,0,0.58)"]
                : ["rgba(0,0,0,0.04)", "rgba(0,0,0,0.35)"]
            }
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: rs(6) },
    shadowOpacity: 0.12,
    shadowRadius: rs(10),
    elevation: 6,
  },
  root: {
    flex: 1,
    overflow: "hidden",
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
  },
});
