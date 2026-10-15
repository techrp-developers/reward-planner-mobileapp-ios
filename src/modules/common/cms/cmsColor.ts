import { processColor } from 'react-native';

type Point = { x: number; y: number };

export interface CmsColorFill {
  // Always at least two valid stops, so it can go straight into LinearGradient.
  colors: string[];
  start: Point;
  end: Point;
  isGradient: boolean;
}

const DIRECTIONS: Record<string, [Point, Point]> = {
  'left-right': [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  'right-left': [{ x: 1, y: 0 }, { x: 0, y: 0 }],
  'top-bottom': [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  'bottom-top': [{ x: 0, y: 1 }, { x: 0, y: 0 }],
  'top-left-bottom-right': [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  'bottom-left-top-right': [{ x: 0, y: 1 }, { x: 1, y: 0 }],
};
const DEFAULT_DIRECTION = DIRECTIONS['top-left-bottom-right'];

// Native views crash on colors they cannot parse, so every stop is checked.
const toValidColor = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const color = value.trim();
  return color && processColor(color) != null ? color : null;
};

// The CMS stores color_value either as a plain color ("#612E9F") or as a JSON
// gradient ({"type":"gradient","colors":[...],"direction":"top-bottom"}).
// Returns null when nothing usable is present.
export const parseCmsColor = (value: string | null | undefined): CmsColorFill | null => {
  if (!value) return null;

  let parsed: any = null;
  if (value.trim().startsWith('{')) {
    try { parsed = JSON.parse(value); } catch { return null; }
  }

  const colors = parsed
    ? (Array.isArray(parsed.colors) ? parsed.colors : [parsed.color])
        .map(toValidColor)
        .filter((color: string | null): color is string => !!color)
    : [toValidColor(value)].filter((color): color is string => !!color);

  if (!colors.length) return null;

  const [start, end] = DIRECTIONS[parsed?.direction] || DEFAULT_DIRECTION;
  return {
    colors: colors.length > 1 ? colors : [colors[0], colors[0]],
    start,
    end,
    isGradient: colors.length > 1,
  };
};

// First stop, for places that can only paint a single solid color.
export const cmsSolidColor = (value: string | null | undefined): string | null =>
  parseCmsColor(value)?.colors[0] ?? null;
