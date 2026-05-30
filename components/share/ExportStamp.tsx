"use client";

// components/share/ExportStamp.tsx
// Phase 4 — PNG export of a single stamp. PRD §06 §3.1.
//
// Two-step UX (aligned with ExportMonth / ExportSearch post-fix):
//   1. Always download the file (a.click with a Blob URL — works in
//      Naver / KakaoTalk in-app browsers where data: URLs are rejected).
//   2. Follow-up success toast offers a '공유하기' action that invokes
//      navigator.share with the file (system share sheet on mobile).
//
// pixelRatio=3 keeps the PNG sharp when forwarded over chat. The export
// node has #fbeaf0 (stamp-paper) as backgroundColor so the transparent
// perforation bites read as paper, not gaps.

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { ImageDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Stamp as StampView } from "@/components/stamp/Stamp";
import { DEFAULT_BACKGROUND_COLOR, getSettings } from "@/lib/settings";
import type { Stamp } from "@/types";

interface ExportStampProps {
  stamp: Stamp;
}

/** Wait for every <img> in root to load or fail. 5-second per-image cap. */
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
 * Trigger a real file download via an anchor click. Converts the dataURL
 * to a Blob URL because many mobile in-app browsers (Naver, KakaoTalk,
 * Instagram) reject `<a href="data:..." download>` clicks.
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
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return true;
  } catch {
    return false;
  }
}

/** Build an optional 공유하기 toast action when navigator.share is available. */
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

export function ExportStamp({ stamp }: ExportStampProps) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);

  const settingsResult = useLiveQuery(() => getSettings(), []);
  const userBg =
    (settingsResult?.ok && settingsResult.value.backgroundColor) ||
    DEFAULT_BACKGROUND_COLOR;

  const handleClick = () => {
    if (rendering) return;
    setRendering(true);
  };

  useEffect(() => {
    if (!rendering) return;
    let cancelled = false;

    void (async () => {
      // Give React a frame to commit the offscreen mount.
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      if (cancelled || !exportRef.current) {
        setRendering(false);
        return;
      }
      try {
        await waitForImages(exportRef.current);
        if (cancelled) return;
        // cacheBust intentionally OFF — it appends a query string that
        // breaks blob: URLs (which are what our photoBlob renders as).
        // Removing it was the fix for the same bug ExportMonth had.
        const dataUrl = await toPng(exportRef.current, {
          pixelRatio: 3,
          backgroundColor: userBg,
        });
        const filename = `scrap-a-day-${stamp.date}.png`;

        const downloaded = await triggerDownload(dataUrl, filename);
        if (cancelled) return;
        if (!downloaded) {
          toast.error("다운로드가 차단됐어요. 팝업을 허용해주세요.");
          return;
        }

        const shareAction = await buildShareAction(dataUrl, filename);
        if (cancelled) return;
        toast.success("우표 이미지를 저장했어요", {
          duration: 7000,
          action: shareAction,
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        toast.error(`이미지 저장 실패: ${msg.slice(0, 80)}`);
        // eslint-disable-next-line no-console
        console.error("ExportStamp toPng failed:", e);
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rendering, stamp]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={rendering}
        className="h-12 gap-2"
      >
        <ImageDown className="size-4" />
        {rendering ? "저장 중…" : "이미지 저장"}
      </Button>

      {/* Hidden offscreen replica — mounted only while rendering so we
          don't pay the blob URL + xl stamp memory cost during normal
          detail-page browsing. */}
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
          <div
            ref={exportRef}
            style={{
              padding: "24px",
              backgroundColor: userBg,
              ['--user-bg' as string]: userBg,
            }}
          >
            <StampView stamp={stamp} size="xl" showDate showMood />
          </div>
        </div>
      )}
    </>
  );
}
