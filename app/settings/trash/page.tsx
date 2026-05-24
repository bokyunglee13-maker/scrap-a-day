"use client";

// app/settings/trash/page.tsx
// Phase 5 — Trash viewer. Soft-deleted stamps live here for 30 days.
// PRD §07, PRD §11 §9.2.5.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";

import { db } from "@/lib/db";
import {
  daysUntilPermanentDelete,
  emptyTrash,
  permanentDeleteStamp,
} from "@/lib/trash";
import { restoreStamp } from "@/lib/stamps";
import type { Stamp } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TrashPage() {
  // Live trashed list — Dexie can't index nullable deletedAt, so filter in JS.
  const trashed = useLiveQuery<Stamp[]>(async () => {
    const all = await db.stamps.toArray();
    return all
      .filter((s) => s.deletedAt !== null)
      .sort((a, b) => {
        const at = a.deletedAt?.getTime() ?? 0;
        const bt = b.deletedAt?.getTime() ?? 0;
        return bt - at;
      });
  }, []);

  const [emptyOpen, setEmptyOpen] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Stamp | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleRestore = async (id: string) => {
    const res = await restoreStamp(id);
    if (res.ok) {
      toast.success("복원했어요");
      return;
    }
    if (res.error === "DUPLICATE_DATE") {
      toast.error("이미 등록된 날짜입니다. 새 우표를 삭제 후 복원하세요");
      return;
    }
    toast.error("잠시 후 다시 시도해주세요");
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await permanentDeleteStamp(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!res.ok) {
      toast.error("잠시 후 다시 시도해주세요");
    }
  };

  const handleEmpty = async () => {
    setEmptying(true);
    const res = await emptyTrash();
    setEmptying(false);
    setEmptyOpen(false);
    if (!res.ok) {
      toast.error("잠시 후 다시 시도해주세요");
    }
  };

  const isLoading = trashed === undefined;
  const isEmpty = !isLoading && trashed.length === 0;

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            aria-label="설정으로"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
            휴지통
          </h1>
        </div>
        {!isEmpty && !isLoading && (
          <Button
            type="button"
            variant="destructive"
            className="h-10"
            onClick={() => setEmptyOpen(true)}
          >
            비우기
          </Button>
        )}
      </header>

      <p className="mt-4 rounded-sm bg-stamp-ink/5 px-3 py-2 font-sans text-sm text-stamp-ink/70">
        30일이 지나면 자동으로 영구 삭제됩니다.
      </p>

      <section className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-sm bg-stamp-ink/5"
              />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="py-12 text-center font-sans text-sm text-stamp-ink/50">
            휴지통이 비어있어요
          </p>
        ) : (
          <ul className="space-y-2">
            {trashed.map((s) => (
              <TrashRow
                key={s.id}
                stamp={s}
                onRestore={() => handleRestore(s.id)}
                onDelete={() => setDeleteTarget(s)}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Empty-trash confirm */}
      <Dialog open={emptyOpen} onOpenChange={(o) => !emptying && setEmptyOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>휴지통을 비우면 되돌릴 수 없어요</DialogTitle>
            <DialogDescription>
              안에 있는 우표 전체가 영구 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => setEmptyOpen(false)}
              disabled={emptying}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12"
              onClick={handleEmpty}
              disabled={emptying}
            >
              {emptying ? "비우는 중…" : "비우기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent-delete confirm */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !deleting && !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이 우표를 영구 삭제할까요?</DialogTitle>
            <DialogDescription>되돌릴 수 없어요.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12"
              onClick={handlePermanentDelete}
              disabled={deleting}
            >
              {deleting ? "삭제 중…" : "영구 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function TrashRow({
  stamp,
  onRestore,
  onDelete,
}: {
  stamp: Stamp;
  onRestore: () => void;
  onDelete: () => void;
}) {
  // Per-row Blob URL. Revoked on unmount so we don't leak in mobile Safari.
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!stamp.photoBlob || stamp.photoBlob.size === 0) {
      setThumbUrl(null);
      return;
    }
    const url = URL.createObjectURL(stamp.photoBlob);
    setThumbUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [stamp.photoBlob]);

  const daysLeft = stamp.deletedAt
    ? daysUntilPermanentDelete(stamp.deletedAt)
    : 0;

  const dateLabel = format(parseISO(stamp.date), "M월 d일", { locale: ko });

  return (
    <li className="flex items-center gap-3 rounded-sm border border-stamp-ink/10 bg-white/40 p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-sm bg-stamp-ink/5">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={`${dateLabel} 사진`}
            className="size-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-sm font-medium text-stamp-ink">
          {dateLabel}
        </p>
        <p className="mt-0.5 font-sans text-xs text-stamp-ink/50">
          {daysLeft}일 후 영구 삭제
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 min-w-20 gap-1"
          onClick={onRestore}
        >
          <RotateCcw className="size-3.5" />
          복원
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-11 min-w-20 gap-1"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
          삭제
        </Button>
      </div>
    </li>
  );
}
