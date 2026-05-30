"use client";

// components/share/SearchExportLayout.tsx
// Post Phase 6 polish — poster-style PNG layout for search results.
//
// What it renders:
//   ┌──────────────────────────────────────┐
//   │   <title from filters>               │   e.g. "스폰지클럽과 함께한 날"
//   │   <caption: filter chips + count>    │   e.g. "설렘 · 6개 · 최근 1개월"
//   │   ─────                              │   dashed divider
//   │   2026년 5월               (3)       │   month header + count
//   │   [stamp] [stamp] [stamp]            │
//   │   [stamp]                            │
//   │                                       │
//   │   2026년 4월               (2)       │
//   │   [stamp] [stamp]                    │
//   │                                       │
//   │   scrap-a-day                        │   signature
//   └──────────────────────────────────────┘
//
// Why a separate layout: same reasoning as MonthExportLayout — locked
// 720px width for cross-device PNG consistency, separate typography
// scale, and the live search page uses 2/3-col responsive grid which
// would render unpredictably in the export blob.

import { useMemo } from "react";

import { Stamp as StampComponent } from "@/components/stamp/Stamp";
import { moodLabel } from "@/lib/retrospect";
import { RANGE_PRESET_LABEL, type RangePreset } from "@/lib/dateGuards";
import type { Mood, Stamp } from "@/types";

const EXPORT_WIDTH = 720;

interface SearchExportLayoutProps {
  /** Pre-fetched, pre-filtered, newest-first stamps. */
  stamps: Stamp[];
  selectedCompanions: string[];
  selectedMoods: Mood[];
  range: RangePreset;
}

/**
 * Build the export title from the active filters. Falls back gracefully
 * across single / multi / mixed-axis selections so users don't see
 * "undefined과 함께한 날" if they only picked moods, etc.
 */
function buildTitle(companions: string[], moods: Mood[]): string {
  const hasCompanions = companions.length > 0;
  const hasMoods = moods.length > 0;

  if (hasCompanions && hasMoods) {
    return `${companions.join(" · ")}과 함께한 ${moods.map(moodLabel).join(" · ")}`;
  }
  if (hasCompanions) {
    return `${companions.join(" · ")}과 함께한 날`;
  }
  if (hasMoods) {
    return `${moods.map(moodLabel).join(" · ")} 우표`;
  }
  return "검색 결과"; // fallback — caller disables the button when both are empty
}

/**
 * Build the small caption beneath the title: filter chips + count + range.
 * Kept compact so it doesn't compete with the title.
 */
function buildCaption(
  companions: string[],
  moods: Mood[],
  count: number,
  range: RangePreset,
): string {
  const parts: string[] = [];
  if (companions.length > 0) parts.push(companions.join(", "));
  if (moods.length > 0) parts.push(moods.map(moodLabel).join(", "));
  parts.push(`${count}개`);
  parts.push(RANGE_PRESET_LABEL[range]);
  return parts.join(" · ");
}

export function SearchExportLayout({
  stamps,
  selectedCompanions,
  selectedMoods,
  range,
}: SearchExportLayoutProps) {
  const title = buildTitle(selectedCompanions, selectedMoods);
  const caption = buildCaption(
    selectedCompanions,
    selectedMoods,
    stamps.length,
    range,
  );

  // Group by YYYY-MM, preserving descending order (stamps come in
  // newest-first from the parent).
  const groups = useMemo(() => {
    const map = new Map<string, Stamp[]>();
    for (const s of stamps) {
      const ym = s.date.slice(0, 7);
      const arr = map.get(ym);
      if (arr) arr.push(s);
      else map.set(ym, [s]);
    }
    return Array.from(map.entries());
  }, [stamps]);

  return (
    <div
      className="bg-stamp-paper"
      style={{ width: EXPORT_WIDTH, padding: 40 }}
    >
      {/* Header — title + caption + dashed divider */}
      <header className="text-center">
        <h1
          className="font-serif text-stamp-ink"
          style={{ fontSize: 30, lineHeight: 1.2 }}
        >
          {title}
        </h1>
        <p
          className="mt-2 font-sans text-stamp-ink/60"
          style={{ fontSize: 13 }}
        >
          {caption}
        </p>
        <div
          className="mx-auto mt-4"
          style={{
            width: 80,
            height: 1,
            borderTop: "1px dashed rgba(75, 21, 40, 0.3)",
          }}
        />
      </header>

      {/* Month groups */}
      <div className="mt-8 flex flex-col" style={{ gap: 32 }}>
        {groups.map(([ym, monthStamps]) => {
          const [yearStr, monthStr] = ym.split("-");
          const year = Number(yearStr);
          const month = Number(monthStr);
          return (
            <section key={ym}>
              {/* Month header — same style as the live search page */}
              <div
                className="flex items-baseline justify-between border-b border-stamp-ink/15 pb-2"
                style={{ marginBottom: 12 }}
              >
                <span
                  className="font-sans text-stamp-ink/75"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  {year}년 {month}월
                </span>
                <span
                  className="font-sans text-stamp-ink/45"
                  style={{ fontSize: 12 }}
                >
                  {monthStamps.length}개
                </span>
              </div>
              {/* 3-col grid (export width gives plenty of room for 3 cols) */}
              <div
                className="grid grid-cols-3"
                style={{ gap: 8 }}
              >
                {monthStamps.map((s) => (
                  <div key={s.id} className="aspect-[3/4] w-full">
                    <StampComponent stamp={s} size="full" showDate showMood />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer — gentle signature */}
      <footer className="mt-10 text-center">
        <p
          className="font-sans text-stamp-ink/35"
          style={{ fontSize: 10, letterSpacing: "0.2em" }}
        >
          scrap-a-day
        </p>
      </footer>
    </div>
  );
}
