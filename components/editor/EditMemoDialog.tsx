'use client';

// components/editor/EditMemoDialog.tsx
// Phase 4 — memo edit dialog. PRD §06 §3.3 / §3.6 (수정 자유도 + 실패 처리).
//
// Failure policy (PRD §11 §9.2.3): on save failure, keep the user's draft in
// the form and stay open. On success: close silently (PRD §10 §5.2 update has
// no toast).

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
import { MemoInput } from '@/components/editor/MemoInput';
import { updateStamp } from '@/lib/stamps';
import type { Stamp } from '@/types';

interface EditMemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamp: Stamp;
}

export function EditMemoDialog({
  open,
  onOpenChange,
  stamp,
}: EditMemoDialogProps) {
  const [draft, setDraft] = useState<string>(stamp.memo);
  const [saving, setSaving] = useState<boolean>(false);

  // Reset draft whenever the dialog opens against a (possibly different) stamp.
  useEffect(() => {
    if (open) setDraft(stamp.memo);
  }, [open, stamp.memo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateStamp(stamp.id, { memo: draft });
      if (result.ok) {
        onOpenChange(false); // silent success per PRD §10 §5.2
        return;
      }
      // Failure: keep dialog open, draft preserved, toast retry hint.
      toast.error('잠시 후 다시 시도해주세요');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>메모 수정</DialogTitle>
        </DialogHeader>
        <MemoInput value={draft} onChange={setDraft} />
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
