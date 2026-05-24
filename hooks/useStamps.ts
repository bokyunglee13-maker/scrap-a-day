'use client';

// hooks/useStamps.ts
// Live query for all active stamps in a given month. Returns:
//   undefined  → still loading (initial Dexie subscription)
//   Stamp[]    → loaded (empty array = no stamps that month)
//
// Auto re-fires on any write to db.stamps (Dexie observability).

import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '@/lib/db';
import type { Stamp } from '@/types';

export function useStampsByMonth(
  year: number,
  month1to12: number,
): Stamp[] | undefined {
  return useLiveQuery(async () => {
    const mm = String(month1to12).padStart(2, '0');
    const lower = `${year}-${mm}-00`;
    const upper = `${year}-${mm}-32`;
    return db.stamps
      .where('date')
      .between(lower, upper, false, false)
      .and((s) => s.deletedAt === null)
      .toArray();
  }, [year, month1to12]);
}
