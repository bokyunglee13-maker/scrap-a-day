// lib/backup.ts
// Backup exports per PRD §07.
//
// Two flavors:
//   - exportJson(): metadata only (no blobs) → small file, fast.
//   - exportPhotosZip(onProgress?): photos packed into a ZIP, named by date.
//
// PRD §11 §9.2.4 failure rules respected:
//   - Partial success is success — emit what we can, surface a warning on the rest.
//   - ZIP generation streams one photo at a time (lets the browser GC blobs between
//     iterations) to keep memory low on phones.
//
// On successful export we update settings.lastBackupAt so the main screen can
// fade the "오랜만이에요 — 백업해두면 안심이에요" nag (PRD §15.5.1).

import JSZip from "jszip";
import { db } from "@/lib/db";
import { logError } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { recordBackup } from "@/lib/settings";
import type { Stamp } from "@/types";

export interface JsonBackup {
  schemaVersion: 1;
  exportedAt: string; // ISO
  stamps: Array<Omit<Stamp, "photoBlob" | "originalPhotoBlob"> & {
    // Blobs are deliberately not in the JSON — they'd bloat the file 1000x.
    // The companion ZIP carries the photo bytes.
    hasPhoto: true;
  }>;
}

/**
 * Export ALL stamps (active + trashed) metadata as a JSON blob.
 * Returns the blob; caller triggers download.
 */
export async function exportJson(): Promise<Result<Blob>> {
  try {
    const all = await db.stamps.toArray();
    const payload: JsonBackup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      stamps: all.map((s) => {
        const { photoBlob: _p, originalPhotoBlob: _o, ...rest } = s;
        return { ...rest, hasPhoto: true };
      }),
    };
    const json = JSON.stringify(payload, dateReviver, 2);
    const blob = new Blob([json], { type: "application/json" });
    await recordBackup();
    return ok(blob);
  } catch (e) {
    await logError("exportJson", e);
    return err("DB_ERROR");
  }
}

export interface ZipProgress {
  processed: number;
  total: number;
  failed: number;
}

export interface ZipExportResult {
  blob: Blob;
  failedDates: string[];
}

/**
 * Export all photos (active stamps only) into a ZIP.
 * Each file named by stamp date. Originals when available, cropped otherwise.
 * onProgress is called after each photo so the UI can update.
 *
 * Returns blob + a list of dates whose photos failed to pack (partial-success
 * semantics per PRD §11 §9.2.4).
 */
export async function exportPhotosZip(
  onProgress?: (p: ZipProgress) => void,
): Promise<Result<ZipExportResult>> {
  try {
    const all = await db.stamps.toArray();
    const active = all.filter((s) => s.deletedAt === null);
    const zip = new JSZip();
    const failedDates: string[] = [];
    let processed = 0;

    for (const stamp of active) {
      try {
        const source = stamp.originalPhotoBlob ?? stamp.photoBlob;
        const ext = guessExt(source.type);
        const buffer = await source.arrayBuffer();
        zip.file(`${stamp.date}${ext}`, buffer);
      } catch (e) {
        failedDates.push(stamp.date);
        // Don't logError per-photo — would flood the log on a bad batch.
      }
      processed += 1;
      onProgress?.({ processed, total: active.length, failed: failedDates.length });
    }

    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    await recordBackup();
    return ok({ blob, failedDates });
  } catch (e) {
    await logError("exportPhotosZip", e);
    return err("DB_ERROR");
  }
}

/**
 * Build a stable filename for downloads — `scrap-a-day-YYYY-MM-DD.{ext}`.
 */
export function backupFilename(kind: "json" | "zip", now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const base = kind === "json" ? "scrap-a-day" : "scrap-a-day-photos";
  return `${base}-${yyyy}-${mm}-${dd}.${kind}`;
}

function guessExt(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/svg+xml") return ".svg";
  return ".bin";
}

// JSON.stringify replacer: Dexie returns native Date objects; JSON.stringify
// turns them into ISO strings naturally. This is a placeholder for future
// custom serialization. Kept here so the helper signature is centralized.
function dateReviver(_key: string, value: unknown): unknown {
  return value;
}
