// lib/seed.ts
// DEV ONLY. Populate the DB with synthetic stamps so the calendar has
// something to render during local development. NEVER call from production
// code paths.
//
// Rules:
//   - Idempotent-ish: bails if any active stamps already exist.
//   - Uses createStamp() — does NOT touch db.stamps directly.
//   - Photo blobs are synthesized SVG gradients (no real user data, no I/O).

import { format, subDays } from 'date-fns';

import { db } from '@/lib/db';
import { createStamp } from '@/lib/stamps';
import type { Result } from '@/lib/result';
import type { Mood, StampStyle } from '@/types';

const STYLES: StampStyle[] = ['classic', 'minimal', 'polaroid'];
const MOODS: (Mood | null)[] = [
  'joy',
  'calm',
  'serene',
  'blue',
  'flutter',
  null,
];
const MEMOS = [
  '맑은 하루',
  '햇살이 좋았다',
  '커피 한 잔',
  '산책길에서',
  '오늘은 조금 흐림',
  '바람이 차가워',
  '책 한 권',
  '늦은 저녁',
  '',
  '비가 왔어',
  '꽃이 피었네',
  '조용한 오후',
];

// 12 distinct gradient palettes — visually varied stamps.
const PALETTES: Array<[string, string]> = [
  ['#fde68a', '#fb923c'],
  ['#bae6fd', '#38bdf8'],
  ['#fecaca', '#f87171'],
  ['#bbf7d0', '#22c55e'],
  ['#e9d5ff', '#a855f7'],
  ['#fde68a', '#f59e0b'],
  ['#a7f3d0', '#10b981'],
  ['#fbcfe8', '#ec4899'],
  ['#c7d2fe', '#6366f1'],
  ['#fed7aa', '#f97316'],
  ['#d9f99d', '#65a30d'],
  ['#bfdbfe', '#3b82f6'],
];

function synthesizeBlob(index: number): Blob {
  const [from, to] = PALETTES[index % PALETTES.length];
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)" />
  <circle cx="200" cy="200" r="80" fill="white" fill-opacity="0.25" />
</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

/**
 * Insert up to `count` (default 12) synthetic stamps spread across the
 * previous 30 days. No-op if any active stamps already exist. Returns the
 * number actually inserted.
 */
export async function seedDummyData(
  count: number = 12,
): Promise<Result<number>> {
  try {
    const existingActive = await db.stamps
      .filter((s) => s.deletedAt === null)
      .count();
    if (existingActive > 0) {
      return { ok: true, value: 0 };
    }

    const today = new Date();
    let inserted = 0;
    for (let i = 0; i < count; i++) {
      // Spread roughly across the last 30 days. Skip duplicates inside this run.
      const offset = Math.floor((i * 30) / count) + 1; // 1..30, avoid future
      const day = subDays(today, offset);
      const date = format(day, 'yyyy-MM-dd');

      const result = await createStamp({
        date,
        photoBlob: synthesizeBlob(i),
        crop: { x: 0, y: 0, width: 400, height: 400, zoom: 1 },
        memo: MEMOS[i % MEMOS.length],
        mood: MOODS[i % MOODS.length],
        moodVisible: i % 4 !== 0, // mix of visible / hidden
        style: STYLES[i % STYLES.length],
      });

      if (result.ok) {
        inserted++;
      }
      // If DUPLICATE_DATE, just move on — keeps the seed re-runnable per cell.
    }

    return { ok: true, value: inserted };
  } catch {
    // logError is already called by createStamp on its own failures.
    return { ok: false, error: 'DB_ERROR' };
  }
}
