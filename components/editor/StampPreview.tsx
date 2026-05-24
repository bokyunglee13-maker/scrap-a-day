'use client';

// components/editor/StampPreview.tsx
// Live preview that mirrors the registered Stamp at `lg` size. PRD §05 미리보기.
// Builds a synthetic Stamp record from the in-flight draft state — no DB write.

import { Stamp as StampView } from '@/components/stamp/Stamp';
import type { CropData, Mood, Stamp, StampStyle } from '@/types';

interface StampPreviewProps {
  date: string;
  photoBlob: Blob;
  crop: CropData;
  memo: string;
  mood: Mood | null;
  moodVisible: boolean;
  style: StampStyle;
}

export function StampPreview({
  date,
  photoBlob,
  crop,
  memo,
  mood,
  moodVisible,
  style,
}: StampPreviewProps) {
  const now = new Date();
  const draft: Stamp = {
    id: 'preview',
    date,
    photoBlob,
    crop,
    memo,
    mood,
    moodVisible,
    style,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-handwriting text-base text-stamp-ink/60">
        이렇게 붙여질 거예요
      </p>
      <StampView stamp={draft} size="lg" showDate showMood />
    </div>
  );
}
