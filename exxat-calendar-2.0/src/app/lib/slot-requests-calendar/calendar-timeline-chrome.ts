import { HEADER_DAY_H, MONTH_ABBR, YEAR_FIRST } from "./constants"
import { addCalendarDays } from "./calendar-date"
import type { CalendarZoom } from "./types"
import type { TimelineTopCol, TimelineYearCol } from "./calendar-timeline"

export const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

/**
 * Timeline header mental model (keep this stable across zooms):
 *
 * - Toolbar → scale (day/week/month/year), period label, jump to today
 * - Header → one question only: "what does each column represent?"
 * - Body   → today hairline (where "now" sits on the infinite timeline)
 *
 * No pills, dots, badges, or accent bars in the header — each extra mark is a
 * question users shouldn't have to answer.
 */
export type TimelineHeaderLayout = {
  height: number
  /** Plain text anchor when scroll pushes month/year labels off-screen. */
  scrollContext: boolean
  /** Day view — hour-of-day rail under date labels. */
  hourRail: boolean
}

export function timelineHeaderLayout(zoom: CalendarZoom): TimelineHeaderLayout {
  return {
    height: HEADER_DAY_H,
    scrollContext: zoom === "day" || zoom === "week" || zoom === "month" || zoom === "year",
    hourRail: zoom === "day",
  }
}

export function formatWeekRangeLabel(startDate: Date): string {
  const end = addCalendarDays(startDate, 6)
  const startMonth = MONTH_ABBR[startDate.getMonth()]
  const endMonth = MONTH_ABBR[end.getMonth()]
  const startDay = startDate.getDate()
  const endDay = end.getDate()
  if (startDate.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay}`
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`
}

/** Fraction of day elapsed (0–1) — prefer zonedDayElapsedFraction for live markers. */
export function dayElapsedFraction(date: Date): number {
  return (date.getHours() * 60 + date.getMinutes()) / (24 * 60)
}

export function formatMonthYearContext(year: number, month: number): string {
  return `${MONTH_ABBR[month]} ${year}`
}

