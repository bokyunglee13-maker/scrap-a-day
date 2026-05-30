// lib/photoStorage.ts
// Phase 6 Stage 5 — Supabase Storage abstraction for stamp photos.
//
// Path structure: {user_id}/{stamp_id}-{kind}.{ext}
//   kind = 'display' (cropped result, used in UI)
//        | 'original' (pre-crop source, used by Phase 4 recropStamp)
//   ext  = derived from Blob.type (jpg/png/webp/bin)
//
// RLS on storage.objects allows access only when the first path segment
// equals auth.uid()::text (see docs/supabase-schema.sql §4).

import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";

const BUCKET = "stamp-photos";

export type PhotoKind = "display" | "original";

function extFromBlob(blob: Blob): string {
  if (blob.type === "image/jpeg") return "jpg";
  if (blob.type === "image/png") return "png";
  if (blob.type === "image/webp") return "webp";
  return "bin";
}

function pathFor(
  userId: string,
  stampId: string,
  kind: PhotoKind,
  ext: string,
): string {
  return `${userId}/${stampId}-${kind}.${ext}`;
}

/**
 * Upload a photo blob. Overwrites if path already exists (recrop flow).
 * Returns the storage path to persist in the stamps row.
 */
export async function uploadPhoto(
  userId: string,
  stampId: string,
  kind: PhotoKind,
  blob: Blob,
): Promise<Result<string>> {
  try {
    const ext = extFromBlob(blob);
    const path = pathFor(userId, stampId, kind, ext);
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type || "application/octet-stream",
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      await logError("uploadPhoto", error, { stampId, kind });
      return err(`STORAGE_UPLOAD_FAILED: ${error.message}`);
    }
    return ok(path);
  } catch (e) {
    await logError("uploadPhoto", e, { stampId, kind });
    return err("STORAGE_UPLOAD_FAILED");
  }
}

/**
 * Download a photo blob by storage path.
 */
export async function downloadPhoto(path: string): Promise<Result<Blob>> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      await logError("downloadPhoto", error, { path });
      return err(`STORAGE_DOWNLOAD_FAILED: ${error?.message ?? "no data"}`);
    }
    return ok(data);
  } catch (e) {
    await logError("downloadPhoto", e, { path });
    return err("STORAGE_DOWNLOAD_FAILED");
  }
}

/**
 * Permanently delete photo(s) from Storage. Used when a stamp is permanently
 * deleted from the trash.
 */
export async function deletePhotos(paths: string[]): Promise<Result<void>> {
  if (paths.length === 0) return ok(undefined);
  try {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) {
      await logError("deletePhotos", error, { count: paths.length });
      return err(`STORAGE_DELETE_FAILED: ${error.message}`);
    }
    return ok(undefined);
  } catch (e) {
    await logError("deletePhotos", e, { count: paths.length });
    return err("STORAGE_DELETE_FAILED");
  }
}
