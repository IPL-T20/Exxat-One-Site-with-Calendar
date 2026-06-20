import { MONTH_ABBR, TIMELINE_START } from "./constants"
import { addCalendarDays, calendarDaysBetween, isoWeekOfYear } from "./calendar-date"
import { DAY_ABBR } from "./calendar-timeline-chrome"
import type { CalendarZoom } from "./types"

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export function periodNavUnit(zoom: CalendarZoom): string {
  switch (zoom) {
    case "day":
      return "day"
    case "week":
      return "week"
    case "month":
      return "month"
    case "year":
      return "year"
  }
}

export function shiftPeriodAnchor(
  anchor: Date,
  zoom: CalendarZoom,
  direction: -1 | 1,
): Date {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const d = anchor.getDate()

  switch (zoom) {
    case "day":
      return addCalendarDays(anchor, direction)
    case "week":
      return addCalendarDays(anchor, direction * 7)
    case "month": {
      const next = new Date(anchor)
      next.setMonth(m + direction)
      return next
    }
    case "year":
      return new Date(y + direction, m, d)
  }
}

function weekRangeForAnchor(anchor: Date): { start: Date; end: Date } {
  const dayIndex = calendarDaysBetween(TIMELINE_START, anchor)
  const weekStartDay = Math.floor(dayIndex / 7) * 7
  const start = addCalendarDays(TIMELINE_START, weekStartDay)
  const end = addCalendarDays(start, 6)
  return { start, end }
}

function formatWeekRangeNavLabel(start: Date, end: Date): string {
  const startMonth = MONTH_ABBR[start.getMonth()]
  const endMonth = MONTH_ABBR[end.getMonth()]
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}`
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`
}

/**
 * Longest period-nav label across zooms. Navigator width is fixed to this case
 * so Day / Week / Month / Year do not resize the control.
 */
export const PERIOD_NAV_REFERENCE_LABEL = "Week 52 · Dec 28 – Jan 3"

/** Fixed toolbar navigator width — chevrons + {@link PERIOD_NAV_REFERENCE_LABEL}. */
export const PERIOD_NAV_WIDTH_CLASS = "w-[15rem]" as const

/** Whether the anchor period contains calendar today for the active zoom. */
export function isViewingCurrentPeriod(
  zoom: CalendarZoom,
  anchor: Date,
  today: Date,
): boolean {
  switch (zoom) {
    case "day":
      return calendarDaysBetween(today, anchor) === 0
    case "week": {
      const { start, end } = weekRangeForAnchor(anchor)
      const t = calendarDaysBetween(start, today)
      return t >= 0 && t <= calendarDaysBetween(start, end)
    }
    case "month":
      return (
        anchor.getFullYear() === today.getFullYear() &&
        anchor.getMonth() === today.getMonth()
      )
    case "year":
      return anchor.getFullYear() === today.getFullYear()
  }
}

/** Toolbar period widget label for the active zoom unit. */
export function formatPeriodNavLabel(zoom: CalendarZoom, anchor: Date): string {
  const month = anchor.getMonth()
  const day = anchor.getDate()
  const year = anchor.getFullYear()
  const monthShort = MONTH_ABBR[month]

  switch (zoom) {
    case "day":
      return `${DAY_ABBR[anchor.getDay()]}, ${monthShort} ${day}`
    case "week": {
      const { start, end } = weekRangeForAnchor(anchor)
      const weekNum = isoWeekOfYear(start)
      return `Week ${weekNum} · ${formatWeekRangeNavLabel(start, end)}`
    }
    case "month":
      return `${MONTH_LONG[month]} ${year}`
    case "year":
      return String(year)
  }
}
