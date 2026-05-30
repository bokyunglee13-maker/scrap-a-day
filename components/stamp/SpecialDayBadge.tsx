// components/stamp/SpecialDayBadge.tsx
// Small decorative badge that sits in the corner of a stamp on special days.
// Tiny SVG illustrations — designed to scale crisp at any stamp size and to
// stay readable even at compact (size='full' ≈ 50px) calendar cells.

import type { ReactElement } from "react";
import type { SpecialDay } from "@/lib/specialDays";
import { SPECIAL_DAY_LABEL } from "@/lib/specialDays";
import { cn } from "@/lib/utils";

interface SpecialDayBadgeProps {
  day: SpecialDay;
  /** Position + sizing classes from the parent (e.g. 'right-[6%] top-[6%] w-[18%]'). */
  className?: string;
}

export function SpecialDayBadge({ day, className }: SpecialDayBadgeProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 aspect-square",
        className,
      )}
      aria-label={SPECIAL_DAY_LABEL[day]}
      title={SPECIAL_DAY_LABEL[day]}
    >
      {ICONS[day]}
    </div>
  );
}

const ICONS: Record<SpecialDay, ReactElement> = {
  // ✨ 새해: 작은 별 + 작은 점들 (반짝임)
  "new-year": (
    <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
      <polygon
        points="10,1 11.8,7.5 18.5,8 13,12.2 15,18.5 10,14.8 5,18.5 7,12.2 1.5,8 8.2,7.5"
        fill="#FAC775"
        stroke="#4B1528"
        strokeWidth="0.5"
      />
    </svg>
  ),

  // ♥ 발렌타인 (받는 사람 입장): 빨간 하트
  valentine: (
    <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
      <path
        d="M10 17.5 C 4 13.5, 1 9, 3.5 5.5 C 6 2.5, 9 4, 10 6 C 11 4, 14 2.5, 16.5 5.5 C 19 9, 16 13.5, 10 17.5 Z"
        fill="#E63946"
      />
    </svg>
  ),

  // 🤍 화이트데이 (주는 사탕): 흰 하트 + 분홍 outline
  "white-day": (
    <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
      <path
        d="M10 17.5 C 4 13.5, 1 9, 3.5 5.5 C 6 2.5, 9 4, 10 6 C 11 4, 14 2.5, 16.5 5.5 C 19 9, 16 13.5, 10 17.5 Z"
        fill="#ffffff"
        stroke="#F4C0D1"
        strokeWidth="1.5"
      />
    </svg>
  ),

  // 1111 빼빼로데이: 4개 막대 — 빼빼로 모양
  pepero: (
    <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
      {/* 4 sticks with chocolate ends */}
      <rect x="3" y="2" width="1.6" height="15" rx="0.5" fill="#F4C0D1" />
      <rect x="3" y="11" width="1.6" height="6" rx="0.5" fill="#4B1528" />
      <rect x="7" y="2" width="1.6" height="15" rx="0.5" fill="#F4C0D1" />
      <rect x="7" y="11" width="1.6" height="6" rx="0.5" fill="#4B1528" />
      <rect x="11" y="2" width="1.6" height="15" rx="0.5" fill="#F4C0D1" />
      <rect x="11" y="11" width="1.6" height="6" rx="0.5" fill="#4B1528" />
      <rect x="15" y="2" width="1.6" height="15" rx="0.5" fill="#F4C0D1" />
      <rect x="15" y="11" width="1.6" height="6" rx="0.5" fill="#4B1528" />
    </svg>
  ),

  // 설날: 빨간 원에 '福' 글자
  "lunar-new-year": (
    <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
      <circle cx="10" cy="10" r="9" fill="#E63946" stroke="#4B1528" strokeWidth="0.4" />
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
  ),

  // 추석: 노란 보름달 + 작은 별
  chuseok: (
    <svg viewBox="0 0 20 20" className="h-full w-full drop-shadow-sm">
      <circle
        cx="11"
        cy="11"
        r="7.5"
        fill="#FAC775"
        stroke="#4B1528"
        strokeWidth="0.4"
      />
      <circle cx="8.5" cy="9.5" r="1.2" fill="#E2B05F" opacity="0.7" />
      <circle cx="12.5" cy="13" r="0.8" fill="#E2B05F" opacity="0.7" />
      <polygon
        points="3.5,5 4,7 6,7.5 4,8 3.5,10 3,8 1,7.5 3,7"
        fill="#FAC775"
        opacity="0.85"
      />
    </svg>
  ),
};
