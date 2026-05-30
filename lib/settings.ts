// lib/settings.ts
// Single-row Settings (id='default') per PRD §09.
//
// Stores:
//   - defaultStyle: the user's preferred stamp style for new registrations
//   - weekStart: fixed 'monday' for now
//   - lastBackupAt: updated by backup.ts; used by the main-screen nag

import { db } from "@/lib/db";
import { logError } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import type { Settings } from "@/types";

const DEFAULT_SETTINGS: Settings = {
  id: "default",
  defaultStyle: "minimal",
  weekStart: "monday",
  lastBackupAt: null,
  disabledSpecialDays: [],
};

/**
 * Get current settings. Materializes the default row on first read.
 */
export async function getSettings(): Promise<Result<Settings>> {
  try {
    const existing = await db.settings.get("default");
    if (existing) return ok(existing);
    await db.settings.put(DEFAULT_SETTINGS);
    return ok(DEFAULT_SETTINGS);
  } catch (e) {
    await logError("getSettings", e);
    return err("DB_ERROR");
  }
}

/**
 * Patch settings. Returns the merged row. Creates the default row if missing.
 */
export async function updateSettings(
  patch: Partial<Omit<Settings, "id">>,
): Promise<Result<Settings>> {
  try {
    const updated = await db.transaction("rw", db.settings, async () => {
      const current = (await db.settings.get("default")) ?? DEFAULT_SETTINGS;
      const next: Settings = { ...current, ...patch };
      await db.settings.put(next);
      return next;
    });
    return ok(updated);
  } catch (e) {
    await logError("updateSettings", e, { patchedKeys: Object.keys(patch) });
    return err("DB_ERROR");
  }
}

/**
 * Stamp lastBackupAt with now(). Called by lib/backup.ts after a successful
 * JSON or ZIP export.
 */
export async function recordBackup(): Promise<Result<void>> {
  const r = await updateSettings({ lastBackupAt: new Date() });
  return r.ok ? ok(undefined) : err(r.error);
}

/**
 * Days since the last backup, or null if never. Used by the main-screen nag.
 */
export function daysSinceBackup(lastBackupAt: Date | null): number | null {
  if (!lastBackupAt) return null;
  const elapsed = Date.now() - lastBackupAt.getTime();
  return Math.floor(elapsed / (24 * 60 * 60 * 1000));
}
