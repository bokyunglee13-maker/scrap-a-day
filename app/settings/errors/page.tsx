"use client";

// app/settings/errors/page.tsx
// Phase 5 — Error log viewer. PRD §12.2.

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

import { db } from "@/lib/db";
import type { ErrorLog } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ErrorsPage() {
  const errors = useLiveQuery<ErrorLog[]>(
    () => db.errors.orderBy("timestamp").reverse().toArray(),
    [],
  );

  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await db.errors.clear();
      setClearOpen(false);
    } catch {
      toast.error("잠시 후 다시 시도해주세요");
    } finally {
      setClearing(false);
    }
  };

  const isLoading = errors === undefined;
  const isEmpty = !isLoading && errors.length === 0;

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
          에러 로그
        </h1>
      </header>

      <p className="mt-3 font-sans text-xs text-stamp-ink/50">
        최대 500개 · 30일 후 자동 삭제
      </p>

      <section className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-sm bg-stamp-ink/5"
              />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="py-12 text-center font-sans text-sm text-stamp-ink/50">
            에러 로그가 비어있어요
          </p>
        ) : (
          <ul className="space-y-2">
            {errors.map((e) => (
              <ErrorRow key={e.id} entry={e} />
            ))}
          </ul>
        )}
      </section>

      {!isEmpty && !isLoading && (
        <div className="mt-6">
          <Button
            type="button"
            variant="destructive"
            className="h-12 w-full"
            onClick={() => setClearOpen(true)}
          >
            전체 삭제
          </Button>
        </div>
      )}

      <Dialog
        open={clearOpen}
        onOpenChange={(o) => !clearing && setClearOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>에러 로그를 모두 삭제할까요?</DialogTitle>
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

function ErrorRow({ entry }: { entry: ErrorLog }) {
  const ts = formatTimestamp(entry.timestamp);
  const hasDetails = !!entry.stack || !!entry.context;

  return (
    <li className="rounded-sm border border-stamp-ink/10 bg-white/40 p-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-stamp-ink/50">{ts}</span>
        <span className="rounded-sm bg-stamp-ink/10 px-1.5 py-0.5 font-mono text-xs text-stamp-ink/70">
          {entry.source}
        </span>
      </div>
      <p className="mt-1 truncate font-sans text-sm text-stamp-ink">
        {entry.message}
      </p>
      {hasDetails ? (
        <details className="mt-2 group">
          <summary className="cursor-pointer font-sans text-xs text-stamp-ink/50 select-none">
            상세
          </summary>
          {entry.stack ? (
            <pre className="mt-1 max-h-48 overflow-auto rounded-sm bg-stamp-ink/5 p-2 font-mono text-[10px] leading-snug text-stamp-ink/70 whitespace-pre-wrap">
              {entry.stack}
            </pre>
          ) : null}
          {entry.context ? (
            <pre className="mt-1 max-h-32 overflow-auto rounded-sm bg-stamp-ink/5 p-2 font-mono text-[10px] leading-snug text-stamp-ink/70 whitespace-pre-wrap">
              {JSON.stringify(entry.context, null, 2)}
            </pre>
          ) : null}
        </details>
      ) : null}
    </li>
  );
}

function formatTimestamp(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da} ${h}:${mi}`;
}
