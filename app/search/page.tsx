'use client';

// app/search/page.tsx
// Phase 5 — search by 함께한 사람 (companions) and/or 감정 (moods).
//
// URL state:
//   ?companion=지수&companion=엄마  (OR within axis)
//   ?mood=joy&mood=calm             (OR within axis, strict enum)
//   Across axes: AND.
//
// LoadState (PRD §11 §9.4.3):
//   undefined → loading
//   []        → empty (different copy depending on whether filters are set)
//   Stamp[]   → success grid

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft } from 'lucide-react';

import { Stamp as StampView } from '@/components/stamp/Stamp';
import { searchStamps, getAllCompanions } from '@/lib/stamps';
import { moodLabel } from '@/lib/retrospect';
import type { Mood } from '@/types';
import { cn } from '@/lib/utils';

const ALL_MOODS: Mood[] = ['joy', 'calm', 'serene', 'blue', 'flutter'];
const MOOD_SET = new Set<Mood>(ALL_MOODS);

const MOOD_BG: Record<Mood, string> = {
  joy: 'bg-mood-joy',
  calm: 'bg-mood-calm',
  serene: 'bg-mood-serene',
  blue: 'bg-mood-blue',
  flutter: 'bg-mood-flutter',
};

function isMood(value: string): value is Mood {
  return MOOD_SET.has(value as Mood);
}

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL → filter state. dedupe on the read side; trim companion strings.
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

  const hasAnyFilter =
    selectedCompanions.length > 0 || selectedMoods.length > 0;

  // Companion universe — refreshes whenever stamps table changes.
  const knownCompanions = useLiveQuery(async () => {
    const res = await getAllCompanions();
    return res.ok ? res.value : [];
  }, []);

  // Search results — re-runs whenever filters or stamps table change.
  const results = useLiveQuery(async () => {
    const res = await searchStamps({
      companions: selectedCompanions.length > 0 ? selectedCompanions : undefined,
      moods: selectedMoods.length > 0 ? selectedMoods : undefined,
    });
    return res.ok ? res.value : [];
  }, [selectedCompanions.join('|'), selectedMoods.join('|')]);

  // Build the next URL with a toggled value on an axis. Preserves the other axis.
  const navigateWith = (params: URLSearchParams) => {
    const qs = params.toString();
    router.replace(qs ? `/search?${qs}` : '/search');
  };

  const toggleCompanion = (name: string) => {
    const next = new URLSearchParams();
    for (const m of selectedMoods) next.append('mood', m);
    const set = new Set(selectedCompanions);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    for (const c of set) next.append('companion', c);
    navigateWith(next);
  };

  const toggleMood = (mood: Mood) => {
    const next = new URLSearchParams();
    for (const c of selectedCompanions) next.append('companion', c);
    const set = new Set(selectedMoods);
    if (set.has(mood)) set.delete(mood);
    else set.add(mood);
    for (const m of set) next.append('mood', m);
    navigateWith(next);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="flex items-center gap-2">
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
      </header>

      {/* Companion filter section (omitted entirely when nothing recorded). */}
      {knownCompanions && knownCompanions.length > 0 && (
        <section className="mt-6 flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-stamp-ink/50">
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
          기록된 사람이 없어요
        </p>
      )}

      {/* Mood filter section. */}
      <section className="mt-6 flex flex-col gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-stamp-ink/50">
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
      <section className="mt-8">
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
            조건에 맞는 우표가 없어요
          </p>
        )}

        {results !== undefined && results.length > 0 && (
          <>
            <p className="mb-3 text-xs text-stamp-ink/50">
              {results.length}개
            </p>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {results.map((s) => (
                <li key={s.id}>
                  <StampView
                    stamp={s}
                    size="full"
                    showDate
                    showMood
                    onClick={() => router.push(`/stamp/${s.date}`)}
                  />
                </li>
              ))}
            </ul>
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
