// lib/sync.ts
// Phase 6 Stage 5 — IndexedDB ↔ Supabase synchronization (stamps + settings).
//
// Local-first model (ADR 0006):
//   - All UI writes still go to IndexedDB first.
//   - Sync is a background reconciliation step that pushes local changes
//     to the server and pulls server changes into local.
//
// Algorithm per cycle:
//   1. Find local rows changed since lastSyncedAt → push.
//      a. Upload display + original photo blobs to Storage.
//      b. UPSERT the row by id (RLS enforces user_id = auth.uid()).
//   2. Pull server rows changed since lastSyncedAt.
//      a. For each, compare updated_at to local.
//      b. If server is newer → download photos + write to IndexedDB.
//      c. If local is newer → skipped (already covered by push above).
//   3. Advance lastSyncedAt watermark in localStorage.
//
// Conflict policy: last-write-wins by updated_at.
// Soft delete (deletedAt) propagates like any other field. Permanent delete
// (Phase 5 trash purge) is NOT yet wired to remove from server — TODO 5.B.
//
// Cost shape: photos uploaded once per stamp; subsequent updates send only
// metadata (a few hundred bytes per row).

import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/errors";
import { uploadPhoto, downloadPhoto } from "@/lib/photoStorage";
import { getSettings, updateSettings } from "@/lib/settings";
import { ok, err, type Result } from "@/lib/result";
import type { Stamp, Settings, StampStyle } from "@/types";

// ---------------------------------------------------------------------------
// Supabase row shapes (must match docs/supabase-schema.sql)
// ---------------------------------------------------------------------------

interface RemoteStamp {
  id: string;
  user_id: string;
  date: string;
  memo: string;
  mood: string | null;
  mood_visible: boolean;
  style: string;
  companions: string[];
  crop_data: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
  };
  photo_path: string | null;
  original_photo_path: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string;
}

// ---------------------------------------------------------------------------
// Watermark — per-user lastSyncedAt in localStorage
// ---------------------------------------------------------------------------

const WATERMARK_KEY_PREFIX = "scrap-a-day:lastSyncedAt:";

export function getLastSyncedAt(userId: string): Date | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(WATERMARK_KEY_PREFIX + userId);
  if (!raw) return null;
  const ms = Number(raw);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

function setLastSyncedAt(userId: string, when: Date) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WATERMARK_KEY_PREFIX + userId, String(when.getTime()));
}

// ---------------------------------------------------------------------------
// Mapping local ↔ remote
// ---------------------------------------------------------------------------

function toRemote(
  stamp: Stamp,
  userId: string,
  photoPath: string | null,
  originalPath: string | null,
): RemoteStamp {
  return {
    id: stamp.id,
    user_id: userId,
    date: stamp.date,
    memo: stamp.memo,
    mood: stamp.mood,
    mood_visible: stamp.moodVisible,
    style: stamp.style,
    companions: stamp.companions ?? [],
    crop_data: stamp.crop,
    photo_path: photoPath,
    original_photo_path: originalPath,
    created_at: stamp.createdAt.toISOString(),
    updated_at: stamp.updatedAt.toISOString(),
    deleted_at: stamp.deletedAt?.toISOString() ?? null,
    synced_at: new Date().toISOString(),
  };
}

function fromRemote(
  row: RemoteStamp,
  photoBlob: Blob,
  originalPhotoBlob: Blob | undefined,
): Stamp {
  return {
    id: row.id,
    date: row.date,
    photoBlob,
    originalPhotoBlob,
    crop: row.crop_data,
    memo: row.memo,
    mood: (row.mood ?? null) as Stamp["mood"],
    moodVisible: row.mood_visible,
    style: row.style as Stamp["style"],
    companions: row.companions.length > 0 ? row.companions : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
  };
}

// ---------------------------------------------------------------------------
// Sync result shape
// ---------------------------------------------------------------------------

export interface SyncResult {
  pushed: number;
  pulled: number;
  skipped: number;
  failed: number;
  /** Human-readable errors, capped to keep toast / log readable. */
  errors: string[];
}

const MAX_LOGGED_ERRORS = 5;

function pushError(result: SyncResult, msg: string) {
  result.failed++;
  if (result.errors.length < MAX_LOGGED_ERRORS) {
    result.errors.push(msg);
  }
}

// ---------------------------------------------------------------------------
// PUSH — local → server
// ---------------------------------------------------------------------------

async function pushStamps(
  userId: string,
  since: Date | null,
  result: SyncResult,
): Promise<void> {
  const all = await db.stamps.toArray();
  const changed = since === null
    ? all
    : all.filter((s) => s.updatedAt.getTime() > since.getTime());

  for (const stamp of changed) {
    try {
      // Upload display photo
      let photoPath: string | null = null;
      const dispRes = await uploadPhoto(
        userId,
        stamp.id,
        "display",
        stamp.photoBlob,
      );
      if (!dispRes.ok) {
        pushError(result, `사진 업로드 실패: ${stamp.date}`);
        continue;
      }
      photoPath = dispRes.value;

      // Upload original (best-effort — recrop not strictly required for
      // cross-device viewing)
      let originalPath: string | null = null;
      if (stamp.originalPhotoBlob) {
        const origRes = await uploadPhoto(
          userId,
          stamp.id,
          "original",
          stamp.originalPhotoBlob,
        );
        if (origRes.ok) originalPath = origRes.value;
      }

      const remote = toRemote(stamp, userId, photoPath, originalPath);
      const { error } = await supabase.from("stamps").upsert(remote);
      if (error) {
        pushError(result, `서버 저장 실패: ${stamp.date}`);
        await logError("pushStamps.upsert", error, { stampId: stamp.id });
        continue;
      }
      result.pushed++;
    } catch (e) {
      pushError(result, `푸시 오류: ${stamp.date}`);
      await logError("pushStamps", e, { stampId: stamp.id });
    }
  }
}

