import {
  computeClusterStats,
  type ApprovalObjectCluster,
} from "../slot-requests-calendar/approval-object-cluster"
import { addCalendarDays } from "../slot-requests-calendar/calendar-date"
import { TIMELINE_START } from "../slot-requests-calendar/constants"
import type { FocusPeriodRange } from "../slot-requests-calendar/calendar-period-focus"
import type { CalendarZoom, Placement } from "../slot-requests-calendar/types"

/** Focus period + day/week zoom: one stripe per schedule (student or group entity). */
export function clusterSchedulesIndividually(
  placements: Placement[],
): ApprovalObjectCluster[] {
  return placements
    .filter((p) => p.start && p.end)
    .sort(
      (a, b) =>
        a.schoolShort.localeCompare(b.schoolShort) ||
        a.start!.getTime() - b.start!.getTime(),
    )
    .map((placement) => ({
      id: placement.id,
      placements: [placement],
      start: placement.start!,
      end: placement.end!,
      level: "individual" as const,
      stats: computeClusterStats([placement]),
    }))
}

export function placementIntersectsCalendarDay(
  placement: Placement,
  day: Date,
): boolean {
  if (!placement.start || !placement.end) return false
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()
  const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1
  return placement.start.getTime() <= dayEnd && placement.end.getTime() >= dayStart
}

/** Calendar days covered by a focus period column span. */
export function focusPeriodCalendarDays(
  focus: FocusPeriodRange,
  zoom: CalendarZoom,
  ppd: number,
): Date[] {
  const startDayIndex = Math.floor(focus.x / ppd)
  const dayCount =
    zoom === "day" ? 1 : zoom === "week" ? 7 : Math.max(1, Math.round(focus.w / ppd))

  return Array.from({ length: dayCount }, (_, i) =>
    addCalendarDays(TIMELINE_START, startDayIndex + i),
  )
}

export function isScheduleFocusShiftLayout(
  zoom: CalendarZoom,
  focusPeriodEnabled: boolean,
  focusClip: FocusPeriodRange | null | undefined,
  schedulesContext: boolean,
): boolean {
  return (
    schedulesContext &&
    focusPeriodEnabled &&
    (zoom === "day" || zoom === "week") &&
    Boolean(focusClip && focusClip.w > 0)
  )
}

/** @deprecated Use {@link isScheduleFocusShiftLayout} */
export function isDayFocusIntraDayLayout(
  zoom: string,
  focusPeriodEnabled: boolean,
  focusClip: FocusPeriodRange | null | undefined,
): boolean {
  return (
    zoom === "day" &&
    focusPeriodEnabled &&
    Boolean(focusClip && focusClip.w > 0)
  )
}
