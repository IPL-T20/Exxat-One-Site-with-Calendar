import { useMemo } from "react"
import {
  MONTH_ABBR,
  YEAR_VIEWPORT_MONTHS,
  TIMELINE_DAYS,
  TIMELINE_START,
  DAY_VIEWPORT_BUFFER_DAYS,
  WEEK_VIEWPORT_DAYS,
  MONTH_VIEWPORT_BUFFER_DAYS,
  YEAR_FIRST,
  YEAR_VIEWPORT_BUFFER_MONTHS,
} from "./constants"
import { formatWeekColumnHover, formatWeekHeaderLabel } from "./calendar-timeline-chrome"
import { addCalendarDays, calendarDaysBetween, getZonedCalendarDate, getZonedTimeParts, calendarDate } from "./calendar-date"
import type { CalendarZoom } from "./types"

export type TimelineDividerCol = {
  x: number
  w: number
}

export type GridLine = {
  x: number
  major: boolean
  label?: string
  kind?: "year" | "month" | "week" | "day"
}

export type TimelineTopCol = {
  label: string
  x: number
  w: number
  year: number
  month: number
}

export type TimelineYearCol = {
  label: string
  x: number
  w: number
  year: number
}

export type TimelineMonthBand = {
  x: number
  w: number
  year: number
  month: number
  isYearStart: boolean
}

/** Full-height zebra columns — stripe index meaning depends on zoom (day/week/month/year). */
export type TimelineTintBand = {
  x: number
  w: number
  stripeIndex: number
}

export type TimelineWeekCol = GridLine & {
  year: number
  month: number
  isMonthStart: boolean
  w: number
  startDate: Date
  headerPrimary: string
  headerAria: string
  headerHover: string
}

/** Primary column bands for aligned header + body vertical dividers. */
function buildDividerColumns(
  zoom: CalendarZoom,
  topCols: TimelineTopCol[],
  yearCols: TimelineYearCol[],
  subCols: TimelineWeekCol[],
): TimelineDividerCol[] {
  switch (zoom) {
    case "year":
      return topCols.map((col) => ({ x: col.x, w: col.w }))
    case "month":
    case "week":
    case "day":
    default:
      return subCols.map((col) => ({ x: col.x, w: col.w }))
  }
}

/** @deprecated Divider positions only — prefer {@link buildDividerColumns}. */
function buildColumnDividerLines(
  zoom: CalendarZoom,
  topCols: TimelineTopCol[],
  yearCols: TimelineYearCol[],
  subCols: TimelineWeekCol[],
): GridLine[] {
  switch (zoom) {
    case "year":
      return topCols.map((col) => ({ x: col.x, major: col.month === 0, kind: "month" as const }))
    case "month":
      return subCols.map((col) => ({ x: col.x, major: col.isMonthStart, kind: "day" as const }))
    case "week":
      return subCols.map((col) => ({ x: col.x, major: col.isMonthStart, kind: "week" as const }))
    case "day":
    default:
      return subCols.map((col) => ({ x: col.x, major: col.isMonthStart, kind: "day" as const }))
  }
}

function foldYearCols(topCols: TimelineTopCol[]): TimelineYearCol[] {
  const yearCols: TimelineYearCol[] = []
  for (const col of topCols) {
    const last = yearCols[yearCols.length - 1]
    if (last && last.year === col.year) {
      last.w += col.w
    } else {
      yearCols.push({ label: String(col.year), x: col.x, w: col.w, year: col.year })
    }
  }
  return yearCols
}

function buildTintBands(
  zoom: CalendarZoom,
  monthBands: TimelineMonthBand[],
  subCols: TimelineWeekCol[],
  yearCols: TimelineYearCol[],
): TimelineTintBand[] {
  if (zoom === "year") {
    return monthBands.map((band) => ({
      x: band.x,
      w: band.w,
      stripeIndex: (band.year - YEAR_FIRST) * 12 + band.month,
    }))
  }

  return subCols.map((col, i) => ({
    x: col.x,
    w: col.w,
    stripeIndex: i,
  }))
}

