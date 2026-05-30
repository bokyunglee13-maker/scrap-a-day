"use client";

// components/share/ExportMonth.tsx
// Phase 6 + polish — Export the current month as a PNG via a poster-style
// offscreen layout (MonthExportLayout).
//
// Two-step UX (changed from share-only):
//   1. Always download the file (a.click) → on Android this lands in the
//      Downloads folder and the system 갤러리 picks it up automatically.
//      On iOS it lands in Files; users can move it to Photos manually or use
//      the share action below.
//   2. Surface a follow-up toast with an optional "공유하기" action that
//      invokes navigator.share with the file. Lets users post to KakaoTalk /
//      Instagram / etc. in one tap.
//
// Bug fix: previously the offscreen layout called useLiveQuery internally,
// so toPng often ran before the stamps arrived → blank-cell PNG. We now
// fetch the stamps up-front in this component and only mount the layout
// when the data is ready.

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { MonthExportLayout } from "./MonthExportLayout";
import { db } from "@/lib/db";
import type { Stamp } from "@/types";

const STAMP_PAPER = "#fbeaf0";

interface ExportMonthProps {
  year: number;
  month: number; // 1-12
}

type Phase = "idle" | "loading" | "rendering";

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

/**
 * Trigger an actual file download via an anchor click. On Android this writes
 * to the Downloads directory (visible in 갤러리 → Downloads album). On iOS
 * Safari this routes through the Files app — Photos saves go through the
 * share-action toast below.
 */
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

/**
 * Build an optional share-action descriptor for the success toast. Returns
 * undefined when navigator.share / canShare isn't available, so the toast
 * simply omits the button in that case (e.g. desktop Chrome).
 */
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
            /* user cancelled or share failed silently — no-op. */
          });
      },
    };
  } catch {
    return undefined;
  }
}

export function ExportMonth({ year, month }: ExportMonthProps) {
  const offscreenRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stamps, setStamps] = useState<Stamp[]>([]);

  // Click → fetch stamps for this month, then flip to 'rendering' which
  // mounts the offscreen layout. The render effect below handles toPng.
  const handleClick = async () => {
    if (phase !== "idle") return;
    setPhase("loading");
    try {
      const mm = String(month).padStart(2, "0");
      const lower = `${year}-${mm}-00`;
      const upper = `${year}-${mm}-32`;
      const all = await db.stamps
        .where("date")
        .between(lower, upper, false, false)
        .and((s) => s.deletedAt === null)
        .toArray();
      setStamps(all);
      setPhase("rendering");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("ExportMonth fetch failed:", e);
      toast.error("우표 데이터를 불러오지 못했어요");
      setPhase("idle");
    }
  };

  // When `phase` flips to 'rendering', the offscreen layout mounts; this
  // effect then waits for images and runs toPng, then cleans up.
  useEffect(() => {
    if (phase !== "rendering") return;
    let cancelled = false;

    void (async () => {
      // Give React a frame to commit the offscreen mount.
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      if (cancelled || !offscreenRef.current) {
        setPhase("idle");
        return;
      }
      try {
        await waitForImages(offscreenRef.current);
        if (cancelled) return;
        // skipFonts removed — earlier we set it true to avoid suspected
        // Google Fonts CORS fetches during export. In practice next/font
        // (both /google and /local) self-hosts under same-origin, so the
        // embed path is safe AND necessary: without embed, iOS Safari can
        // fall back to system sans when rendering the SVG foreignObject,
        // which would make the PNG show a different typeface than the live
        // page. Embed → Paperlogy guaranteed.
        const dataUrl = await toPng(offscreenRef.current, {
          pixelRatio: 2,
          backgroundColor: STAMP_PAPER,
        });
        const mm = String(month).padStart(2, "0");
        const filename = `scrap-a-day-${year}-${mm}.png`;

        const downloaded = triggerDownload(dataUrl, filename);
        if (cancelled) return;
        if (!downloaded) {
          toast.error("다운로드가 차단됐어요. 팝업을 허용해주세요.");
          return;
        }

        // Optional share follow-up (no-op when not supported).
        const shareAction = await buildShareAction(dataUrl, filename);
        if (cancelled) return;
        toast.success("이미지를 저장했어요", {
          duration: 7000,
          action: shareAction,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`이미지 저장 실패: ${msg.slice(0, 80)}`);
        // eslint-disable-next-line no-console
        console.error("ExportMonth toPng failed:", e);
      } finally {
        if (!cancelled) {
          setPhase("idle");
          setStamps([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, year, month]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={phase !== "idle"}
        aria-label="이 달 이미지 저장"
        className="inline-flex size-11 items-center justify-center rounded-sm p-2 text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <Download className="size-5" />
      </button>

      {/* Mount the offscreen export replica only while rendering. Saves the
          ~15MB blob URL memory cost during normal browsing. Stamps come from
          the up-front fetch in handleClick, so the data is guaranteed ready
          when MonthExportLayout mounts (no more empty-cell PNG bug). */}
      {phase === "rendering" && (
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
            <MonthExportLayout year={year} month={month} stamps={stamps} />
          </div>
        </div>
      )}
    </>
  );
}
