'use client';

// components/stamp/StampClassic.tsx
// 클래식: 큰 톱니, 진한 내부 보더, 우측 하단 날짜 (액면가 위치), serif 워드마크.

import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Stamp } from '@/types';
import { getPerforationTeeth } from '@/lib/perforation';
import { getSpecialDay } from '@/lib/specialDays';
import { SpecialDayBadge } from './SpecialDayBadge';

export type StampSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface StampProps {
  stamp: Stamp;
  size?: StampSize;
  showDate?: boolean;
  showMood?: boolean;
  onClick?: () => void;
}

const SIZE_CLASS: Record<StampSize, string> = {
  sm: 'w-12',
  md: 'w-20',
  lg: 'w-48',
  xl: 'w-72',
  full: 'w-full',
};

// SVG viewBox uses 3:4 — 90×120 keeps the perforation math integer-friendly.
const VB_W = 90;
const VB_H = 120;

function formatStampDate(iso: string, size: StampSize): string {
  const date = parseISO(iso);
  // 'full' sizes responsively to its container — treat as compact for date.
  if (size === 'sm' || size === 'md' || size === 'full') return format(date, 'd');
  return format(date, 'M월 d일', { locale: ko });
}

function buildAlt(stamp: Stamp): string {
  const dateLabel = format(parseISO(stamp.date), 'M월 d일', { locale: ko });
  const base = `${dateLabel} 우표`;
  return stamp.memo ? `${base} — ${stamp.memo}` : base;
}

function moodBgClass(mood: Stamp['mood']): string {
  switch (mood) {
    case 'joy':
      return 'bg-mood-joy';
    case 'calm':
      return 'bg-mood-calm';
    case 'serene':
      return 'bg-mood-serene';
    case 'blue':
      return 'bg-mood-blue';
    case 'flutter':
      return 'bg-mood-flutter';
    default:
      return 'bg-transparent';
  }
}

// Painted teeth approach (consistent with the cropper). Each circle is
// centered on the rectangle's edge — only the inside half is visible
// (SVG clips outside the viewBox). Filled with the body color so the
// scallop bites read as "paper showing through" against any photo.
//
// We use a painted overlay instead of CSS mask-image because at small
// sizes (size='full' = ~50px in the calendar) the actual mask cuts are
// 1-2px and effectively invisible. Painted scallops keep the stamp look
// readable at every size.
const CLASSIC_TEETH = getPerforationTeeth(VB_W, VB_H, 'classic');

export function StampClassic({
  stamp,
  size = 'md',
  showDate = true,
  showMood = true,
  onClick,
}: StampProps) {
  const photoUrl = useMemo(
    () => URL.createObjectURL(stamp.photoBlob),
    [stamp.photoBlob],
  );
  useEffect(() => {
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const dateText = formatStampDate(stamp.date, size);
  const isSmall = size === 'sm' || size === 'md' || size === 'full';
  const showMoodDot =
    showMood && stamp.mood !== null && stamp.moodVisible === true;

  const content = (
    <div
      className={cn(
        'relative aspect-[3/4] overflow-hidden rounded-sm bg-stamp-paper shadow-sm',
        SIZE_CLASS[size],
      )}
    >
      {/* Paper backdrop */}
      <div className="absolute inset-0 bg-stamp-paper" />

      {/* Photo fills the entire stamp (no paper bottom — user request).
          Tradeoff: 1:1 cropped blob in 3:4 container with object-cover
          trims ~12.5% top + bottom. Acceptable per user feedback. */}
      <img
        src={photoUrl}
        alt={buildAlt(stamp)}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Date — bottom LEFT (moved from bottom-right so mood can take the
          polaroid-style bottom-right position). Dark chip for legibility
          over arbitrary photo content. */}
      {showDate && (
        <div
          className={cn(
            'absolute left-[6%] flex flex-col items-start leading-none rounded-[2px] bg-stamp-ink/85 text-stamp-paper',
            isSmall ? 'bottom-[6%] px-1 py-0' : 'bottom-[5%] px-1.5 py-0.5',
          )}
        >
          {!isSmall && (
            <span className="font-serif text-[8px] tracking-[0.2em] opacity-70">
              SCRAP·A·DAY
            </span>
          )}
          <span
            className={cn(
              'font-serif font-medium',
              size === 'sm' && 'text-[10px]',
              size === 'md' && 'text-sm',
              size === 'full' && 'text-xs',
              size === 'lg' && 'text-2xl',
              size === 'xl' && 'text-3xl',
            )}
          >
            {dateText}
          </span>
        </div>
      )}

      {/* Special-day decoration — set of scattered stickers per theme
          (compact for calendar sizes, full at lg/xl). */}
      {(() => {
        const day = getSpecialDay(stamp.date);
        return day ? (
          <SpecialDayBadge day={day} variant={isSmall ? 'compact' : 'full'} />
        ) : null;
      })()}

      {/* Mood dot — BOTTOM RIGHT, uniform with Minimal and Polaroid. */}
      {showMoodDot && (
        <div
          className={cn(
            'absolute bottom-[6%] right-[6%] rounded-full ring-1 ring-white',
            moodBgClass(stamp.mood),
            isSmall ? 'size-2' : 'size-3 ring-2',
          )}
          aria-label={`감정: ${stamp.mood}`}
        />
      )}

      {/* Perforation overlay — painted scallops bite into the photo edges.
          No stroke: a clean stamp-paper fill reads as actual paper showing
          through the perforation cuts (real-stamp look). The earlier stroke
          version felt 'painted on' to the user. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 fill-stamp-paper"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
      >
        {CLASSIC_TEETH.map((t, i) => (
          <circle key={i} cx={t.cx} cy={t.cy} r={t.r} />
        ))}
      </svg>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={buildAlt(stamp)}
      >
        {content}
      </button>
    );
  }
  return content;
}