export function formatDayViewColumn(date: Date): {
  weekday: string
  day: string
  aria: string
  hover: string
} {
  const monthLabel = MONTH_ABBR[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const weekday = DAY_ABBR[date.getDay()]
  return {
    weekday,
    day: String(day),
    aria: `${weekday}, ${monthLabel} ${day}, ${year}`,
    hover: `${monthLabel} ${day}, ${year}`,
  }
}

export type TimelineHeaderLabel = {
  primary: string
  aria: string
  hover: string
}

export const HEADER_CELL_HOVER = "cursor-default"

/** Year view — edge-buffer month column: muted year over bold month. */
export function formatYearViewMonthColumn(year: number, month: number): {
  year: string
  month: string
  aria: string
  hover: string
} {
  const monthLabel = MONTH_ABBR[month]
  return {
    year: String(year),
    month: monthLabel,
    aria: `${monthLabel} ${year}`,
    hover: `${monthLabel} ${year}`,
  }
}

/** Month view — edge-buffer day: muted month over bold day number. */
export function formatMonthViewEdgeBufferColumn(date: Date): {
  sub: string
  primary: string
  aria: string
  hover: string
} {
  const monthLabel = MONTH_ABBR[date.getMonth()]
  const day = String(date.getDate())
  return {
    sub: monthLabel,
    primary: day,
    aria: formatDayViewColumn(date).aria,
    hover: formatDayViewColumn(date).hover,
  }
}

/** Week view — edge-buffer day: muted week range over bold day number. */
export function formatWeekViewEdgeBufferDayColumn(
  date: Date,
  weekStart: Date,
): {
  sub: string
  primary: string
  aria: string
  hover: string
} {
  const day = String(date.getDate())
  const sub = formatWeekRangeLabel(weekStart)
  return {
    sub,
    primary: day,
    aria: formatDayViewColumn(date).aria,
    hover: formatDayViewColumn(date).hover,
  }
}

/** Week view — edge-buffer week column: muted month over bold week range. */
export function formatWeekViewEdgeBufferWeekColumn(weekStart: Date): {
  sub: string
  primary: string
  aria: string
  hover: string
} {
  const sub = MONTH_ABBR[weekStart.getMonth()]
  const primary = formatWeekRangeLabel(weekStart)
  const end = addCalendarDays(weekStart, 6)
  const endMonth = MONTH_ABBR[end.getMonth()]
  const hover =
    weekStart.getMonth() === end.getMonth()
      ? `Week of ${sub} ${weekStart.getDate()} – ${end.getDate()}, ${weekStart.getFullYear()}`
      : `Week of ${sub} ${weekStart.getDate()} – ${endMonth} ${end.getDate()}, ${weekStart.getFullYear()}`
  return { sub, primary, aria: hover, hover }
}

export function formatMonthHeaderLabel(year: number, month: number): TimelineHeaderLabel {
  const monthLabel = MONTH_ABBR[month]
  return {
    primary: monthLabel,
    aria: `${monthLabel} ${year}`,
    hover: `${monthLabel} ${year}`,
  }
}

export function formatYearHeaderHover(year: number): string {
  return String(year)
}

/** Year view — always use 3-letter month; single letters are ambiguous (J/J/M). */
export function formatYearViewMonthLabel(year: number, month: number): TimelineHeaderLabel {
  const monthLabel = MONTH_ABBR[month]
  return {
    primary: monthLabel,
    aria: `${monthLabel} ${year}`,
    hover: `${monthLabel} ${year}`,
  }
}

export function monthAtTimelineX(
  x: number,
  topCols: TimelineTopCol[],
): { year: number; month: number } {
  if (topCols.length === 0) return { year: YEAR_FIRST, month: 0 }
  for (let i = topCols.length - 1; i >= 0; i--) {
    if (x >= topCols[i].x) return { year: topCols[i].year, month: topCols[i].month }
  }
  return { year: topCols[0].year, month: topCols[0].month }
}

export function yearAtTimelineX(x: number, topCols: TimelineTopCol[]): number {
  return monthAtTimelineX(x, topCols).year
}

export type StickyScrollEdgeContext = {
  left: string | null
  right: string | null
}

const SCROLL_EDGE_INSET = 6

/**
 * Month/year chips for clipped timeline edges — opaque badges with fade scrims,
 * not text painted over column labels.
 */
export function stickyScrollEdgeContext(
  scrollLeft: number,
  viewportW: number,
  topCols: TimelineTopCol[],
  _yearCols: TimelineYearCol[],
  zoom: CalendarZoom,
): StickyScrollEdgeContext {
  const empty = { left: null, right: null }
  if (viewportW <= 0 || topCols.length === 0) return empty
  if (zoom !== "day" && zoom !== "week" && zoom !== "month" && zoom !== "year") return empty

  const viewportRight = scrollLeft + viewportW
  const probeLeft = scrollLeft + SCROLL_EDGE_INSET
  const probeRight = viewportRight - SCROLL_EDGE_INSET

  const leftMonth = monthAtTimelineX(probeLeft, topCols)
  const rightMonth = monthAtTimelineX(probeRight, topCols)
  const leftCol = topCols.find((c) => c.year === leftMonth.year && c.month === leftMonth.month)
  const rightCol = topCols.find((c) => c.year === rightMonth.year && c.month === rightMonth.month)

  let left: string | null = null
  let right: string | null = null

  if (leftCol && leftCol.x < scrollLeft + SCROLL_EDGE_INSET) {
    left = formatMonthYearContext(leftMonth.year, leftMonth.month)
  }

  if (rightCol && rightCol.x + rightCol.w > viewportRight - SCROLL_EDGE_INSET) {
    right = formatMonthYearContext(rightMonth.year, rightMonth.month)
  }

  if (left && right && left === right) {
    right = null
  }

  return { left, right }
}

/** @deprecated Use {@link stickyScrollEdgeContext} */
export function stickyScrollContext(
  scrollLeft: number,
  viewportW: number,
  topCols: TimelineTopCol[],
  yearCols: TimelineYearCol[],
  zoom: CalendarZoom,
): string | null {
  return stickyScrollEdgeContext(scrollLeft, viewportW, topCols, yearCols, zoom).left
}

/** @deprecated Week label hue — neutral typography only in the simplified header. */
export function yearMonthChrome(_year: number, _month: number) {
  return {
    yearBg: "transparent",
    yearFg: "var(--muted-foreground)",
    weekLabelColor: "var(--muted-foreground)",
  }
}

export function tintColumnBackground(stripeIndex: number): string {
  return stripeIndex % 2 === 0
    ? "var(--calendar-month-column-zebra)"
    : "var(--background)"
}

/** @deprecated */
export function monthColumnBackground(year: number, month: number): string {
  return tintColumnBackground((year - YEAR_FIRST) * 12 + month)
}

/** @deprecated */
export function stickyEdgeYears(
  scrollLeft: number,
  viewportW: number,
  topCols: TimelineTopCol[],
  yearCols: TimelineYearCol[],
) {
  const ctx = stickyScrollContext(scrollLeft, viewportW, topCols, yearCols, "year")
  return { left: ctx ? Number(ctx) : null, right: null }
}

/** @deprecated */
export function stickyEdgeMonths(
  scrollLeft: number,
  viewportW: number,
  topCols: TimelineTopCol[],
) {
  const ctx = stickyScrollContext(scrollLeft, viewportW, topCols, [], "week")
  if (!ctx) return { left: null, right: null }
  const m = monthAtTimelineX(scrollLeft + 8, topCols)
  return { left: m, right: null }
}

export function formatWeekHeaderLabel(
  date: Date,
  zoom: CalendarZoom,
  colWidthPx: number,
): TimelineHeaderLabel {
  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()
  const monthLabel = MONTH_ABBR[month]
  const hover = `${monthLabel} ${day}, ${year}`

  if (zoom === "day") {
    if (colWidthPx >= 28) {
      return { primary: String(day), aria: hover, hover }
    }
    return { primary: "", aria: hover, hover }
  }

  if (zoom === "month") {
    if (colWidthPx >= 14) {
      return { primary: String(day), aria: hover, hover }
    }
    return { primary: "", aria: hover, hover }
  }

  if (zoom === "week") {
    const weekEnd = new Date(date)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const endDay = weekEnd.getDate()
    const endMonth = MONTH_ABBR[weekEnd.getMonth()]
    const weekHover = formatWeekColumnHover(date, zoom)
    if (colWidthPx >= 56) {
      const primary =
        weekEnd.getMonth() === month
          ? `${day}–${endDay}`
          : `${monthLabel} ${day} – ${endMonth} ${endDay}`
      return { primary, aria: weekHover, hover: weekHover }
    }
    if (colWidthPx >= 20) {
      return { primary: String(day), aria: weekHover, hover: weekHover }
    }
    return { primary: "", aria: weekHover, hover: weekHover }
  }

  if (colWidthPx >= 14) {
    return { primary: String(day), aria: hover, hover }
  }

  return { primary: "", aria: hover, hover }
}

export function formatWeekColumnHover(date: Date, zoom: CalendarZoom): string {
  const monthLabel = MONTH_ABBR[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  if (zoom === "day") return `${monthLabel} ${day}, ${year}`
  if (zoom === "month") return `${monthLabel} ${day}, ${year}`
  const end = new Date(date)
  end.setDate(end.getDate() + 6)
  const endMonth = MONTH_ABBR[end.getMonth()]
  if (end.getMonth() === date.getMonth()) {
    return `Week of ${monthLabel} ${day} – ${end.getDate()}, ${year}`
  }
  return `Week of ${monthLabel} ${day}, ${year} – ${endMonth} ${end.getDate()}, ${year}`
}
