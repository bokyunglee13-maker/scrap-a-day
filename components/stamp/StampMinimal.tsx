'use client';

// components/stamp/StampMinimal.tsx
// 미니멀: 작고 촘촘한 톱니, 미세한 흰 라인 보더, 좌측 상단 흰 칩 위 날짜.

import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Stamp } from '@/types';
import { getPerforationTeeth } from '@/lib/perforation';

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

const VB_W = 90;
const VB_H = 120;

function formatStampDate(iso: string, size: StampSize): string {
  const date = parseISO(iso);
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

// See StampClassic for the rationale on painted teeth vs CSS mask.
const MINIMAL_TEETH = getPerforationTeeth(VB_W, VB_H, 'minimal');

export function StampMinimal({
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

      {/* Photo fills the stamp body (inset-0). Same reasoning as Classic:
          the painted-teeth overlay needs photo pixels at the edges to
          paint over, otherwise it blends into matching-color padding. */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={photoUrl}
          alt={buildAlt(stamp)}
          className="absolute left-1/2 top-1/2 h-full w-full object-cover"
          style={{
            transform: `translate(calc(-50% + ${stamp.crop.x}px), calc(-50% + ${stamp.crop.y}px)) scale(${stamp.crop.zoom})`,
          }}
          draggable={false}
        />
      </div>

      {/* Hairline white inner border (decorative frame inside the photo) */}
      <div className="pointer-events-none absolute inset-[5%] border border-white/80" />

      {/* Date chip — top left */}
      {showDate && (
        <div
          className={cn(
            'absolute left-[6%] top-[6%] flex items-center justify-center rounded-[2px] bg-white text-stamp-ink shadow-sm',
            size === 'sm' && 'px-1 py-0 text-[9px]',
            size === 'md' && 'px-1.5 py-0 text-xs',
            size === 'full' && 'px-1.5 py-0 text-[11px]',
            size === 'lg' && 'px-2 py-0.5 text-base',
            size === 'xl' && 'px-2.5 py-1 text-xl',
          )}
        >
          <span className="font-serif font-medium leading-none">
            {dateText}
          </span>
        </div>
      )}

      {/* Mood dot — bottom right */}
      {showMoodDot && (
        <div
          className={cn(
            'absolute bottom-[8%] right-[8%] size-3 rounded-full ring-2 ring-white',
            moodBgClass(stamp.mood),
          )}
          aria-label={`감정: ${stamp.mood}`}
        />
      )}

      {/* Perforation overlay — no stroke for cleaner real-stamp look. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 fill-stamp-paper"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
      >
        {MINIMAL_TEETH.map((t, i) => (
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
