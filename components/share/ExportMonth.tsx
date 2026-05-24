"use client";

// components/share/ExportMonth.tsx
// Phase 5 — Export the current month's calendar board as a single PNG.
// PRD §07 "한 달 시트 PNG 내보내기".
//
// Strategy mirrors ExportStamp.tsx: walk the target node with html-to-image at
// pixelRatio=2, then either Web Share API (mobile) or <a download> (desktop).
// The board node is passed in by ref from app/page.tsx, so we don't need an
// offscreen replica — the calendar layout is already responsive.

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

export function ExportMonth({ targetRef, year, month }: ExportMonthProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const node = targetRef.current;
    if (!node) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: STAMP_PAPER,
      });
      const mm = String(month).padStart(2, "0");
      const filename = `scrap-a-day-${year}-${mm}.png`;
      const ok = await shareOrDownload(dataUrl, filename);
      if (ok) {
        toast.success("이미지를 저장했어요");
      } else {
        toast.error("잠시 후 다시 시도해주세요");
      }
    } catch {
      toast.error("잠시 후 다시 시도해주세요");
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
