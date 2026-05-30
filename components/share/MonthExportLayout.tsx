"use client";

// components/share/MonthExportLayout.tsx
// Phase 6 polish — dedicated layout for the monthly PNG export.
//
// Why a separate layout (not just capturing MonthBoard):
//   - Needs '2026년 5월' header + signature footer that aren't on the live page
//   - Needs fixed export width (720px) for consistent PNG output across devices
//   - Lets us tune typography / spacing for a 'poster' feel without disturbing
//     the responsive in-app calendar
//
// Reuses the existing Stamp / EmptyStamp components, so the painted-teeth and
// special-day decorations the user worked on come through to the PNG exactly
// as they appear in the app.
//
// Bug fix (post Phase 6 mark): stamps are now passed in as a prop instead of
// fetched via useLiveQuery. Reason — useLiveQuery resolves asynchronously,
// and the parent's toPng call was firing before the data arrived, producing a
// PNG full of empty cells. The parent (ExportMonth) now fetches once up-front
// and only mounts this layout when the data is in hand.

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDaysInMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Stamp as StampComponent, EmptyStamp } from "@/components/stamp/Stamp";
import type { Stamp } from "@/types";

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const EXPORT_WIDTH = 720; // px — locked so the PNG is consistent across devices

interface MonthExportLayoutProps {
  year: number;
  month: number; // 1-12
  /** Pre-fetched stamps for this month (deletedAt === null already filtered).
   *  Passing as a prop guarantees the data is ready before render — critical
   *  for the offscreen toPng capture. */
  stamps: Stamp[];
}

export function MonthExportLayout({ year, month, stamps }: MonthExportLayoutProps) {
  const monthAnchor = new Date(year, month - 1, 1);

  // 7×N Monday-start grid covering the whole month.
  const cells = (() => {
    const monthStart = startOfMonth(monthAnchor);
    const monthEnd = endOfMonth(monthAnchor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  })();

  const stampByIso = new Map<string, Stamp>();
  for (const s of stamps) stampByIso.set(s.date, s);

  const totalDays = getDaysInMonth(monthAnchor);
  const filledCount = stamps.length;
  const monthIndex0 = month - 1;

  return (
    <div
      className="bg-stamp-paper"
      style={{ width: EXPORT_WIDTH, padding: 40 }}
    >
      {/* Header — large year+month, dotted divider, signature wordmark.
          font-serif still tagged but now aliased to Paperlogy globally. */}
      <header className="text-center">
        <h1 className="font-serif text-stamp-ink" style={{ fontSize: 44, lineHeight: 1.1 }}>
          {year}년 {month}월
        </h1>
        <div
          className="mx-auto mt-3"
          style={{
            width: 80,
            height: 1,
            borderTop: "1px dashed rgba(75, 21, 40, 0.3)",
          }}
        />
        <p
          className="mt-3 font-sans text-stamp-ink/40"
          style={{ fontSize: 11, letterSpacing: "0.35em" }}
        >
          SCRAP · A · DAY
        </p>
      </header>

      {/* Weekday header */}
      <div
        className="mt-8 grid grid-cols-7 text-center font-sans text-stamp-ink/55"
        style={{ gap: 8, fontSize: 12 }}
      >
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ paddingBottom: 4 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Stamp grid — reuses Stamp/EmptyStamp at size='full' so painted teeth
          + special-day decorations come through to the PNG exactly. Per-cell
          width comes from the grid track (auto-1fr × 7). */}
      <div
        className="grid grid-cols-7"
        style={{ gap: 8 }}
      >
        {cells.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const isOtherMonth = d.getMonth() !== monthIndex0;
          if (isOtherMonth) {
            return <div key={iso} className="aspect-[3/4]" aria-hidden />;
          }
          const stamp = stampByIso.get(iso);
          if (stamp) {
            return (
              <div key={iso} className="block aspect-[3/4] w-full">
                <StampComponent stamp={stamp} size="full" showDate showMood />
              </div>
            );
          }
          return (
            <div key={iso} className="block aspect-[3/4] w-full">
              <EmptyStamp date={iso} size="full" />
            </div>
          );
        })}
      </div>

      {/* Footer — gentle status line + signature */}
      <footer className="mt-10 text-center">
        <p
          className="font-serif text-stamp-ink/70"
          style={{ fontSize: 16 }}
        >
          {filledCount} / {totalDays}일 채웠어요
        </p>
        <p
          className="mt-2 font-sans text-stamp-ink/35"
          style={{ fontSize: 10, letterSpacing: "0.2em" }}
        >
          scrap-a-day
        </p>
      </footer>
    </div>
  );
}
