// lib/trash.ts
// Trash management per PRD §07. Soft-deleted stamps live here for 30 days.
//
// Functions:
//   - getTrashedStamps(): all stamps with deletedAt !== null, ordered newest-first
//   - cleanExpiredTrash(): permanently deletes stamps whose deletedAt is > 30 days ago
//   - permanentDeleteStamp(id): user-initiated permanent delete (irreversible)
//   - emptyTrash(): user-initiated wipe of all trashed stamps
//
// All functions use Result<T>, transaction, logError pattern.

import { db } from "@/lib/db";
import { logError } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import type { Stamp } from "@/types";

const TRASH_RETENTION_DAYS = 30;
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * All trashed stamps (deletedAt != null), newest deletion first.
 */
export async function getTrashedStamps(): Promise<Result<Stamp[]>> {
  try {
    const all = await db.stamps.toArray();
    const trashed = all
      .filter((s) => s.deletedAt !== null)
      .sort((a, b) => {
        const at = a.deletedAt?.getTime() ?? 0;
        const bt = b.deletedAt?.getTime() ?? 0;
        return bt - at;
      });
    return ok(trashed);
  } catch (e) {
    await logError("getTrashedStamps", e);
    return err("DB_ERROR");
  }
}

/**
 * Count of trashed stamps. Cheaper than fetching them.
 */
export async function getTrashCount(): Promise<Result<number>> {
  try {
    // Dexie can't index null. Filter in JS — usually a small set.
    const all = await db.stamps.toArray();
    const count = all.filter((s) => s.deletedAt !== null).length;
    return ok(count);
  } catch (e) {
    await logError("getTrashCount", e);
    return err("DB_ERROR");
  }
}

/**
 * App-load auto-cleanup. Permanently deletes stamps whose deletedAt is older
 * than the retention window (30 days). Safe to call repeatedly.
 */
export async function cleanExpiredTrash(): Promise<Result<number>> {
  try {
    const cutoff = new Date(Date.now() - TRASH_RETENTION_MS);
    const deletedCount = await db.transaction("rw", db.stamps, async () => {
      const all = await db.stamps.toArray();
      const expiredIds = all
        .filter(
          (s) => s.deletedAt !== null && s.deletedAt.getTime() < cutoff.getTime(),
        )
        .map((s) => s.id);
      if (expiredIds.length === 0) return 0;
      await db.stamps.bulkDelete(expiredIds);
      return expiredIds.length;
    });
    return ok(deletedCount);
  } catch (e) {
    await logError("cleanExpiredTrash", e);
    return err("DB_ERROR");
  }
}

/**
 * User-initiated permanent delete of a single stamp. Idempotent if already gone.
 */
export async function permanentDeleteStamp(id: string): Promise<Result<void>> {
  try {
    await db.transaction("rw", db.stamps, async () => {
      await db.stamps.delete(id);
    });
    return ok(undefined);
  } catch (e) {
    await logError("permanentDeleteStamp", e, { id });
    return err("DB_ERROR");
  }
}

/**
 * Empty the entire trash. Returns count purged.
 */
export async function emptyTrash(): Promise<Result<number>> {
  try {
    const purged = await db.transaction("rw", db.stamps, async () => {
      const all = await db.stamps.toArray();
      const trashedIds = all
        .filter((s) => s.deletedAt !== null)
        .map((s) => s.id);
      if (trashedIds.length === 0) return 0;
      await db.stamps.bulkDelete(trashedIds);
      return trashedIds.length;
    });
    return ok(purged);
  } catch (e) {
    await logError("emptyTrash", e);
    return err("DB_ERROR");
  }
}

/**
 * Days until a stamp is permanently auto-deleted from the trash.
 * Returns 0 if already expired (next cleanExpiredTrash will purge it).
 */
export function daysUntilPermanentDelete(deletedAt: Date): number {
  const elapsed = Date.now() - deletedAt.getTime();
  const remaining = TRASH_RETENTION_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
