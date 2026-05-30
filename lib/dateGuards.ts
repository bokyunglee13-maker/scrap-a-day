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

// -----------------------------------------------------------------------------
// Search date-range presets (Phase 5+ — used by /search to bound the dataset)
// -----------------------------------------------------------------------------

export type RangePreset = "1mo" | "3mo" | "6mo" | "1yr" | "all";

export const RANGE_PRESET_LABEL: Record<RangePreset, string> = {
  "1mo": "최근 1개월",
  "3mo": "최근 3개월",
  "6mo": "최근 6개월",
  "1yr": "최근 1년",
  all: "전체",
};

export const DEFAULT_RANGE: RangePreset = "3mo";

/**
 * Convert a preset into a yyyy-MM-dd `from` date string (inclusive).
 * Returns null for 'all' (no lower bound).
 */
export function rangePresetToFrom(
  preset: RangePreset,
  today: Date = new Date(),
): string | null {
  if (preset === "all") return null;
  const months = preset === "1mo" ? 1 : preset === "3mo" ? 3 : preset === "6mo" ? 6 : 12;
  const from = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
  const yyyy = from.getFullYear();
  const mm = String(from.getMonth() + 1).padStart(2, "0");
  const dd = String(from.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseRangePreset(value: string | null | undefined): RangePreset {
  if (value === "1mo" || value === "3mo" || value === "6mo" || value === "1yr" || value === "all") {
    return value;
  }
  return DEFAULT_RANGE;
}

