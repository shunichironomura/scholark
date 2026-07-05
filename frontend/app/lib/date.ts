/**
 * Date-only helpers.
 *
 * API dates are date-only strings ("YYYY-MM-DD"). `new Date("YYYY-MM-DD")`
 * parses as UTC midnight, so mixing it with local-time math (setHours,
 * comparisons against `new Date()`) shifts dates by a day in timezones west
 * of UTC. These helpers keep all calendar math in local time.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Parse a date-only string (or Date) into a Date at local midnight. */
export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    const copy = new Date(value);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
  const [year = 1970, month = 1, day = 1] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Today at local midnight. */
export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Format a Date as its local YYYY-MM-DD. */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Whole calendar days from `from` (default: today) to `to`.
 * Positive means the future. Math.round absorbs DST-shortened/-lengthened
 * days, so the result is consistent regardless of direction.
 */
export function diffCalendarDays(to: string | Date, from: string | Date = startOfToday()): number {
  return Math.round((parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / MS_PER_DAY);
}
