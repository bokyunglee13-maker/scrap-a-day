"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Stamp, EmptyStamp } from "@/components/stamp/Stamp";
import type { Stamp as StampRecord } from "@/types";
import { cn } from "@/lib/utils";
import {
  isPastMonth,
  REGISTRATION_BLOCKED_MESSAGE,
} from "@/lib/dateGuards";

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

  // NOTE on wrapper classes:
  // We deliberately do NOT use `items-center` on these flex columns.
  // Stamps and EmptyStamps use size="full" (= w-full) in the calendar so
  // each one fills its grid cell. In a flex column, `items-center` is
  // `align-items: center`, which lets children fit their content width —
  // and a child with `w-full` referencing its (auto-sized) parent then
  // collapses to 0. Default `align-items: stretch` makes children take
  // the full cross-axis width, which is what we want here.

  // Future date: muted EmptyStamp, tap → toast only.
  if (isFuture) {
    return (
      <div className="flex flex-col gap-1 opacity-30">
        <EmptyStamp
          date={iso}
          size="full"
          isToday={false}
          onClick={() => toast(REGISTRATION_BLOCKED_MESSAGE.future)}
        />
      </div>
    );
  }

  // Filled stamp — always viewable, even in past months.
  if (stamp !== null) {
    return (
      <div className="flex flex-col">
        <Stamp
          stamp={stamp}
          size="full"
          showDate
          showMood
          onClick={() => router.push(`/stamp/${stamp.date}`)}
        />
      </div>
    );
  }

  // Past-month + empty: blocked from new registration (warm toast only).
  // User can still tap to feel a response — just no /new navigation.
  if (isPastMonth(iso)) {
    return (
      <div className="flex flex-col gap-1 opacity-40">
        <EmptyStamp
          date={iso}
          size="full"
          isToday={false}
          onClick={() => toast(REGISTRATION_BLOCKED_MESSAGE.pastMonth)}
        />
      </div>
    );
  }

  // Empty past-in-this-month or today cell: registerable.
  return (
    <div className="flex flex-col gap-1">
      <EmptyStamp
        date={iso}
        size="full"
        isToday={isToday}
        onClick={() => router.push(`/new?date=${iso}`)}
      />
      {isToday && todayHint && (
        <span
          className={cn(
            "mt-0.5 text-center font-sans text-[10px] leading-tight md:text-xs",
            // whitespace-pre-line honors the explicit \n in lib/hooks.ts so the
            // hint renders on the intended 2-3 lines instead of auto-wrapping
            // mid-syllable. font-medium + full-opacity mood-joy is the 'a bit
            // darker' the user asked for without introducing a new color token.
            "whitespace-pre-line font-medium text-mood-joy",
          )}
        >
          {todayHint}
        </span>
      )}
    </div>
  );
}
