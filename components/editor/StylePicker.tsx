'use client';

// components/editor/StylePicker.tsx
// 3 stamp style cards. PRD §05 step 3. Text-only — the live StampPreview
// covers the visual differentiation.

import type { StampStyle } from '@/types';
import { cn } from '@/lib/utils';

interface StylePickerProps {
  value: StampStyle;
  onChange: (next: StampStyle) => void;
}

interface StyleSpec {
  style: StampStyle;
  label: string;
}

// Classic style removed from the picker per user feedback. Existing stamps
// with style='classic' still render correctly (StampClassic component is
// preserved for back-compat).
const STYLES: StyleSpec[] = [
  { style: 'minimal', label: '미니멀' },
  { style: 'polaroid', label: '폴라로이드' },
];

export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="우표 스타일"
      className="grid grid-cols-2 gap-2"
    >
      {STYLES.map((s) => {
        const isOn = value === s.style;
        return (
          <button
            key={s.style}
            type="button"
            role="radio"
            aria-checked={isOn}
            onClick={() => onChange(s.style)}
            className={cn(
              'rounded-md px-4 py-3 font-serif text-sm transition-colors',
              isOn
                ? 'bg-stamp-ink text-stamp-paper'
                : 'bg-white border border-stamp-ink/20 text-stamp-ink hover:bg-stamp-ink/5',
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
