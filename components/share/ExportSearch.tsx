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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Mood, Stamp } from "@/types";
import type { RangePreset } from "@/lib/dateGuards";

/** Threshold above which we show a 'this will be a long image' confirm
 *  before kicking off the toPng render. ~60 stamps with the 3-col 720px
 *  layout produces roughly a 4000-5000px tall PNG (3+ Instagram stories).
 *  Below 60 we just download silently — the typical 1-3 month search. */
const CONFIRM_THRESHOLD = 60;

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

/**
 * Trigger a download. Converts the dataURL to a Blob URL first because
 * many mobile in-app browsers (Naver, KakaoTalk, Instagram) intercept
 * `<a href="data:..." download>` clicks but then refuse to process the
 * data URL — the user sees a '다운로드 실패' toast even though we never
 * threw. Blob URLs are same-origin object refs that all browsers handle
 * the same way: 'real download'.
 */
async function triggerDownload(
  dataUrl: string,
  filename: string,
): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after 60s — long enough for any browser's download manager
    // to have fetched the blob, short enough that we don't leak memory.
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
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

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Visually disabled (faded) when there's nothing to download, but the
  // button stays *clickable* — taps surface a hint toast explaining why
  // ("사람 또는 감정 먼저 선택"), which is friendlier than a silent
  // dead button. True disabled-disabled only while a render/dialog is
  // already in flight.
  const isInFlight = rendering || confirmOpen;
  const isEmpty = disabled || stamps.length === 0;

  const handleClick = () => {
    if (isInFlight) return;
    if (disabled) {
      toast("사람 또는 감정을 먼저 선택해주세요");
      return;
    }
    if (stamps.length === 0) {
      toast("이 조건에 맞는 우표가 없어요");
      return;
    }
    if (stamps.length > CONFIRM_THRESHOLD) {
      // Surface the heavy-render warning so users aren't surprised by a
      // 5000px-tall PNG. They can either continue (we proceed) or cancel
      // and narrow the date range / pick a single month instead.
      setConfirmOpen(true);
      return;
    }
    setRendering(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
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

        const downloaded = await triggerDownload(dataUrl, filename);
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
        disabled={isInFlight}
        aria-label="검색 결과 이미지 저장"
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-30",
          // 'Visually disabled' when nothing to download — but clickable so
          // the hint toast still fires.
          isEmpty && !isInFlight && "opacity-30",
        )}
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

      {/* Long-result confirm. Only mounts when needed so it doesn't sit in
          the DOM for the 99% case (small searches). */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>긴 이미지가 만들어져요</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stamp-ink/70 leading-relaxed">
            검색 결과 {stamps.length}개를 한 장의 이미지로 만듭니다.
            <br />
            인스타 스토리 여러 장 길이가 될 수 있어요.
          </p>
          <p className="text-xs text-stamp-ink/55 leading-relaxed">
            짧게 받고 싶다면 취소하고 기간을 좁히거나 (예: 최근 1개월) 사람 +
            감정을 같이 선택해 결과를 줄여보세요.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              취소
            </Button>
            <Button type="button" onClick={handleConfirm}>
              계속 받기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
