"use client";

// app/settings/backup/page.tsx
// Phase 5 — JSON / ZIP exports.
// PRD §07, PRD §11 §9.2.4, PRD §15.5.1.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileDown, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { backupFilename, exportJson, exportPhotosZip } from "@/lib/backup";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";

function downloadBlob(blob: Blob, filename: string): boolean {
  // Synthesize an <a download> click. Returns false if the click is blocked
  // (some mobile browsers throw a SecurityError when not triggered by a
  // direct user gesture; our caller handles fallback messaging).
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  } finally {
    // Release after a tick so the browser has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default function BackupPage() {
  const [lastBackup, setLastBackup] = useState<Date | null | undefined>(
    undefined,
  );
  const [jsonBusy, setJsonBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipProgress, setZipProgress] = useState<{
    processed: number;
    total: number;
    failed: number;
  } | null>(null);

  const refreshLastBackup = async () => {
    const res = await getSettings();
    setLastBackup(res.ok ? res.value.lastBackupAt : null);
  };

  useEffect(() => {
    void refreshLastBackup();
  }, []);

  const handleJson = async () => {
    setJsonBusy(true);
    const res = await exportJson();
    if (!res.ok) {
      setJsonBusy(false);
      toast.error("백업 중 문제가 생겼어요. 잠시 후 다시 시도해주세요");
      return;
    }
    const ok = downloadBlob(res.value, backupFilename("json"));
    setJsonBusy(false);
    if (ok) {
      toast.success("백업 파일을 다운로드했어요");
      void refreshLastBackup();
    } else {
      toast.error("팝업 차단을 해제한 뒤 다시 시도해주세요");
    }
  };

  const handleZip = async () => {
    setZipBusy(true);
    setZipProgress({ processed: 0, total: 0, failed: 0 });
    // TODO Phase 5.5+: monthly split on OOM (PRD §11 §9.2.4).
    const res = await exportPhotosZip((p) => setZipProgress(p));
    if (!res.ok) {
      setZipBusy(false);
      setZipProgress(null);
      toast.error("백업 중 문제가 생겼어요. 잠시 후 다시 시도해주세요");
      return;
    }
    const { blob, failedDates } = res.value;
    const ok = downloadBlob(blob, backupFilename("zip"));
    setZipBusy(false);
    setZipProgress(null);
    if (!ok) {
      toast.error("팝업 차단을 해제한 뒤 다시 시도해주세요");
      return;
    }
    toast.success("백업 파일을 다운로드했어요");
    if (failedDates.length > 0) {
      toast.warning(`${failedDates.length}개 사진이 누락됐어요`);
    }
    void refreshLastBackup();
  };

  const lastBackupLabel = (() => {
    if (lastBackup === undefined) return "확인 중…";
    if (lastBackup === null) return "백업한 적 없음";
    return `마지막 백업: ${formatBackupDate(lastBackup)}`;
  })();

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="설정으로"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-sm text-stamp-ink/70 hover:bg-stamp-ink/5 hover:text-stamp-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-serif text-lg font-medium text-stamp-ink md:text-xl">
          백업
        </h1>
      </header>

      <p className="mt-3 font-sans text-xs text-stamp-ink/50">
        {lastBackupLabel}
      </p>

      {/* JSON */}
      <section className="mt-6 rounded-sm border border-stamp-ink/10 bg-white/40 p-4">
        <h2 className="flex items-center gap-2 font-serif text-base font-medium text-stamp-ink">
          <FileDown className="size-4" />
          JSON 내보내기
        </h2>
        <p className="mt-2 font-sans text-sm text-stamp-ink/70">
          메모, 감정, 스타일, 날짜 정보를 JSON 파일로 저장합니다. (사진은
          포함되지 않습니다)
        </p>
        <Button
          type="button"
          className="mt-4 h-12 w-full"
          onClick={handleJson}
          disabled={jsonBusy}
        >
          {jsonBusy ? "내보내는 중…" : "JSON 다운로드"}
        </Button>
      </section>

      {/* ZIP */}
      <section className="mt-4 rounded-sm border border-stamp-ink/10 bg-white/40 p-4">
        <h2 className="flex items-center gap-2 font-serif text-base font-medium text-stamp-ink">
          <ImageIcon className="size-4" />
          사진 ZIP
        </h2>
        <p className="mt-2 font-sans text-sm text-stamp-ink/70">
          모든 사진을 ZIP 파일로 묶어서 저장합니다.
        </p>

        {zipBusy && zipProgress ? (
          <div className="mt-3">
            <p className="font-sans text-xs text-stamp-ink/60">
              처리 중: {zipProgress.processed}/{zipProgress.total}
              {zipProgress.failed > 0
                ? ` (누락 ${zipProgress.failed})`
                : ""}
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stamp-ink/10">
              <div
                className="h-full bg-stamp-ink/60 transition-[width] duration-200"
                style={{
                  width: `${
                    zipProgress.total === 0
                      ? 0
                      : Math.round(
                          (zipProgress.processed / zipProgress.total) * 100,
                        )
                  }%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          className="mt-4 h-12 w-full"
          onClick={handleZip}
          disabled={zipBusy}
        >
          {zipBusy ? "압축 중…" : "사진 ZIP 다운로드"}
        </Button>
      </section>
    </main>
  );
}

function formatBackupDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
