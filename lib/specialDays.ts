// lib/specialDays.ts
// Special-day detection for the stamp visual overlay.
//
// Solar dates are matched on MM-DD (independent of year).
// Lunar dates (설날, 추석) are hardcoded for 2026-2030 — extend later or move
// to a lunar conversion library when that range runs out.

export type SpecialDay =
  | "new-year"        // 1월 1일
  | "valentine"       // 2월 14일
  | "white-day"       // 3월 14일
  | "pepero"          // 11월 11일
  | "lunar-new-year"  // 설날 (음력 1월 1일)
  | "chuseok";        // 추석 (음력 8월 15일)

const SOLAR_FIXED: Record<string, SpecialDay> = {
  "01-01": "new-year",
  "02-14": "valentine",
  "03-14": "white-day",
  "11-11": "pepero",
};

// Pre-computed lunar dates for 2026-2030. Source: Korea Astronomy Institute
// public calendar. Re-verify before extending past 2030.
const LUNAR_DATES: Record<string, SpecialDay> = {
  // 설날 (음력 1월 1일)
  "2026-02-17": "lunar-new-year",
  "2027-02-06": "lunar-new-year",
  "2028-01-26": "lunar-new-year",
  "2029-02-13": "lunar-new-year",
  "2030-02-03": "lunar-new-year",
  // 추석 (음력 8월 15일)
  "2026-09-25": "chuseok",
  "2027-09-15": "chuseok",
  "2028-10-03": "chuseok",
  "2029-09-22": "chuseok",
  "2030-09-11": "chuseok",
};

export const SPECIAL_DAY_LABEL: Record<SpecialDay, string> = {
  "new-year": "새해",
  valentine: "발렌타인",
  "white-day": "화이트데이",
  pepero: "빼빼로데이",
  "lunar-new-year": "설날",
  chuseok: "추석",
};

/**
 * Get the special-day key for a yyyy-MM-dd date, or null.
 * Lunar dates take precedence over solar (matters in edge cases like
 * Seollal landing on Jan 1 of a future year).
 */
export function getSpecialDay(date: string): SpecialDay | null {
  const lunar = LUNAR_DATES[date];
  if (lunar) return lunar;
  const mmdd = date.slice(5); // 'YYYY-MM-DD' → 'MM-DD'
  return SOLAR_FIXED[mmdd] ?? null;
}
