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
      className="rounded-lg p-6 transition-colors"
      style={{ backgroundColor: color }}
    >
      <div className="mx-auto" style={{ width: 128 }}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-white shadow-sm">
          {/* dotted inner border — mimics EmptyStamp */}
          <div className="pointer-events-none absolute inset-[6%] border border-dotted border-stamp-ink/40" />
          {/* perforation overlay — sample circles, fill = chosen bg */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ fill: color }}
            viewBox="0 0 90 120"
            preserveAspectRatio="none"
          >
            {/* top + bottom edges */}
            {[8, 22, 36, 50, 64, 78].map((cx) => (
              <circle key={`t-${cx}`} cx={cx} cy={0} r="3" />
            ))}
            {[8, 22, 36, 50, 64, 78].map((cx) => (
              <circle key={`b-${cx}`} cx={cx} cy={120} r="3" />
            ))}
            {/* left + right edges */}
            {[8, 22, 36, 50, 64, 78, 92, 106].map((cy) => (
              <circle key={`l-${cy}`} cx={0} cy={cy} r="3" />
            ))}
            {[8, 22, 36, 50, 64, 78, 92, 106].map((cy) => (
              <circle key={`r-${cy}`} cx={90} cy={cy} r="3" />
            ))}
          </svg>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-xs text-stamp-ink/55">
        {color}
      </p>
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
        <div className="mt-6 flex flex-col gap-6">
          {/* Live preview */}
          <Preview color={color} />

          {/* Quick-select presets */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-stamp-ink/60">
              자주 쓰는 색
            </h2>
            <ul className="grid grid-cols-3 gap-3">
              {PRESETS.map((p) => {
                const active =
                  color.toUpperCase() === p.value.toUpperCase();
                return (
                  <li key={p.value}>
                    <button
                      type="button"
                      onClick={() => void applyColor(p.value)}
                      aria-pressed={active}
                      className={cn(
                        "flex h-20 w-full flex-col items-center justify-center gap-1 rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-stamp-ink shadow-sm"
                          : "border-stamp-ink/15 hover:border-stamp-ink/40",
                      )}
                    >
                      <span
                        className="size-9 rounded-full border border-stamp-ink/15"
                        style={{ backgroundColor: p.value }}
                      />
                      <span className="text-xs text-stamp-ink/70">
                        {p.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Native picker */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-stamp-ink/60">
              직접 선택
            </h2>
            <label className="flex items-center justify-between gap-3 rounded-md border border-stamp-ink/10 bg-white/40 px-4 py-3">
              <span className="text-sm text-stamp-ink">
                색상 picker 열기
              </span>
              <input
                type="color"
                value={color}
                onChange={(e) => void applyColor(e.target.value.toUpperCase())}
                aria-label="배경 색 picker"
                className="size-10 cursor-pointer rounded border border-stamp-ink/20 bg-transparent p-0"
              />
            </label>
          </section>

          {/* HEX / RGB text input */}
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-stamp-ink/60">
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
                placeholder="#FBEAF0 또는 rgb(251, 234, 240)"
                className="h-11 flex-1 rounded-md border border-stamp-ink/20 bg-white px-3 text-base text-stamp-ink placeholder:text-stamp-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={handleTextSubmit}
                className="inline-flex h-11 items-center rounded-md bg-stamp-ink px-4 text-sm font-medium text-stamp-paper hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                적용
              </button>
            </div>
            {textError && (
              <p className="text-xs text-destructive">{textError}</p>
            )}
          </section>

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-md border border-stamp-ink/15 text-sm text-stamp-ink/70 hover:bg-stamp-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            기본 색으로 되돌리기
          </button>

          <p className="text-xs leading-relaxed text-stamp-ink/50">
            배경 색을 바꾸면 우표 가장자리 톱니도 같은 색으로 변해요. 우표
            안쪽은 항상 흰색이라 어떤 배경이든 사진이 잘 보입니다.
          </p>
        </div>
      )}
    </main>
  );
}