export function xOfDate(
  d: Date,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): number {
  return Math.max(0, calendarDaysBetween(TIMELINE_START, d) * ppd)
}

/** Pixel x of the live clock on the infinite timeline (all zoom levels). */
export function xOfLiveMoment(
  now: Date,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): number {
  const { year, month, day, hour, minute } = getZonedTimeParts(now)
  const frac = (hour * 60 + minute) / (24 * 60)
  const calendarDay = calendarDate(year, month, day)
  const dayIndex = calendarDaysBetween(TIMELINE_START, calendarDay)
  return Math.max(0, dayIndex * ppd + frac * ppd)
}

export function widthOfRange(
  start: Date,
  end: Date,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): number {
  return Math.max(
    6,
    xOfDate(end, zoom, ppd, monthPxW) - xOfDate(start, zoom, ppd, monthPxW),
  )
}

export function buildGrid(
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): {
  topCols: TimelineTopCol[]
  yearCols: TimelineYearCol[]
  monthBands: TimelineMonthBand[]
  /** Zoom-aware zebra columns for the full-height tint layer. */
  tintBands: TimelineTintBand[]
  subCols: TimelineWeekCol[]
  /** Column bands for full-height dividers — header and body share these boxes. */
  dividerCols: TimelineDividerCol[]
  /** @deprecated Use dividerCols */
  bodyLines: GridLine[]
  /** @deprecated Use bodyLines in row canvases. Kept for compatibility. */
  lines: GridLine[]
} {
  const topCols: TimelineTopCol[] = []
  const monthBands: TimelineMonthBand[] = []
  const subCols: TimelineWeekCol[] = []

  let cur = new Date(TIMELINE_START.getFullYear(), TIMELINE_START.getMonth(), 1)
  const end = new Date(2028, 0, 1)
  const timelineEndPx = TIMELINE_DAYS * ppd
  while (cur < end) {
    const yr = cur.getFullYear()
    const mo = cur.getMonth()
    const ms = new Date(yr, mo, 1)
    const me = new Date(yr, mo + 1, 0)
    const startDay = calendarDaysBetween(TIMELINE_START, ms)
    const endDay = Math.min(TIMELINE_DAYS, calendarDaysBetween(TIMELINE_START, me) + 1)
    const sx = Math.max(0, startDay * ppd)
    const ex = Math.min(timelineEndPx, endDay * ppd)
    const w = ex - sx
    if (w <= 0) {
      cur = new Date(yr, mo + 1, 1)
      continue
    }
    topCols.push({
      label: MONTH_ABBR[mo],
      x: sx,
      w,
      year: yr,
      month: mo,
    })
    monthBands.push({ x: sx, w, year: yr, month: mo, isYearStart: mo === 0 })
    cur = new Date(yr, mo + 1, 1)
  }

  const yearCols = foldYearCols(topCols)
  const stride = zoom === "week" ? 7 : 1
  for (let d = 0; d < TIMELINE_DAYS; d += stride) {
    const date = addCalendarDays(TIMELINE_START, d)
    const x = d * ppd
    const nextX = Math.min(TIMELINE_DAYS * ppd, (d + stride) * ppd)
    const colW = nextX - x
    const weekLabel = formatWeekHeaderLabel(date, zoom, colW)
    subCols.push({
      x,
      major: false,
      label: weekLabel.primary,
      year: date.getFullYear(),
      month: date.getMonth(),
      isMonthStart: date.getDate() === 1,
      w: colW,
      startDate: date,
      headerPrimary: weekLabel.primary,
      headerAria: weekLabel.aria,
      headerHover: formatWeekColumnHover(date, zoom),
    })
  }

  const tintBands = buildTintBands(zoom, monthBands, subCols, yearCols)
  const dividerCols = buildDividerColumns(zoom, topCols, yearCols, subCols)
  const bodyLines = buildColumnDividerLines(zoom, topCols, yearCols, subCols)
  return { topCols, yearCols, monthBands, tintBands, subCols, dividerCols, bodyLines, lines: bodyLines }
}

