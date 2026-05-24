'use client';

// hooks/useStamp.ts
// Live query for a single date's active stamp. Returns:
//   undefined  → loading
//   null       → loaded, no active stamp for that date
//   Stamp      → loaded, found
//
// Re-fires whenever the underlying row mutates.

import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/lib/db';
import type { Stamp } from '@/types';

export function useStampByDate(date: string): Stamp | null | undefined {
  return useLiveQuery(async () => {
    const stamp = await db.stamps
      .where('date')
      .equals(date)
      .and((s) => s.deletedAt === null)
      .first();
    return stamp ?? null;
  }, [date]);
}
