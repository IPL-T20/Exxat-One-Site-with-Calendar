import type {
  CalendarTimelineRow,
  CalendarViewGroup,
} from "../slot-requests-calendar/calendar-grouping"
import type { LocationNode, Placement } from "../slot-requests-calendar/types"
import {
  scheduleAllViewContext,
  scheduleDisplayName,
  scheduleLeafSubtitle,
} from "./schedules-calendar-labels"
import {
  compareSchedulesForLiveSort,
} from "./schedules-calendar-lens"
import type { ScheduleRecord } from "./types"

function queueCounts(placements: Placement[]) {
  return { pendingCount: 0, reviewCount: 0, placementCount: placements.length }
}

function sumCounts(rows: CalendarTimelineRow[]) {
  return rows.reduce(
    (acc, row) => ({
      pendingCount: acc.pendingCount + row.pendingCount,
      reviewCount: acc.reviewCount + row.reviewCount,
      placementCount: acc.placementCount + row.placementCount,
    }),
    { pendingCount: 0, reviewCount: 0, placementCount: 0 },
  )
}

function rowFromSchedule(
  placement: Placement,
  scheduleById: Map<string, ScheduleRecord>,
): CalendarTimelineRow {
  const record = scheduleById.get(placement.id)
  const counts = queueCounts([placement])
  return {
    id: placement.id,
    label: record ? scheduleDisplayName(record) : placement.schoolShort || placement.school,
    subtitle: record ? scheduleLeafSubtitle(record) : null,
    disciplineDecisionId: null,
    placements: [placement],
    ...counts,
    capacity: 0,
    approvedSlots: 0,
  }
}

function rowFromDepartment(
  loc: LocationNode,
  disc: LocationNode["disciplines"][number],
  scheduleById: Map<string, ScheduleRecord>,
): CalendarTimelineRow {
  const scheduleLeaves = disc.placements.map((p) => rowFromSchedule(p, scheduleById))
  const counts = sumCounts(scheduleLeaves)
  return {
    id: disc.id,
    label: disc.name,
    subtitle: null,
    disciplineDecisionId: disc.id,
    placements: disc.placements,
    scheduleLeaves,
    ...counts,
    capacity: disc.capacity,
    approvedSlots: disc.approvedSlots,
  }
}

/** Location → Department → Schedule tree for schedules calendar (View by Location). */
export function buildSchedulesLocationTreeGroups(
  locations: LocationNode[],
  scheduleById: Map<string, ScheduleRecord>,
): CalendarViewGroup[] {
  return locations.map((loc) => {
    const rows = loc.disciplines.map((disc) => rowFromDepartment(loc, disc, scheduleById))
    return {
      id: loc.id,
      label: loc.name,
      subtitle: null,
      contextTag: loc.locationGroup || null,
      rows,
      ...sumCounts(rows),
      flat: false,
    }
  })
}

/** One flat row per schedule, sorted for the Live view (today-centric). */
export function buildSchedulesLiveViewGroups(
  locations: LocationNode[],
  scheduleById: Map<string, ScheduleRecord>,
  referenceDate: string,
): CalendarViewGroup[] {
  const groups: CalendarViewGroup[] = []

  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      for (const placement of disc.placements) {
        const record = scheduleById.get(placement.id)
        const row = rowFromSchedule(placement, scheduleById)
        groups.push({
          id: placement.id,
          label: row.label,
          subtitle: null,
          contextTag: record ? scheduleAllViewContext(record) : `${loc.name} › ${disc.name}`,
          rows: [row],
          ...queueCounts([placement]),
          flat: true,
        })
      }
    }
  }

  return groups.sort((a, b) => {
    const aRecord = scheduleById.get(a.id)
    const bRecord = scheduleById.get(b.id)
    if (aRecord && bRecord) {
      const byLive = compareSchedulesForLiveSort(aRecord, bRecord, referenceDate)
      if (byLive !== 0) return byLive
    }
    const aStart = a.rows[0]?.placements[0]?.start?.getTime() ?? 0
    const bStart = b.rows[0]?.placements[0]?.start?.getTime() ?? 0
    if (aStart !== bStart) return aStart - bStart
    return a.label.localeCompare(b.label)
  })
}

/** One flat row per schedule (All view) — reuses existing flat-group timeline row. */
export function buildSchedulesAllViewGroups(
  locations: LocationNode[],
  scheduleById: Map<string, ScheduleRecord>,
): CalendarViewGroup[] {
  const groups: CalendarViewGroup[] = []

  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      for (const placement of disc.placements) {
        const record = scheduleById.get(placement.id)
        const row = rowFromSchedule(placement, scheduleById)
        groups.push({
          id: placement.id,
          label: row.label,
          subtitle: null,
          contextTag: record ? scheduleAllViewContext(record) : `${loc.name} › ${disc.name}`,
          rows: [row],
          ...queueCounts([placement]),
          flat: true,
        })
      }
    }
  }

  return groups.sort((a, b) => {
    const aStart = a.rows[0]?.placements[0]?.start?.getTime() ?? 0
    const bStart = b.rows[0]?.placements[0]?.start?.getTime() ?? 0
    if (aStart !== bStart) return aStart - bStart
    const aCtx = a.contextTag ?? ""
    const bCtx = b.contextTag ?? ""
    if (aCtx !== bCtx) return aCtx.localeCompare(bCtx)
    return a.label.localeCompare(b.label)
  })
}

export function schedulesDepartmentKeys(groups: CalendarViewGroup[]): string[] {
  const keys: string[] = []
  for (const group of groups) {
    for (const row of group.rows) {
      if (row.scheduleLeaves?.length) keys.push(`${group.id}::${row.id}`)
    }
  }
  return keys
}
