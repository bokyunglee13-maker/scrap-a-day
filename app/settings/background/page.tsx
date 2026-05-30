"use client";

// app/settings/background/page.tsx
// Phase 3 of personalization — app background color picker.
//
// Three input paths (most → least direct):
//   1. Six curated quick-select chips (top of page) — covers ~90% of users
//   2. Native color picker (<input type="color">) — full color space, no dep
//   3. Manual HEX/RGB text input — for precise hand-picked colors
// Plus a 'default로 되돌리기' button to bail out.
//
// Live preview at the top shows the selected color filling a stamp-shaped
// box so the user sees how the perforation teeth will look against the
// background before committing.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import {
  DEFAULT_BACKGROUND_COLOR,
  getSettings,
  updateSettings,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

// Curated palette — all very low-saturation tones that play well with
// the stamp's pink paper backdrop and don't fight the photo content.
const PRESETS: Array<{ value: string; label: string }> = [
  { value: "#FBEAF0", label: "분홍" },
  { value: "#F5EBD8", label: "베이지" },
  { value: "#FBF6E8", label: "연크림" },
  { value: "#E8F1FB", label: "연하늘" },
  { value: "#F0EEEC", label: "연그레이" },
  { value: "#EFEAF4", label: "연라벤더" },
];

// ---------------------------------------------------------------------------
// Color string parsing — accept HEX (#RGB, #RRGGBB) and rgb(R, G, B)
// ---------------------------------------------------------------------------

const HEX_3 = /^#?([0-9a-f]{3})$/i;
const HEX_6 = /^#?([0-9a-f]{6})$/i;
const RGB = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

function normalizeColorInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // #fff or fff → #FFFFFF
  const m3 = trimmed.match(HEX_3);
  if (m3) {
    const [r, g, b] = m3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  // #ffffff or ffffff → #FFFFFF
  const m6 = trimmed.match(HEX_6);
  if (m6) return `#${m6[1].toUpperCase()}`;
  // rgb(r, g, b) → #RRGGBB
  const mrgb = trimmed.match(RGB);
  if (mrgb) {
    const r = Math.min(255, Number(mrgb[1]));
    const g = Math.min(255, Number(mrgb[2]));
    const b = Math.min(255, Number(mrgb[3]));
    return `#${[r, g, b]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Preview tile — empty-stamp shape with perforation overlay, fills the
// selected background so users see the teeth + frame interaction live.
// ---------------------------------------------------------------------------

function Preview({ color }: { color: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3 transition-colors"
      style={{ backgroundColor: color }}
    >
      {/* Smaller preview stamp (was 128, now 56) so the whole page fits
          on smaller mobile viewports (~640px tall) without scrolling.
          Inline layout: stamp on the left, hex code on the right. */}
      <div style={{ width: 56 }} className="shrink-0">
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-white shadow-sm">
          <div className="pointer-events-none absolute inset-[6%] border border-dotted border-stamp-ink/40" />
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ fill: color }}
            viewBox="0 0 90 120"
            preserveAspectRatio="none"
          >
            {[8, 22, 36, 50, 64, 78].map((cx) => (
              <circle key={`t-${cx}`} cx={cx} cy={0} r="3" />
            ))}
            {[8, 22, 36, 50, 64, 78].map((cx) => (
              <circle key={`b-${cx}`} cx={cx} cy={120} r="3" />
            ))}
            {[8, 22, 36, 50, 64, 78, 92, 106].map((cy) => (
              <circle key={`l-${cy}`} cx={0} cy={cy} r="3" />
            ))}
            {[8, 22, 36, 50, 64, 78, 92, 106].map((cy) => (
              <circle key={`r-${cy}`} cx={90} cy={cy} r="3" />
            ))}
          </svg>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm text-stamp-ink">{color}</p>
        <p className="mt-0.5 text-xs text-stamp-ink/55">
          미리보기 — 톱니가 배경과 같은 색
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BackgroundSettingsPage() {
  const [color, setColor] = useState<string>(DEFAULT_BACKGROUND_COLOR);
  const [textInput, setTextInput] = useState<string>("");
  const [textError, setTextError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getSettings();
      if (cancelled) return;
      if (res.ok) {
        const stored = res.value.backgroundColor || DEFAULT_BACKGROUND_COLOR;
        setColor(stored);
        setTextInput(stored);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyColor = async (next: string) => {
    setColor(next);
    setTextInput(next);
    setTextError(null);
    const res = await updateSettings({ backgroundColor: next });
    if (!res.ok) {
      toast.error("저장 중 문제가 생겼어요");
    }
  };

  const handleTextSubmit = () => {
    const parsed = normalizeColorInput(textInput);
    if (!parsed) {
      setTextError("HEX (#FFFFFF) 또는 RGB (rgb(255,255,255)) 형식만 가능해요");
      return;
    }
    void applyColor(parsed);
  };

  const reset = () => {
    void applyColor(DEFAULT_BACKGROUND_COLOR);
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
          배경 색
        </h1>
      </header>

      {loading ? (
        <p className="mt-8 text-center text-sm text-stamp-ink/40">
          불러오는 중…
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {/* Compact inline preview (stamp + hex side-by-side). */}
          <Preview color={color} />

          {/* Quick-select presets — 6 colors in a single row (grid-cols-6)
              so they take only one short row, leaving vertical space for
              the picker + HEX inputs below. Each cell becomes a small
              tappable circle with the name tucked underneath. */}
          <section className="flex flex-col gap-1.5">
            <h2 className="text-xs font-medium text-stamp-ink/60">
              자주 쓰는 색
            </h2>
            <ul className="grid grid-cols-6 gap-1.5">
              {PRESETS.map((p) => {
                const active =
                  color.toUpperCase() === p.value.toUpperCase();
                return (
                  <li key={p.value}>
                    <button
                      type="button"
                      onClick={() => void applyColor(p.value)}
                      aria-pressed={active}
                      aria-label={p.label}
                      className={cn(
                        "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-stamp-ink shadow-sm"
                          : "border-stamp-ink/15 hover:border-stamp-ink/40",
                      )}
                    >
                      <span
                        className="size-6 rounded-full border border-stamp-ink/15"
                        style={{ backgroundColor: p.value }}
                      />
                      <span className="text-[10px] leading-none text-stamp-ink/70">
                        {p.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Native picker (compact). key+defaultValue trick documented in
              earlier commit — Samsung Internet ignores controlled value
              on <input type="color">. */}
          <section className="flex flex-col gap-1.5">
            <h2 className="text-xs font-medium text-stamp-ink/60">
              직접 선택
            </h2>
            <label className="flex items-center justify-between gap-3 rounded-md border border-stamp-ink/10 bg-white/40 px-3 py-2">
              <span className="text-sm text-stamp-ink">색상 picker</span>
              <input
                key={color}
                type="color"
                defaultValue={color}
                onChange={(e) => void applyColor(e.target.value.toUpperCase())}
                aria-label="배경 색 picker"
                className="size-9 cursor-pointer rounded border border-stamp-ink/20 bg-transparent p-0"
              />
            </label>
          </section>

          {/* HEX / RGB text input. flex layout keeps input + 적용 button
              on a single row at any viewport width. Input shrinks; button
              stays compact (px-3 + text-sm). */}
          <section className="flex flex-col gap-1.5">
            <h2 className="text-xs font-medium text-stamp-ink/60">
              HEX 또는 RGB 코드
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setTextError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTextSubmit();
                }}
                placeholder="#FBEAF0"
                className="h-10 min-w-0 flex-1 rounded-md border border-stamp-ink/20 bg-white px-3 text-base text-stamp-ink placeholder:text-stamp-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={handleTextSubmit}
                className="inline-flex h-10 shrink-0 items-center rounded-md bg-stamp-ink px-3 text-sm font-medium text-stamp-paper hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                적용
              </button>
            </div>
            {textError && (
              <p className="text-xs text-destructive">{textError}</p>
            )}
          </section>

          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md border border-stamp-ink/15 text-sm text-stamp-ink/70 hover:bg-stamp-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            기본 색으로 되돌리기
          </button>
        </div>
      )}
    </main>
  );
}
