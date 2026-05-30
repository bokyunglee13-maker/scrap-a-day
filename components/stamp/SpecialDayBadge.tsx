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

import type { ReactElement } from "react";
import type { SpecialDay } from "@/lib/specialDays";
import { SPECIAL_DAY_LABEL } from "@/lib/specialDays";
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
}

export function SpecialDayBadge({ day, variant = "full" }: SpecialDayBadgeProps) {
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
  // 4×2 grid of squares forming a chocolate bar
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
    {/* stick */}
    <rect x="7" y="10" width="2" height="9" rx="0.5" fill="#ffffff" stroke="#999" strokeWidth="0.3" />
    {/* candy head with spiral */}
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
      {/* stick */}
      <rect x="2.5" y="0" width="3" height="24" rx="0.8" fill="#F4C0D1" />
      {/* chocolate end (bottom 60%) */}
      <rect x="2.5" y="9" width="3" height="15" rx="0.8" fill="#4B1528" />
      {/* sprinkles */}
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
  // Simplified Korean lucky knot (매듭) — two crossed loops
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
  // Half-moon shape filled in green-ish (송편)
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

// --- Sticker compositions (FULL variant — detail page lg/xl) -----------------

const FULL: Record<SpecialDay, StickerSpec[]> = {
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
};

// --- Sticker compositions (COMPACT variant — calendar size='full') -----------
// Single main sticker, slightly bigger than accents. Accents dropped because
// at ~50px stamps the scattered tiny stickers turn to mush.
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
};
