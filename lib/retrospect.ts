// lib/retrospect.ts
// Lightweight monthly retrospective per PRD §07 (MVP scope — full charts are v1.1).
//
// Returns:
//   - filledCount / totalDays in the month
//   - mood distribution { joy, calm, serene, blue, flutter, none }
//   - dominantMood (highest count, or null if none)
//
// All computed from getStampsByMonth — no new DB indexes needed.

import { getDaysInMonth } from "date-fns";
import { getStampsByMonth } from "@/lib/stamps";
import { ok, err, type Result } from "@/lib/result";
import type { Mood } from "@/types";

export interface MoodDistribution {
  joy: number;
  calm: number;
  serene: number;
  blue: number;
  flutter: number;
  none: number;
}

export interface MonthRetrospect {
  year: number;
  month: number; // 1-12
  filledCount: number;
  totalDays: number;
  moodDistribution: MoodDistribution;
  dominantMood: Mood | null;
}

const MOOD_LABEL: Record<Mood, string> = {
  joy: "기쁨",
  calm: "평온",
  serene: "차분",
  blue: "우울",
  flutter: "설렘",
};

export function moodLabel(mood: Mood): string {
  return MOOD_LABEL[mood];
}

export async function getMonthRetrospect(
  year: number,
  month1to12: number,
): Promise<Result<MonthRetrospect>> {
  const stampsResult = await getStampsByMonth(year, month1to12);
  if (!stampsResult.ok) return err(stampsResult.error);

  const stamps = stampsResult.value;
  const dist: MoodDistribution = {
    joy: 0,
    calm: 0,
    serene: 0,
    blue: 0,
    flutter: 0,
    none: 0,
  };
  for (const s of stamps) {
    if (s.mood === null) {
      dist.none += 1;
    } else {
      dist[s.mood] += 1;
    }
  }

  // Dominant: most-counted non-'none' mood. Tie-break: insertion order of
  // MOOD_LABEL keys (joy > calm > serene > blue > flutter), which gives a
  // stable, predictable answer when two moods tie.
  let dominantMood: Mood | null = null;
  let bestCount = 0;
  for (const m of Object.keys(MOOD_LABEL) as Mood[]) {
    if (dist[m] > bestCount) {
      bestCount = dist[m];
      dominantMood = m;
    }
  }

  const totalDays = getDaysInMonth(new Date(year, month1to12 - 1, 1));

  return ok({
    year,
    month: month1to12,
    filledCount: stamps.length,
    totalDays,
    moodDistribution: dist,
    dominantMood,
  });
}