/** Year view — twelve-month core window centered on the anchor month. */
export function yearViewportCore(anchor: Date): {
  start: Date
  end: Date
  coreDays: number
} {
  const monthsBefore = Math.floor(YEAR_VIEWPORT_MONTHS / 2) - 1
  const monthsAfter = YEAR_VIEWPORT_MONTHS - monthsBefore - 1
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - monthsBefore, 1)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + monthsAfter + 1, 0)
  const coreDays = calendarDaysBetween(start, end) + 1
  return { start, end, coreDays }
}

/** Year view — core span + one full buffer month on each side. */
export function yearViewportDaySpan(anchor: Date): number {
  const { start, end } = yearViewportCore(anchor)
  const bufferStart = new Date(start.getFullYear(), start.getMonth() - YEAR_VIEWPORT_BUFFER_MONTHS, 1)
  const bufferEnd = new Date(end.getFullYear(), end.getMonth() + YEAR_VIEWPORT_BUFFER_MONTHS + 1, 0)
  return calendarDaysBetween(bufferStart, bufferEnd) + 1
}

/** Year view — the two peek months (prior/next year) flanking the 12-month core. */
export function yearViewEdgeBufferColumnKeys(anchor: Date): Set<string> {
  const { start, end } = yearViewportCore(anchor)
  const left = new Date(start.getFullYear(), start.getMonth() - YEAR_VIEWPORT_BUFFER_MONTHS, 1)
  const right = new Date(end.getFullYear(), end.getMonth() + YEAR_VIEWPORT_BUFFER_MONTHS, 1)
  const key = (year: number, month: number) => `${year}-${month}`
  return new Set([
    key(left.getFullYear(), left.getMonth()),
    key(right.getFullYear(), right.getMonth()),
  ])
}

export function isYearViewEdgeBufferColumn(col: TimelineTopCol, anchor: Date): boolean {
  return yearViewEdgeBufferColumnKeys(anchor).has(`${col.year}-${col.month}`)
}

/** Month view — all days in the anchor month. */
export function monthViewportCore(anchor: Date): {
  start: Date
  end: Date
  coreDays: number
} {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  const coreDays = end.getDate()
  return { start, end, coreDays }
}

/** Month view — core month + one buffer day on each side (adjacent month peek). */
export function monthViewportDaySpan(anchor: Date): number {
  return monthViewportCore(anchor).coreDays + MONTH_VIEWPORT_BUFFER_DAYS * 2
}

function calendarDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/** Week view — seven-day core window containing the anchor. */
export function weekViewportCore(anchor: Date): { start: Date; end: Date } {
  const dayIndex = calendarDaysBetween(TIMELINE_START, anchor)
  const weekStartDay = Math.floor(dayIndex / 7) * 7
  const start = addCalendarDays(TIMELINE_START, weekStartDay)
  return { start, end: addCalendarDays(start, 6) }
}

export function weekStartForDate(date: Date): Date {
  const dayIndex = calendarDaysBetween(TIMELINE_START, date)
  const weekStartDay = Math.floor(dayIndex / 7) * 7
  return addCalendarDays(TIMELINE_START, weekStartDay)
}

const WEEK_VIEWPORT_BUFFER_DAYS = (WEEK_VIEWPORT_DAYS - 7) / 2

/** Day view — focused navigator day. */
export function dayViewportCore(anchor: Date): { start: Date; end: Date; coreDays: number } {
  return { start: anchor, end: anchor, coreDays: 1 }
}

