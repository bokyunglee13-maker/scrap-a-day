'use client';

// hooks/useCurrentMonth.ts
// View-state for the calendar month navigation. Pure React state — no DB.
//
// Month is 1-12 (NOT 0-indexed Date.getMonth()) to match `month1to12` used
// throughout lib/stamps.ts and lib/usage.ts.

import { useCallback, useMemo, useState } from 'react';

export interface CurrentMonth {
  year: number;
  month: number; // 1-12
  goPrev: () => void;
  goNext: () => void;
  goToday: () => void;
  isCurrent: boolean;
}

function thisMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function useCurrentMonth(
  initial?: { year: number; month: number },
): CurrentMonth {
  const [{ year, month }, setState] = useState(() => initial ?? thisMonth());

  const goPrev = useCallback(() => {
    setState(({ year: y, month: m }) =>
      m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 },
    );
  }, []);

  const goNext = useCallback(() => {
    setState(({ year: y, month: m }) =>
      m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 },
    );
  }, []);

  const goToday = useCallback(() => {
    setState(thisMonth());
  }, []);

  const isCurrent = useMemo(() => {
    const t = thisMonth();
    return t.year === year && t.month === month;
  }, [year, month]);

  return { year, month, goPrev, goNext, goToday, isCurrent };
}
