'use client';

// components/share/ExportStamp.tsx
// Phase 4 — PNG export of a single stamp. PRD §06 §3.1 "이미지 저장".
//
// Strategy: render an offscreen replica of the stamp at a fixed size (xl) so
// the visible UI doesn't reflow during export. html-to-image walks the
// offscreen subtree to produce a PNG, which we then either share via Web
// Share API (mobile) or download (desktop / fallback).
//
// pixelRatio=3 keeps the output sharp when forwarded over chat / saved to
// camera roll. backgroundColor=#fbeaf0 (stamp-paper) is required because the
// stamp uses transparent perforation bites; without an opaque fill, those
// bites read as gaps after PNG conversion.

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { ImageDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Stamp as StampView } from '@/components/stamp/Stamp';
import type { Stamp } from '@/types';

interface ExportStampProps {
  stamp: Stamp;
}

const STAMP_PAPER = '#fbeaf0';

async function shareOrDownload(dataUrl: string, filename: string): Promise<void> {
  // Mobile share path — converts dataUrl → File, hands to navigator.share.
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });
      // canShare can be undefined on older browsers — guard before calling.
      if (
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file], title: 'Scrap a Day' });
          toast.success('이미지를 저장했어요');
          return;
        } catch (e) {
          // User cancelled share — treat as silent no-op.
          if (e instanceof Error && e.name === 'AbortError') return;
          // Any other share failure falls through to download.
        }
      }
    } catch {
      // Fall through to download below.
    }
  }

  // Desktop / no share API: synthesize an <a download> click.
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast.success('이미지를 저장했어요');
}

export function ExportStamp({ stamp }: ExportStampProps) {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExport = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: STAMP_PAPER,
      });
      const filename = `scrap-a-day-${stamp.date}.png`;
      await shareOrDownload(dataUrl, filename);
    } catch {
      toast.error('잠시 후 다시 시도해주세요');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleExport}
        disabled={exporting}
        className="h-12 gap-2"
      >
        <ImageDown className="size-4" />
        {exporting ? '저장 중…' : '이미지 저장'}
      </Button>

      {/* Hidden offscreen replica used as the export source. Kept mounted so
          html-to-image always has a real node to walk. Padding gives the
          rendered PNG a small "matting" border around the stamp. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={exportRef}
          style={{
            padding: '24px',
            backgroundColor: STAMP_PAPER,
          }}
        >
          <StampView stamp={stamp} size="xl" showDate showMood />
        </div>
      </div>
    </>
  );
}
