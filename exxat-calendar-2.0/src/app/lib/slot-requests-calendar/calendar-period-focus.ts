import { SIDEBAR_W, TIMELINE_START } from "./constants"
import { addCalendarDays, calendarDaysBetween } from "./calendar-date"
import { xOfDate } from "./calendar-timeline"
import type { CalendarZoom } from "./types"

export type FocusPeriodRange = { x: number; w: number }

/** Pixel span of the focused period column(s) for the active zoom unit. */
export function focusPeriodPixelRange(
  anchor: Date,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): FocusPeriodRange {
  switch (zoom) {
    case "day": {
      const x = xOfDate(anchor, zoom, ppd, monthPxW)
      return { x, w: ppd }
    }
    case "week": {
      const dayIndex = calendarDaysBetween(TIMELINE_START, anchor)
      const weekStartDay = Math.floor(dayIndex / 7) * 7
      const start = addCalendarDays(TIMELINE_START, weekStartDay)
      const x = xOfDate(start, zoom, ppd, monthPxW)
      return { x, w: 7 * ppd }
    }
    case "month": {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
      const x = xOfDate(start, zoom, ppd, monthPxW)
      const w = xOfDate(end, zoom, ppd, monthPxW) + ppd - x
      return { x, w }
    }
    case "year": {
      const start = new Date(anchor.getFullYear(), 0, 1)
      const end = new Date(anchor.getFullYear(), 11, 31)
      const x = xOfDate(start, zoom, ppd, monthPxW)
      const w = xOfDate(end, zoom, ppd, monthPxW) + ppd - x
      return { x, w }
    }
  }
}

/** Pixel span of the current period unit (day / week / month / year) for the active zoom. */
export function currentPeriodPixelRange(
  today: Date,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): FocusPeriodRange {
  return focusPeriodPixelRange(today, zoom, ppd, monthPxW)
}
export function columnOverlapsFocus(
  colX: number,
  colW: number,
  focus: FocusPeriodRange,
): boolean {
  return focus.x < colX + colW && focus.x + focus.w > colX
}

const DEFAULT_MIN_CLIP_W = 12

/** Clip a stripe pixel span to the focused period; null when no overlap or too narrow. */
export function clipStripeToFocusPeriod(
  left: number,
  width: number,
  focus: FocusPeriodRange,
  minWidth = DEFAULT_MIN_CLIP_W,
): { left: number; width: number } | null {
  if (focus.w <= 0) return null
  const right = left + width
  const focusRight = focus.x + focus.w
  if (right <= focus.x || left >= focusRight) return null
  const clipLeft = Math.max(left, focus.x)
  const clipRight = Math.min(right, focusRight)
  const clipW = clipRight - clipLeft
  if (clipW < minWidth) return null
  return { left: clipLeft, width: clipW }
}

export function stripeIntersectsFocusPeriod(
  left: number,
  width: number,
  focus: FocusPeriodRange,
): boolean {
  return clipStripeToFocusPeriod(left, width, focus, 1) !== null
}

/** Viewport-center timeline x → period anchor for the active zoom. */
export function anchorFromViewportCenter(
  scrollLeft: number,
  scrollClientWidth: number,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): Date {
  const centerX = Math.max(
    0,
    scrollLeft + SIDEBAR_W + Math.max(240, scrollClientWidth - SIDEBAR_W) / 2,
  )

  const dayIndex = Math.max(0, Math.floor(centerX / ppd))
  const date = addCalendarDays(TIMELINE_START, dayIndex)

  switch (zoom) {
    case "day":
    case "month":
      return date
    case "week": {
      const weekStartDay = Math.floor(dayIndex / 7) * 7
      return addCalendarDays(TIMELINE_START, weekStartDay + 3)
    }
    case "year":
      return new Date(date.getFullYear(), date.getMonth(), 15)
    default:
      return date
  }
}
