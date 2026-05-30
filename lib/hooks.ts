// lib/hooks.ts
// Pure selector for empty-stamp / placeholder hint copy per PRD §10.5.1.
// No IO. The caller resolves IO (today's date, usage stats) and passes a HookContext.

export interface HookContext {
  isFuture: boolean;
  isToday: boolean;
  /** today === last day of the *currently displayed* month */
  isMonthLastDay: boolean;
  /** entire calendar empty (no active stamps anywhere) */
  isFirstUse: boolean;
  /** consecutive past empty days back from today; 0 if today is filled */
  emptyStreak: number;
  /** 0 = today, 1 = yesterday, etc. Negative = future. */
  daysAgo: number;
  /** 0-23, used only as fallback for time-of-day branches */
  hour: number;
}

/**
 * Pick the message for an empty-stamp / placeholder context.
 * Priority order from PRD §10.5.1:
 *   1. 첫 사용
 *   2. 미래 날짜
 *   3. 월 마지막 날
 *   4. 연속 7일+ 빈칸
 *   5. 연속 3일+ 빈칸
 *   6. 과거 (3일 이상 전)
 *   7. 시간대 (today only): 밤 → 저녁 → 기본
 */
export function getHookMessage(ctx: HookContext): string {
  if (ctx.isFirstUse) return "첫 우표를 붙여볼까요?";
  if (ctx.isFuture) return "내일을 기다려요";
  if (ctx.isMonthLastDay && ctx.isToday) return "이 달의 마지막 한 칸";
  if (ctx.emptyStreak >= 7) return "오랜만이에요";
  if (ctx.emptyStreak >= 3) return "괜찮아요, 천천히 채워도 돼요";
  if (ctx.daysAgo >= 3) return "지난 날을 떠올려볼까요?";

  // Today / time-of-day fallbacks.
  // The 18~22h hint uses explicit \n breaks because the cell is narrow (~45px wide
  // on mobile) and the auto-wrap was chopping at awkward syllable boundaries
  // ("오늘은 어" / "떤 하루였" / "어요?"). 3 짧은 줄로 강제하면 시각적으로 정돈됨.
  if (ctx.hour >= 22) return "오늘이\n가기 전에";
  if (ctx.hour >= 18) return "오늘은\n어떤 하루\n였나요?";
  return "오늘,\n한 장";
}

/**
 * Convenience for the calendar's empty-cell case. Caller passes the cell's
 * date and today; this builds HookContext and resolves to a message.
 */
export function getEmptyCellMessage(args: {
  cellDate: Date;
  today: Date;
  isFirstUse: boolean;
  emptyStreak: number;
}): string {
  const { cellDate, today, isFirstUse, emptyStreak } = args;

  const startOfDay = (d: Date): Date =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const cellStart = startOfDay(cellDate);
  const todayStart = startOfDay(today);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysAgo = Math.round((todayStart.getTime() - cellStart.getTime()) / msPerDay);

  const isToday = daysAgo === 0;
  const isFuture = daysAgo < 0;

  // Last day of the *cell's* month — for the "today === month last day" branch
  // we check whether today is the last day of its own month.
  const todayLast = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth() + 1,
    0,
  );
  const isMonthLastDay = todayStart.getTime() === todayLast.getTime();

  return getHookMessage({
    isFuture,
    isToday,
    isMonthLastDay,
    isFirstUse,
    emptyStreak,
    daysAgo,
    hour: today.getHours(),
  });
}
