'use client';

// components/stamp/StampClassic.tsx
// 클래식: 큰 톱니, 진한 내부 보더, 우측 하단 날짜 (액면가 위치), serif 워드마크.

import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Stamp } from '@/types';
import { getClassicPerforationPath } from '@/lib/perforation';

export type StampSize = 'sm' | 'md' | 'lg' | 'xl';

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
};

// SVG viewBox uses 3:4 — 90×120 keeps the perforation math integer-friendly.
const VB_W = 90;
const VB_H = 120;

function formatStampDate(iso: string, size: StampSize): string {
  const date = parseISO(iso);
  if (size === 'sm' || size === 'md') return format(date, 'd');
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

function classicMaskCss(): React.CSSProperties {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VB_W} ${VB_H}' preserveAspectRatio='none'><path d='${getClassicPerforationPath(VB_W, VB_H)}' fill='white' fill-rule='evenodd'/></svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return {
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };
}

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
  const isSmall = size === 'sm' || size === 'md';
  const showMoodDot =
    showMood && stamp.mood !== null && stamp.moodVisible === true;

  const content = (
    <div
      className={cn(
        'relative aspect-[3/4] overflow-hidden bg-stamp-paper',
        SIZE_CLASS[size],
      )}
      style={classicMaskCss()}
    >
      {/* Paper backdrop */}
      <div className="absolute inset-0 bg-stamp-paper" />

      {/* Photo region with crop transform */}
      <div className="absolute inset-[6%] overflow-hidden">
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

      {/* Inner ink border (2px) — sits over the photo */}
      <div className="pointer-events-none absolute inset-[6%] border-2 border-stamp-ink" />

      {/* Wordmark + date — bottom right */}
      {showDate && (
        <div className="absolute bottom-[7%] right-[8%] flex flex-col items-end leading-none text-stamp-ink">
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
              size === 'lg' && 'text-2xl',
              size === 'xl' && 'text-3xl',
            )}
          >
            {dateText}
          </span>
        </div>
      )}

      {/* Mood dot — TOP RIGHT for classic (bottom-right is taken by date) */}
      {showMoodDot && (
        <div
          className={cn(
            'absolute right-[8%] top-[8%] size-3 rounded-full ring-2 ring-white',
            moodBgClass(stamp.mood),
          )}
          aria-label={`감정: ${stamp.mood}`}
        />
      )}
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
