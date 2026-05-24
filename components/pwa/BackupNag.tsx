"use client";

// components/pwa/BackupNag.tsx
// Phase 5 — gentle nudge to back up. PRD §15.5.1 second mitigation for iOS ITP.
//
// Visibility ladder:
//   - never backed up → "백업한 적이 없어요" + link
//   - >= 5 days since last backup → "마지막 백업이 N일 전이에요" + link
//   - otherwise → render null

import { useEffect, useState } from "react";
import Link from "next/link";

import { daysSinceBackup, getSettings } from "@/lib/settings";

const NAG_THRESHOLD_DAYS = 5;

type Variant =
  | { kind: "never" }
  | { kind: "stale"; days: number }
  | { kind: "fresh" }
  | { kind: "loading" };

export function BackupNag() {
  const [variant, setVariant] = useState<Variant>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getSettings();
      if (cancelled) return;
      if (!res.ok) {
        // Render the "never" copy — failing to read settings shouldn't hide the nag.
        setVariant({ kind: "never" });
        return;
      }
      const last = res.value.lastBackupAt;
      if (!last) {
        setVariant({ kind: "never" });
        return;
      }
      const days = daysSinceBackup(last);
      if (days === null) {
        setVariant({ kind: "never" });
        return;
      }
      if (days >= NAG_THRESHOLD_DAYS) {
        setVariant({ kind: "stale", days });
      } else {
        setVariant({ kind: "fresh" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (variant.kind === "loading" || variant.kind === "fresh") return null;

  const message =
    variant.kind === "never"
      ? "백업한 적이 없어요"
      : `마지막 백업이 ${variant.days}일 전이에요`;

  return (
    <div className="mx-auto mt-3 max-w-md px-4">
      <Link
        href="/settings/backup"
        className="flex items-center justify-between gap-3 rounded-sm border border-stamp-ink/10 bg-mood-joy/15 px-3 py-2 text-stamp-ink/80 hover:bg-mood-joy/25"
      >
        <span className="font-sans text-sm">{message}</span>
        <span className="font-sans text-sm text-stamp-ink/60 underline underline-offset-2">
          지금 백업하기
        </span>
      </Link>
    </div>
  );
}
