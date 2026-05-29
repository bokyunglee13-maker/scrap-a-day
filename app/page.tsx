"use client";

import { useEffect, useRef } from "react";
import { useCurrentMonth } from "@/hooks/useCurrentMonth";
import { recordDailyVisit } from "@/lib/usage";
import { cleanExpiredTrash } from "@/lib/trash";
import { MonthHeader } from "@/components/calendar/MonthHeader";
import { MonthBoard } from "@/components/calendar/MonthBoard";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { BackupNag } from "@/components/pwa/BackupNag";
import { RetrospectCard } from "@/components/retrospect/RetrospectCard";
import { ExportMonth } from "@/components/share/ExportMonth";

export default function HomePage() {
  const { year, month, goPrev, goNext, goToday, isCurrent } = useCurrentMonth();

  // Ref to the calendar board DOM node for one-tap month PNG export.
  const boardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // App-load housekeeping (fire-and-forget):
    //  - recordDailyVisit: usage tracking for the retrospective (PRD §12.3)
    //  - cleanExpiredTrash: permanently delete >30-day-trashed stamps (PRD §07)
    void recordDailyVisit();
    void cleanExpiredTrash();
  }, []);

  return (
    <>
      {/* PWA install nudge — hides when installed or dismissed (PRD §15.5.1). */}
      <InstallBanner />

      <main className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <MonthHeader
              year={year}
              month={month}
              onPrev={goPrev}
              onNext={goNext}
              onToday={goToday}
              isCurrent={isCurrent}
            />
          </div>
          {/* Side-by-side with the settings cog (which lives inside MonthHeader). */}
          <ExportMonth targetRef={boardRef} year={year} month={month} />
        </div>

        {/* Wrap the board in a ref-able div so ExportMonth has a real node. */}
        <div ref={boardRef} className="mt-6 bg-stamp-paper">
          <MonthBoard year={year} month={month} />
        </div>

        {/* Monthly retrospective — empty state handled internally. */}
        <RetrospectCard year={year} month={month} />

        {/* "Back up your data" nudge — moved to the bottom so the calendar
            remains the dominant element on the page (user feedback). Still
            renders only when null/stale; otherwise silent. */}
        <BackupNag />
      </main>
    </>
  );
}
