'use client';

// components/editor/CompanionPicker.tsx
// Phase 5 — companion (함께한 사람) chip-add input with autocomplete.
//
// Free-text tag UI:
//   - Existing entries render as removable chips (X button on each).
//   - Bottom input accepts a new name on Enter (trim + dedupe).
//   - Autocomplete dropdown surfaces previously-used names that prefix-match.
//
// Mobile-first guarantees (PRD §15):
//   - Input text-base (16px) → no iOS Safari auto-zoom.
//   - Chip remove buttons + suggestion buttons ≥ 40px tappable.
//   - onFocus scrolls the input into view so the keyboard doesn't cover it.

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { getAllCompanions } from '@/lib/stamps';
import { cn } from '@/lib/utils';

interface CompanionPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Optional cap; defaults to 10 to keep registrations focused. */
  max?: number;
}

const DEFAULT_MAX = 10;

export function CompanionPicker({
  value,
  onChange,
  max = DEFAULT_MAX,
}: CompanionPickerProps) {
  const [draft, setDraft] = useState<string>('');
  const [knownNames, setKnownNames] = useState<string[]>([]);
  const [hasFocus, setHasFocus] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // One-shot autocomplete pool. Failure is non-fatal — the user can still type.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getAllCompanions();
      if (!cancelled && res.ok) setKnownNames(res.value);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addChip = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (value.includes(name)) {
      setDraft('');
      return;
    }
    if (value.length >= max) return;
    onChange([...value, name]);
    setDraft('');
  };

  const removeChip = (name: string) => {
    onChange(value.filter((n) => n !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChip(draft);
    }
  };

  // Filter suggestions: not already chosen, prefix-matches current input
  // (case-insensitive). Empty input ⇒ show full unchosen list.
  const suggestions = useMemo(() => {
    const chosen = new Set(value);
    const needle = draft.trim().toLocaleLowerCase('ko');
    return knownNames.filter((name) => {
      if (chosen.has(name)) return false;
      if (!needle) return true;
      return name.toLocaleLowerCase('ko').startsWith(needle);
    });
  }, [knownNames, value, draft]);

  const showSuggestions = hasFocus && suggestions.length > 0 && value.length < max;
  const atCap = value.length >= max;

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="선택된 사람">
          {value.map((name) => (
            <li key={name}>
              <span className="inline-flex items-center gap-1 rounded-full bg-stamp-ink/10 px-3 py-1 text-sm text-stamp-ink">
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => removeChip(name)}
                  aria-label={`${name} 제거`}
                  className="inline-flex size-5 items-center justify-center rounded-full text-stamp-ink/60 hover:bg-stamp-ink/10 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {atCap ? (
        <p className="text-xs text-stamp-ink/50">최대 {max}명</p>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setHasFocus(true);
              e.currentTarget.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
              });
            }}
            // Delay blur so a tap on a suggestion fires its onMouseDown/onClick
            // before the dropdown vanishes.
            onBlur={() => {
              window.setTimeout(() => setHasFocus(false), 150);
            }}
            placeholder="이름 입력 후 엔터"
            aria-label="함께한 사람 추가"
            className="h-11 w-full rounded-md border border-stamp-ink/20 bg-white px-3 text-base text-stamp-ink placeholder:text-stamp-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {showSuggestions && (
            <ul
              role="listbox"
              aria-label="이전에 사용한 이름"
              className={cn(
                'absolute left-0 right-0 top-full z-10 mt-1',
                'max-h-40 overflow-y-auto rounded-md border border-stamp-ink/15 bg-white shadow-sm',
              )}
            >
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    // Use onMouseDown so we trigger BEFORE input blur runs.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addChip(name);
                      inputRef.current?.focus();
                    }}
                    className="block h-10 w-full px-3 text-left text-sm text-stamp-ink hover:bg-stamp-ink/5 focus-visible:bg-stamp-ink/5 focus-visible:outline-none"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
