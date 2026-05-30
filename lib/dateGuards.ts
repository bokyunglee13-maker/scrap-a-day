// lib/dateGuards.ts
// Registration eligibility for a given date.
//
// Rules (Phase 5+, per user feedback):
//   - Future dates: blocked (existing, PRD §04 / §05).
//   - This month's past + today: allowed.
//   - Past months: BLOCKED — the user wants to keep monthly records bounded
//     to the current month and avoid backfilling distant memories.
//
// Existing stamps in past months still display and remain viewable / editable
// from the detail screen. Only NEW registration on past-month dates is denied.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function todayKey(today: Date = new Date()): string {
  const t = startOfDay(today);
  const yyyy = t.getFullYear();
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const dd = String(t.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonthKey(today: Date = new Date()): string {
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

/**
 * iso (yyyy-MM-dd) is strictly after today.
 */
export function isFutureDate(iso: string, today: Date = new Date()): boolean {
  return iso > todayKey(today);
}

/**
 * iso is in a month earlier than today's month
 * (e.g., today = 5/30, iso = 4/15 → true; iso = 5/1 → false).
 */
export function isPastMonth(iso: string, today: Date = new Date()): boolean {
  return iso < startOfMonthKey(today);
}

/**
 * A date is registerable iff it is in the current month and not in the future.
 * (Today is always registerable.)
 */
export function isRegisterable(iso: string, today: Date = new Date()): boolean {
  return !isFutureDate(iso, today) && !isPastMonth(iso, today);
}

// User-visible copy (Phase 5+, tone matches PRD §10 §5.2 — gentle, no blame).
export const REGISTRATION_BLOCKED_MESSAGE = {
  future: "내일을 기다려요",
  pastMonth: "이 달의 기록만 채워볼까요",
} as const;
