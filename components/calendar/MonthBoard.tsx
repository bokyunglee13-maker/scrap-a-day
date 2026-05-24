"use client";

import { useEffect, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDaysInMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useStampsByMonth } from "@/hooks/useStamps";
import { getConsecutiveEmptyDays } from "@/lib/usage";
import { getEmptyCellMessage } from "@/lib/hooks";
import type { Stamp } from "@/types";
import { DayCell } from "./DayCell";

interface MonthBoardProps {
  year: number;
  month: number; // 1-12
}

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function MonthBoard({ year, month }: MonthBoardProps) {
  const stamps = useStampsByMonth(year, month);
  const today = useMemo(() => new Date(), []);
  const monthAnchor = useMemo(() => new Date(year, month - 1, 1), [year, month]);

  // 7×N grid (Monday-start) covering the whole month.
  const cells = useMemo(() => {
    const monthStart = startOfMonth(monthAnchor);
    const monthEnd = endOfMonth(monthAnchor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [monthAnchor]);

  // Lookup table: iso → stamp.
  const stampByIso = useMemo(() => {
    const map = new Map<string, Stamp>();
    if (stamps) {
      for (const s of stamps) map.set(s.date, s);
    }
    return map;
  }, [stamps]);

  // First-use heuristic per Phase 2 scope: no active stamps in the currently
  // viewed month AND we're viewing the current month. A wider cross-month
  // check is Phase 5 polish.
  const isViewingCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;
  const isFirstUse = stamps !== undefined && stamps.length === 0 && isViewingCurrentMonth;

  // Empty streak for hook-message selection (today's cell hint only).
  const [emptyStreak, setEmptyStreak] = useState<number>(0);
  useEffect(() => {
    if (!isViewingCurrentMonth) {
      setEmptyStreak(0);
      return;
    }
    let cancelled = false;
    void getConsecutiveEmptyDays().then((res) => {
      if (cancelled) return;
      if (res.ok) setEmptyStreak(res.value);
    });
    return () => {
      cancelled = true;
    };
  }, [isViewingCurrentMonth, stamps]);

  // Compute today's hint once.
  const todayHint = useMemo(() => {
    if (!isViewingCurrentMonth) return undefined;
    return getEmptyCellMessage({
      cellDate: today,
      today,
      isFirstUse,
      emptyStreak,
    });
  }, [isViewingCurrentMonth, today, isFirstUse, emptyStreak]);

  // Loading skeleton: muted boxes matching cell footprint.
  if (stamps === undefined) {
    return (
      <div>
        <div className="grid grid-cols-7 gap-2 text-center font-sans text-xs text-stamp-ink/50">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {cells.map((d) => (
            <div
              key={d.toISOString()}
              className="aspect-[3/4] animate-pulse rounded-sm bg-stamp-ink/5"
            />
          ))}
        </div>
      </div>
    );
  }

  const monthIndex0 = month - 1;
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const filledThisMonth = stamps.length;
  const totalDays = getDaysInMonth(monthAnchor);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 text-center font-sans text-xs text-stamp-ink/50">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const isOtherMonth = d.getMonth() !== monthIndex0;
          const isToday = isSameDay(d, today);
          const cellMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const isFuture = cellMidnight.getTime() > todayMidnight.getTime();
          const stamp = stampByIso.get(iso) ?? null;
          return (
            <DayCell
              key={iso}
              date={d}
              stamp={stamp}
              isToday={isToday}
              isFuture={isFuture}
              isOtherMonth={isOtherMonth}
              todayHint={isToday ? todayHint : undefined}
            />
          );
        })}
      </div>

      <p className="mt-6 text-center font-sans text-xs text-stamp-ink/40">
        {filledThisMonth} / {totalDays}일
      </p>
    </div>
  );
}
