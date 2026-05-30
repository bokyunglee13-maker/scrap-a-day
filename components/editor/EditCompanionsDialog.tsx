'use client';

// components/editor/EditCompanionsDialog.tsx
// Phase 5 — companion list edit dialog.
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
import { CompanionPicker } from '@/components/editor/CompanionPicker';
import { updateStamp } from '@/lib/stamps';
import type { Stamp } from '@/types';

interface EditCompanionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamp: Stamp;
}

export function EditCompanionsDialog({
  open,
  onOpenChange,
  stamp,
}: EditCompanionsDialogProps) {
  const [draft, setDraft] = useState<string[]>(stamp.companions ?? []);
  const [saving, setSaving] = useState<boolean>(false);

  // Reset draft whenever the dialog opens (possibly against a different stamp).
  useEffect(() => {
    if (open) setDraft(stamp.companions ?? []);
  }, [open, stamp.companions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Empty array → omit the field entirely so storage stays clean.
      const next = draft.length > 0 ? draft : undefined;
      const result = await updateStamp(stamp.id, { companions: next });
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
          <DialogTitle>함께한 사람 수정</DialogTitle>
        </DialogHeader>
        <CompanionPicker value={draft} onChange={setDraft} />
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
