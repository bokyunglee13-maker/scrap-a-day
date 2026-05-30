"use client";

// components/share/ExportMonth.tsx
// Phase 5 — Export the current month's calendar board as a single PNG, then
// hand off to Web Share API (mobile = Instagram / KakaoTalk / etc. via system
// share sheet) or trigger a download (desktop).
//
// Why the failure mode mattered for the user:
// The board is heavy — 30+ stamps each with a blob: <img>, painted-teeth SVG
// overlay, and (sometimes) special-day stickers. iOS Safari's foreignObject
// pipeline can choke on this volume. The fixes below are practical
// mitigations that have been documented to help, in priority order:
//
//   1. Preload every <img> in the target subtree so html-to-image doesn't
//      see partially-loaded textures.
//   2. Don't pass cacheBust=true for blob: URLs — appending ?t= breaks them.
//   3. skipFonts=true — we already use next/font system-injected fonts; the
//      embedder doesn't need to inline them, and trying often errors out on
//      cross-origin Google Fonts CSS fetches.
//   4. On error, include the actual message in the toast so the user can tell
//      us what's wrong (was a generic '잠시 후 다시 시도해주세요' before).

import { useState, type RefObject } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download } from "lucide-react";

const STAMP_PAPER = "#fbeaf0";

interface ExportMonthProps {
  targetRef: RefObject<HTMLElement | null>;
  year: number;
  month: number; // 1-12
}

/**
 * Wait until every <img> inside `root` reports complete + naturalWidth > 0.
 * Resolves immediately for already-loaded images. Bounded by a 5s timeout per
 * image so a single broken src can't hang the whole export.
 */
async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const waits = imgs.map(
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
        // Per-image safety timeout — a broken image shouldn't hang the export.
        window.setTimeout(done, 5000);
      }),
  );
  await Promise.all(waits);
}

async function shareOrDownload(
  dataUrl: string,
  filename: string,
): Promise<boolean> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: "Scrap a Day" });
          return true;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return true;
          // Any other share failure falls through to download.
        }
      }
    } catch {
      // Fall through to download below.
    }
  }

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

export function ExportMonth({ targetRef, year, month }: ExportMonthProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const node = targetRef.current;
    if (!node) {
      toast.error("저장할 영역을 찾을 수 없어요");
      return;
    }
    setExporting(true);
    try {
      // 1) Preload all blob: <img>s so html-to-image doesn't snapshot
      //    half-loaded textures.
      await waitForImages(node);

      // 2) Serialize. cacheBust removed (breaks blob: URLs). skipFonts true —
      //    next/font fonts are already in the page, no need to re-embed.
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: STAMP_PAPER,
        skipFonts: true,
      });

      const mm = String(month).padStart(2, "0");
      const filename = `scrap-a-day-${year}-${mm}.png`;
      const ok = await shareOrDownload(dataUrl, filename);
      if (ok) {
        toast.success("이미지를 저장했어요");
      } else {
        toast.error("다운로드를 시작할 수 없어요. 브라우저 팝업을 허용해주세요.");
      }
    } catch (e) {
      // Surface the actual error so the user can tell us what failed —
      // the previous generic message hid the real cause (CORS / memory /
      // foreignObject / etc.).
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`이미지 저장에 실패했어요: ${msg.slice(0, 80)}`);
      // eslint-disable-next-line no-console
      console.error("ExportMonth toPng failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      aria-label="이 달 이미지 저장"
      className="inline-flex size-11 items-center justify-center rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <Download className="size-5" />
    </button>
  );
}
