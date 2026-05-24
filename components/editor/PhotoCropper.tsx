'use client';

// components/editor/PhotoCropper.tsx
// Square (1:1) crop wrapper around react-easy-crop with a zoom slider fallback.
// PRD §05 step 2.
//
// The library emits three separate callbacks (onCropChange / onZoomChange /
// onCropComplete) at different times in a gesture. We don't try to merge them
// here — we forward each change as a partial patch and the parent merges into
// its own state. This avoids the "stale prop in callback" trap.

import { useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { getPerforationTeeth } from '@/lib/perforation';

// 11×11 minimal teeth around a square viewBox give a clear stamp-edge feel
// without crowding the cropper. The teeth render OUTSIDE the photo region as
// white scalloped semicircles — they overlap the cropper edges so the user
// sees "this will become a stamp" while cropping.
const VB = 90;
const PERFORATION_TEETH = getPerforationTeeth(VB, VB, 'minimal');

export interface CropperPatch {
  x?: number;
  y?: number;
  zoom?: number;
  pixelArea?: { x: number; y: number; width: number; height: number };
}

interface PhotoCropperProps {
  imageUrl: string;
  crop: { x: number; y: number };
  zoom: number;
  /** Forwarded for each underlying event as a partial patch. */
  onChange: (patch: CropperPatch) => void;
}

export function PhotoCropper({
  imageUrl,
  crop,
  zoom,
  onChange,
}: PhotoCropperProps) {
  const handleCropChange = useCallback(
    (location: Point) => {
      onChange({ x: location.x, y: location.y });
    },
    [onChange],
  );

  const handleZoomChange = useCallback(
    (next: number) => {
      onChange({ zoom: next });
    },
    [onChange],
  );

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onChange({
        pixelArea: {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        },
      });
    },
    [onChange],
  );

  const handleSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleZoomChange(Number(e.target.value));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-square overflow-hidden rounded-md bg-stamp-ink/5">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          minZoom={1}
          maxZoom={3}
          showGrid={false}
          objectFit="contain"
          onCropChange={handleCropChange}
          onZoomChange={handleZoomChange}
          onCropComplete={handleCropComplete}
        />
        {/* Stamp-edge overlay: scalloped teeth around the perimeter so the
            cropper looks like an actual stamp instead of a plain square.
            pointer-events-none keeps drag/pinch fully on the underlying Cropper. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 fill-stamp-paper stroke-stamp-ink/15"
          viewBox={`0 0 ${VB} ${VB}`}
          preserveAspectRatio="none"
        >
          {PERFORATION_TEETH.map((t, i) => (
            <circle key={i} cx={t.cx} cy={t.cy} r={t.r} strokeWidth="0.3" />
          ))}
        </svg>
      </div>
      <p className="text-center text-xs text-stamp-ink/40">
        우표 모양으로 잘려요 — 가장자리는 잘립니다
      </p>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-stamp-ink/60">확대/축소</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={handleSliderInput}
          aria-label="확대/축소"
          className="h-11 w-full cursor-pointer accent-stamp-ink"
        />
      </label>
    </div>
  );
}
