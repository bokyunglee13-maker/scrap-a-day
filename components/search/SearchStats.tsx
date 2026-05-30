'use client';

// components/search/SearchStats.tsx
// Post Phase 6 polish — lightweight stats card above search results.
//
// What it shows depends on the active filter combo:
//   사람 1명만 → 감정 분포 + 월별 빈도 + 자주 같이 + 회수/평균 간격
//   감정 1개만 → 월별 추이 + 그 감정 때 함께한 사람 Top 3 + 전체 대비 %
//   사람 1명 + 감정 1개 → 월별 분포 + 카운트
//   여러 개 / 둘 다 다중 → 월별 분포만 (해석이 어려워서)
//
// Visual: CSS-only. No chart library. Reuses RetrospectCard's bar idiom
// (a single horizontal flex with mood-color segments) so the visual
// vocabulary stays consistent across the app.
//
// Design philosophy: this is for 회상 (recall), not 평가 (judgment).
// No "X번 미달성" or "이번 달 0번" language. Just neutral counts and
// shapes the user can read meaning into themselves.

import { useMemo } from 'react';

import { moodLabel } from '@/lib/retrospect';
import type { Mood, Stamp } from '@/types';

interface SearchStatsProps {
  /** Filtered, newest-first stamps. */
  stamps: Stamp[];
  selectedCompanions: string[];
  selectedMoods: Mood[];
}

const ALL_MOODS: Mood[] = ['joy', 'calm', 'serene', 'blue', 'flutter'];

const MOOD_BG: Record<Mood, string> = {
  joy: 'bg-mood-joy',
  calm: 'bg-mood-calm',
  serene: 'bg-mood-serene',
  blue: 'bg-mood-blue',
  flutter: 'bg-mood-flutter',
};

const MOOD_DOT: Record<Mood, string> = MOOD_BG;

// ---------------------------------------------------------------------------
// Mood distribution — 5-color horizontal bar.
// Borrowed from RetrospectCard so the visual idiom stays consistent.
// ---------------------------------------------------------------------------

