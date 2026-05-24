'use client';

// components/editor/MoodPicker.tsx
// 5 mood colors + "none" + a sibling "표시" toggle. PRD §05 step 3.
// Touch targets are size-11 (44px) per PRD §15.2.1.

import { X } from 'lucide-react';
import type { Mood } from '@/types';
import { cn } from '@/lib/utils';

interface MoodPickerProps {
  value: Mood | null;
  onChange: (next: Mood | null) => void;
  /** Whether the mood dot will be visible on the stamp. */
  visible: boolean;
  onVisibleChange: (next: boolean) => void;
}

interface MoodSpec {
  mood: Mood;
  label: string;
  bg: string;
}

// Labels MUST match PRD §03 §4.3 verbatim. (Earlier '고요/울적' was an agent typo.)
const MOODS: MoodSpec[] = [
  { mood: 'joy', label: '기쁨', bg: 'bg-mood-joy' },
  { mood: 'calm', label: '평온', bg: 'bg-mood-calm' },
  { mood: 'serene', label: '차분', bg: 'bg-mood-serene' },
  { mood: 'blue', label: '우울', bg: 'bg-mood-blue' },
  { mood: 'flutter', label: '설렘', bg: 'bg-mood-flutter' },
];

export function MoodPicker({
  value,
  onChange,
  visible,
  onVisibleChange,
}: MoodPickerProps) {
  const moodSelected = value !== null;

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="감정 선택"
        className="grid grid-cols-3 gap-3"
      >
        {MOODS.map((m) => {
          const isOn = value === m.mood;
          return (
            <button
              key={m.mood}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-label={`${m.label} 선택`}
              onClick={() => onChange(m.mood)}
              className="flex flex-col items-center gap-1.5 rounded-md py-2 transition-colors hover:bg-stamp-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  'size-11 rounded-full transition-shadow',
                  m.bg,
                  isOn &&
                    'ring-2 ring-stamp-ink ring-offset-2 ring-offset-stamp-paper',
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  isOn ? 'font-medium text-stamp-ink' : 'text-stamp-ink/60',
                )}
              >
                {m.label}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={!moodSelected}
          aria-label="감정 없음"
          onClick={() => onChange(null)}
          className="flex flex-col items-center gap-1.5 rounded-md py-2 transition-colors hover:bg-stamp-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className={cn(
              'flex size-11 items-center justify-center rounded-full border-2 border-dashed border-stamp-ink/30 text-stamp-ink/40 transition-shadow',
              !moodSelected &&
                'ring-2 ring-stamp-ink ring-offset-2 ring-offset-stamp-paper',
            )}
          >
            <X className="size-5" />
          </span>
          <span
            className={cn(
              'text-xs',
              !moodSelected ? 'font-medium text-stamp-ink' : 'text-stamp-ink/60',
            )}
          >
            선택 안 함
          </span>
        </button>
      </div>

      <label
        className={cn(
          'flex items-center gap-2 text-sm select-none',
          !moodSelected && 'opacity-40',
        )}
      >
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          disabled={!moodSelected}
          onClick={() => onVisibleChange(!visible)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-stamp-ink/20 transition-colors',
            visible ? 'bg-stamp-ink' : 'bg-stamp-ink/10',
            !moodSelected && 'cursor-not-allowed',
          )}
        >
          <span
            className={cn(
              'inline-block size-5 transform rounded-full bg-stamp-paper shadow transition-transform',
              visible ? 'translate-x-5' : 'translate-x-0.5',
            )}
          />
        </button>
        <span className="text-stamp-ink/70">감정 표시</span>
      </label>
    </div>
  );
}
