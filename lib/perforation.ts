// lib/perforation.ts
// Pure SVG geometry helpers for stamp perforation masks.
// No React. No colors. Coordinates only — colors are applied by the consumer.
//
// Design intent (PRD §4.2, §4.7):
//   classic — 큰 톱니, 반경 ~3.5, 간격 ~14
//   minimal — 작고 촘촘한 톱니, 반경 ~2, 간격 ~8
//
// The returned path is intended for use as an SVG <mask>:
//   - A white rectangle (mask shows photo)
//   - Black circles along the 4 edges (mask cuts perforation teeth out)
//
// We return TWO things via separate helpers:
//   - getPerforationRectPath(w, h, radius)  → "M0,0 H{w} V{h} H0 Z" (the white base)
//   - getPerforationTeeth(w, h, variant)    → an array of {cx, cy, r} for the cutout teeth
//
// The combined helpers getClassicPerforationPath / getMinimalPerforationPath return
// an SVG path `d` string that draws the rect + teeth as a single fill-rule="evenodd"
// path, which is convenient for cases where a single <path> is preferable to many
// <circle> elements inside the mask.

export type PerforationVariant = 'classic' | 'minimal';

interface PerforationSpec {
  /** Tooth (semicircle) radius in SVG user units. */
  radius: number;
  /** Center-to-center distance between teeth along an edge. */
  spacing: number;
}

const SPECS: Record<PerforationVariant, PerforationSpec> = {
  classic: { radius: 3.5, spacing: 14 },
  minimal: { radius: 2, spacing: 8 },
};

export interface Tooth {
  cx: number;
  cy: number;
  r: number;
}

/**
 * Place tooth centers along the 4 edges of a w×h rectangle.
 * Teeth are evenly distributed so each edge starts and ends with equal margin.
 * Corners are *not* doubled — top-left corner only contributes to the top row's
 * leftmost tooth (not also the left column's topmost tooth).
 */
function placeTeeth(w: number, h: number, spec: PerforationSpec): Tooth[] {
  const teeth: Tooth[] = [];

  const placeAlong = (
    length: number,
    fixed: number,
    axis: 'x' | 'y',
  ): void => {
    // Number of teeth on this edge. Keep at least 2 so corners read as teeth.
    const count = Math.max(2, Math.round(length / spec.spacing));
    // Even spacing with equal margins at both ends.
    const step = length / count;
    for (let i = 0; i < count; i++) {
      const pos = step * (i + 0.5);
      if (axis === 'x') {
        teeth.push({ cx: pos, cy: fixed, r: spec.radius });
      } else {
        teeth.push({ cx: fixed, cy: pos, r: spec.radius });
      }
    }
  };

  // Top & bottom edges
  placeAlong(w, 0, 'x');
  placeAlong(w, h, 'x');
  // Left & right edges (skip the very corner positions — they overlap with top/bottom)
  placeAlong(h, 0, 'y');
  placeAlong(h, w, 'y');

  return teeth;
}

/**
 * Convenience: get tooth circles for the given variant + rectangle.
 * Returns coordinates relative to (0,0)–(w,h).
 */
export function getPerforationTeeth(
  w: number,
  h: number,
  variant: PerforationVariant,
): Tooth[] {
  return placeTeeth(w, h, SPECS[variant]);
}

/**
 * Outer rectangle path. The visible photo region in the mask.
 */
export function getPerforationRectPath(w: number, h: number): string {
  return `M0,0 H${w} V${h} H0 Z`;
}

/**
 * Build a single SVG path `d` string that contains:
 *   - the outer rectangle (visible)
 *   - all tooth circles as sub-paths (cut out via fill-rule="evenodd")
 *
 * Consumers should render the path with `fill="white" fill-rule="evenodd"`
 * inside an SVG <mask>. The teeth then become transparent (cut out) areas.
 */
function buildPerforationPath(w: number, h: number, variant: PerforationVariant): string {
  const teeth = placeTeeth(w, h, SPECS[variant]);
  const rect = getPerforationRectPath(w, h);
  // Approximate each circle with two arcs — robust across SVG renderers.
  const circles = teeth
    .map(({ cx, cy, r }) => {
      const left = cx - r;
      const right = cx + r;
      return `M${left},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;
    })
    .join(' ');
  return `${rect} ${circles}`;
}

export function getClassicPerforationPath(w: number, h: number): string {
  return buildPerforationPath(w, h, 'classic');
}

export function getMinimalPerforationPath(w: number, h: number): string {
  return buildPerforationPath(w, h, 'minimal');
}

/**
 * Tooth radius for a given variant — exposed for components that want to add
 * matching inner padding so content isn't clipped by the perforation cutouts.
 */
export function getPerforationRadius(variant: PerforationVariant): number {
  return SPECS[variant].radius;
}
