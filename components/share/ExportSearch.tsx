"use client";

// components/share/ExportSearch.tsx
// Post Phase 6 polish — download/share the current search result as a
// poster-style PNG. Mirrors ExportMonth's two-step UX:
//   1. Always download (a.click) → Android Downloads / iOS Files
//   2. Follow-up success toast surfaces an optional '공유하기' action
//      that invokes navigator.share with the file (KakaoTalk / Instagram
//      / etc.)
//
// Disabled when there's no active filter or zero results — nothing to
// export, and we'd rather signal that than render an empty poster.

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { SearchExportLayout } from "./SearchExportLayout";
import type { Mood, Stamp } from "@/types";
import type { RangePreset } from "@/lib/dateGuards";

const STAMP_PAPER = "#fbeaf0";

interface ExportSearchProps {
  /** Newest-first stamps matching the current filters. */
  stamps: Stamp[];
  selectedCompanions: string[];
  selectedMoods: Mood[];
  range: RangePreset;
  /** True when both filter axes are empty — nothing meaningful to export. */
  disabled?: boolean;
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          window.setTimeout(done, 5000);
        }),
    ),
  );
}

function triggerDownload(dataUrl: string, filename: string): boolean {
  try {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}

async function buildShareAction(
  dataUrl: string,
  filename: string,
): Promise<{ label: string; onClick: () => void } | undefined> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return undefined;
  }
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (
      typeof navigator.canShare === "function" &&
      !navigator.canShare({ files: [file] })
    ) {
      return undefined;
    }
    return {
      label: "공유하기",
      onClick: () => {
        void navigator
          .share({ files: [file], title: "Scrap a Day" })
          .catch(() => {
            /* user cancelled — no-op */
          });
      },
    };
  } catch {
    return undefined;
  }
}

/** Build a filename like 'scrap-a-day-search-스폰지클럽.png'.
 *  Falls back to 'search' if no companion / mood is selected (the button
 *  is disabled in that case, but defense in depth). */
function buildFilename(companions: string[], moods: Mood[]): string {
  const segments: string[] = [];
  if (companions.length > 0) segments.push(companions[0]);
  if (moods.length > 0) segments.push(moods[0]);
  const tail = segments.join("-") || "search";
  // sanitize for filesystem (basic ascii fallback; the OS handles unicode fine
  // in modern browsers, but strip slashes and backslashes just in case)
  const safe = tail.replace(/[\\/:*?"<>|]/g, "");
  return `scrap-a-day-search-${safe}.png`;
}

export function ExportSearch({
  stamps,
  selectedCompanions,
  selectedMoods,
  range,
  disabled = false,
}: ExportSearchProps) {
  const offscreenRef = useRef<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState(false);

  const isDisabled = disabled || stamps.length === 0 || rendering;

  const handleClick = () => {
    if (isDisabled) return;
    setRendering(true);
  };

  useEffect(() => {
    if (!rendering) return;
    let cancelled = false;

    void (async () => {
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      if (cancelled || !offscreenRef.current) {
        setRendering(false);
        return;
      }
      try {
        await waitForImages(offscreenRef.current);
        if (cancelled) return;
        const dataUrl = await toPng(offscreenRef.current, {
          pixelRatio: 2,
          backgroundColor: STAMP_PAPER,
        });
        const filename = buildFilename(selectedCompanions, selectedMoods);

        const downloaded = triggerDownload(dataUrl, filename);
        if (cancelled) return;
        if (!downloaded) {
          toast.error("다운로드가 차단됐어요. 팝업을 허용해주세요.");
          return;
        }

        const shareAction = await buildShareAction(dataUrl, filename);
        if (cancelled) return;
        toast.success("검색 결과 이미지를 저장했어요", {
          duration: 7000,
          action: shareAction,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`이미지 저장 실패: ${msg.slice(0, 80)}`);
        // eslint-disable-next-line no-console
        console.error("ExportSearch toPng failed:", e);
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rendering, selectedCompanions, selectedMoods]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label="검색 결과 이미지 저장"
        className="inline-flex size-11 items-center justify-center rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Download className="size-5" />
      </button>

      {rendering && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            pointerEvents: "none",
          }}
        >
          <div ref={offscreenRef}>
            <SearchExportLayout
              stamps={stamps}
              selectedCompanions={selectedCompanions}
              selectedMoods={selectedMoods}
              range={range}
            />
          </div>
        </div>
      )}
    </>
  );
}
