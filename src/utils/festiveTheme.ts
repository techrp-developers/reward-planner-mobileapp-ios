/**
 * Returns true if the current device time falls within the Independence Day
 * festive window: Aug 12 00:00:00 → Aug 15 23:59:59 (local time, current year).
 *
 * Called once at app launch — the result is stable for the session.
 * The year is dynamic so no code change is needed next year.
 *
 * Boundary tests:
 *   Aug 11 23:59:59 → false
 *   Aug 12 00:00:00 → true
 *   Aug 15 23:59:59 → true
 *   Aug 16 00:00:00 → false
 */
export const isFestivePeriod = (): boolean => {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 7, 12, 0, 0, 0, 0);       // Aug 12 00:00:00.000
  const end   = new Date(year, 7, 15, 23, 59, 59, 999);  // Aug 15 23:59:59.999
  return now >= start && now <= end;
};
