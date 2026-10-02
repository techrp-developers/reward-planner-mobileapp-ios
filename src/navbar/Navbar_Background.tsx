import React from "react";
import {
  Animated,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { NavbarBannerMap } from "./api/NavbarContentApi";
import { TopTab } from "./navbarConstants";

type Props = {
  activeTab: TopTab;
  banners: NavbarBannerMap;
  insetsTop: number;
  isDark: boolean;
  scrollY: Animated.Value;
};

// Recommended CMS artwork ratio only; navbar layout follows its content.
export const NAVBAR_BACKGROUND_ASPECT_RATIO = 1317 / 551;
// Collapsed state still needs to cover the pinned module-tabs row once the
// profile/search block collapses away above it.
export const NAVBAR_COLLAPSED_BACKGROUND_HEIGHT = 105;
export const NAVBAR_COLLAPSE_DISTANCE = 90;
export const NAVBAR_SCROLLED_BACKGROUND_OFFSET = 45;

export default function Navbar_Background({
  activeTab,
  banners,
  isDark,
  scrollY,
}: Props) {
  const scrolledBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, NAVBAR_SCROLLED_BACKGROUND_OFFSET],
    outputRange: [0, 1],
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
  const hasVisibleImage = (banner: typeof currentBanner) =>
    Boolean(banner?.imageUrl && !failedImages[banner.imageUrl]);
  const showOverlay = hasVisibleImage(currentBanner) || hasVisibleImage(previousBanner);
  // CMS colors have no dark variant; use the dark surface and dim artwork
  // so the navbar remains readable in either theme.
  const defaultBgColor = isDark ? "#09090B" : "#FFFFFF";

  const renderLayer = (tab: TopTab, opacity?: Animated.Value | number) => {
    const banner = banners[tab];
    const imageUrl = banner?.imageUrl;
    const showImage = Boolean(imageUrl && !failedImages[imageUrl]);
    const bgColor = isDark ? defaultBgColor : banner?.bgColor ?? defaultBgColor;

    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        {bgColor !== "transparent" ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
        ) : null}
        {showImage ? (
          <Image
            source={{ uri: imageUrl as string }}
            style={StyleSheet.absoluteFill}
            // Fill the complete navbar frame, including the iOS safe area,
            // so no black band appears behind the camera/status bar. `cover`
            // preserves the image proportions without stretching.
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
    isDark ? defaultBgColor : currentBanner?.bgColor ?? previousBanner?.bgColor ?? defaultBgColor;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: resolvedBgColor }]}>
      <View style={styles.root}>
        {previousTab !== activeTab ? renderLayer(previousTab, 1) : null}
        {renderLayer(activeTab, previousTab === activeTab ? 1 : fade)}
        {isDark && showOverlay ? (
          <View style={[StyleSheet.absoluteFill, styles.darkImageOverlay]} />
        ) : null}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: defaultBgColor, opacity: scrolledBackgroundOpacity }]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  darkImageOverlay: {
    backgroundColor: "rgba(9,9,11,0.6)",
  },
});
