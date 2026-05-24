"use client";

// components/retrospect/RetrospectCard.tsx
// Phase 5 — lightweight monthly retrospective (MVP scope per PRD §07).

import { useEffect, useState } from "react";

import {
  getMonthRetrospect,
  moodLabel,
  type MonthRetrospect,
  type MoodDistribution,
} from "@/lib/retrospect";
import type { Mood } from "@/types";
import { useStampsByMonth } from "@/hooks/useStamps";

interface RetrospectCardProps {
  year: number;
  month: number; // 1-12
}

const MOOD_ORDER: Array<keyof MoodDistribution> = [
  "joy",
  "calm",
  "serene",
  "blue",
  "flutter",
  "none",
];

const MOOD_COLOR: Record<keyof MoodDistribution, string> = {
  joy: "bg-mood-joy",
  calm: "bg-mood-calm",
  serene: "bg-mood-serene",
  blue: "bg-mood-blue",
  flutter: "bg-mood-flutter",
  none: "bg-stamp-ink/15",
};

const MOOD_DISPLAY_NAME: Record<keyof MoodDistribution, string> = {
  joy: "기쁨",
  calm: "평온",
  serene: "차분",
  blue: "우울",
  flutter: "설렘",
  none: "감정 없음",
};

export function RetrospectCard({ year, month }: RetrospectCardProps) {
  const [data, setData] = useState<MonthRetrospect | null>(null);

  // Re-render whenever a stamp in this month changes (writes/deletes/etc).
  const stamps = useStampsByMonth(year, month);
  const stampsVersion = stamps?.length ?? -1;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getMonthRetrospect(year, month);
      if (!cancelled && res.ok) setData(res.value);
    })();
    return () => {
      cancelled = true;
    };
  }, [year, month, stampsVersion]);

  if (!data) {
    return (
      <div className="mx-auto mt-6 max-w-md px-4">
        <div className="h-24 animate-pulse rounded-sm bg-stamp-ink/5" />
      </div>
    );
  }

  if (data.filledCount === 0) {
    return (
      <div className="mx-auto mt-6 max-w-md px-4">
        <div className="rounded-sm border border-stamp-ink/10 bg-white/40 px-4 py-3 text-center">
          <p className="font-sans text-sm text-stamp-ink/50">
            이 달은 아직 우표가 없어요
          </p>
        </div>
      </div>
    );
  }

  const total = MOOD_ORDER.reduce(
    (acc, m) => acc + data.moodDistribution[m],
    0,
  );

  return (
    <div className="mx-auto mt-6 max-w-md px-4">
      <div className="rounded-sm border border-stamp-ink/10 bg-white/40 px-4 py-4">
        <h2 className="font-serif text-base font-medium text-stamp-ink">
          이 달의 기록
        </h2>

        <p className="mt-2 font-sans text-sm text-stamp-ink/70">
          채운 날 {data.filledCount} / 총 {data.totalDays}일
        </p>

        {total > 0 ? (
          <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
            {MOOD_ORDER.map((m) => {
              const count = data.moodDistribution[m];
              if (count === 0) return null;
              const pct = (count / total) * 100;
              return (
                <div
                  key={m}
                  className={MOOD_COLOR[m]}
                  style={{ width: `${pct}%` }}
                  title={`${MOOD_DISPLAY_NAME[m]} ${count}`}
                  aria-label={`${MOOD_DISPLAY_NAME[m]} ${count}개`}
                />
              );
            })}
          </div>
        ) : null}

        {data.dominantMood ? (
          <p className="mt-3 font-sans text-sm text-stamp-ink/70">
            가장 많은 감정:{" "}
            <span className="font-medium text-stamp-ink">
              {moodLabel(data.dominantMood as Mood)}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
