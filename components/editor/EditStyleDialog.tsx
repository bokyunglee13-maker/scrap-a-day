'use client';

// components/editor/EditStyleDialog.tsx
// Phase 4 — stamp style edit dialog with live preview. PRD §06 §3.3.

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
import { StylePicker } from '@/components/editor/StylePicker';
import { Stamp as StampView } from '@/components/stamp/Stamp';
import { updateStamp } from '@/lib/stamps';
import type { Stamp, StampStyle } from '@/types';

interface EditStyleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamp: Stamp;
}

export function EditStyleDialog({
  open,
  onOpenChange,
  stamp,
}: EditStyleDialogProps) {
  const [draftStyle, setDraftStyle] = useState<StampStyle>(stamp.style);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (open) setDraftStyle(stamp.style);
  }, [open, stamp.style]);

  // Synthetic stamp record for live preview — no DB write.
  const previewStamp = useMemo<Stamp>(
    () => ({ ...stamp, style: draftStyle }),
    [stamp, draftStyle],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateStamp(stamp.id, { style: draftStyle });
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
          <DialogTitle>스타일 변경</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center py-2">
            <StampView stamp={previewStamp} size="lg" showDate showMood />
          </div>
          <StylePicker value={draftStyle} onChange={setDraftStyle} />
        </div>
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
