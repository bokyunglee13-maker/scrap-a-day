'use client';

// components/stamp/StampPolaroid.tsx
// 폴라로이드: 톱니 없음(직사각형), 흰 프레임, 정사각형 사진, 손글씨 캡션.

import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Stamp } from '@/types';

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

export function StampPolaroid({
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
  const hasMemo = stamp.memo.trim().length > 0;
  // Caption is only readable at lg/xl in practice; render only when sized up.
  const showCaption = hasMemo && (size === 'lg' || size === 'xl');

  const content = (
    <div
      className={cn(
        'relative aspect-[3/4] overflow-hidden bg-white shadow-sm',
        SIZE_CLASS[size],
      )}
    >
      {/* Photo region — square, top/left/right 8% margin, larger bottom margin.
          The 3:4 outer + square photo + 8% side margin → photo height = width - 16%
          → bottom margin = 4/3 of (1 - 16%) subtracted from height. We position
          the square with explicit insets so the bottom area is reserved for caption. */}
      <div
        className="absolute overflow-hidden bg-stamp-paper"
        style={{
          top: '8%',
          left: '8%',
          right: '8%',
          // Square: height = container width * 0.84. As % of container height
          // (4/3 × width), that's 0.84 / (4/3) = 0.63 → bottom is 100% - 8% - 63% = 29%.
          bottom: '29%',
        }}
      >
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

      {/* Date chip — top left, on the white frame */}
      {showDate && (
        <div
          className={cn(
            'absolute left-[5%] top-[3%] flex items-center justify-center rounded-[2px] bg-white text-stamp-ink',
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

      {/* Handwritten caption — bottom area, only when memo exists and size is large enough */}
      {showCaption && (
        <div className="absolute inset-x-[8%] bottom-[6%] text-center">
          <p
            className={cn(
              'font-handwriting text-stamp-ink/80 leading-tight',
              size === 'lg' && 'text-lg',
              size === 'xl' && 'text-2xl',
            )}
          >
            {stamp.memo}
          </p>
        </div>
      )}

      {/* Mood dot — bottom right */}
      {showMoodDot && (
        <div
          className={cn(
            'absolute bottom-[8%] right-[6%] size-3 rounded-full ring-2 ring-white',
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
