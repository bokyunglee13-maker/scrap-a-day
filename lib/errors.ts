// lib/errors.ts
// Phase 2: console + IndexedDB-backed error log per PRD §12.2.
//
// Policies enforced here:
//   - Sanitize context: no Blobs, no strings > 100 chars (sensitive content).
//   - Always console.error first — logging itself must never throw.
//   - Persist to `db.errors` (best-effort, swallowed on failure).
//   - Cap: at most 500 rows. Excess oldest-first deletion inside one transaction.
//   - Retention: drop entries older than 30 days at log time (cheap range delete).
//   - SSR-safe: if `indexedDB` is unavailable (server, build), only console.error.

import { db } from '@/lib/db';
import type { ErrorLog } from '@/types';

export type ErrorContext = Record<string, unknown>;

const MAX_ENTRIES = 500;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function logError(
  source: string,
  error: unknown,
  context?: ErrorContext,
): Promise<void> {
  const safe = sanitize(context);

  // 1. Console first. Cheap, synchronous, always works.
  // eslint-disable-next-line no-console
  console.error(`[${source}]`, error, safe);

  // 2. Persist to IndexedDB. Swallow any failure — logging must never throw.
  if (typeof indexedDB === 'undefined') return;

  try {
    const entry: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      source,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: safe,
    };

    await db.transaction('rw', db.errors, async () => {
      // Add the new entry.
      await db.errors.add(entry);

      // Auto-cleanup: drop entries older than 30 days.
      const cutoff = new Date(Date.now() - RETENTION_MS);
      await db.errors.where('timestamp').below(cutoff).delete();

      // Cap at MAX_ENTRIES. If still over, delete oldest by timestamp.
      const count = await db.errors.count();
      if (count > MAX_ENTRIES) {
        const overflow = count - MAX_ENTRIES;
        const oldest = await db.errors
          .orderBy('timestamp')
          .limit(overflow)
          .primaryKeys();
        if (oldest.length > 0) {
          await db.errors.bulkDelete(oldest);
        }
      }
    });
  } catch {
    // Intentional swallow. We've already console.error'd above.
    // Throwing here would defeat the purpose of error logging.
  }
}

function sanitize(ctx?: ErrorContext): ErrorContext | undefined {
  if (!ctx) return undefined;
  const safe: ErrorContext = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v instanceof Blob) continue;
    if (typeof v === 'string' && v.length > 100) continue;
    safe[k] = v;
  }
  return safe;
}
