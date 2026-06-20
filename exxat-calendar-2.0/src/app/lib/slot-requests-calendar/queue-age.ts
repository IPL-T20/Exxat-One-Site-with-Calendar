import { CALENDAR_TODAY, MS_DAY, MONTH_ABBR } from "./constants"

/** Calendar days from submission date to reference today (≥ 0). */
export function computeQueueAgeDays(
  requestedDate: string,
  today: Date = CALENDAR_TODAY,
): number {
  const submitted = Date.parse(requestedDate)
  if (!Number.isFinite(submitted)) return 0
  const todayMidnight = new Date(today)
  todayMidnight.setHours(0, 0, 0, 0)
  const diff = todayMidnight.getTime() - submitted
  if (diff < 0) return 0
  return Math.floor(diff / MS_DAY)
}

/** Format a Date as `Mon DD, YYYY` for slot-request fixtures. */
export function formatSlotRequestDate(date: Date): string {
  return `${MONTH_ABBR[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`
}

/** Stagger submission dates for mock rows — `daysAgo` offset from today. */
export function requestedDateDaysAgo(daysAgo: number, today: Date = CALENDAR_TODAY): string {
  const d = new Date(today)
  d.setDate(d.getDate() - Math.max(0, daysAgo))
  return formatSlotRequestDate(d)
}
