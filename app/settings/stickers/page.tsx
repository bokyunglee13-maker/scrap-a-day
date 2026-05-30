"use client";

// app/settings/stickers/page.tsx
// Phase 2 of the special-day expansion — per-sticker on/off settings page.
// Doubles as a sticker preview page (the user couldn't otherwise see what
// each day's sticker looks like without waiting for that calendar date).
//
// Each row:
//   [preview stamp 80px wide][날짜 + 이름][on/off switch]
//
// Preview uses SpecialDayBadge with forceShow=true so the user sees the
// sticker even on rows they've toggled off — otherwise toggling off would
// make the preview disappear, which is a confusing UX.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { getSettings, updateSettings } from "@/lib/settings";
import {
  SPECIAL_DAY_DISPLAY_DATE,
  SPECIAL_DAY_LABEL,
  SPECIAL_DAY_ORDER,
  type SpecialDay,
} from "@/lib/specialDays";
import { SpecialDayBadge } from "@/components/stamp/SpecialDayBadge";
import { cn } from "@/lib/utils";

/**
 * Small preview tile — mimics the EmptyStamp visual (white background,
 * dotted inner border, simple perforation) so the user sees what the
 * sticker will look like in their actual calendar. forceShow=true so the
 * preview ignores the user's disabled list for THIS row.
 */
function StickerPreview({ day }: { day: SpecialDay }) {
  return (
    <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-sm bg-white shadow-sm">
      {/* dotted inner border — matches EmptyStamp */}
      <div className="pointer-events-none absolute inset-[6%] border border-dotted border-stamp-ink/40" />
      {/* sticker overlay (compact variant = calendar look) */}
      <SpecialDayBadge day={day} variant="compact" forceShow />
    </div>
  );
}

/**
 * Hand-rolled toggle — avoid pulling in shadcn/ui Switch for one screen.
 * Tap target is 44×24 (compliant with PRD §15 touch targets via the
 * surrounding clickable label area which is taller).
 */
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-stamp-ink" : "bg-stamp-ink/20",
      )}
    >
      <span
        className={cn(
          "block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export default function StickersSettingsPage() {
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getSettings();
      if (cancelled) return;
      if (res.ok) {
        setDisabled(new Set(res.value.disabledSpecialDays ?? []));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSticker = async (day: SpecialDay) => {
    const next = new Set(disabled);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    // Optimistic update — the row flips instantly, no spinner.
    setDisabled(next);
    const res = await updateSettings({
      disabledSpecialDays: Array.from(next),
    });
    if (!res.ok) {
      // Roll back on failure.
      setDisabled(disabled);
      toast.error("저장 중 문제가 생겼어요");
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
          특별한 날 스티커
        </h1>
      </header>

      <p className="mt-4 text-sm leading-relaxed text-stamp-ink/60">
        특별한 날에는 우표 위에 스티커가 표시돼요. 원하지 않는 날짜는 끌 수
        있어요.
      </p>

      {loading ? (
        <p className="mt-8 text-center text-sm text-stamp-ink/40">
          불러오는 중…
        </p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-stamp-ink/10 rounded-md border border-stamp-ink/10 bg-white/40">
          {SPECIAL_DAY_ORDER.map((day) => {
            const enabled = !disabled.has(day);
            const labelText = SPECIAL_DAY_LABEL[day];
            return (
              <li
                key={day}
                className="flex items-center gap-3 px-3 py-3"
              >
                <StickerPreview day={day} />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-xs text-stamp-ink/50">
                    {SPECIAL_DAY_DISPLAY_DATE[day]}
                  </p>
                  <p className="font-sans text-base text-stamp-ink truncate">
                    {labelText}
                  </p>
                </div>
                <ToggleSwitch
                  checked={enabled}
                  onChange={() => toggleSticker(day)}
                  label={`${labelText} 스티커 ${enabled ? "끄기" : "켜기"}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
