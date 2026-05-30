'use client';

// app/search/page.tsx
// Phase 5+ — search by 함께한 사람 (companions) and/or 감정 (moods) within
// a date range.
//
// URL state:
//   ?companion=지수&companion=엄마  (OR within axis)
//   ?mood=joy&mood=calm             (OR within axis, strict enum)
//   ?range=1mo|3mo|6mo|1yr|all      (date floor; default 3mo)
//   Across axes: AND.
//
// IMPORTANT — reactivity:
// dexie-react-hooks tracks Dexie operations performed DIRECTLY inside the
// useLiveQuery callback. Awaiting an external async helper (e.g.
// searchStamps()) does not propagate tracking. So this page inlines the
// Dexie reads, which is the bug fix for #2/#3 (results / known-companions
// not updating after a write).

import { Suspense, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft } from 'lucide-react';

import { Stamp as StampView } from '@/components/stamp/Stamp';
import { ExportSearch } from '@/components/share/ExportSearch';
import { SearchStats } from '@/components/search/SearchStats';
import { db } from '@/lib/db';
import { moodLabel } from '@/lib/retrospect';
import {
  DEFAULT_RANGE,
  parseRangePreset,
  RANGE_PRESET_LABEL,
  rangePresetToFrom,
  type RangePreset,
} from '@/lib/dateGuards';
import type { Mood } from '@/types';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_MOODS: Mood[] = ['joy', 'calm', 'serene', 'blue', 'flutter'];
const MOOD_SET = new Set<Mood>(ALL_MOODS);

const MOOD_BG: Record<Mood, string> = {
  joy: 'bg-mood-joy',
  calm: 'bg-mood-calm',
  serene: 'bg-mood-serene',
  blue: 'bg-mood-blue',
  flutter: 'bg-mood-flutter',
};

const ALL_RANGES: RangePreset[] = ['1mo', '3mo', '6mo', '1yr', 'all'];

