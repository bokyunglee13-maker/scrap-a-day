"use client";

import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MonthHeaderProps {
  year: number;
  month: number; // 1-12
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrent: boolean;
}

export function MonthHeader({
  year,
  month,
  onPrev,
  onNext,
  onToday,
  isCurrent,
}: MonthHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="이전 달"
          className="rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
          {year}년 {month}월
        </h1>
        <button
          type="button"
          onClick={onNext}
          aria-label="다음 달"
          className="rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToday}
          aria-label="오늘로 이동"
          className={cn(
            "rounded-sm px-2 py-1 font-sans text-sm text-stamp-ink/60 transition-opacity hover:bg-stamp-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isCurrent && "pointer-events-none opacity-0",
          )}
        >
          오늘
        </button>
        <Link
          href="/settings"
          aria-label="설정"
          className="rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </header>
  );
}
