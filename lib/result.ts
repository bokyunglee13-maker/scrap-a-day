// lib/result.ts
// Shared discriminated union for all DB / IO operations.
// Per `db-architect` §1 and PRD §09: functions return Result<T> instead of throwing.
// Callers use `if (result.ok)` narrowing.

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** Convenience constructors — optional, prefer object literals for clarity. */
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(error: string): Result<T> => ({ ok: false, error });
