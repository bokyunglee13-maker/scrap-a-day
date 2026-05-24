"use client";

import { useEffect } from "react";
import { useCurrentMonth } from "@/hooks/useCurrentMonth";
import { recordDailyVisit } from "@/lib/usage";
import { MonthHeader } from "@/components/calendar/MonthHeader";
import { MonthBoard } from "@/components/calendar/MonthBoard";

export default function HomePage() {
  const { year, month, goPrev, goNext, goToday, isCurrent } = useCurrentMonth();

  useEffect(() => {
    void recordDailyVisit();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <MonthHeader
        year={year}
        month={month}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        isCurrent={isCurrent}
      />
      <div className="mt-6">
        <MonthBoard year={year} month={month} />
      </div>
    </main>
  );
}
