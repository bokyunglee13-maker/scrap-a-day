'use client';

// components/editor/DeleteStampDialog.tsx
// Phase 4 — delete confirm + 5-second 되돌리기 toast. PRD §06 §3.5, §10 §5.2.
//
// AlertDialog NOT installed in this project — using regular Dialog with a
// destructive-variant primary button per the brief.
//
// Failure (PRD §11 §9.2.3): keep dialog open + toast retry. Restore conflict
// (DUPLICATE_DATE) handled at the toast level too.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { restoreStamp, softDeleteStamp } from '@/lib/stamps';
import type { Stamp } from '@/types';

interface DeleteStampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamp: Stamp;
}

export function DeleteStampDialog({
  open,
  onOpenChange,
  stamp,
}: DeleteStampDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      const result = await softDeleteStamp(stamp.id);
      if (!result.ok) {
        toast.error('잠시 후 다시 시도해주세요');
        return;
      }
      onOpenChange(false);
      router.push('/');
      toast('휴지통으로 옮겼어요', {
        duration: 5000,
        action: {
          label: '되돌리기',
          onClick: async () => {
            const restored = await restoreStamp(stamp.id);
            if (restored.ok) return; // silent — live query brings stamp back
            if (restored.error === 'DUPLICATE_DATE') {
              toast.error('이미 등록된 날짜입니다');
            } else {
              toast.error('잠시 후 다시 시도해주세요');
            }
          },
        },
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이 우표를 휴지통으로 옮길까요?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-stamp-ink/70">
          30일 동안 휴지통에서 되돌릴 수 있어요.
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="h-12"
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
            className="h-12"
          >
            {deleting ? '삭제 중…' : '삭제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