function isMood(value: string): value is Mood {
  return MOOD_SET.has(value as Mood);
}

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL → filter state.
  const selectedCompanions = useMemo<string[]>(() => {
    const raw = searchParams.getAll('companion');
    return Array.from(
      new Set(raw.map((s) => s.trim()).filter((s) => s.length > 0)),
    );
  }, [searchParams]);

  const selectedMoods = useMemo<Mood[]>(() => {
    const raw = searchParams.getAll('mood');
    return Array.from(new Set(raw.filter(isMood)));
  }, [searchParams]);

  const range = useMemo<RangePreset>(
    () => parseRangePreset(searchParams.get('range')),
    [searchParams],
  );

  const hasAnyFilter =
    selectedCompanions.length > 0 || selectedMoods.length > 0;

  // Auto-scroll to results when filters change so the user sees their hits
  // immediately instead of having to scroll past the filter chips.
  const resultsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!hasAnyFilter) return;
    // Defer a tick so the layout settles after the URL replace re-render.
    const id = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }, 50);
    return () => window.clearTimeout(id);
  }, [hasAnyFilter, selectedCompanions.join('|'), selectedMoods.join('|')]);

  // ---------------------------------------------------------------------------
  // Live queries — INLINE Dexie reads (reactivity contract).
  // ---------------------------------------------------------------------------

  // Universe of recorded companion names (across all dates — no range filter
  // so users can always filter to anyone they've ever tagged).
  const knownCompanions = useLiveQuery(async () => {
    const all = await db.stamps.toArray();
    const set = new Set<string>();
    for (const s of all) {
      if (s.deletedAt !== null) continue;
      for (const c of s.companions ?? []) {
        const trimmed = c.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
  }, []);

  // Results — filtered by current URL state. Dependency string forces a
  // re-subscribe whenever any filter axis changes.
  const companionsKey = selectedCompanions.join('|');
  const moodsKey = selectedMoods.join('|');
  const results = useLiveQuery(async () => {
    const all = await db.stamps.toArray();
    const wantCompanions = selectedCompanions.length > 0
      ? new Set(selectedCompanions)
      : null;
    const wantMoods = selectedMoods.length > 0
      ? new Set(selectedMoods)
      : null;
    const from = rangePresetToFrom(range);

    const matches = all.filter((s) => {
      if (s.deletedAt !== null) return false;
      if (from && s.date < from) return false;
      if (wantCompanions) {
        const cs = s.companions ?? [];
        if (!cs.some((c) => wantCompanions.has(c))) return false;
      }
      if (wantMoods) {
        if (s.mood === null || !wantMoods.has(s.mood)) return false;
      }
      return true;
    });

    matches.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return matches;
  }, [companionsKey, moodsKey, range]);

  // Group results by YYYY-MM. Precomputed via useMemo so the render path
  // is a plain array map (the earlier IIFE-inside-JSX form rendered the
  // section headers but the grid cells came out 0px on some mobile WebViews
  // — likely a layout-timing edge with aspect-ratio inside a freshly-
  // committed Map iteration).
  const groupedResults = useMemo(() => {
    if (!results || results.length === 0) return [];
    const map = new Map<string, typeof results>();
    for (const s of results) {
      const ym = s.date.slice(0, 7); // 'YYYY-MM'
      const existing = map.get(ym);
      if (existing) {
        existing.push(s);
      } else {
        map.set(ym, [s]);
      }
    }
    return Array.from(map.entries());
  }, [results]);

  // ---------------------------------------------------------------------------
  // URL helpers
  // ---------------------------------------------------------------------------

  const buildParams = (overrides: {
    companions?: string[];
    moods?: Mood[];
    range?: RangePreset;
  }): URLSearchParams => {
    const next = new URLSearchParams();
    const companions = overrides.companions ?? selectedCompanions;
    const moods = overrides.moods ?? selectedMoods;
    const r = overrides.range ?? range;
    for (const c of companions) next.append('companion', c);
    for (const m of moods) next.append('mood', m);
    if (r !== DEFAULT_RANGE) next.set('range', r);
    return next;
  };

  const navigateWith = (params: URLSearchParams) => {
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : '/search');
  };

  const toggleCompanion = (name: string) => {
    const set = new Set(selectedCompanions);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    navigateWith(buildParams({ companions: Array.from(set) }));
  };

  // Single-select per user feedback. Tapping the active mood clears it;
  // tapping a different mood replaces the selection.
  const toggleMood = (mood: Mood) => {
    const next: Mood[] = selectedMoods.includes(mood) ? [] : [mood];
    navigateWith(buildParams({ moods: next }));
  };

  const handleRangeChange = (value: string) => {
    navigateWith(buildParams({ range: parseRangePreset(value) }));
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            aria-label="설정으로"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
            검색
          </h1>
        </div>
        {/* Download / share — disabled when no filter active or no results.
            The opacity-30 disabled state hints 'select something first'. */}
        <ExportSearch
          stamps={results ?? []}
          selectedCompanions={selectedCompanions}
          selectedMoods={selectedMoods}
          range={range}
          disabled={!hasAnyFilter}
        />
      </header>

      {/* Date range — affects how many photos are loaded. Default 3 months.
          Label and Select trigger sized to match the chip buttons below
          (text-sm = 14px) so the page reads as a unified palette instead
          of three different scales (was: text-xs label + text-base select
          + text-sm chips). */}
      <section className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-stamp-ink/60">
          기간
        </h2>
        <Select value={range} onValueChange={handleRangeChange}>
          <SelectTrigger className="h-10 min-w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_RANGES.map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_PRESET_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Companion filter section. */}
      {knownCompanions && knownCompanions.length > 0 && (
        <section className="mt-6 flex flex-col gap-2">
          <h2 className="text-sm font-medium text-stamp-ink/60">
            함께한 사람
          </h2>
          <ul className="flex flex-wrap gap-2">
            {knownCompanions.map((name) => {
              const active = selectedCompanions.includes(name);
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => toggleCompanion(name)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex h-10 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'border-stamp-ink bg-stamp-ink text-stamp-paper'
                        : 'border-stamp-ink/20 bg-white text-stamp-ink hover:bg-stamp-ink/5',
                    )}
                  >
                    {name}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {knownCompanions && knownCompanions.length === 0 && (
        <p className="mt-6 text-sm text-stamp-ink/50">
          아직 함께한 사람이 기록되지 않았어요
        </p>
      )}

      {/* Mood filter section. */}
      <section className="mt-6 flex flex-col gap-2">
        <h2 className="text-sm font-medium text-stamp-ink/60">
          감정
        </h2>
        <ul className="flex flex-wrap gap-2">
          {ALL_MOODS.map((mood) => {
            const active = selectedMoods.includes(mood);
            return (
              <li key={mood}>
                <button
                  type="button"
                  onClick={() => toggleMood(mood)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-stamp-ink bg-stamp-ink text-stamp-paper'
                      : 'border-stamp-ink/20 bg-white text-stamp-ink hover:bg-stamp-ink/5',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-3 rounded-full',
                      MOOD_BG[mood],
                    )}
                    aria-hidden
                  />
                  <span>{moodLabel(mood)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Results. */}
      <section ref={resultsRef} className="mt-8 scroll-mt-4">
        {results === undefined && (
          <p className="text-sm text-stamp-ink/50">검색 중…</p>
        )}

        {results !== undefined && results.length === 0 && !hasAnyFilter && (
          <p className="text-sm text-stamp-ink/60">
            보고싶은 사람이나 감정을 선택해보세요
          </p>
        )}

        {results !== undefined && results.length === 0 && hasAnyFilter && (
          <p className="text-sm text-stamp-ink/60">
            {RANGE_PRESET_LABEL[range]} 기간에 조건에 맞는 우표가 없어요
          </p>
        )}

        {results !== undefined && results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-stamp-ink/60">
              {results.length}개 · {RANGE_PRESET_LABEL[range]}
            </p>
            {/* Stats card sits above the monthly groups. Renders nothing
                when results < 2 or when the filter combo yields no
                meaningful axis (defensive — caller already gates on
                hasAnyFilter via the surrounding `results.length > 0`). */}
            <SearchStats
              stamps={results}
              selectedCompanions={selectedCompanions}
              selectedMoods={selectedMoods}
            />
            {groupedResults.map(([ym, stamps], idx) => {
              const [yearStr, monthStr] = ym.split('-');
              const year = Number(yearStr);
              const month = Number(monthStr);
              return (
                <section
                  key={ym}
                  className={cn(idx === 0 ? '' : 'mt-8')}
                >
                  <h3 className="mb-3 flex items-baseline justify-between border-b border-stamp-ink/10 pb-2 text-sm font-medium text-stamp-ink/70">
                    <span>
                      {year}년 {month}월
                    </span>
                    <span className="text-xs text-stamp-ink/40">
                      {stamps.length}개
                    </span>
                  </h3>
                  {/* COMPLETELY different approach from the (twice-failed)
                      grid+full+aspect strategy. StampView at size='lg' has
                      a hard-coded w-48 (192px) so there's no width-from-parent
                      dependency. Two stamps fit per row inside max-w-md;
                      flex-wrap handles the rest. flex justify-start with the
                      stamps' own intrinsic 192px width — zero ambiguity. */}
                  <div className="flex flex-wrap gap-4">
                    {stamps.map((s) => (
                      <StampView
                        key={s.id}
                        stamp={s}
                        size="lg"
                        showDate
                        showMood
                        onClick={() => router.push(`/stamp/${s.date}`)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-10 text-center text-sm text-stamp-ink/50">
          로딩 중…
        </main>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
