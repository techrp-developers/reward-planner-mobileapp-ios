// Layout rules behind the RP Move iPhone fixes: tile columns never cut
// labels, and the tab bar region owns the bottom inset exactly once.
import { MIN_TILE_WIDTH, TILE_GAP, screenInsets, tileGrid } from '../src/modules/step_counter/utils/layout';

// Width inside a tile card: screen − 2 × page gutter − 2 × card padding (14) − border.
const innerFor = (screen: number, gutter: number) => screen - gutter * 2 - 28 - 2;

describe('goal / weekly tiles', () => {
  it('keeps four tiles per row on a 390pt iPhone', () => {
    const grid = tileGrid(innerFor(390, 24), 4);
    expect(grid.cols).toBe(4);
    expect(grid.tileWidth).toBeGreaterThanOrEqual(MIN_TILE_WIDTH);
  });

  it('drops to two columns on a small iPhone instead of truncating', () => {
    const grid = tileGrid(innerFor(320, 20), 4);
    expect(grid.cols).toBe(2);
    expect(grid.tileWidth).toBeGreaterThanOrEqual(MIN_TILE_WIDTH);
  });

  it('never makes tiles wider than the row', () => {
    const inner = innerFor(430, 27);
    const { cols, tileWidth } = tileGrid(inner, 4);
    expect(cols * tileWidth + (cols - 1) * TILE_GAP).toBeLessThanOrEqual(inner);
  });

  it('handles a single recommendation and longer plans', () => {
    expect(tileGrid(300, 1).cols).toBe(1);
    expect(tileGrid(312, 6).cols).toBe(4);
  });
});

describe('tab bar safe area', () => {
  const device = { top: 59, right: 0, bottom: 34, left: 0 };

  it('gives tab screens only the logo overhang, not the device inset again', () => {
    expect(screenInsets(device, true, 26)).toEqual({ top: 59, right: 0, bottom: 26, left: 0 });
  });

  it('keeps the real insets on screens without the bar', () => {
    expect(screenInsets(device, false, 26)).toBe(device);
  });
});


describe('goal tiles with larger text', () => {
  it.each([320, 375, 390, 430])('fits all tiles at %ipt', screen => {
    const inner = innerFor(screen, 24);
    const { cols, tileWidth } = tileGrid(inner, 4, 1.2);
    expect(cols * tileWidth + (cols - 1) * TILE_GAP).toBeLessThanOrEqual(inner);
    expect(tileWidth).toBeGreaterThanOrEqual(MIN_TILE_WIDTH * 1.2);
  });
  it('uses one column when two cannot fit accessible text', () => {
    expect(tileGrid(180, 4, 1.5).cols).toBe(1);
  });
});
