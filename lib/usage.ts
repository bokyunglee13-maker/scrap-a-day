// lib/usage.ts
// Daily usage tracking per PRD §12.3. Feeds the Phase 2.5 hook message selector
// (consecutive-empty-days branches) and Phase 5 stats UI.
//
// All functions follow the same Result<T> + try/catch + logError contract as
// lib/stamps.ts. Date strings are 'yyyy-MM-dd' produced by date-fns.

import { format, subDays } from 'date-fns';

import { db } from '@/lib/db';
import { logError } from '@/lib/errors';
import type { Result } from '@/lib/result';
import type { UsageDay } from '@/types';

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Record that the user opened the app today. No-op if today's row exists.
 */
export async function recordDailyVisit(): Promise<Result<void>> {
  try {
    const today = todayKey();
    await db.transaction('rw', db.usage, async () => {
      const existing = await db.usage.get(today);
      if (!existing) {
        const row: UsageDay = {
          date: today,
          visitedAt: new Date(),
          registeredStamps: 0,
          failedAttempts: 0,
        };
        await db.usage.add(row);
      }
    });
    return { ok: true, value: undefined };
  } catch (e) {
    await logError('recordDailyVisit', e, {});
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Increment the registered-stamps counter for a given date. Creates the row
 * if missing (e.g. midnight cross during a session).
 */
export async function incrementRegistered(date: string): Promise<Result<void>> {
  try {
    await db.transaction('rw', db.usage, async () => {
      const existing = await db.usage.get(date);
      if (!existing) {
        const row: UsageDay = {
          date,
          visitedAt: new Date(),
          registeredStamps: 1,
          failedAttempts: 0,
        };
        await db.usage.add(row);
      } else {
        await db.usage.put({
          ...existing,
          registeredStamps: existing.registeredStamps + 1,
        });
      }
    });
    return { ok: true, value: undefined };
  } catch (e) {
    await logError('incrementRegistered', e, { date });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Increment the failed-attempt counter for a given date. Same upsert semantics.
 */
export async function incrementFailed(date: string): Promise<Result<void>> {
  try {
    await db.transaction('rw', db.usage, async () => {
      const existing = await db.usage.get(date);
      if (!existing) {
        const row: UsageDay = {
          date,
          visitedAt: new Date(),
          registeredStamps: 0,
          failedAttempts: 1,
        };
        await db.usage.add(row);
      } else {
        await db.usage.put({
          ...existing,
          failedAttempts: existing.failedAttempts + 1,
        });
      }
    });
    return { ok: true, value: undefined };
  } catch (e) {
    await logError('incrementFailed', e, { date });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * All usage rows whose `date` is in the given month. Useful for monthly stats.
 */
export async function getUsageForMonth(
  year: number,
  month1to12: number,
): Promise<Result<UsageDay[]>> {
  try {
    const mm = String(month1to12).padStart(2, '0');
    const lower = `${year}-${mm}-00`;
    const upper = `${year}-${mm}-32`;
    const rows = await db.usage
      .where('date')
      .between(lower, upper, false, false)
      .toArray();
    return { ok: true, value: rows };
  } catch (e) {
    await logError('getUsageForMonth', e, { year, month: month1to12 });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Walks back day-by-day from `asOf` (default today) and counts how many
 * consecutive days have NO active stamp AND no usage row showing a
 * registration. Stops at the first day that has either.
 *
 * Capped at 30 to keep the walk cheap — the hook-message ladder doesn't need
 * more granularity than "3+", "7+", "30+".
 *
 * Used by PRD §10.5.1 hook message branches (3-day, 7-day empty streaks).
 */
export async function getConsecutiveEmptyDays(
  asOf: Date = new Date(),
): Promise<Result<number>> {
  const MAX_WALK = 30;
  try {
    let count = 0;
    for (let i = 0; i < MAX_WALK; i++) {
      const day = subDays(asOf, i);
      const key = format(day, 'yyyy-MM-dd');

      const [stamp, usage] = await Promise.all([
        db.stamps
          .where('date')
          .equals(key)
          .and((s) => s.deletedAt === null)
          .first(),
        db.usage.get(key),
      ]);

      const hadActivity =
        !!stamp || (!!usage && usage.registeredStamps > 0);

      if (hadActivity) break;
      count++;
    }
    return { ok: true, value: count };
  } catch (e) {
    await logError('getConsecutiveEmptyDays', e, {});
    return { ok: false, error: 'DB_ERROR' };
  }
}
