import type { CalendarViewGroup } from "../slot-requests-calendar/calendar-grouping"

/** Flat All view — virtualize when row count exceeds this threshold. */
export const SCHEDULES_ALL_VIEW_VIRTUALIZE_THRESHOLD = 100

export const SCHEDULES_ALL_VIEW_VIRTUAL_OVERSCAN = 6

export interface SchedulesFlatRowPlanEntry {
  group: CalendarViewGroup
  rowH: number
  offset: number
}

export interface SchedulesFlatRowPlan {
  entries: SchedulesFlatRowPlanEntry[]
  totalHeight: number
}

export interface SchedulesFlatVirtualWindow {
  start: number
  end: number
  paddingTop: number
  paddingBottom: number
  totalCount: number
}

export function computeSchedulesFlatVirtualWindow(
  plan: SchedulesFlatRowPlan,
  scrollTop: number,
  viewportHeight: number,
  headerHeight: number,
  overscan = SCHEDULES_ALL_VIEW_VIRTUAL_OVERSCAN,
): SchedulesFlatVirtualWindow {
  const { entries, totalHeight } = plan
  const totalCount = entries.length

  if (totalCount === 0) {
    return { start: 0, end: 0, paddingTop: 0, paddingBottom: 0, totalCount: 0 }
  }

  const viewStart = Math.max(0, scrollTop - headerHeight)
  const viewEnd = viewStart + viewportHeight

  let start = 0
  while (start < totalCount && entries[start].offset + entries[start].rowH < viewStart) {
    start += 1
  }

  let end = start
  while (end < totalCount && entries[end].offset < viewEnd) {
    end += 1
  }

  start = Math.max(0, start - overscan)
  end = Math.min(totalCount, end + overscan)

  const paddingTop = start > 0 ? entries[start].offset : 0
  const last = entries[end - 1]
  const paddingBottom = last ? Math.max(0, totalHeight - (last.offset + last.rowH)) : totalHeight

  return { start, end, paddingTop, paddingBottom, totalCount }
}
