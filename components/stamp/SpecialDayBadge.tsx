"use client";

// components/stamp/SpecialDayBadge.tsx
// Special-day decoration overlay — kitsch / illustrated sticker style.
//
// Visual language (post user feedback round 2):
//   - Bold outline (stroke-width 0.7-1.2 on the main shape)
//   - Single-fill colors (no gradients)
//   - Round, chunky proportions (소박하면서 친근)
//   - Small white highlight on top to suggest gloss
//   - drop-shadow-sm on every SVG for a 'stuck on paper' feel
//
// Per-day user toggle (Phase 2):
//   Each SpecialDay can be turned off via Settings → disabledSpecialDays[].
//   forceShow=true bypasses the check (used by the settings preview).

import type { ReactElement } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import type { SpecialDay } from "@/lib/specialDays";
import { SPECIAL_DAY_LABEL } from "@/lib/specialDays";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

interface SpecialDayBadgeProps {
  day: SpecialDay;
  variant?: "compact" | "full";
  forceShow?: boolean;
}

export function SpecialDayBadge({
  day,
  variant = "full",
  forceShow = false,
}: SpecialDayBadgeProps) {
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
  className: string;
}

// =============================================================================
// SVG PRIMITIVES — kitsch illustrated style
// Conventions:
//   - Bold outline = stroke 0.7-1.2 in a darker shade of the fill
//   - Highlight = small white ellipse at ~10° rotation in the upper-left
//   - drop-shadow-sm wrapper class for paper-sticker depth
// =============================================================================

// --- Heart (used by Valentine, White Day) -----------------------------------

function heart(fill: string, stroke: string, highlight = true): ReactElement {
  return (
    <svg viewBox="0 0 24 22" className="h-full w-full drop-shadow-sm">
      <path
        d="M12 20.5 C 4 15.5, 1.5 10, 4.5 5.5 C 7.5 1.5, 11 3, 12 6 C 13 3, 16.5 1.5, 19.5 5.5 C 22.5 10, 20 15.5, 12 20.5 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {highlight && (
        <ellipse
          cx="8"
          cy="7"
          rx="2.2"
          ry="1.3"
          fill="#ffffff"
          opacity="0.6"
          transform="rotate(-25 8 7)"
        />
      )}
    </svg>
  );
}
const HEART_RED = heart("#E63946", "#8A1424");
const HEART_PINK = heart("#F4A8C1", "#B0617F");
const HEART_WHITE = heart("#FFFFFF", "#C8829D", false);

// --- Chocolate bar (Valentine accent) ---------------------------------------

const CHOCOLATE_BAR = (
  <svg viewBox="0 0 26 18" className="h-full w-full drop-shadow-sm">
    {/* foil wrapper bottom */}
    <rect x="0.5" y="6" width="25" height="11" rx="1.5" fill="#FAC775" stroke="#8A6320" strokeWidth="0.6" />
    {/* chocolate bar on top of foil */}
    <rect x="2" y="0.5" width="22" height="13" rx="1.5" fill="#5C3317" stroke="#2D1A0B" strokeWidth="0.9" />
    {/* segment lines */}
    <line x1="9" y1="1.5" x2="9" y2="12.5" stroke="#2D1A0B" strokeWidth="0.7" />
    <line x1="17" y1="1.5" x2="17" y2="12.5" stroke="#2D1A0B" strokeWidth="0.7" />
    <line x1="3" y1="7" x2="23" y2="7" stroke="#2D1A0B" strokeWidth="0.7" />
    {/* highlight */}
    <ellipse cx="6" cy="3" rx="1.5" ry="0.6" fill="#ffffff" opacity="0.25" />
  </svg>
);

// --- Lollipop (White Day accent) --------------------------------------------

const LOLLIPOP = (
  <svg viewBox="0 0 18 24" className="h-full w-full drop-shadow-sm">
    {/* stick */}
    <rect x="8" y="12" width="2" height="11" rx="1" fill="#ffffff" stroke="#7A6E5C" strokeWidth="0.6" />
    {/* candy head */}
    <circle cx="9" cy="8" r="6.5" fill="#ffffff" stroke="#C8829D" strokeWidth="1" />
    {/* swirl */}
    <path
      d="M 9 8 m -4 0 a 4 4 0 1 1 8 0 a 2.5 2.5 0 1 1 -5 0 a 1.5 1.5 0 1 1 3 0"
      fill="none"
      stroke="#F4A8C1"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    {/* highlight */}
    <ellipse cx="6" cy="5" rx="1.6" ry="0.9" fill="#ffffff" opacity="0.8" />
  </svg>
);

