import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, AppState, BackHandler, Image, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { SplashCampaign } from "./splashTypes";

// Close when the artwork has not appeared by then, even though it was prefetched.
const IMAGE_LOAD_TIMEOUT_MS = 3000;
const FILL = "#100E18";
export const ARTWORK_FADE_MS = 250;

type Props = {
  campaign: SplashCampaign;
  /** serverNow ≈ Date.now() + offsetMs */
  offsetMs: number;
  /** The artwork has finished fading in: count the display now. Called once. */
  onShown: () => void;
  onClose: () => void;
  /** Called instead of onClose when the artwork is tapped and has a destination. */
  onAction?: () => void;
};

/**
 * Full-screen CMS artwork, rendered inside the launch (Splash) route rather
 * than as a separate modal. The whole artwork is kept (`contain`: it may carry
 * offers or terms); a blurred copy fills the edges, so the screen is
 * edge-to-edge on every aspect ratio without cropping or stretching. The
 * duration timer starts only once the image is visible, and every exit path
 * (skip, timeout, tap, failure, expiry, background, back) closes exactly once.
 */
export default function PromotionalSplashScreen({ campaign, offsetMs, onShown, onClose, onAction }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // loaded: the image decoded and the fade started. visible: the fade finished,
  // so the artwork is really on screen; only then do the timer and the
  // "shown" record start.
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const closedRef = useRef(false);
  const loadedRef = useRef(false);
  const shownRef = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const { display } = campaign;
  // Never trap the employee: artwork that cannot be skipped always times out.
  const autoDismiss = display.auto_dismiss || !display.dismissible;

  const finish = useCallback((action: boolean) => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (action && onAction) onAction();
    else onClose();
  }, [onAction, onClose]);

  useEffect(() => {
    if (loaded) return undefined;
    const timer = setTimeout(() => finish(false), IMAGE_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [finish, loaded]);

  // Stop the fade if the screen closes or unmounts part-way through.
  useEffect(() => () => opacity.stopAnimation(), [opacity]);

  const handleLoad = useCallback(() => {
    if (closedRef.current || loadedRef.current) return;
    loadedRef.current = true;
    setLoaded(true);
    Animated.timing(opacity, { toValue: 1, duration: ARTWORK_FADE_MS, useNativeDriver: true }).start(({ finished }) => {
      // An interrupted fade never counts as shown.
      if (!finished || closedRef.current || shownRef.current) return;
      shownRef.current = true;
      setVisible(true);
      onShown();
    });
  }, [onShown, opacity]);

  useEffect(() => {
    if (!visible || !autoDismiss) return undefined;
    const timer = setTimeout(() => finish(false), display.display_seconds * 1000);
    return () => clearTimeout(timer);
  }, [autoDismiss, display.display_seconds, finish, visible]);

  // Close at the campaign's end even if it is still on screen.
  useEffect(() => {
    const expires = campaign.expires_at ? Date.parse(campaign.expires_at) : NaN;
    if (!Number.isFinite(expires)) return undefined;
    const remaining = expires - (Date.now() + offsetMs);
    if (remaining <= 0) {
      finish(false);
      return undefined;
    }
    const timer = setTimeout(() => finish(false), Math.min(remaining, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [campaign.expires_at, finish, offsetMs]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") finish(false);
    });
    return () => subscription.remove();
  }, [finish]);

  // Android back acts as Skip when skipping is allowed.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (display.dismissible) finish(false);
      return true;
    });
    return () => subscription.remove();
  }, [display.dismissible, finish]);

  const label = campaign.cta_text || campaign.title || t("common:actions.close");
  const source = { uri: campaign.image_url };

  return (
    <Animated.View style={[styles.screen, { opacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={24} accessible={false} />
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
      <Pressable
        testID="promo-splash-artwork"
        style={StyleSheet.absoluteFill}
        disabled={!onAction}
        onPress={() => finish(true)}
        accessibilityRole={onAction ? "button" : "image"}
        accessibilityLabel={label}
      >
        <Image
          testID="promo-splash-image"
          source={source}
          resizeMode="contain"
          style={styles.artwork}
          accessibilityIgnoresInvertColors
          onLoad={handleLoad}
          onError={() => finish(false)}
        />
      </Pressable>
      {display.dismissible && visible ? (
        <Pressable
          testID="promo-splash-skip"
          accessibilityRole="button"
          accessibilityLabel={t("common:actions.skip")}
          onPress={() => finish(false)}
          hitSlop={8}
          style={[styles.skip, { top: insets.top + 12, right: insets.right + 16 }]}
        >
          <Text style={styles.skipText}>{t("common:actions.skip")}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: FILL },
  dim: { backgroundColor: "rgba(16, 14, 24, 0.35)" },
  artwork: { width: "100%", height: "100%" },
  skip: {
    position: "absolute",
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 10, 30, 0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.45)",
  },
  skipText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
});