/** Side peek width — one day column, matching month-view buffer proportion for the anchor month. */
export function dayViewSideGutterPx(viewportWidth: number, anchor: Date): number {
  const w = Math.max(240, viewportWidth)
  return Math.round(w / monthViewportDaySpan(anchor))
}

/** Day view ppd — focused day fills the viewport; side gutters show adjacent-day peeks. */
export function dayViewCorePpd(viewportWidth: number, anchor: Date): number {
  const w = Math.max(240, viewportWidth)
  const gutter = dayViewSideGutterPx(w, anchor)
  return Math.max(24, w - 2 * gutter)
}

/** Week view ppd — seven core days fill the viewport; side gutters show day peeks. */
export function weekViewCorePpd(viewportWidth: number, anchor: Date): number {
  const w = Math.max(240, viewportWidth)
  const gutter = dayViewSideGutterPx(w, anchor)
  return Math.max(0.01, (w - 2 * gutter) / 7)
}

/** Side peek width — one month column in the year navigator strip. */
export function yearViewSideGutterPx(viewportWidth: number): number {
  const w = Math.max(240, viewportWidth)
  const monthSlots = YEAR_VIEWPORT_MONTHS + YEAR_VIEWPORT_BUFFER_MONTHS * 2
  return Math.round(w / monthSlots)
}

/** Year view ppd — twelve core months fill the viewport; side gutters show month peeks. */
export function yearViewCorePpd(viewportWidth: number, anchor: Date): number {
  const w = Math.max(240, viewportWidth)
  const gutter = yearViewSideGutterPx(w)
  const { coreDays } = yearViewportCore(anchor)
  return Math.max(0.01, (w - 2 * gutter) / coreDays)
}

/** Day view — peek days before/after the focused day. */
export function dayViewEdgeBufferDayKeys(anchor: Date): Set<string> {
  return new Set([
    calendarDayKey(addCalendarDays(anchor, -DAY_VIEWPORT_BUFFER_DAYS)),
    calendarDayKey(addCalendarDays(anchor, DAY_VIEWPORT_BUFFER_DAYS)),
  ])
}

export function isDayViewEdgeBufferDay(date: Date, anchor: Date): boolean {
  return dayViewEdgeBufferDayKeys(anchor).has(calendarDayKey(date))
}

/** Month view — peek days from the prior/next month. */
export function monthViewEdgeBufferDayKeys(anchor: Date): Set<string> {
  const { start, end } = monthViewportCore(anchor)
  return new Set([
    calendarDayKey(addCalendarDays(start, -MONTH_VIEWPORT_BUFFER_DAYS)),
    calendarDayKey(addCalendarDays(end, MONTH_VIEWPORT_BUFFER_DAYS)),
  ])
}

export function isMonthViewEdgeBufferDay(date: Date, anchor: Date): boolean {
  return monthViewEdgeBufferDayKeys(anchor).has(calendarDayKey(date))
}

/** Week view — peek days before/after the focused week. */
export function weekViewEdgeBufferDayKeys(anchor: Date): Set<string> {
  const { start, end } = weekViewportCore(anchor)
  return new Set([
    calendarDayKey(addCalendarDays(start, -WEEK_VIEWPORT_BUFFER_DAYS)),
    calendarDayKey(addCalendarDays(end, WEEK_VIEWPORT_BUFFER_DAYS)),
  ])
}

export function isWeekViewEdgeBufferDay(date: Date, anchor: Date): boolean {
  return weekViewEdgeBufferDayKeys(anchor).has(calendarDayKey(date))
}

/** Week view — collapsed columns for peek weeks flanking the focused week. */
export function weekViewEdgeBufferWeekStartKeys(anchor: Date): Set<string> {
  const { start, end } = weekViewportCore(anchor)
  const leftBuf = addCalendarDays(start, -WEEK_VIEWPORT_BUFFER_DAYS)
  const rightBuf = addCalendarDays(end, WEEK_VIEWPORT_BUFFER_DAYS)
  return new Set([
    calendarDayKey(weekStartForDate(leftBuf)),
    calendarDayKey(weekStartForDate(rightBuf)),
  ])
}

