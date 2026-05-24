'use client';

// components/editor/RecropDialog.tsx
// Phase 4 — re-crop dialog. PRD §06 §3.1/§3.4: same photo only, cropper re-opens.
//
// Goes through the dedicated `recropStamp` code path (NOT `updateStamp`) so
// the type-level "no photoBlob in updateStamp" guard (PRD §06 §3.4) stays
// intact. Original blob is preserved across re-crops, so the user can
// re-crop arbitrarily many times.
//
// Missing-original fallback (PRD §11 §9.2.3): Phase 3 rows lack
// `originalPhotoBlob`. We surface "원본 사진을 찾을 수 없어요" and disable
// saving entirely — no silent fallback to the cropped blob (that would lose
// pixels every cycle).

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhotoCropper, type CropperPatch } from '@/components/editor/PhotoCropper';
import { extractCroppedBlob } from '@/lib/imageProcessing';
import { recropStamp } from '@/lib/stamps';
import type { CropData, Stamp } from '@/types';

interface CropState {
  x: number;
  y: number;
  zoom: number;
  pixelArea: { x: number; y: number; width: number; height: number };
}

interface RecropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamp: Stamp;
}

export function RecropDialog({ open, onOpenChange, stamp }: RecropDialogProps) {
  const original = stamp.originalPhotoBlob ?? null;
  const hasOriginal = original !== null;

  // Seed the cropper with the previously saved crop so the user starts
  // exactly where they left off. zoom defaults to 1 if absent (legacy rows).
  const initial = useMemo<CropState>(
    () => ({
      x: stamp.crop.x ?? 0,
      y: stamp.crop.y ?? 0,
      zoom: stamp.crop.zoom ?? 1,
      pixelArea: { x: 0, y: 0, width: 0, height: 0 },
    }),
    [stamp.crop.x, stamp.crop.y, stamp.crop.zoom],
  );

  const [crop, setCrop] = useState<CropState>(initial);
  const [saving, setSaving] = useState<boolean>(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // Reset seed each time we re-open the dialog (stamp prop may have updated).
  useEffect(() => {
    if (open) setCrop(initial);
  }, [open, initial]);

  // Object URL for the original blob. Created when the dialog opens AND we
  // have an original; revoked on close / cleanup. PRD §15.5.4 Blob URL hygiene.
  useEffect(() => {
    if (!open || !original) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(original);
    setOriginalUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, original]);

  const handleCropPatch = (patch: CropperPatch) => {
    setCrop((prev) => ({
      x: patch.x ?? prev.x,
      y: patch.y ?? prev.y,
      zoom: patch.zoom ?? prev.zoom,
      pixelArea: patch.pixelArea ?? prev.pixelArea,
    }));
  };

  const handleSave = async () => {
    if (!original) return; // guarded by UI, but defensive
    setSaving(true);
    try {
      let newCroppedBlob: Blob;
      try {
        newCroppedBlob = await extractCroppedBlob(original, crop.pixelArea);
      } catch {
        toast.error('잠시 후 다시 시도해주세요');
        return;
      }
      const newCrop: CropData = {
        x: crop.x,
        y: crop.y,
        width: crop.pixelArea.width,
        height: crop.pixelArea.height,
        zoom: crop.zoom,
      };
      const result = await recropStamp(stamp.id, newCroppedBlob, newCrop);
      if (result.ok) {
        onOpenChange(false);
        return;
      }
      toast.error('잠시 후 다시 시도해주세요');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>크롭 다시</DialogTitle>
        </DialogHeader>

        {!hasOriginal && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-sm text-stamp-ink/70">
              원본 사진을 찾을 수 없어요
            </p>
            <p className="text-xs text-stamp-ink/50">
              크롭을 다시 조정하려면 우표를 삭제 후 새로 등록해주세요.
            </p>
          </div>
        )}

        {hasOriginal && originalUrl && (
          <PhotoCropper
            imageUrl={originalUrl}
            crop={{ x: crop.x, y: crop.y }}
            zoom={crop.zoom}
            onChange={handleCropPatch}
          />
        )}

        <DialogFooter>
          {!hasOriginal ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12"
            >
              닫기
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="h-12"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-12"
              >
                {saving ? '저장 중…' : '저장'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
