"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Stamp, EmptyStamp } from "@/components/stamp/Stamp";
import type { Stamp as StampRecord } from "@/types";
import { cn } from "@/lib/utils";

interface DayCellProps {
  date: Date;
  stamp: StampRecord | null;
  isToday: boolean;
  isFuture: boolean;
  isOtherMonth: boolean;
  /** Optional hint text shown beneath today's empty cell only. */
  todayHint?: string;
}

export function DayCell({
  date,
  stamp,
  isToday,
  isFuture,
  isOtherMonth,
  todayHint,
}: DayCellProps) {
  const router = useRouter();
  const iso = format(date, "yyyy-MM-dd");

  // Other-month placeholder: keep the grid aligned, no interaction.
  if (isOtherMonth) {
    return <div aria-hidden className="aspect-[3/4]" />;
  }

  // Future date: muted EmptyStamp, tap → toast only.
  if (isFuture) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="opacity-30">
          <EmptyStamp
            date={iso}
            size="md"
            isToday={false}
            onClick={() => toast("내일을 기다려요")}
          />
        </div>
      </div>
    );
  }

  // Filled stamp.
  if (stamp !== null) {
    return (
      <div className="flex flex-col items-center">
        <Stamp
          stamp={stamp}
          size="md"
          showDate
          showMood
          onClick={() => router.push(`/stamp/${stamp.date}`)}
        />
      </div>
    );
  }

  // Empty past/today cell.
  return (
    <div className="flex flex-col items-center gap-1">
      <EmptyStamp
        date={iso}
        size="md"
        isToday={isToday}
        onClick={() => router.push(`/new?date=${iso}`)}
      />
      {isToday && todayHint && (
        <span
          className={cn(
            "mt-0.5 text-center font-sans text-[10px] leading-tight md:text-xs",
            "text-mood-joy/80",
          )}
        >
          {todayHint}
        </span>
      )}
    </div>
  );
}
