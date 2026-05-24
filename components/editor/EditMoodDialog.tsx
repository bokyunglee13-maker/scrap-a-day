'use client';

// components/editor/EditMoodDialog.tsx
// Phase 4 — mood + moodVisible edit dialog. PRD §06 §3.3.

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoodPicker } from '@/components/editor/MoodPicker';
import { updateStamp } from '@/lib/stamps';
import type { Mood, Stamp } from '@/types';

interface EditMoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamp: Stamp;
}

export function EditMoodDialog({
  open,
  onOpenChange,
  stamp,
}: EditMoodDialogProps) {
  const [mood, setMood] = useState<Mood | null>(stamp.mood);
  const [moodVisible, setMoodVisible] = useState<boolean>(stamp.moodVisible);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setMood(stamp.mood);
      setMoodVisible(stamp.moodVisible);
    }
  }, [open, stamp.mood, stamp.moodVisible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateStamp(stamp.id, { mood, moodVisible });
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
          <DialogTitle>감정 변경</DialogTitle>
        </DialogHeader>
        <MoodPicker
          value={mood}
          onChange={setMood}
          visible={moodVisible}
          onVisibleChange={setMoodVisible}
        />
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
