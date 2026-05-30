// lib/stamps.ts
// Stamp CRUD per PRD §09. All functions return Result<T> — none throw.
//
// Invariants enforced:
//   - Unique (date, deletedAt IS NULL) — Dexie does not enforce; we do.
//   - createStamp inside `rw` transaction on db.stamps.
//   - updateStamp signature CANNOT accept photoBlob (PRD §06 §3.4: no replacement).
//   - softDeleteStamp sets deletedAt; never `db.stamps.delete()`.
//   - All catches call `logError` with sanitized context (no Blob, no memo).

import { db } from '@/lib/db';
import { logError } from '@/lib/errors';
import type { Result } from '@/lib/result';
import type { CropData, Mood, Stamp, StampStyle } from '@/types';

export interface StampInput {
  date: string;
  photoBlob: Blob;                // cropped blob (display)
  originalPhotoBlob?: Blob;       // original (for Phase 4 re-crop). Optional for back-compat.
  crop: CropData;
  memo: string;
  mood: Mood | null;
  moodVisible: boolean;
  style: StampStyle;
  companions?: string[];          // Phase 5: 함께한 사람들 (free-text tags)
}

/**
 * Create a new stamp for `data.date`. Returns DUPLICATE_DATE if an active
 * (non-trashed) stamp already exists for that date.
 */
