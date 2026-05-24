"use client";

// app/settings/usage/page.tsx
// Phase 5 — Usage stats viewer. PRD §12.3.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

import { db } from "@/lib/db";
import { getUsageForMonth } from "@/lib/usage";
import type { UsageDay } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Stats {
  visitedThisMonth: number;
  registeredThisMonth: number;
  failedThisMonth: number;
  successRate: number | null; // null if total === 0
  visitedLast7Days: number;
}

export default function UsagePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [version, setVersion] = useState(0); // bumps after a clear
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const monthRes = await getUsageForMonth(year, month);
      const monthRows: UsageDay[] = monthRes.ok ? monthRes.value : [];

      const visited = monthRows.length;
      const registered = monthRows.reduce(
        (acc, r) => acc + r.registeredStamps,
        0,
      );
      const failed = monthRows.reduce((acc, r) => acc + r.failedAttempts, 0);
      const total = registered + failed;

      // Last 7 days: walk 7 calendar days back, count visited rows.
      let last7 = 0;
      try {
        const keys = new Set<string>();
        for (let i = 0; i < 7; i++) {
          keys.add(format(subDays(now, i), "yyyy-MM-dd"));
        }
        const all = await db.usage.toArray();
        last7 = all.filter((r) => keys.has(r.date)).length;
      } catch {
        last7 = 0;
      }

      if (!cancelled) {
        setStats({
          visitedThisMonth: visited,
          registeredThisMonth: registered,
          failedThisMonth: failed,
          successRate:
            total === 0 ? null : Math.round((registered / total) * 100),
          visitedLast7Days: last7,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const handleClear = async () => {
    setClearing(true);
    try {
      await db.usage.clear();
      setClearOpen(false);
      setVersion((v) => v + 1);
    } catch {
      toast.error("잠시 후 다시 시도해주세요");
    } finally {
      setClearing(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="설정으로"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
          사용 통계
        </h1>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <StatCard
          label="이번 달 방문일"
          value={stats?.visitedThisMonth ?? "—"}
          suffix="일"
        />
        <StatCard
          label="이번 달 등록"
          value={stats?.registeredThisMonth ?? "—"}
          suffix="장"
        />
        <StatCard
          label="이번 달 실패"
          value={stats?.failedThisMonth ?? "—"}
          suffix="회"
        />
        {stats && stats.successRate !== null ? (
          <StatCard
            label="등록 성공률"
            value={stats.successRate}
            suffix="%"
          />
        ) : (
          <StatCard label="등록 성공률" value="—" />
        )}
        <StatCard
          label="최근 7일 방문일"
          value={stats?.visitedLast7Days ?? "—"}
          suffix="일"
        />
      </section>

      <div className="mt-8">
        <Button
          type="button"
          variant="destructive"
          className="h-12 w-full"
          onClick={() => setClearOpen(true)}
        >
          전체 삭제
        </Button>
      </div>

      <Dialog
        open={clearOpen}
        onOpenChange={(o) => !clearing && setClearOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용 통계를 모두 삭제할까요?</DialogTitle>
            <DialogDescription>되돌릴 수 없어요.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => setClearOpen(false)}
              disabled={clearing}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12"
              onClick={handleClear}
              disabled={clearing}
            >
              {clearing ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="rounded-sm bg-stamp-paper p-4 ring-1 ring-stamp-ink/10">
      <p className="font-sans text-xs text-stamp-ink/50">{label}</p>
      <p className="mt-1 font-serif text-2xl font-medium text-stamp-ink">
        {value}
        {suffix ? (
          <span className="ml-0.5 font-sans text-sm text-stamp-ink/60">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}