// --- Star (New Year main + accent) ------------------------------------------

const STAR_GOLD = (
  <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-sm">
    <polygon
      points="12,1.5 14.7,8.4 22,9 16.5,13.8 18.5,21 12,17.1 5.5,21 7.5,13.8 2,9 9.3,8.4"
      fill="#FAC775"
      stroke="#7A5018"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <ellipse cx="9" cy="6.5" rx="1.4" ry="0.8" fill="#ffffff" opacity="0.65" transform="rotate(-20 9 6.5)" />
  </svg>
);

const SPARKLE_GOLD = (
  <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-sm">
    <path d="M12 1 L13 10 L22 11 L13 12 L12 23 L11 12 L2 11 L11 10 Z" fill="#FAC775" stroke="#7A5018" strokeWidth="0.7" strokeLinejoin="round" />
  </svg>
);

// --- Pepero stick (Pepero day) ----------------------------------------------

function pepero(rotation = 0): ReactElement {
  return (
    <svg viewBox="0 0 10 28" className="h-full w-full drop-shadow-sm" style={{ transform: `rotate(${rotation}deg)` }}>
      {/* stick (biscuit part) */}
      <rect x="2.5" y="0" width="5" height="28" rx="2" fill="#F4D5AA" stroke="#7A5018" strokeWidth="0.6" />
      {/* chocolate end */}
      <rect x="2.5" y="10" width="5" height="18" rx="2" fill="#5C3317" stroke="#2D1A0B" strokeWidth="0.7" />
      {/* sprinkles */}
      <circle cx="4" cy="14" r="0.7" fill="#FAC775" stroke="#7A5018" strokeWidth="0.2" />
      <circle cx="6" cy="18" r="0.6" fill="#ffffff" stroke="#666" strokeWidth="0.2" />
      <circle cx="4" cy="21" r="0.6" fill="#F4A8C1" stroke="#B0617F" strokeWidth="0.2" />
      <circle cx="6" cy="24" r="0.5" fill="#FAC775" stroke="#7A5018" strokeWidth="0.2" />
    </svg>
  );
}

// --- 福 badge (Lunar New Year) ----------------------------------------------

const FU_BADGE = (
  <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-sm">
    {/* diamond background (rotated square, traditional placement) */}
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#E63946" stroke="#7A0D1F" strokeWidth="1.2" transform="rotate(45 12 12)" />
    {/* 福 character */}
    <text
      x="12"
      y="16.5"
      fontSize="14"
      fontFamily="'Noto Serif KR', serif"
      fontWeight="900"
      fill="#FAC775"
      textAnchor="middle"
      stroke="#7A5018"
      strokeWidth="0.3"
    >
      福
    </text>
  </svg>
);

// --- Lucky knot (Lunar New Year accent) --------------------------------------