function MoodDistributionBar({ stamps }: { stamps: Stamp[] }) {
  const dist = useMemo(() => {
    const d: Record<Mood, number> = {
      joy: 0,
      calm: 0,
      serene: 0,
      blue: 0,
      flutter: 0,
    };
    for (const s of stamps) {
      if (s.mood && ALL_MOODS.includes(s.mood)) d[s.mood]++;
    }
    return d;
  }, [stamps]);

  const moodTotal = ALL_MOODS.reduce((acc, m) => acc + dist[m], 0);
  if (moodTotal === 0) return null;

  // Dominant for the caption.
  const dominant = ALL_MOODS.reduce<Mood>(
    (best, m) => (dist[m] > dist[best] ? m : best),
    'joy',
  );

  return (
    <div>
      <p className="mb-2 text-xs text-stamp-ink/55">감정 분포</p>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {ALL_MOODS.map((m) => {
          if (dist[m] === 0) return null;
          const pct = (dist[m] / moodTotal) * 100;
          return (
            <div
              key={m}
              className={MOOD_BG[m]}
              style={{ width: `${pct}%` }}
              title={`${moodLabel(m)} ${dist[m]}`}
              aria-label={`${moodLabel(m)} ${dist[m]}개`}
            />
          );
        })}
      </div>
      <p className="mt-2 text-xs text-stamp-ink/60">
        가장 많은 감정:{' '}
        <span className="font-medium text-stamp-ink">{moodLabel(dominant)}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly distribution — small horizontal bars, newest first.
// ---------------------------------------------------------------------------

function MonthlyBars({ stamps }: { stamps: Stamp[] }) {
  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stamps) {
      const ym = s.date.slice(0, 7);
      map.set(ym, (map.get(ym) ?? 0) + 1);
    }
    // Sort descending by month, take up to 6 months
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 6);
  }, [stamps]);

  if (monthly.length === 0) return null;
  const maxCount = Math.max(...monthly.map(([, n]) => n));

  return (
    <div>
      <p className="mb-2 text-xs text-stamp-ink/55">월별 빈도</p>
      <ul className="flex flex-col gap-1">
        {monthly.map(([ym, count]) => {
          const [year, month] = ym.split('-');
          const pct = (count / maxCount) * 100;
          return (
            <li key={ym} className="flex items-center gap-2 text-xs">
              <span className="w-14 shrink-0 text-stamp-ink/60">
                {Number(year)}.{Number(month)}
              </span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-stamp-ink/5">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-stamp-ink/35"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right text-stamp-ink/50">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Companion top list — for "감정 때 함께한 사람" or "사람과 자주 같이"
// ---------------------------------------------------------------------------

function CompanionTopList({
  title,
  pairs,
}: {
  title: string;
  pairs: Array<[string, number]>;
}) {
  if (pairs.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs text-stamp-ink/55">{title}</p>
      <ul className="flex flex-wrap gap-1.5">
        {pairs.map(([name, count]) => (
          <li
            key={name}
            className="inline-flex items-center gap-1.5 rounded-full bg-stamp-ink/10 px-3 py-1 text-xs text-stamp-ink"
          >
            <span className="font-medium">{name}</span>
            <span className="text-stamp-ink/50">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SearchStats({
  stamps,
  selectedCompanions,
  selectedMoods,
}: SearchStatsProps) {
  const hasCompanions = selectedCompanions.length > 0;
  const hasMoods = selectedMoods.length > 0;
  const isSingleCompanion = selectedCompanions.length === 1;
  const isSingleMood = selectedMoods.length === 1;

  // 사람 1명만 선택했을 때: 그 사람과 자주 같이 본 사람 (co-occurrence)
  const cooccur = useMemo(() => {
    if (!isSingleCompanion || hasMoods) return [];
    const me = selectedCompanions[0];
    const counts = new Map<string, number>();
    for (const s of stamps) {
      for (const c of s.companions ?? []) {
        if (c === me) continue;
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [stamps, isSingleCompanion, hasMoods, selectedCompanions]);

  // 감정 1개만 선택했을 때: 그 감정 때 자주 같이 있던 사람 Top
  const topCompanions = useMemo(() => {
    if (!isSingleMood || hasCompanions) return [];
    const counts = new Map<string, number>();
    for (const s of stamps) {
      for (const c of s.companions ?? []) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [stamps, isSingleMood, hasCompanions]);

  // 사람 1명만 선택했을 때 메타: 평균 간격
  const meta = useMemo(() => {
    if (!isSingleCompanion || hasMoods) return null;
    if (stamps.length < 2) return null;
    const dates = stamps.map((s) => s.date).sort();
    const first = new Date(dates[0]);
    const last = new Date(dates[dates.length - 1]);
    const spanDays = Math.floor(
      (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
    );
    const avgInterval = Math.max(
      1,
      Math.floor(spanDays / Math.max(1, stamps.length - 1)),
    );
    return { count: stamps.length, avgInterval };
  }, [stamps, isSingleCompanion, hasMoods]);

  // 너무 적은 데이터에선 통계 자체를 숨김 (해석이 무의미)
  if (stamps.length < 2) return null;

  // 어떤 카드도 표시할 게 없으면 (예: 빈 필터) 숨김 — 호출자가 보장하지만 방어
  const willRenderMood = !hasMoods; // 감정 미선택 시만 감정 분포 의미
  const willRenderMonthly = true; // 항상
  const willRenderCooccur = cooccur.length > 0;
  const willRenderTop = topCompanions.length > 0;
  const willRenderMeta = meta !== null;

  if (
    !willRenderMood &&
    !willRenderMonthly &&
    !willRenderCooccur &&
    !willRenderTop &&
    !willRenderMeta
  ) {
    return null;
  }

  return (
    <section className="mb-6 flex flex-col gap-4 rounded-md border border-stamp-ink/10 bg-white/40 p-4">
      {willRenderMood && <MoodDistributionBar stamps={stamps} />}
      {willRenderMonthly && <MonthlyBars stamps={stamps} />}
      {willRenderCooccur && (
        <CompanionTopList title="자주 같이" pairs={cooccur} />
      )}
      {willRenderTop && (
        <CompanionTopList
          title={`${moodLabel(selectedMoods[0])} 때 함께한`}
          pairs={topCompanions}
        />
      )}
      {willRenderMeta && meta && (
        <p className="text-xs text-stamp-ink/55">
          총 {meta.count}번 · 평균 {meta.avgInterval}일 간격
        </p>
      )}
      {/* MOOD_DOT은 향후 단일 감정 카드 등에서 재사용 가능 — 일단 미사용 */}
      {false && <span className={MOOD_DOT.joy} />}
    </section>
  );
}
