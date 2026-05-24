// lib/errors.ts
// Phase 1 implementation: console only. Phase 2 will add IndexedDB writes
// to the `errors` table per PRD §12.2 (max 500 entries, 30-day retention).
//
// Per PRD §12.2 sanitize policy: never include Blobs or long strings
// (memo content, etc.) in error context.

export type ErrorContext = Record<string, unknown>;

export async function logError(
  source: string,
  error: unknown,
  context?: ErrorContext,
): Promise<void> {
  const safe = sanitize(context);
  // eslint-disable-next-line no-console
  console.error(`[${source}]`, error, safe);
  // Phase 2: await db.errors.add({ id, timestamp, source, message, stack, context: safe });
}

function sanitize(ctx?: ErrorContext): ErrorContext | undefined {
  if (!ctx) return undefined;
  const safe: ErrorContext = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v instanceof Blob) continue;
    if (typeof v === "string" && v.length > 100) continue;
    safe[k] = v;
  }
  return safe;
}
