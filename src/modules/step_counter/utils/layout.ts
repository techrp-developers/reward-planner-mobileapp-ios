// Layout rules shared by RP Move screens. Kept as pure functions so they can
// be tested without rendering.

export const TILE_GAP = 8;

// Narrowest tile that still shows "5,000" and "steps / day" in full.
export const MIN_TILE_WIDTH = 70;

/**
 * Weekly-plan / goal tiles: up to four per row, dropping to fewer columns
 * when four would be narrower than MIN_TILE_WIDTH (small iPhones, larger
 * text), so labels wrap or fit instead of being cut to "steps /…".
 */
export function tileGrid(innerWidth: number, count: number, fontScale = 1) {
  let cols = Math.max(1, Math.min(count, 4));
  const widthFor = (c: number) => (innerWidth - TILE_GAP * (c - 1)) / c;
  if (cols > 2 && widthFor(cols) < MIN_TILE_WIDTH * fontScale) cols = 2;
  if (cols > 1 && widthFor(cols) < MIN_TILE_WIDTH * fontScale) cols = 1;
  return { cols, tileWidth: Math.floor(widthFor(cols)) };
}

type Insets = { top: number; right: number; bottom: number; left: number };

/**
 * Safe-area insets handed to RP Move screens. While the tab bar shows, it sits
 * in its own region that already contains the device's bottom inset, so the
 * screens only clear the raised center logo — the inset is never applied twice.
 */
export function screenInsets(device: Insets, tabBarShown: boolean, logoOverhang: number): Insets {
  return tabBarShown ? { ...device, bottom: logoOverhang } : device;
}