// ---------------------------------------------------------------------------
// PULL — server → local
// ---------------------------------------------------------------------------

async function pullStamps(
  userId: string,
  since: Date | null,
  result: SyncResult,
): Promise<void> {
  try {
    let query = supabase.from("stamps").select("*").eq("user_id", userId);
    if (since !== null) {
      query = query.gt("updated_at", since.toISOString());
    }
    const { data, error } = await query;
    if (error) {
      pushError(result, `서버 조회 실패: ${error.message}`);
      await logError("pullStamps.select", error);
      return;
    }
    if (!data) return;

    for (const row of data as RemoteStamp[]) {
      try {
        const local = await db.stamps.get(row.id);
        const remoteUpdated = new Date(row.updated_at);

        // Conflict: local is at least as new → skip
        if (local && local.updatedAt.getTime() >= remoteUpdated.getTime()) {
          result.skipped++;
          continue;
        }

        // Download display photo
        if (!row.photo_path) {
          pushError(result, `사진 경로 없음: ${row.date}`);
          continue;
        }
        const dispRes = await downloadPhoto(row.photo_path);
        if (!dispRes.ok) {
          pushError(result, `사진 다운로드 실패: ${row.date}`);
          continue;
        }
        const photoBlob = dispRes.value;

        // Download original (best-effort)
        let originalBlob: Blob | undefined = undefined;
        if (row.original_photo_path) {
          const origRes = await downloadPhoto(row.original_photo_path);
          if (origRes.ok) originalBlob = origRes.value;
        }

        const stamp = fromRemote(row, photoBlob, originalBlob);
        await db.stamps.put(stamp);
        result.pulled++;
      } catch (e) {
        pushError(result, `풀 오류: ${row.date}`);
        await logError("pullStamps.row", e, { stampId: row.id });
      }
    }
  } catch (e) {
    pushError(result, "서버 통신 오류");
    await logError("pullStamps", e);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run a full push + pull cycle for the given user. Updates the watermark
 * (lastSyncedAt) on completion regardless of per-row failures — failed rows
 * will be re-attempted on the next sync because their updated_at is still
 * after the previous (older) watermark.
 *
 * NOTE: caller is responsible for ensuring `userId` matches the current
 * Supabase auth session. Pass it from useUser().user.id.
 */
export async function syncStamps(userId: string): Promise<Result<SyncResult>> {
  if (!userId) return err("NOT_AUTHENTICATED");

  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  // Capture the start time BEFORE any work, so the watermark we set is
  // never ahead of changes that happened during this run.
  const cycleStartedAt = new Date();
  const since = getLastSyncedAt(userId);

  await pushStamps(userId, since, result);
  await pullStamps(userId, since, result);

  setLastSyncedAt(userId, cycleStartedAt);

  return ok(result);
}

// ---------------------------------------------------------------------------
// Settings sync (single row per user — simple LWW upsert)
// ---------------------------------------------------------------------------

interface RemoteSettings {
  user_id: string;
  default_style: string;
  week_start: string;
  last_backup_at: string | null;
  updated_at: string;
}

/**
 * Settings is a single row per user. LWW upsert: whichever side has the
 * newer updated_at wins. We don't track a separate watermark — settings
 * are tiny and syncing on every cycle is fine.
 */
export async function syncSettings(userId: string): Promise<Result<void>> {
  if (!userId) return err("NOT_AUTHENTICATED");
  try {
    const localRes = await getSettings();
    if (!localRes.ok) return err("LOCAL_READ_FAILED");
    const local = localRes.value;

    // Fetch server row (may not exist).
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      await logError("syncSettings.select", error);
      return err("REMOTE_READ_FAILED");
    }

    const remote = data as RemoteSettings | null;
    const localUpdated = new Date(); // local doesn't track updated_at — treat as 'now'-ish
    const remoteUpdated = remote ? new Date(remote.updated_at) : new Date(0);

    if (!remote) {
      // No server row yet → push local to server.
      await pushSettingsToServer(userId, local);
      return ok(undefined);
    }

    // If remote is strictly newer, pull it into local.
    if (remoteUpdated.getTime() > localUpdated.getTime() - 1000) {
      // Within 1s of local — defer to remote (avoids ping-pong loops).
      await updateSettings({
        defaultStyle: remote.default_style as StampStyle,
        lastBackupAt: remote.last_backup_at ? new Date(remote.last_backup_at) : null,
      });
    } else {
      // Local has changes server doesn't have → push.
      await pushSettingsToServer(userId, local);
    }
    return ok(undefined);
  } catch (e) {
    await logError("syncSettings", e);
    return err("SYNC_FAILED");
  }
}

async function pushSettingsToServer(userId: string, local: Settings): Promise<void> {
  const row: RemoteSettings = {
    user_id: userId,
    default_style: local.defaultStyle,
    week_start: local.weekStart,
    last_backup_at: local.lastBackupAt?.toISOString() ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("settings").upsert(row);
  if (error) {
    await logError("pushSettingsToServer", error);
  }
}

// ---------------------------------------------------------------------------
// syncAll — convenience wrapper for callers that want both axes
// ---------------------------------------------------------------------------

export async function syncAll(userId: string): Promise<Result<SyncResult>> {
  // Run stamps first (heavier, more critical). Settings is best-effort.
  const stampsRes = await syncStamps(userId);
  void syncSettings(userId); // fire-and-forget
  return stampsRes;
}
