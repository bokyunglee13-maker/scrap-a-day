// components/stamp/EmptyStamp.tsx
// 빈 우표: 항상 미니멀 톱니. 흰 배경, 미세한 안쪽 점선, 회색 날짜.
// isToday → 부드러운 골드 글로우 + "오늘, 한 장" 힌트.
//
// Stamp 레코드가 없으므로 사진/감정 props는 받지 않습니다.

import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getMinimalPerforationPath } from '@/lib/perforation';

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
        'relative aspect-[3/4] overflow-hidden bg-white',
        SIZE_CLASS[size],
      )}
      style={minimalMaskCss()}
    >
      {/* White paper backdrop — visible inside the perforation cutout. */}
      <div className="absolute inset-0 bg-white" />

      {/* Faint dotted inner border */}
      <div className="pointer-events-none absolute inset-[6%] border border-dotted border-stamp-ink/20" />

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
