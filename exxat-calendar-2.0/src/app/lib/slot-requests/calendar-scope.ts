import { parseDurationRange } from "../slot-requests-calendar/parse"
import type { SlotRequestRow } from "../slot-requests-calendar/types"
import { parseIsoDate } from "../schedules/aggregations"

const SCOPE_START = new Date(2026, 7, 1)
const SCOPE_END = new Date(2026, 11, 31, 23, 59, 59, 999)

function rowTimelineRange(row: SlotRequestRow): { start: Date; end: Date } | null {
  if (row.timelineStartIso && row.timelineEndIso) {
    return {
      start: parseIsoDate(row.timelineStartIso),
      end: parseIsoDate(row.timelineEndIso),
    }
  }
  return parseDurationRange(row.requestedDuration)
}

/** True when the row's requested duration overlaps Aug–Dec 2026. */
export function rowOverlapsAugDec2026(row: SlotRequestRow): boolean {
  const range = rowTimelineRange(row)
  if (!range) return false
  return range.start <= SCOPE_END && range.end >= SCOPE_START
}

/** Calendar display scope — active requests overlapping Aug–Dec 2026. */
export function buildMappleCalendarScopeRows(allRows: SlotRequestRow[]): SlotRequestRow[] {
  const scoped = allRows.filter(
    (row) =>
      rowOverlapsAugDec2026(row) &&
      (row.status === "Request Pending" ||
        row.status === "Review" ||
        row.status === "Approved"),
  )
  return scoped.length > 0 ? scoped : allRows.filter(rowOverlapsAugDec2026)
}

export const MAPPLE_CALENDAR_FOCUS_DATE = new Date(2026, 7, 15)
