'use client';

// components/stamp/StampMinimal.tsx
// 미니멀: 작고 촘촘한 톱니, 미세한 흰 라인 보더, 좌측 상단 흰 칩 위 날짜.

import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Stamp } from '@/types';
import { getMinimalPerforationPath } from '@/lib/perforation';

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

function minimalMaskCss(): React.CSSProperties {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${VB_W} ${VB_H}' preserveAspectRatio='none'><path d='${getMinimalPerforationPath(VB_W, VB_H)}' fill='white' fill-rule='evenodd'/></svg>`;
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
        'relative aspect-[3/4] overflow-hidden bg-stamp-paper',
        SIZE_CLASS[size],
      )}
      style={minimalMaskCss()}
    >
      {/* Paper backdrop */}
      <div className="absolute inset-0 bg-stamp-paper" />

      {/* Photo region with crop transform */}
      <div className="absolute inset-[4%] overflow-hidden">
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

      {/* Hairline white inner border */}
      <div className="pointer-events-none absolute inset-[4%] border border-white/80" />

      {/* Date chip — top left */}
      {showDate && (
        <div
          className={cn(
            'absolute left-[6%] top-[6%] flex items-center justify-center rounded-[2px] bg-white text-stamp-ink shadow-sm',
            size === 'sm' && 'px-1 py-0 text-[9px]',
            size === 'md' && 'px-1.5 py-0 text-xs',
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
