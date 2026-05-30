// lib/specialDays.ts
// Special-day detection for the stamp visual overlay.
//
// Solar dates are matched on MM-DD (independent of year).
// Lunar dates (설날, 추석, 부처님 오신날) are hardcoded for 2026-2030 — extend later or
// move to a lunar conversion library when that range runs out.

export type SpecialDay =
  // Phase 1 — existing 6
  | "new-year"        // 1월 1일
  | "valentine"       // 2월 14일
  | "white-day"       // 3월 14일
  | "pepero"          // 11월 11일
  | "lunar-new-year"  // 설날 (음력 1월 1일)
  | "chuseok"         // 추석 (음력 8월 15일)
  // Phase 2 — lifestyle additions
  | "children-day"      // 5월 5일
  | "parents-day"       // 5월 8일
  | "teachers-day"      // 5월 15일
  | "buddha-birthday"   // 음력 4월 8일 (부처님 오신날)
  | "halloween"         // 10월 31일
  | "christmas"         // 12월 25일
  // Phase 2 — public holidays (subdued tone in stickers)
  | "samiljeol"             // 3월 1일 (삼일절)
  | "memorial-day"          // 6월 6일 (현충일)
  | "liberation-day"        // 8월 15일 (광복절)
  | "national-foundation"   // 10월 3일 (개천절)
  | "hangeul-day";          // 10월 9일 (한글날)

const SOLAR_FIXED: Record<string, SpecialDay> = {
  "01-01": "new-year",
  "02-14": "valentine",
  "03-01": "samiljeol",
  "03-14": "white-day",
  "05-05": "children-day",
  "05-08": "parents-day",
  "05-15": "teachers-day",
  "06-06": "memorial-day",
  "08-15": "liberation-day",
  "10-03": "national-foundation",
  "10-09": "hangeul-day",
  "10-31": "halloween",
  "11-11": "pepero",
  "12-25": "christmas",
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
  // 부처님 오신날 (음력 4월 8일)
  "2026-05-24": "buddha-birthday",
  "2027-05-13": "buddha-birthday",
  "2028-05-02": "buddha-birthday",
  "2029-05-20": "buddha-birthday",
  "2030-05-09": "buddha-birthday",
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
  "children-day": "어린이날",
  "parents-day": "어버이날",
  "teachers-day": "스승의 날",
  "buddha-birthday": "부처님 오신날",
  halloween: "핼러윈",
  christmas: "크리스마스",
  samiljeol: "삼일절",
  "memorial-day": "현충일",
  "liberation-day": "광복절",
  "national-foundation": "개천절",
  "hangeul-day": "한글날",
};

/**
 * Display date string for a special day key. Solar dates show as 'M/D';
 * lunar dates show '음력 M/D'. Used in the settings list and tooltips.
 */
export const SPECIAL_DAY_DISPLAY_DATE: Record<SpecialDay, string> = {
  "new-year": "1/1",
  valentine: "2/14",
  "white-day": "3/14",
  pepero: "11/11",
  "lunar-new-year": "음력 1/1",
  chuseok: "음력 8/15",
  "children-day": "5/5",
  "parents-day": "5/8",
  "teachers-day": "5/15",
  "buddha-birthday": "음력 4/8",
  halloween: "10/31",
  christmas: "12/25",
  samiljeol: "3/1",
  "memorial-day": "6/6",
  "liberation-day": "8/15",
  "national-foundation": "10/3",
  "hangeul-day": "10/9",
};

/**
 * Stable display order for the settings list — solar dates ordered by
 * calendar (Jan→Dec), then lunar dates grouped at the end (since their
 * solar date moves each year).
 */
export const SPECIAL_DAY_ORDER: SpecialDay[] = [
  "new-year",
  "valentine",
  "samiljeol",
  "white-day",
  "children-day",
  "parents-day",
  "teachers-day",
  "memorial-day",
  "liberation-day",
  "national-foundation",
  "hangeul-day",
  "halloween",
  "pepero",
  "christmas",
  // Lunar at the end — their solar date is year-dependent
  "lunar-new-year",
  "buddha-birthday",
  "chuseok",
];

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
