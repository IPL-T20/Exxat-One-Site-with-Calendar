import type { CalendarViewGroup } from "./calendar-grouping"
import { visiblePlacements } from "./calendar-mode"
import { formatPeriodNavLabel } from "./calendar-period-nav"
import { formatQueueSummary, formatToReviewCount } from "./coordinator-copy"
import { TIMELINE_START } from "./constants"
import { addCalendarDays, calendarDaysBetween } from "./calendar-date"
import type { CalendarLayers, CalendarMode, CalendarZoom, Placement } from "./types"

export type FocusPeriodDateRange = { start: Date; end: Date }

export type FocusPeriodSnapshot = {
  periodLabel: string
  requestCount: number
  pendingCount: number
  reviewCount: number
  toReview: number
  schoolCount: number
  toReviewLabel: string
  queueSummary: string | null
}

/** Calendar date span for the toolbar navigator period at the active zoom. */
export function focusPeriodDateRange(anchor: Date, zoom: CalendarZoom): FocusPeriodDateRange {
  switch (zoom) {
    case "day": {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
      const end = new Date(start)
      return { start, end }
    }
    case "week": {
      const dayIndex = calendarDaysBetween(TIMELINE_START, anchor)
      const weekStartDay = Math.floor(dayIndex / 7) * 7
      const start = addCalendarDays(TIMELINE_START, weekStartDay)
      const end = addCalendarDays(start, 6)
      return { start, end }
    }
    case "month": {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
      return { start, end }
    }
    case "year": {
      const start = new Date(anchor.getFullYear(), 0, 1)
      const end = new Date(anchor.getFullYear(), 11, 31)
      return { start, end }
    }
  }
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function placementOverlapsFocusPeriod(
  placement: Placement,
  range: FocusPeriodDateRange,
): boolean {
  if (!placement.start || !placement.end) return false
  const rangeStart = startOfDay(range.start)
  const rangeEnd = startOfDay(range.end)
  const placementStart = startOfDay(placement.start)
  const placementEnd = startOfDay(placement.end)
  return placementStart <= rangeEnd && placementEnd >= rangeStart
}

export function computeFocusPeriodSnapshot(
  groups: CalendarViewGroup[],
  anchor: Date,
  zoom: CalendarZoom,
  mode: CalendarMode,
  layers: CalendarLayers,
): FocusPeriodSnapshot {
  const range = focusPeriodDateRange(anchor, zoom)
  const seenRequestIds = new Set<string>()
  const schools = new Set<string>()

  let pendingCount = 0
  let reviewCount = 0

  for (const group of groups) {
    for (const row of group.rows) {
      for (const placement of visiblePlacements(row.placements, mode, layers)) {
        if (!placementOverlapsFocusPeriod(placement, range)) continue

        const requestId = placement.slotRequestId ?? placement.id
        if (seenRequestIds.has(requestId)) continue
        seenRequestIds.add(requestId)

        if (placement.school) schools.add(placement.school)
        if (placement.status === "Request Pending") pendingCount++
        else if (placement.status === "Review") reviewCount++
      }
    }
  }

  const requestCount = seenRequestIds.size
  const toReview = pendingCount + reviewCount

  return {
    periodLabel: formatPeriodNavLabel(zoom, anchor),
    requestCount,
    pendingCount,
    reviewCount,
    toReview,
    schoolCount: schools.size,
    toReviewLabel: formatToReviewCount(toReview),
    queueSummary: formatQueueSummary(pendingCount, reviewCount),
  }
}
