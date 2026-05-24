'use client';

// components/editor/MemoInput.tsx
// 100-char memo input with live counter. PRD §05 step 3.
// text-base (16px) prevents iOS Safari auto-zoom on focus. PRD §15.2.3.

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MemoInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

const MAX_LEN = 100;

export function MemoInput({
  value,
  onChange,
  placeholder = '오늘, 한 장',
}: MemoInputProps) {
  const atLimit = value.length === MAX_LEN;

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LEN))}
        onFocus={(e) =>
          e.currentTarget.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          })
        }
        placeholder={placeholder}
        maxLength={MAX_LEN}
        rows={3}
        aria-label="메모"
        className="text-base resize-none"
      />
      <div
        className={cn(
          'self-end text-xs tabular-nums text-stamp-ink/50',
          atLimit && 'text-mood-flutter',
        )}
        aria-live="polite"
      >
        {value.length}/{MAX_LEN}
      </div>
    </div>
  );
}
