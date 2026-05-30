"use client";

// components/stamp/SpecialDayBadge.tsx
// Special-day decoration overlay. Each day gets a SET of stickers (a main
// badge + accent decorations) scattered across the stamp — not just a single
// corner icon. This gives the stamp a real 'sticker' feel for occasions like
// Valentine, Pepero day, etc.
//
// Sticker positions are container-percentage so they scale with stamp size
// (works at all sizes from calendar 'full' to detail 'xl'). All SVGs are
// pointer-events-none and z-10 so they sit above the photo without
// intercepting taps.
//
// User-controlled visibility (Phase 2):
//   Each SpecialDay can be individually turned off via Settings →
//   disabledSpecialDays[]. This component reads settings reactively (Dexie
//   live query) and short-circuits to null when the user has disabled this
//   day's sticker. forceShow=true bypasses the check — used by the settings
//   preview row so users can see the sticker they're toggling.

import type { ReactElement } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import type { SpecialDay } from "@/lib/specialDays";
import { SPECIAL_DAY_LABEL } from "@/lib/specialDays";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface SpecialDayBadgeProps {
  day: SpecialDay;
  /**
   * Visual mass scale.
   * - 'compact' (calendar cells, ≤ md): slightly bigger main icon, accent
   *   stickers dropped to avoid clutter at small sizes.
   * - 'full' (lg/xl on detail page): all stickers shown at full strength.
   */
  variant?: "compact" | "full";
  /**
   * Bypass the user's disabled-list check. Used in the settings preview
   * so the user sees the sticker even when they're about to toggle it off.
   */
  forceShow?: boolean;
}

export function SpecialDayBadge({
  day,
  variant = "full",
  forceShow = false,
}: SpecialDayBadgeProps) {
  // Reactive read — re-renders when the user toggles a sticker in settings.
  const settingsResult = useLiveQuery(() => getSettings(), []);
  const isDisabled =
    !forceShow &&
    settingsResult?.ok === true &&
    Array.isArray(settingsResult.value.disabledSpecialDays) &&
    settingsResult.value.disabledSpecialDays.includes(day);
  if (isDisabled) return null;

  const stickers = variant === "compact" ? COMPACT[day] : FULL[day];
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-label={SPECIAL_DAY_LABEL[day]}
      title={SPECIAL_DAY_LABEL[day]}
    >
      {stickers.map((s, i) => (
        <div key={i} className={cn("absolute aspect-square", s.className)}>
          {s.svg}
        </div>
      ))}
    </div>
  );
}

interface StickerSpec {
  svg: ReactElement;
  /** Tailwind positioning + width. e.g. 'right-[5%] top-[5%] w-[28%]'. */
  className: string;
}

// --- SVG primitives ----------------------------------------------------------

const HEART_RED = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <path
      d="M10 17.5 C 4 13.5, 1 9, 3.5 5.5 C 6 2.5, 9 4, 10 6 C 11 4, 14 2.5, 16.5 5.5 C 19 9, 16 13.5, 10 17.5 Z"
      fill="#E63946"
      stroke="#7A0D1F"
      strokeWidth="0.4"
    />
  </svg>
);

const HEART_PINK = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <path
      d="M10 17.5 C 4 13.5, 1 9, 3.5 5.5 C 6 2.5, 9 4, 10 6 C 11 4, 14 2.5, 16.5 5.5 C 19 9, 16 13.5, 10 17.5 Z"
      fill="#F4C0D1"
      stroke="#C8829D"
      strokeWidth="0.4"
    />
  </svg>
);

const HEART_WHITE = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <path
      d="M10 17.5 C 4 13.5, 1 9, 3.5 5.5 C 6 2.5, 9 4, 10 6 C 11 4, 14 2.5, 16.5 5.5 C 19 9, 16 13.5, 10 17.5 Z"
      fill="#ffffff"
      stroke="#F4C0D1"
      strokeWidth="1.5"
    />
  </svg>
);

const CHOCOLATE_BAR = (
  <svg viewBox="0 0 24 16" className="h-full w-full drop-shadow-sm">
    <rect x="0.5" y="0.5" width="23" height="15" rx="1.5" fill="#5C3317" stroke="#2D1A0B" strokeWidth="0.5" />
    <line x1="6" y1="1" x2="6" y2="15" stroke="#3A1F0E" strokeWidth="0.6" />
    <line x1="12" y1="1" x2="12" y2="15" stroke="#3A1F0E" strokeWidth="0.6" />
    <line x1="18" y1="1" x2="18" y2="15" stroke="#3A1F0E" strokeWidth="0.6" />
    <line x1="1" y1="8" x2="23" y2="8" stroke="#3A1F0E" strokeWidth="0.6" />
  </svg>
);

