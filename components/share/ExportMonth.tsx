"use client";

// components/share/ExportMonth.tsx
// Phase 6 — Export the current month as a PNG with a dedicated poster-style
// layout (MonthExportLayout). Then hand off to Web Share API (mobile = Insta /
// KakaoTalk / etc. via system share sheet) or trigger a download (desktop).
//
// Why mount-on-demand instead of always-present offscreen replica:
// Each stamp creates a blob: URL for its photo. Keeping a full offscreen
// duplicate of the month doubles memory (~15MB for 30 stamps with originals).
// Mount only while exporting; useEffect waits for images to load before
// calling toPng.

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { MonthExportLayout } from "./MonthExportLayout";

const STAMP_PAPER = "#fbeaf0";

interface ExportMonthProps {
  year: number;
  month: number; // 1-12
}

/**
 * Wait for every <img> in `root` to either load or fail. 5-second per-image
 * safety so a broken src can't hang the export.
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
          // Fall through to download.
        }
      }
    } catch {
      // Fall through.
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

export function ExportMonth({ year, month }: ExportMonthProps) {
  const offscreenRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  // When `exporting` flips true, the offscreen layout mounts; this effect
  // then waits for images and runs toPng, then cleans up.
  useEffect(() => {
    if (!exporting) return;
    let cancelled = false;

    void (async () => {
      // Give React a frame to commit the offscreen mount.
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      if (cancelled || !offscreenRef.current) {
        setExporting(false);
        return;
      }
      try {
        await waitForImages(offscreenRef.current);
        if (cancelled) return;
        const dataUrl = await toPng(offscreenRef.current, {
          pixelRatio: 2,
          backgroundColor: STAMP_PAPER,
          skipFonts: true,
        });
        const mm = String(month).padStart(2, "0");
        const filename = `scrap-a-day-${year}-${mm}.png`;
        const ok = await shareOrDownload(dataUrl, filename);
        if (cancelled) return;
        if (ok) {
          toast.success("이미지를 저장했어요");
        } else {
          toast.error("다운로드가 차단됐어요. 팝업을 허용해주세요.");
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`이미지 저장 실패: ${msg.slice(0, 80)}`);
        // eslint-disable-next-line no-console
        console.error("ExportMonth toPng failed:", e);
      } finally {
        if (!cancelled) setExporting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exporting, year, month]);

  return (
    <>
      <button
        type="button"
        onClick={() => setExporting(true)}
        disabled={exporting}
        aria-label="이 달 이미지 저장"
        className="inline-flex size-11 items-center justify-center rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <Download className="size-5" />
      </button>

      {/* Mount the offscreen export replica only while exporting. Saves the
          ~15MB blob URL memory cost during normal browsing. */}
      {exporting && (
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
            <MonthExportLayout year={year} month={month} />
          </div>
        </div>
      )}
    </>
  );
}
