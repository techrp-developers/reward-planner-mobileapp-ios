import { Dimensions, PixelRatio, Platform } from 'react-native';

const BASE_WIDTH = 375;
const { width } = Dimensions.get('window');

// Scale ratio capped so tablets don't get absurdly large
const ratio = Math.min(width / BASE_WIDTH, 1.35);

/** Responsive size — for spacing, widths, heights, border radii */
export const rs = (n: number) =>
  Math.round(PixelRatio.roundToNearestPixel(n * ratio));

/** Font scale — same ratio but capped tighter (1.2) so text stays readable */
export const fs = (n: number) =>
  Math.round(PixelRatio.roundToNearestPixel(n * Math.min(ratio, 1.2)));

/** Platform-aware hit slop for touchables */
export const hitSlop = (n = 8) => ({
  top: n, bottom: n, left: n, right: n,
});
