import { CALENDAR_TIMEZONE, MS_DAY } from "./constants"

/** Calendar date at local midnight from year/month/day parts. */
export function calendarDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day)
}

/** Whole calendar days from `start` to `end` (UTC-normalized, DST-safe). */
export function calendarDaysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((endUtc - startUtc) / MS_DAY)
}

export function addCalendarDays(start: Date, days: number): Date {
  return calendarDate(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + days,
  )
}

/** ISO 8601 week number (1–53) for a calendar date. */
export function isoWeekOfYear(date: Date): number {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const weekday = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - weekday)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

/** Live calendar "today" in the given IANA timezone (default IST). */
export function getZonedCalendarDate(
  now = new Date(),
  timeZone: string = CALENDAR_TIMEZONE,
): Date {
  const { year, month, day } = getZonedTimeParts(now, timeZone)
  return calendarDate(year, month, day)
}

export type ZonedTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

/** Calendar + clock fields in the given IANA timezone. */
export function getZonedTimeParts(
  now = new Date(),
  timeZone: string = CALENDAR_TIMEZONE,
): ZonedTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now)

  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value) - 1,
    day: Number(parts.find((p) => p.type === "day")!.value),
    hour: Number(parts.find((p) => p.type === "hour")!.value),
    minute: Number(parts.find((p) => p.type === "minute")!.value),
  }
}

/** Fraction of day elapsed (0–1) in the given IANA timezone. */
export function zonedDayElapsedFraction(
  now = new Date(),
  timeZone: string = CALENDAR_TIMEZONE,
): number {
  const { hour, minute } = getZonedTimeParts(now, timeZone)
  return (hour * 60 + minute) / (24 * 60)
}