const LOLLIPOP = (
  <svg viewBox="0 0 16 20" className="h-full w-full drop-shadow-sm">
    <rect x="7" y="10" width="2" height="9" rx="0.5" fill="#ffffff" stroke="#999" strokeWidth="0.3" />
    <circle cx="8" cy="6" r="5.5" fill="#ffffff" stroke="#F4C0D1" strokeWidth="0.5" />
    <path
      d="M 8 6 m -3.5 0 a 3.5 3.5 0 1 1 7 0 a 2.5 2.5 0 1 1 -5 0 a 1.5 1.5 0 1 1 3 0"
      fill="none"
      stroke="#F4C0D1"
      strokeWidth="0.9"
    />
  </svg>
);

const STAR_GOLD = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <polygon
      points="10,1 11.8,7.5 18.5,8 13,12.2 15,18.5 10,14.8 5,18.5 7,12.2 1.5,8 8.2,7.5"
      fill="#FAC775"
      stroke="#8A6320"
      strokeWidth="0.5"
    />
  </svg>
);

const SPARKLE_GOLD = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <path d="M10 1 L11 9 L19 10 L11 11 L10 19 L9 11 L1 10 L9 9 Z" fill="#FAC775" stroke="#8A6320" strokeWidth="0.4" />
  </svg>
);

function pepero(rotation = 0): ReactElement {
  return (
    <svg
      viewBox="0 0 8 24"
      className="h-full w-full drop-shadow-sm"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <rect x="2.5" y="0" width="3" height="24" rx="0.8" fill="#F4C0D1" />
      <rect x="2.5" y="9" width="3" height="15" rx="0.8" fill="#4B1528" />
      <circle cx="3.5" cy="13" r="0.5" fill="#FAC775" />
      <circle cx="4.7" cy="17" r="0.4" fill="#ffffff" />
      <circle cx="3.6" cy="20" r="0.4" fill="#F4C0D1" />
    </svg>
  );
}

const FU_BADGE = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <circle cx="10" cy="10" r="9" fill="#E63946" stroke="#7A0D1F" strokeWidth="0.5" />
    <text
      x="10"
      y="14.5"
      fontSize="13"
      fontFamily="serif"
      fontWeight="700"
      fill="#FAC775"
      textAnchor="middle"
    >
      福
    </text>
  </svg>
);

const KNOT = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <path
      d="M 4 10 a 3 3 0 0 1 6 0 a 3 3 0 0 1 6 0"
      fill="none"
      stroke="#E63946"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M 4 10 a 3 3 0 0 0 6 0 a 3 3 0 0 0 6 0"
      fill="none"
      stroke="#E63946"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const FULL_MOON = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    <circle cx="10" cy="10" r="9" fill="#FAC775" stroke="#8A6320" strokeWidth="0.5" />
    <circle cx="7" cy="8" r="1.4" fill="#E2B05F" opacity="0.6" />
    <circle cx="13" cy="11.5" r="1" fill="#E2B05F" opacity="0.6" />
    <circle cx="10.5" cy="14" r="0.8" fill="#E2B05F" opacity="0.6" />
  </svg>
);

const SONGPYEON = (
  <svg viewBox="0 0 20 12" className="h-full w-full drop-shadow-sm">
    <path
      d="M 1 11 A 9 11 0 0 1 19 11 Z"
      fill="#C0DD97"
      stroke="#7A8F4C"
      strokeWidth="0.5"
    />
    <ellipse cx="10" cy="11" rx="9" ry="1.2" fill="#A8C77F" opacity="0.7" />
  </svg>
);

// --- NEW SVG primitives (Phase 2 additions) ----------------------------------