export async function createStamp(data: StampInput): Promise<Result<Stamp>> {
  try {
    // Unique pre-check (outside the tx is fine — the tx still catches a race).
    const existing = await db.stamps
      .where('date')
      .equals(data.date)
      .and((s) => s.deletedAt === null)
      .first();

    if (existing) {
      return { ok: false, error: 'DUPLICATE_DATE' };
    }

    const stamp = await db.transaction('rw', db.stamps, async () => {
      // Re-check inside tx to close the race window.
      const racer = await db.stamps
        .where('date')
        .equals(data.date)
        .and((s) => s.deletedAt === null)
        .first();
      if (racer) {
        throw new Error('DUPLICATE_DATE');
      }

      const now = new Date();
      const newStamp: Stamp = {
        id: crypto.randomUUID(),
        date: data.date,
        photoBlob: data.photoBlob,
        originalPhotoBlob: data.originalPhotoBlob,
        crop: data.crop,
        memo: data.memo,
        mood: data.mood,
        moodVisible: data.moodVisible,
        style: data.style,
        companions: data.companions,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      await db.stamps.add(newStamp);
      return newStamp;
    });

    return { ok: true, value: stamp };
  } catch (e) {
    if (e instanceof Error && e.message === 'DUPLICATE_DATE') {
      return { ok: false, error: 'DUPLICATE_DATE' };
    }
    await logError('createStamp', e, {
      date: data.date,
      style: data.style,
      mood: data.mood,
    });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Find the active stamp for an exact date string, or null.
 */
export async function getStampByDate(
  date: string,
): Promise<Result<Stamp | null>> {
  try {
    const stamp = await db.stamps
      .where('date')
      .equals(date)
      .and((s) => s.deletedAt === null)
      .first();
    return { ok: true, value: stamp ?? null };
  } catch (e) {
    await logError('getStampByDate', e, { date });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * All active stamps with date in the given month. Used by the calendar.
 * Uses an indexed `between` query for speed.
 */
export async function getStampsByMonth(
  year: number,
  month1to12: number,
): Promise<Result<Stamp[]>> {
  try {
    const mm = String(month1to12).padStart(2, '0');
    // Inclusive lower bound, exclusive upper bound via string prefix range.
    const lower = `${year}-${mm}-00`;
    const upper = `${year}-${mm}-32`;
    const stamps = await db.stamps
      .where('date')
      .between(lower, upper, false, false)
      .and((s) => s.deletedAt === null)
      .toArray();
    return { ok: true, value: stamps };
  } catch (e) {
    await logError('getStampsByMonth', e, { year, month: month1to12 });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Update mutable fields of a stamp. Photo blob CANNOT be replaced — the type
 * signature itself prevents it (Partial<Pick<…>> excludes photoBlob).
 */
export async function updateStamp(
  id: string,
  patch: Partial<Pick<Stamp, 'memo' | 'mood' | 'moodVisible' | 'style' | 'crop' | 'companions'>>,
): Promise<Result<Stamp>> {
  try {
    const updated = await db.transaction('rw', db.stamps, async () => {
      const current = await db.stamps.get(id);
      if (!current) {
        throw new Error('NOT_FOUND');
      }
      if (current.deletedAt !== null) {
        throw new Error('DELETED');
      }
      const next: Stamp = {
        ...current,
        ...patch,
        updatedAt: new Date(),
      };
      await db.stamps.put(next);
      return next;
    });
    return { ok: true, value: updated };
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return { ok: false, error: 'NOT_FOUND' };
    }
    if (e instanceof Error && e.message === 'DELETED') {
      return { ok: false, error: 'DELETED' };
    }
    await logError('updateStamp', e, {
      id,
      patchedKeys: Object.keys(patch),
    });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Re-extract and persist a new cropped photoBlob from the user's previously
 * preserved originalPhotoBlob. Phase 4 PRD §06 §3.3: crop is the one
 * "표현(expression)" axis users may revise; this is the dedicated code path
 * for that — `updateStamp` deliberately cannot accept any blob, so the
 * "사진 변경 금지" guard at the type level remains intact.
 *
 * Caller is responsible for extracting `newCroppedBlob` from the ORIGINAL
 * (via `extractCroppedBlob(stamp.originalPhotoBlob, …)`). This function
 * does NOT touch `originalPhotoBlob`, so the user can re-crop again later.
 */
export async function recropStamp(
  id: string,
  newCroppedBlob: Blob,
  newCrop: CropData,
): Promise<Result<Stamp>> {
  try {
    const updated = await db.transaction('rw', db.stamps, async () => {
      const current = await db.stamps.get(id);
      if (!current) {
        throw new Error('NOT_FOUND');
      }
      if (current.deletedAt !== null) {
        throw new Error('DELETED');
      }
      const next: Stamp = {
        ...current,
        photoBlob: newCroppedBlob, // ONLY the cropped blob changes.
        crop: newCrop,
        // originalPhotoBlob: preserved verbatim from `current`.
        updatedAt: new Date(),
      };
      await db.stamps.put(next);
      return next;
    });
    return { ok: true, value: updated };
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return { ok: false, error: 'NOT_FOUND' };
    }
    if (e instanceof Error && e.message === 'DELETED') {
      return { ok: false, error: 'DELETED' };
    }
    await logError('recropStamp', e, { id });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Restore a soft-deleted stamp back to active (deletedAt → null).
 * Used by the 5-second "되돌리기" toast and the trash UI (Phase 5).
 *
 * Conflicts: if another active stamp now occupies this date (e.g., the user
 * created a new one after deleting), returns DUPLICATE_DATE — they must
 * resolve the conflict themselves (PRD §07).
 */
export async function restoreStamp(id: string): Promise<Result<Stamp>> {
  try {
    const restored = await db.transaction('rw', db.stamps, async () => {
      const current = await db.stamps.get(id);
      if (!current) {
        throw new Error('NOT_FOUND');
      }
      if (current.deletedAt === null) {
        // Already active — idempotent return.
        return current;
      }
      const conflict = await db.stamps
        .where('date')
        .equals(current.date)
        .and((s) => s.id !== id && s.deletedAt === null)
        .first();
      if (conflict) {
        throw new Error('DUPLICATE_DATE');
      }
      const next: Stamp = {
        ...current,
        deletedAt: null,
        updatedAt: new Date(),
      };
      await db.stamps.put(next);
      return next;
    });
    return { ok: true, value: restored };
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return { ok: false, error: 'NOT_FOUND' };
    }
    if (e instanceof Error && e.message === 'DUPLICATE_DATE') {
      return { ok: false, error: 'DUPLICATE_DATE' };
    }
    await logError('restoreStamp', e, { id });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Filter active stamps by companion(s) and/or mood(s).
 * - Both arrays optional. Empty arrays mean "no filter on this axis".
 * - When both are present: AND across axes. Within an axis, OR semantics
 *   (stamp matches if it contains ANY of the requested companions / moods).
 * - Returns newest date first.
 */
export async function searchStamps(filter: {
  companions?: string[];
  moods?: Mood[];
}): Promise<Result<Stamp[]>> {
  try {
    const all = await db.stamps.toArray();
    const wantCompanions = filter.companions?.length
      ? new Set(filter.companions)
      : null;
    const wantMoods = filter.moods?.length ? new Set(filter.moods) : null;

    const matches = all.filter((s) => {
      if (s.deletedAt !== null) return false;
      if (wantCompanions) {
        const stampCompanions = s.companions ?? [];
        const hit = stampCompanions.some((c) => wantCompanions.has(c));
        if (!hit) return false;
      }
      if (wantMoods) {
        if (s.mood === null || !wantMoods.has(s.mood)) return false;
      }
      return true;
    });

    // Sort newest date first (string comparison is correct for yyyy-MM-dd).
    matches.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    return { ok: true, value: matches };
  } catch (e) {
    await logError('searchStamps', e, {
      companionCount: filter.companions?.length ?? 0,
      moodCount: filter.moods?.length ?? 0,
    });
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * All unique companion names that have ever been used in an ACTIVE stamp.
 * Used for autocomplete in CompanionPicker and the search filter chip list.
 */
export async function getAllCompanions(): Promise<Result<string[]>> {
  try {
    const all = await db.stamps.toArray();
    const set = new Set<string>();
    for (const s of all) {
      if (s.deletedAt !== null) continue;
      for (const c of s.companions ?? []) {
        const trimmed = c.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    return { ok: true, value: Array.from(set).sort((a, b) => a.localeCompare(b, 'ko')) };
  } catch (e) {
    await logError('getAllCompanions', e);
    return { ok: false, error: 'DB_ERROR' };
  }
}

/**
 * Soft-delete: sets deletedAt to now. Stamp moves to the trash.
 * Never calls db.stamps.delete().
 */
export async function softDeleteStamp(id: string): Promise<Result<Stamp>> {
  try {
    const updated = await db.transaction('rw', db.stamps, async () => {
      const current = await db.stamps.get(id);
      if (!current) {
        throw new Error('NOT_FOUND');
      }
      if (current.deletedAt !== null) {
        // Already trashed — idempotent return.
        return current;
      }
      const next: Stamp = {
        ...current,
        deletedAt: new Date(),
        updatedAt: new Date(),
      };
      await db.stamps.put(next);
      return next;
    });
    return { ok: true, value: updated };
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return { ok: false, error: 'NOT_FOUND' };
    }
    await logError('softDeleteStamp', e, { id });
    return { ok: false, error: 'DB_ERROR' };
  }
}