const KNOT = (
  <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-sm">
    {/* double-loop knot */}
    <path
      d="M 6 12 Q 6 7 12 9 Q 18 7 18 12 Q 18 17 12 15 Q 6 17 6 12 Z"
      fill="#E63946"
      stroke="#7A0D1F"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    {/* center knot */}
    <circle cx="12" cy="12" r="2" fill="#FAC775" stroke="#7A5018" strokeWidth="0.7" />
    {/* tassel */}
    <line x1="12" y1="14" x2="12" y2="22" stroke="#E63946" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="10" y1="20" x2="10" y2="23" stroke="#E63946" strokeWidth="0.8" strokeLinecap="round" />
    <line x1="14" y1="20" x2="14" y2="23" stroke="#E63946" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

// --- Full moon (Chuseok) ----------------------------------------------------

const FULL_MOON = (
  <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-sm">
    <circle cx="12" cy="12" r="10" fill="#FAC775" stroke="#7A5018" strokeWidth="1" />
    {/* rabbit silhouette — simplified pounding-rice pose */}
    <ellipse cx="10" cy="14" rx="2.5" ry="3" fill="#7A5018" opacity="0.45" />
    <ellipse cx="13" cy="13" rx="1.2" ry="2.5" fill="#7A5018" opacity="0.45" transform="rotate(-15 13 13)" />
    <ellipse cx="14" cy="14.5" rx="1.2" ry="2.5" fill="#7A5018" opacity="0.45" transform="rotate(15 14 14.5)" />
    {/* moon highlight */}
    <ellipse cx="8.5" cy="8" rx="2" ry="1.3" fill="#ffffff" opacity="0.5" transform="rotate(-25 8.5 8)" />
  </svg>
);

// --- Songpyeon (Chuseok accent) ---------------------------------------------

const SONGPYEON = (
  <svg viewBox="0 0 22 14" className="h-full w-full drop-shadow-sm">
    {/* half-moon rice cake */}
    <path
      d="M 2 13 A 9 12 0 0 1 20 13 Z"
      fill="#C0DD97"
      stroke="#5C7C2C"
      strokeWidth="0.9"
      strokeLinejoin="round"
    />
    {/* highlight on top */}
    <path
      d="M 5 9 Q 8 6 11 6"
      fill="none"
      stroke="#ffffff"
      strokeWidth="1"
      opacity="0.5"
      strokeLinecap="round"
    />
  </svg>
);

// --- Balloon (Children's day) -----------------------------------------------

function balloon(fill: string, stroke: string): ReactElement {
  return (
    <svg viewBox="0 0 18 26" className="h-full w-full drop-shadow-sm">
      {/* balloon body — chunkier than before */}
      <ellipse cx="9" cy="9" rx="7.5" ry="8.5" fill={fill} stroke={stroke} strokeWidth="1" />
      {/* knot triangle */}
      <path d="M 7 17 L 11 17 L 9 19 Z" fill={stroke} />
      {/* string */}
      <path d="M 9 19 Q 11 22 8 26" stroke={stroke} strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {/* highlight */}
      <ellipse cx="6" cy="5.5" rx="2" ry="2.6" fill="#ffffff" opacity="0.6" transform="rotate(-25 6 5.5)" />
    </svg>
  );
}
const BALLOON_RED = balloon("#E63946", "#8A1424");
const BALLOON_YELLOW = balloon("#FAC775", "#7A5018");
const BALLOON_BLUE = balloon("#B5D4F4", "#3A6B9C");

// --- Carnation (Parents' day, Teachers' day) -------------------------------
// Redesigned per user reference image — simple, round 5-lobe flower with
// clear outline, short stem, single leaf.

function carnation(fill: string, stroke: string): ReactElement {
  return (
    <svg viewBox="0 0 24 30" className="h-full w-full drop-shadow-sm">
      {/* 5 round lobes forming a flower shape */}
      <circle cx="12" cy="6" r="4.5" fill={fill} stroke={stroke} strokeWidth="0.9" />
      <circle cx="5.5" cy="10" r="4.5" fill={fill} stroke={stroke} strokeWidth="0.9" />
      <circle cx="18.5" cy="10" r="4.5" fill={fill} stroke={stroke} strokeWidth="0.9" />
      <circle cx="8" cy="16" r="4.5" fill={fill} stroke={stroke} strokeWidth="0.9" />
      <circle cx="16" cy="16" r="4.5" fill={fill} stroke={stroke} strokeWidth="0.9" />
      {/* dark center */}
      <circle cx="12" cy="11" r="2.2" fill={stroke} />
      {/* highlight on top lobe */}
      <ellipse cx="10" cy="4.5" rx="1.5" ry="1" fill="#ffffff" opacity="0.6" transform="rotate(-25 10 4.5)" />
      {/* stem */}
      <path d="M 12 19 L 12 29" stroke="#5C7C2C" strokeWidth="1.4" strokeLinecap="round" />
      {/* leaf */}
      <path
        d="M 12 23 Q 7 22 5 26 Q 9 26 12 25 Z"
        fill="#7CA84A"
        stroke="#3D5E1F"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
const CARNATION_RED = carnation("#E63946", "#8A1424");
const CARNATION_PINK = carnation("#F4A8C1", "#B0617F");

// --- Lotus lantern (Buddha's birthday) --------------------------------------

const LOTUS_LANTERN = (
  <svg viewBox="0 0 22 28" className="h-full w-full drop-shadow-sm">
    {/* hanging line + cap */}
    <line x1="11" y1="0" x2="11" y2="3.5" stroke="#7A5018" strokeWidth="0.6" />
    <ellipse cx="11" cy="4" rx="2" ry="1" fill="#FAC775" stroke="#7A5018" strokeWidth="0.6" />
    {/* lantern body — chunky round */}
    <ellipse cx="11" cy="13" rx="8" ry="8.5" fill="#E63946" stroke="#8A1424" strokeWidth="1" />
    {/* lotus petal lines (3 layers) */}
    <path d="M 4 11 Q 7 8 11 11 Q 15 8 18 11" fill="none" stroke="#FAC775" strokeWidth="1" strokeLinecap="round" />
    <path d="M 4 14 Q 7 11 11 14 Q 15 11 18 14" fill="none" stroke="#FAC775" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
    <path d="M 5 17 Q 8 14 11 17 Q 14 14 17 17" fill="none" stroke="#FAC775" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
    {/* highlight */}
    <ellipse cx="7" cy="9" rx="1.5" ry="1" fill="#ffffff" opacity="0.4" transform="rotate(-25 7 9)" />
    {/* tassel */}
    <line x1="11" y1="21.5" x2="11" y2="23" stroke="#FAC775" strokeWidth="0.7" />
    <line x1="9" y1="23" x2="9" y2="27" stroke="#FAC775" strokeWidth="0.6" />
    <line x1="11" y1="23" x2="11" y2="27" stroke="#FAC775" strokeWidth="0.6" />
    <line x1="13" y1="23" x2="13" y2="27" stroke="#FAC775" strokeWidth="0.6" />
  </svg>
);

// --- Halloween pumpkin -------------------------------------------------------

const PUMPKIN = (
  <svg viewBox="0 0 26 22" className="h-full w-full drop-shadow-sm">
    {/* pumpkin body — three overlapping bulges */}
    <ellipse cx="13" cy="13" rx="11" ry="8.5" fill="#F39C12" stroke="#7A4A05" strokeWidth="1" />
    <ellipse cx="7" cy="13" rx="4" ry="8" fill="#F39C12" stroke="#7A4A05" strokeWidth="0.6" opacity="0.7" />
    <ellipse cx="19" cy="13" rx="4" ry="8" fill="#F39C12" stroke="#7A4A05" strokeWidth="0.6" opacity="0.7" />
    {/* stem */}
    <path d="M 11.5 1 Q 13 4 14.5 1 L 14.5 4.5 L 11.5 4.5 Z" fill="#5C7C2C" stroke="#3D5E1F" strokeWidth="0.6" strokeLinejoin="round" />
    {/* eyes */}
    <polygon points="8,11 10.5,8 10.5,12" fill="#1a0e05" stroke="#000" strokeWidth="0.3" />
    <polygon points="18,11 15.5,8 15.5,12" fill="#1a0e05" stroke="#000" strokeWidth="0.3" />
    {/* jagged mouth */}
    <path
      d="M 7 16 L 9 14 L 10 16 L 11 14 L 12 16 L 13 14 L 14 16 L 15 14 L 16 16 L 17 14 L 19 16 L 17 19 L 9 19 Z"
      fill="#1a0e05"
      stroke="#000"
      strokeWidth="0.4"
      strokeLinejoin="round"
    />
    {/* highlight */}
    <ellipse cx="6" cy="9" rx="1.8" ry="1.2" fill="#ffffff" opacity="0.35" transform="rotate(-25 6 9)" />
  </svg>
);

const BAT = (
  <svg viewBox="0 0 24 14" className="h-full w-full drop-shadow-sm">
    {/* body — round */}
    <ellipse cx="12" cy="7" rx="2.2" ry="3" fill="#2D1A0B" stroke="#000" strokeWidth="0.5" />
    {/* wings */}
    <path
      d="M 12 5 L 8 2 L 5 4 L 2 3 L 4 7 L 1 9 L 5 9 L 7 12 L 10 9 L 12 10 L 14 9 L 17 12 L 19 9 L 23 9 L 20 7 L 22 3 L 19 4 L 16 2 Z"
      fill="#2D1A0B"
      stroke="#000"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
    {/* ears */}
    <polygon points="11,4 10.5,2 12,3.5" fill="#2D1A0B" stroke="#000" strokeWidth="0.3" />
    <polygon points="13,4 13.5,2 12,3.5" fill="#2D1A0B" stroke="#000" strokeWidth="0.3" />
    {/* eyes — small red dots */}
    <circle cx="11" cy="6.5" r="0.5" fill="#E63946" />
    <circle cx="13" cy="6.5" r="0.5" fill="#E63946" />
  </svg>
);

// --- Christmas tree + gift --------------------------------------------------

const CHRISTMAS_TREE = (
  <svg viewBox="0 0 22 26" className="h-full w-full drop-shadow-sm">
    {/* three layered triangles */}
    <polygon points="11,2 5,11 17,11" fill="#5C7C2C" stroke="#2D4A0B" strokeWidth="0.9" strokeLinejoin="round" />
    <polygon points="11,7 3,15 19,15" fill="#5C7C2C" stroke="#2D4A0B" strokeWidth="0.9" strokeLinejoin="round" />
    <polygon points="11,12 1,21 21,21" fill="#5C7C2C" stroke="#2D4A0B" strokeWidth="0.9" strokeLinejoin="round" />
    {/* trunk */}
    <rect x="9.5" y="21" width="3" height="4" fill="#5C3317" stroke="#2D1A0B" strokeWidth="0.6" />
    {/* tree-top star */}
    <polygon points="11,0 12,2.5 14.5,2.5 12.5,4 13.5,6.5 11,5 8.5,6.5 9.5,4 7.5,2.5 10,2.5" fill="#FAC775" stroke="#7A5018" strokeWidth="0.5" strokeLinejoin="round" />
    {/* ornaments */}
    <circle cx="8" cy="9" r="0.9" fill="#E63946" stroke="#8A1424" strokeWidth="0.3" />
    <circle cx="14" cy="13" r="0.9" fill="#F4A8C1" stroke="#B0617F" strokeWidth="0.3" />
    <circle cx="6" cy="17" r="0.9" fill="#FAC775" stroke="#7A5018" strokeWidth="0.3" />
    <circle cx="16" cy="18" r="0.9" fill="#E63946" stroke="#8A1424" strokeWidth="0.3" />
    <circle cx="11" cy="14" r="0.9" fill="#FAC775" stroke="#7A5018" strokeWidth="0.3" />
  </svg>
);

const GIFT = (
  <svg viewBox="0 0 18 20" className="h-full w-full drop-shadow-sm">
    {/* box body */}
    <rect x="1" y="8" width="16" height="11" rx="0.8" fill="#E63946" stroke="#8A1424" strokeWidth="0.9" />
    {/* vertical ribbon */}
    <rect x="8" y="8" width="2" height="11" fill="#FAC775" stroke="#7A5018" strokeWidth="0.3" />
    {/* lid */}
    <rect x="0.5" y="6" width="17" height="3" rx="0.8" fill="#E63946" stroke="#8A1424" strokeWidth="0.9" />
    {/* horizontal ribbon on lid */}
    <rect x="8" y="6" width="2" height="3" fill="#FAC775" stroke="#7A5018" strokeWidth="0.3" />
    {/* bow loops */}
    <ellipse cx="6" cy="4" rx="2.5" ry="2" fill="#FAC775" stroke="#7A5018" strokeWidth="0.6" />
    <ellipse cx="12" cy="4" rx="2.5" ry="2" fill="#FAC775" stroke="#7A5018" strokeWidth="0.6" />
    <circle cx="9" cy="4" r="1" fill="#FAC775" stroke="#7A5018" strokeWidth="0.6" />
    {/* highlight */}
    <ellipse cx="3" cy="11" rx="1.2" ry="0.6" fill="#ffffff" opacity="0.35" />
  </svg>
);

// --- Korean flag (Samiljeol, Liberation Day) --------------------------------

const TAEGEUKGI = (
  <svg viewBox="0 0 26 18" className="h-full w-full drop-shadow-sm">
    {/* white field with outline */}
    <rect x="0.5" y="0.5" width="25" height="17" rx="0.5" fill="#ffffff" stroke="#5A3A18" strokeWidth="0.7" />
    {/* taegeuk — red top, blue bottom (S-curve) */}
    <circle cx="13" cy="9" r="4.5" fill="#3658A5" stroke="#1F3A6F" strokeWidth="0.4" />
    <path
      d="M 13 4.5 A 4.5 4.5 0 0 1 13 13.5 A 2.25 2.25 0 0 0 13 9 A 2.25 2.25 0 0 1 13 4.5 Z"
      fill="#E63946"
      stroke="#8A1424"
      strokeWidth="0.4"
    />
    {/* four trigrams — simplified bars at corners */}
    <g stroke="#1a0e05" strokeWidth="0.6" strokeLinecap="round">
      {/* top-left ☰ */}
      <line x1="2.5" y1="3.5" x2="5.5" y2="3.5" />
      <line x1="2.5" y1="4.5" x2="5.5" y2="4.5" />
      <line x1="2.5" y1="5.5" x2="5.5" y2="5.5" />
      {/* bottom-right ☷ */}
      <line x1="20.5" y1="13" x2="21.5" y2="13" />
      <line x1="22.5" y1="13" x2="23.5" y2="13" />
      <line x1="20.5" y1="14" x2="21.5" y2="14" />
      <line x1="22.5" y1="14" x2="23.5" y2="14" />
      <line x1="20.5" y1="15" x2="21.5" y2="15" />
      <line x1="22.5" y1="15" x2="23.5" y2="15" />
      {/* top-right ☵ */}
      <line x1="20.5" y1="3.5" x2="23.5" y2="3.5" />
      <line x1="20.5" y1="4.5" x2="21.5" y2="4.5" />
      <line x1="22.5" y1="4.5" x2="23.5" y2="4.5" />
      <line x1="20.5" y1="5.5" x2="23.5" y2="5.5" />
      {/* bottom-left ☲ */}
      <line x1="2.5" y1="13" x2="3.5" y2="13" />
      <line x1="4.5" y1="13" x2="5.5" y2="13" />
      <line x1="2.5" y1="14" x2="5.5" y2="14" />
      <line x1="2.5" y1="15" x2="3.5" y2="15" />
      <line x1="4.5" y1="15" x2="5.5" y2="15" />
    </g>
  </svg>
);

// --- Memorial ribbon ---------------------------------------------------------

const BLACK_RIBBON = (
  <svg viewBox="0 0 18 26" className="h-full w-full drop-shadow-sm">
    {/* upper loop */}
    <path
      d="M 9 2 Q 3 6 5 12 L 9 9 L 13 12 Q 15 6 9 2 Z"
      fill="#2D1A0B"
      stroke="#000"
      strokeWidth="0.7"
      strokeLinejoin="round"
    />
    {/* knot */}
    <ellipse cx="9" cy="11" rx="2" ry="1.4" fill="#0d0805" stroke="#000" strokeWidth="0.5" />
    {/* tails */}
    <path d="M 7 12 L 3 22 L 6 23 L 9 13 Z" fill="#2D1A0B" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
    <path d="M 11 12 L 15 22 L 12 23 L 9 13 Z" fill="#2D1A0B" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
  </svg>
);

// --- Mountains (National Foundation day) ------------------------------------

const MOUNTAINS = (
  <svg viewBox="0 0 26 18" className="h-full w-full drop-shadow-sm">
    {/* sky background — soft */}
    <rect x="0.5" y="0.5" width="25" height="17" rx="0.8" fill="#FBEAF0" stroke="#7A5018" strokeWidth="0.6" />
    {/* sun */}
    <circle cx="20" cy="5" r="2.5" fill="#FAC775" stroke="#7A5018" strokeWidth="0.6" />
    {/* back mountain */}
    <polygon points="0,17 8,4 16,17" fill="#7CA84A" stroke="#3D5E1F" strokeWidth="0.7" strokeLinejoin="round" />
    {/* front mountain */}
    <polygon points="8,17 16,1 24,17" fill="#5C7C2C" stroke="#2D4A0B" strokeWidth="0.9" strokeLinejoin="round" />
    {/* snow cap */}
    <polygon points="14,4 16,1 18,4 17,5 16,4.5 15,5" fill="#ffffff" stroke="#7A5018" strokeWidth="0.4" strokeLinejoin="round" />
  </svg>
);

// --- Hangeul character (Hangeul day) ----------------------------------------

const HANGEUL_GA = (
  <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-sm">
    {/* paper background */}
    <rect x="0.8" y="0.8" width="22.4" height="22.4" rx="2.5" fill="#FBEAF0" stroke="#7A0D1F" strokeWidth="0.9" />
    {/* '가' character */}
    <g fill="none" stroke="#4B1528" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {/* ㄱ */}
      <path d="M 4 6 L 12 6 L 12 14" />
      {/* ㅏ vertical */}
      <line x1="17" y1="3" x2="17" y2="21" />
      {/* ㅏ horizontal */}
      <line x1="17" y1="12" x2="20.5" y2="12" />
    </g>
  </svg>
);

// =============================================================================
// COMPOSITIONS — which stickers compose each special day
// =============================================================================

const FULL: Record<SpecialDay, StickerSpec[]> = {
  "new-year": [
    { svg: STAR_GOLD, className: "right-[5%] top-[5%] w-[30%]" },
    { svg: SPARKLE_GOLD, className: "left-[8%] bottom-[12%] w-[16%]" },
    { svg: SPARKLE_GOLD, className: "right-[20%] bottom-[18%] w-[12%]" },
  ],
  valentine: [
    { svg: HEART_RED, className: "right-[5%] top-[5%] w-[30%] aspect-[24/22]" },
    { svg: HEART_PINK, className: "right-[37%] top-[14%] w-[16%] aspect-[24/22]" },
    { svg: CHOCOLATE_BAR, className: "left-[6%] bottom-[8%] w-[32%] aspect-[26/18]" },
    { svg: HEART_PINK, className: "left-[44%] bottom-[6%] w-[12%] aspect-[24/22]" },
  ],
  "white-day": [
    { svg: HEART_WHITE, className: "right-[5%] top-[5%] w-[30%] aspect-[24/22]" },
    { svg: LOLLIPOP, className: "left-[7%] bottom-[6%] w-[24%] aspect-[18/24]" },
    { svg: HEART_PINK, className: "right-[37%] top-[14%] w-[14%] aspect-[24/22]" },
  ],
  pepero: [
    { svg: pepero(-12), className: "right-[6%] top-[5%] w-[14%] aspect-[10/28]" },
    { svg: pepero(8), className: "right-[22%] top-[8%] w-[14%] aspect-[10/28]" },
    { svg: pepero(-5), className: "left-[8%] bottom-[6%] w-[14%] aspect-[10/28]" },
    { svg: pepero(15), className: "left-[26%] bottom-[8%] w-[14%] aspect-[10/28]" },
  ],
  "lunar-new-year": [
    { svg: FU_BADGE, className: "right-[5%] top-[5%] w-[28%]" },
    { svg: KNOT, className: "left-[6%] bottom-[8%] w-[28%]" },
  ],
  chuseok: [
    { svg: FULL_MOON, className: "right-[5%] top-[5%] w-[30%]" },
    { svg: SONGPYEON, className: "left-[8%] bottom-[8%] w-[24%] aspect-[22/14]" },
    { svg: SPARKLE_GOLD, className: "right-[37%] top-[15%] w-[10%]" },
  ],
  "children-day": [
    { svg: BALLOON_RED, className: "right-[5%] top-[5%] w-[20%] aspect-[18/26]" },
    { svg: BALLOON_YELLOW, className: "right-[26%] top-[8%] w-[18%] aspect-[18/26]" },
    { svg: BALLOON_BLUE, className: "right-[44%] top-[6%] w-[18%] aspect-[18/26]" },
    { svg: STAR_GOLD, className: "left-[6%] bottom-[10%] w-[16%]" },
  ],
  "parents-day": [
    { svg: CARNATION_RED, className: "right-[5%] top-[5%] w-[30%] aspect-[24/30]" },
    { svg: CARNATION_PINK, className: "left-[7%] bottom-[8%] w-[22%] aspect-[24/30]" },
  ],
  "teachers-day": [
    { svg: CARNATION_PINK, className: "right-[5%] top-[5%] w-[30%] aspect-[24/30]" },
    { svg: CARNATION_PINK, className: "left-[8%] bottom-[10%] w-[20%] aspect-[24/30]" },
  ],
  "buddha-birthday": [
    { svg: LOTUS_LANTERN, className: "right-[5%] top-[3%] w-[24%] aspect-[22/28]" },
    { svg: LOTUS_LANTERN, className: "left-[7%] top-[5%] w-[20%] aspect-[22/28]" },
  ],
  halloween: [
    { svg: PUMPKIN, className: "right-[5%] bottom-[10%] w-[34%] aspect-[26/22]" },
    { svg: BAT, className: "left-[8%] top-[8%] w-[24%] aspect-[24/14]" },
    { svg: BAT, className: "right-[42%] top-[15%] w-[16%] aspect-[24/14]" },
  ],
  christmas: [
    { svg: CHRISTMAS_TREE, className: "right-[5%] top-[5%] w-[28%] aspect-[22/26]" },
    { svg: GIFT, className: "left-[7%] bottom-[8%] w-[22%] aspect-[18/20]" },
    { svg: STAR_GOLD, className: "left-[42%] top-[10%] w-[12%]" },
  ],
  samiljeol: [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[32%] aspect-[26/18]" },
  ],
  "memorial-day": [
    { svg: BLACK_RIBBON, className: "right-[5%] top-[5%] w-[20%] aspect-[18/26]" },
  ],
  "liberation-day": [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[32%] aspect-[26/18]" },
    { svg: SPARKLE_GOLD, className: "left-[8%] bottom-[10%] w-[14%]" },
  ],
  "national-foundation": [
    { svg: MOUNTAINS, className: "right-[5%] bottom-[8%] w-[38%] aspect-[26/18]" },
  ],
  "hangeul-day": [
    { svg: HANGEUL_GA, className: "right-[5%] top-[5%] w-[28%]" },
  ],
};

// Compact = single main sticker (calendar size='full' / md, ~50-80px wide).
// Accents drop off because tiny scattered shapes turn to mush at this scale.
const COMPACT: Record<SpecialDay, StickerSpec[]> = {
  "new-year": [
    { svg: STAR_GOLD, className: "right-[5%] top-[5%] w-[36%]" },
  ],
  valentine: [
    { svg: HEART_RED, className: "right-[5%] top-[5%] w-[36%] aspect-[24/22]" },
  ],
  "white-day": [
    { svg: HEART_WHITE, className: "right-[5%] top-[5%] w-[36%] aspect-[24/22]" },
  ],
  pepero: [
    { svg: pepero(-12), className: "right-[12%] top-[5%] w-[16%] aspect-[10/28]" },
    { svg: pepero(10), className: "right-[30%] top-[5%] w-[16%] aspect-[10/28]" },
  ],
  "lunar-new-year": [
    { svg: FU_BADGE, className: "right-[5%] top-[5%] w-[32%]" },
  ],
  chuseok: [
    { svg: FULL_MOON, className: "right-[5%] top-[5%] w-[36%]" },
  ],
  "children-day": [
    { svg: BALLOON_RED, className: "right-[5%] top-[5%] w-[24%] aspect-[18/26]" },
    { svg: BALLOON_YELLOW, className: "right-[30%] top-[5%] w-[22%] aspect-[18/26]" },
  ],
  "parents-day": [
    { svg: CARNATION_RED, className: "right-[5%] top-[5%] w-[34%] aspect-[24/30]" },
  ],
  "teachers-day": [
    { svg: CARNATION_PINK, className: "right-[5%] top-[5%] w-[34%] aspect-[24/30]" },
  ],
  "buddha-birthday": [
    { svg: LOTUS_LANTERN, className: "right-[5%] top-[5%] w-[28%] aspect-[22/28]" },
  ],
  halloween: [
    { svg: PUMPKIN, className: "right-[5%] bottom-[8%] w-[38%] aspect-[26/22]" },
  ],
  christmas: [
    { svg: CHRISTMAS_TREE, className: "right-[5%] top-[5%] w-[34%] aspect-[22/26]" },
  ],
  samiljeol: [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[38%] aspect-[26/18]" },
  ],
  "memorial-day": [
    { svg: BLACK_RIBBON, className: "right-[5%] top-[5%] w-[24%] aspect-[18/26]" },
  ],
  "liberation-day": [
    { svg: TAEGEUKGI, className: "right-[5%] top-[5%] w-[38%] aspect-[26/18]" },
  ],
  "national-foundation": [
    { svg: MOUNTAINS, className: "right-[5%] bottom-[8%] w-[42%] aspect-[26/18]" },
  ],
  "hangeul-day": [
    { svg: HANGEUL_GA, className: "right-[5%] top-[5%] w-[34%]" },
  ],
};