/** Balloon. Color is parameterized; line at the bottom is the string. */
function balloon(fill: string, stroke: string): ReactElement {
  return (
    <svg viewBox="0 0 16 22" className="h-full w-full drop-shadow-sm">
      {/* balloon body */}
      <ellipse cx="8" cy="8" rx="6.5" ry="7.5" fill={fill} stroke={stroke} strokeWidth="0.5" />
      {/* tiny knot */}
      <path d="M 7 15.4 L 9 15.4 L 8 17 Z" fill={stroke} />
      {/* string */}
      <path d="M 8 17 Q 9 19 8 22" stroke={stroke} strokeWidth="0.5" fill="none" />
      {/* highlight */}
      <ellipse cx="6" cy="5" rx="1.3" ry="2" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
const BALLOON_RED = balloon("#E63946", "#7A0D1F");
const BALLOON_YELLOW = balloon("#FAC775", "#8A6320");
const BALLOON_BLUE = balloon("#B5D4F4", "#4A7BA8");

/** Carnation — used by 어버이날 (red) and 스승의 날 (pink).
 *  Redesigned to feel like a real top-down carnation: round, ruffled
 *  cluster of petals with a small dark center, on a short stem.
 *  User feedback: the previous fan-shape didn't read as a carnation. */
function carnation(fill: string, stroke: string, accent: string): ReactElement {
  return (
    <svg viewBox="0 0 24 28" className="h-full w-full drop-shadow-sm">
      {/* outer ruffled cluster — large base ellipse */}
      <ellipse cx="12" cy="11" rx="10" ry="8.5" fill={fill} />
      {/* layered round petals giving the 'ruffled bouquet' feel */}
      <circle cx="6" cy="10" r="4.2" fill={fill} stroke={stroke} strokeWidth="0.35" />
      <circle cx="18" cy="10" r="4.2" fill={fill} stroke={stroke} strokeWidth="0.35" />
      <circle cx="9" cy="6" r="3.8" fill={fill} stroke={stroke} strokeWidth="0.35" />
      <circle cx="15" cy="6" r="3.8" fill={fill} stroke={stroke} strokeWidth="0.35" />
      <circle cx="12" cy="14" r="4.3" fill={fill} stroke={stroke} strokeWidth="0.35" />
      <circle cx="7" cy="14" r="3.5" fill={fill} stroke={stroke} strokeWidth="0.3" />
      <circle cx="17" cy="14" r="3.5" fill={fill} stroke={stroke} strokeWidth="0.3" />
      {/* inner highlight petals — slightly darker accent for depth */}
      <circle cx="10" cy="10" r="2.5" fill={accent} opacity="0.55" />
      <circle cx="14" cy="10" r="2.5" fill={accent} opacity="0.55" />
      {/* dark center */}
      <circle cx="12" cy="10.5" r="1.5" fill={stroke} opacity="0.8" />
      {/* small petal-edge highlights (white) for the ruffled top */}
      <path
        d="M 4 8 Q 6 6 8 8 M 16 8 Q 18 6 20 8 M 9 4 Q 11 3 13 4 M 14 4 Q 16 3 18 4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.4"
        opacity="0.6"
        strokeLinecap="round"
      />
      {/* stem */}
      <path d="M 12 18 L 12 27" stroke="#5C7C2C" strokeWidth="1.2" strokeLinecap="round" />
      {/* leaves — pointed ovals */}
      <ellipse cx="9" cy="22" rx="2.5" ry="1" fill="#5C7C2C" transform="rotate(-30 9 22)" />
      <ellipse cx="15" cy="24" rx="2.5" ry="1" fill="#5C7C2C" transform="rotate(30 15 24)" />
    </svg>
  );
}
// fill / stroke (darker outline) / accent (slightly darker interior shading)
const CARNATION_RED = carnation("#E63946", "#7A0D1F", "#B82835");
const CARNATION_PINK = carnation("#F4A8C1", "#C8829D", "#D88AA8");

/** Lotus lantern for 부처님 오신날. Hanging from a small chain. */
const LOTUS_LANTERN = (
  <svg viewBox="0 0 20 24" className="h-full w-full drop-shadow-sm">
    {/* hanging string */}
    <line x1="10" y1="0" x2="10" y2="3" stroke="#8A6320" strokeWidth="0.5" />
    <circle cx="10" cy="3.5" r="0.6" fill="#FAC775" stroke="#8A6320" strokeWidth="0.3" />
    {/* lantern body — round bulb */}
    <ellipse cx="10" cy="11" rx="6.5" ry="7" fill="#E63946" stroke="#7A0D1F" strokeWidth="0.5" />
    {/* petal accents */}
    <path d="M 4 11 Q 7 8 10 11 Q 13 8 16 11" fill="none" stroke="#FAC775" strokeWidth="0.6" />
    <path d="M 4 13 Q 7 10 10 13 Q 13 10 16 13" fill="none" stroke="#FAC775" strokeWidth="0.6" opacity="0.7" />
    {/* tassel */}
    <line x1="10" y1="18" x2="10" y2="20" stroke="#FAC775" strokeWidth="0.6" />
    <line x1="9" y1="20" x2="9" y2="23" stroke="#FAC775" strokeWidth="0.5" />
    <line x1="10" y1="20" x2="10" y2="23" stroke="#FAC775" strokeWidth="0.5" />
    <line x1="11" y1="20" x2="11" y2="23" stroke="#FAC775" strokeWidth="0.5" />
  </svg>
);

/** Halloween pumpkin (잭오랜턴). */
const PUMPKIN = (
  <svg viewBox="0 0 22 20" className="h-full w-full drop-shadow-sm">
    {/* pumpkin body — three overlapping ovals for that 'segmented' look */}
    <ellipse cx="11" cy="11" rx="10" ry="8" fill="#F39C12" stroke="#A8650A" strokeWidth="0.5" />
    <ellipse cx="6" cy="11" rx="4" ry="8" fill="#F39C12" stroke="#A8650A" strokeWidth="0.3" opacity="0.8" />
    <ellipse cx="16" cy="11" rx="4" ry="8" fill="#F39C12" stroke="#A8650A" strokeWidth="0.3" opacity="0.8" />
    {/* stem */}
    <rect x="9.5" y="1" width="3" height="3" rx="0.5" fill="#5C7C2C" stroke="#3A5018" strokeWidth="0.3" />
    {/* eyes + mouth */}
    <polygon points="7,9 9,7 9,11" fill="#2D1A0B" />
    <polygon points="15,9 13,7 13,11" fill="#2D1A0B" />
    <path d="M 6 14 L 8 13 L 9 14 L 10 13 L 11 14 L 12 13 L 13 14 L 14 13 L 16 14 L 14 16 L 8 16 Z" fill="#2D1A0B" />
  </svg>
);

const BAT = (
  <svg viewBox="0 0 20 12" className="h-full w-full drop-shadow-sm">
    <path
      d="M 10 4 L 7 1 L 5 4 L 1 3 L 4 7 L 1 9 L 5 8 L 7 11 L 10 8 L 13 11 L 15 8 L 19 9 L 16 7 L 19 3 L 15 4 L 13 1 Z"
      fill="#2D1A0B"
      stroke="#000"
      strokeWidth="0.3"
    />
    {/* eyes */}
    <circle cx="9" cy="5" r="0.3" fill="#E63946" />
    <circle cx="11" cy="5" r="0.3" fill="#E63946" />
  </svg>
);

/** Christmas tree. */
const CHRISTMAS_TREE = (
  <svg viewBox="0 0 20 22" className="h-full w-full drop-shadow-sm">
    {/* three triangular layers */}
    <polygon points="10,1 4,9 16,9" fill="#5C7C2C" stroke="#3A5018" strokeWidth="0.4" />
    <polygon points="10,6 3,13 17,13" fill="#5C7C2C" stroke="#3A5018" strokeWidth="0.4" />
    <polygon points="10,11 2,18 18,18" fill="#5C7C2C" stroke="#3A5018" strokeWidth="0.4" />
    {/* trunk */}
    <rect x="9" y="18" width="2" height="3" fill="#5C3317" stroke="#2D1A0B" strokeWidth="0.3" />
    {/* tree-top star */}
    <polygon points="10,0.5 10.6,2 12,2 11,3 11.5,4.5 10,3.7 8.5,4.5 9,3 8,2 9.4,2" fill="#FAC775" stroke="#8A6320" strokeWidth="0.2" />
    {/* ornaments */}
    <circle cx="7" cy="8" r="0.7" fill="#E63946" />
    <circle cx="13" cy="11" r="0.7" fill="#F4C0D1" />
    <circle cx="6" cy="15" r="0.7" fill="#FAC775" />
    <circle cx="14" cy="16" r="0.7" fill="#E63946" />
  </svg>
);

const GIFT = (
  <svg viewBox="0 0 16 16" className="h-full w-full drop-shadow-sm">
    <rect x="1" y="6" width="14" height="9" rx="0.5" fill="#E63946" stroke="#7A0D1F" strokeWidth="0.4" />
    <rect x="7" y="6" width="2" height="9" fill="#FAC775" />
    {/* lid */}
    <rect x="0.5" y="5" width="15" height="2" rx="0.5" fill="#E63946" stroke="#7A0D1F" strokeWidth="0.4" />
    {/* bow */}
    <path d="M 8 5 Q 6 2 5 3 Q 4 4 5 5 Z" fill="#FAC775" stroke="#8A6320" strokeWidth="0.3" />
    <path d="M 8 5 Q 10 2 11 3 Q 12 4 11 5 Z" fill="#FAC775" stroke="#8A6320" strokeWidth="0.3" />
    <circle cx="8" cy="5" r="0.6" fill="#FAC775" stroke="#8A6320" strokeWidth="0.3" />
  </svg>
);

/** Korean flag (태극기). Used for 삼일절 and 광복절. Slightly stylized. */
const TAEGEUKGI = (
  <svg viewBox="0 0 24 16" className="h-full w-full drop-shadow-sm">
    {/* white background */}
    <rect x="0" y="0" width="24" height="16" fill="#ffffff" stroke="#999" strokeWidth="0.3" />
    {/* taegeuk — top half red */}
    <path d="M 12 4 a 4 4 0 0 1 0 8 a 2 2 0 0 0 0 -4 a 2 2 0 0 1 0 -4 Z" fill="#E63946" />
    {/* taegeuk — bottom half blue */}
    <path d="M 12 4 a 4 4 0 0 0 0 8 a 2 2 0 0 1 0 -4 a 2 2 0 0 0 0 -4 Z" fill="#3658A5" />
    {/* four trigrams — simplified short lines at corners */}
    <g stroke="#2D1A0B" strokeWidth="0.5">
      <line x1="3" y1="3" x2="5" y2="3" />
      <line x1="3" y1="4" x2="5" y2="4" />
      <line x1="3" y1="5" x2="5" y2="5" />
      <line x1="19" y1="3" x2="21" y2="3" />
      <line x1="19" y1="5" x2="20" y2="5" />
      <line x1="20.5" y1="5" x2="21" y2="5" />
      <line x1="3" y1="11" x2="3.7" y2="11" />
      <line x1="4.3" y1="11" x2="5" y2="11" />
      <line x1="3" y1="13" x2="5" y2="13" />
      <line x1="19" y1="11" x2="19.7" y2="11" />
      <line x1="20.3" y1="11" x2="21" y2="11" />
      <line x1="19" y1="13" x2="19.7" y2="13" />
      <line x1="20.3" y1="13" x2="21" y2="13" />
    </g>
  </svg>
);

/** Black memorial ribbon (현충일). Subdued / mournful tone. */
const BLACK_RIBBON = (
  <svg viewBox="0 0 16 22" className="h-full w-full drop-shadow-sm">
    {/* upper loop */}
    <path d="M 8 2 Q 4 6 6 10 L 8 8 L 10 10 Q 12 6 8 2 Z" fill="#2D1A0B" stroke="#000" strokeWidth="0.3" />
    {/* knot */}
    <ellipse cx="8" cy="9.5" rx="1.5" ry="1" fill="#1a1109" stroke="#000" strokeWidth="0.3" />
    {/* lower tails */}
    <path d="M 6.5 10 L 4 18 L 6 19 L 7.5 11 Z" fill="#2D1A0B" stroke="#000" strokeWidth="0.3" />
    <path d="M 9.5 10 L 12 18 L 10 19 L 8.5 11 Z" fill="#2D1A0B" stroke="#000" strokeWidth="0.3" />
  </svg>
);

/** Mountain silhouette (개천절 — Dangun's mountain heritage). Three peaks. */
const MOUNTAINS = (
  <svg viewBox="0 0 24 16" className="h-full w-full drop-shadow-sm">
    {/* back mountain */}
    <polygon points="0,16 8,4 16,16" fill="#7A8F4C" stroke="#4A5C2C" strokeWidth="0.4" />
    {/* front mountain */}
    <polygon points="8,16 16,2 24,16" fill="#5C7C2C" stroke="#3A5018" strokeWidth="0.4" />
    {/* snow cap on the tallest */}
    <polygon points="14,4 16,2 18,4 17,5 16,4.5 15,5" fill="#ffffff" stroke="#999" strokeWidth="0.2" />
    {/* sun */}
    <circle cx="20" cy="4" r="1.8" fill="#FAC775" stroke="#8A6320" strokeWidth="0.3" />
  </svg>
);

/** Hangeul character composition — '가' or 'ㄱ ㄴ ㄷ' style. Used for 한글날. */
const HANGEUL_GA = (
  <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
    {/* paper background — soft beige */}
    <rect x="0.5" y="0.5" width="19" height="19" rx="2" fill="#FBEAF0" stroke="#7A0D1F" strokeWidth="0.5" />
    {/* '가' character — drawn with simple strokes */}
    <g fill="#4B1528" stroke="#4B1528">
      {/* ㄱ */}
      <path d="M 4 5 L 11 5 L 11 12" stroke="#4B1528" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* ㅏ — vertical line + horizontal */}
      <line x1="14" y1="3" x2="14" y2="17" stroke="#4B1528" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="14" y1="10" x2="17" y2="10" stroke="#4B1528" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  </svg>
);

// --- Sticker compositions (FULL variant — detail page lg/xl) -----------------

const FULL: Record<SpecialDay, StickerSpec[]> = {
  // Existing 6
  "new-year": [
    { svg: STAR_GOLD, className: "right-[5%] top-[5%] w-[28%]" },
    { svg: SPARKLE_GOLD, className: "left-[8%] bottom-[12%] w-[14%]" },
    { svg: SPARKLE_GOLD, className: "right-[18%] bottom-[18%] w-[10%]" },
  ],
  valentine: [
    { svg: HEART_RED, className: "right-[5%] top-[5%] w-[28%]" },
    { svg: HEART_PINK, className: "right-[36%] top-[14%] w-[14%]" },
    { svg: CHOCOLATE_BAR, className: "left-[6%] bottom-[8%] w-[30%] aspect-[3/2]" },
    { svg: HEART_PINK, className: "left-[42%] bottom-[6%] w-[10%]" },
  ],
  "white-day": [
    { svg: HEART_WHITE, className: "right-[5%] top-[5%] w-[28%]" },
    { svg: LOLLIPOP, className: "left-[7%] bottom-[6%] w-[22%] aspect-[4/5]" },
    { svg: HEART_PINK, className: "right-[36%] top-[14%] w-[12%]" },
  ],
  pepero: [
    { svg: pepero(-12), className: "right-[6%] top-[5%] w-[12%] aspect-[1/3]" },
    { svg: pepero(8), className: "right-[20%] top-[8%] w-[12%] aspect-[1/3]" },
    { svg: pepero(-5), className: "left-[8%] bottom-[6%] w-[12%] aspect-[1/3]" },
    { svg: pepero(15), className: "left-[24%] bottom-[8%] w-[12%] aspect-[1/3]" },
  ],
  "lunar-new-year": [
    { svg: FU_BADGE, className: "right-[5%] top-[5%] w-[26%]" },
    { svg: KNOT, className: "left-[6%] bottom-[8%] w-[26%] aspect-square" },
  ],
  chuseok: [
    { svg: FULL_MOON, className: "right-[5%] top-[5%] w-[28%]" },
    { svg: SONGPYEON, className: "left-[8%] bottom-[8%] w-[22%] aspect-[3/2]" },
    { svg: SPARKLE_GOLD, className: "right-[36%] top-[15%] w-[8%]" },
  ],
  // NEW — lifestyle
  "children-day": [
    { svg: BALLOON_RED, className: "right-[5%] top-[5%] w-[18%] aspect-[8/11]" },
    { svg: BALLOON_YELLOW, className: "right-[24%] top-[8%] w-[16%] aspect-[8/11]" },
    { svg: BALLOON_BLUE, className: "right-[42%] top-[6%] w-[16%] aspect-[8/11]" },
    { svg: STAR_GOLD, className: "left-[6%] bottom-[10%] w-[14%]" },
  ],
  "parents-day": [
    { svg: CARNATION_RED, className: "right-[5%] top-[5%] w-[28%] aspect-[24/28]" },
    { svg: CARNATION_PINK, className: "left-[7%] bottom-[8%] w-[20%] aspect-[24/28]" },
  ],
  "teachers-day": [
    { svg: CARNATION_PINK, className: "right-[5%] top-[5%] w-[28%] aspect-[24/28]" },
    { svg: CARNATION_PINK, className: "left-[8%] bottom-[10%] w-[18%] aspect-[24/28]" },
  ],
  "buddha-birthday": [
    { svg: LOTUS_LANTERN, className: "right-[5%] top-[3%] w-[22%] aspect-[20/24]" },
    { svg: LOTUS_LANTERN, className: "left-[7%] top-[5%] w-[18%] aspect-[20/24]" },
  ],
  halloween: [
    { svg: PUMPKIN, className: "right-[5%] bottom-[10%] w-[30%] aspect-[22/20]" },
    { svg: BAT, className: "left-[8%] top-[8%] w-[22%] aspect-[20/12]" },
    { svg: BAT, className: "right-[40%] top-[15%] w-[14%] aspect-[20/12]" },
  ],
  christmas: [
    { svg: CHRISTMAS_TREE, className: "right-[5%] top-[5%] w-[26%] aspect-[24/28]" },
    { svg: GIFT, className: "left-[7%] bottom-[8%] w-[20%] aspect-square" },
    { svg: STAR_GOLD, className: "left-[40%] top-[10%] w-[10%]" },
  ],
  // NEW — public holidays (subdued / single sticker)
  samiljeol: [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[30%] aspect-[24/16]" },
  ],
  "memorial-day": [
    { svg: BLACK_RIBBON, className: "right-[5%] top-[5%] w-[18%] aspect-[16/22]" },
  ],
  "liberation-day": [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[30%] aspect-[24/16]" },
    { svg: SPARKLE_GOLD, className: "left-[8%] bottom-[10%] w-[12%]" },
  ],
  "national-foundation": [
    { svg: MOUNTAINS, className: "right-[5%] bottom-[8%] w-[36%] aspect-[24/16]" },
  ],
  "hangeul-day": [
    { svg: HANGEUL_GA, className: "right-[5%] top-[5%] w-[26%]" },
  ],
};

// --- Sticker compositions (COMPACT variant — calendar size='full') -----------
// Single main sticker, slightly bigger than accents. Accents dropped because
// at ~50-80px stamps the scattered tiny stickers turn to mush.
const COMPACT: Record<SpecialDay, StickerSpec[]> = {
  "new-year": [
    { svg: STAR_GOLD, className: "right-[5%] top-[5%] w-[34%]" },
  ],
  valentine: [
    { svg: HEART_RED, className: "right-[5%] top-[5%] w-[34%]" },
  ],
  "white-day": [
    { svg: HEART_WHITE, className: "right-[5%] top-[5%] w-[34%]" },
  ],
  pepero: [
    { svg: pepero(-12), className: "right-[12%] top-[5%] w-[14%] aspect-[1/3]" },
    { svg: pepero(10), className: "right-[28%] top-[5%] w-[14%] aspect-[1/3]" },
  ],
  "lunar-new-year": [
    { svg: FU_BADGE, className: "right-[5%] top-[5%] w-[30%]" },
  ],
  chuseok: [
    { svg: FULL_MOON, className: "right-[5%] top-[5%] w-[34%]" },
  ],
  // NEW
  "children-day": [
    { svg: BALLOON_RED, className: "right-[5%] top-[5%] w-[22%] aspect-[8/11]" },
    { svg: BALLOON_YELLOW, className: "right-[28%] top-[5%] w-[20%] aspect-[8/11]" },
  ],
  "parents-day": [
    { svg: CARNATION_RED, className: "right-[5%] top-[5%] w-[32%] aspect-[24/28]" },
  ],
  "teachers-day": [
    { svg: CARNATION_PINK, className: "right-[5%] top-[5%] w-[32%] aspect-[24/28]" },
  ],
  "buddha-birthday": [
    { svg: LOTUS_LANTERN, className: "right-[5%] top-[5%] w-[26%] aspect-[20/24]" },
  ],
  halloween: [
    { svg: PUMPKIN, className: "right-[5%] bottom-[8%] w-[36%] aspect-[22/20]" },
  ],
  christmas: [
    { svg: CHRISTMAS_TREE, className: "right-[5%] top-[5%] w-[32%] aspect-[24/28]" },
  ],
  samiljeol: [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[36%] aspect-[24/16]" },
  ],
  "memorial-day": [
    { svg: BLACK_RIBBON, className: "right-[5%] top-[5%] w-[22%] aspect-[16/22]" },
  ],
  "liberation-day": [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[36%] aspect-[24/16]" },
  ],
  "national-foundation": [
    { svg: MOUNTAINS, className: "right-[5%] bottom-[8%] w-[40%] aspect-[24/16]" },
  ],
  "hangeul-day": [
    { svg: HANGEUL_GA, className: "right-[5%] top-[5%] w-[32%]" },
  ],
};