export function isWeekViewEdgeBufferWeekCol(weekStart: Date, anchor: Date): boolean {
  return weekViewEdgeBufferWeekStartKeys(anchor).has(calendarDayKey(weekStart))
}

/** Week view header — left buffer, 7 core days, right buffer (matches viewport). */
export function weekViewportDayDates(anchor: Date): Date[] {
  const { start, end } = weekViewportCore(anchor)
  const dates = [addCalendarDays(start, -WEEK_VIEWPORT_BUFFER_DAYS)]
  for (let i = 0; i < 7; i++) {
    dates.push(addCalendarDays(start, i))
  }
  dates.push(addCalendarDays(end, WEEK_VIEWPORT_BUFFER_DAYS))
  return dates
}

/** Pixels per day so the default span fills the visible timeline width. */
export function computeViewportScale(
  viewportWidth: number,
  zoom: CalendarZoom,
  anchor: Date = getZonedCalendarDate(),
): { ppd: number; monthPxW: number } {
  const w = Math.max(240, viewportWidth)

  if (zoom === "year") {
    return {
      ppd: yearViewCorePpd(w, anchor),
      monthPxW: 0,
    }
  }

  if (zoom === "month") {
    return {
      ppd: w / monthViewportDaySpan(anchor),
      monthPxW: 0,
    }
  }

  if (zoom === "week") {
    return { ppd: weekViewCorePpd(w, anchor), monthPxW: 0 }
  }

  return { ppd: dayViewCorePpd(w, anchor), monthPxW: 0 }
}

/** Default horizontal scroll so the anchor period is framed in the timeline viewport. */
export function defaultViewportScrollLeft(
  zoom: CalendarZoom,
  viewportWidth: number,
  todayX: number,
  ppd: number,
  monthPxW: number,
  anchor: Date = getZonedCalendarDate(),
): number {
  const timelineViewportW = Math.max(240, viewportWidth)
  const frame = (timelineX: number) =>
    Math.max(0, timelineX - timelineViewportW / 2)

  if (zoom === "year") {
    const { start } = yearViewportCore(anchor)
    const coreStartX = xOfDate(start, zoom, ppd, monthPxW)
    const gutter = yearViewSideGutterPx(timelineViewportW)
    return Math.max(0, coreStartX - gutter)
  }

  if (zoom === "month") {
    const { start, coreDays } = monthViewportCore(anchor)
    const coreStartX = xOfDate(start, zoom, ppd, monthPxW)
    const coreWidth = coreDays * ppd
    return frame(coreStartX + coreWidth / 2)
  }

  if (zoom === "week") {
    const { start } = weekViewportCore(anchor)
    const weekStartX = xOfDate(start, zoom, ppd, monthPxW)
    const gutter = dayViewSideGutterPx(timelineViewportW, anchor)
    return Math.max(0, weekStartX - gutter)
  }

  if (zoom === "day") {
    const gutter = dayViewSideGutterPx(timelineViewportW, anchor)
    const anchorX = xOfDate(anchor, zoom, ppd, monthPxW)
    return Math.max(0, anchorX - gutter)
  }

  return 0
}

export function useTimelineMetrics(
  timelineWidth: number,
  zoom: CalendarZoom,
  anchor?: Date,
) {
  const calendarToday = useMemo(() => getZonedCalendarDate(), [])
  const focus = anchor ?? calendarToday
  const { ppd, monthPxW } = computeViewportScale(timelineWidth, zoom, focus)
  const timelineW = TIMELINE_DAYS * ppd
  const todayX = xOfDate(calendarToday, zoom, ppd, monthPxW)
  return { ppd, monthPxW, timelineW, todayX, calendarToday, periodAnchor: focus }
}
