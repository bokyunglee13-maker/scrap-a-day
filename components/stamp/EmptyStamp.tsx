// components/stamp/EmptyStamp.tsx
// 빈 우표: 항상 미니멀 톱니. 흰 배경, 미세한 안쪽 점선, 회색 날짜.
// isToday → 부드러운 골드 글로우 + "오늘, 한 장" 힌트.
//
// Stamp 레코드가 없으므로 사진/감정 props는 받지 않습니다.

import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getPerforationTeeth } from '@/lib/perforation';

export type StampSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface EmptyStampProps {
  date: string; // 'YYYY-MM-DD'
  size?: StampSize;
  isToday?: boolean;
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

// Painted teeth (see StampClassic for rationale). EmptyStamp always uses
// minimal teeth per PRD §03 §4.4.
const MINIMAL_TEETH = getPerforationTeeth(VB_W, VB_H, 'minimal');

export function EmptyStamp({
  date,
  size = 'md',
  isToday = false,
  onClick,
}: EmptyStampProps) {
  const dateText = formatStampDate(date, size);
  const dateLabel = format(parseISO(date), 'M월 d일', { locale: ko });
  const showHint = isToday && (size === 'lg' || size === 'xl');

  const content = (
    <div
      className={cn(
        'relative aspect-[3/4] overflow-hidden rounded-sm bg-white shadow-sm',
        SIZE_CLASS[size],
      )}
    >
      {/* White paper backdrop */}
      <div className="absolute inset-0 bg-white" />

      {/* Dotted inner border (bumped from /20 → /40 for visibility) */}
      <div className="pointer-events-none absolute inset-[6%] border border-dotted border-stamp-ink/40" />

      {/* Date — centered, muted gray */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-stamp-ink/40">
        <span
          className={cn(
            'font-serif font-medium leading-none',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-base',
            size === 'full' && 'text-sm',
            size === 'lg' && 'text-3xl',
            size === 'xl' && 'text-4xl',
          )}
        >
          {dateText}
        </span>
        {showHint && (
          <span className="font-sans text-sm text-mood-joy">오늘, 한 장</span>
        )}
      </div>

      {/* Perforation overlay — painted minimal scallops along the edges.
          Fill is stamp-paper so scallops blend with the calendar bg, making
          the empty cell read as a stamp instead of a plain white card. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 fill-stamp-paper stroke-stamp-ink/35"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
      >
        {MINIMAL_TEETH.map((t, i) => (
          <circle key={i} cx={t.cx} cy={t.cy} r={t.r} strokeWidth="0.6" />
        ))}
      </svg>
    </div>
  );

  // Today glow — soft gold ring on the OUTER wrapper so it isn't clipped by the mask.
  // For size='full' we MUST use block+w-full; an inline-block parent collapses to
  // 0 width when its only child is w-full (circular sizing).
  const wrapper = (
    <div
      className={cn(
        size === 'full' ? 'block w-full' : 'inline-block',
        isToday && 'rounded-sm ring-2 ring-mood-joy/40 ring-offset-1 ring-offset-stamp-paper',
      )}
    >
      {content}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${dateLabel} 빈 우표${isToday ? ' (오늘)' : ''}`}
      >
        {wrapper}
      </button>
    );
  }
  return wrapper;
}
