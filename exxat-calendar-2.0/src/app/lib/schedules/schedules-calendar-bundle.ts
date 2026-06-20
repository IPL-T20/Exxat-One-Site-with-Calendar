import type { CalendarDataBundle } from "../mock/calendar-data-bundle"
import {
  buildLocationTreeFromPlacements,
  detectConflicts,
  siteKpis,
} from "../slot-requests-calendar/build-tree"
import type { DecisionSnapshot } from "../slot-requests-calendar/decision-engine"
import type {
  ConflictRecord,
  LocationNode,
  Placement,
  ScheduleRecord as CalendarScheduleRecord,
  SlotRequestRow,
  UtilizationSnapshot,
} from "../slot-requests-calendar/types"
import type { ScheduleRecord as MappleScheduleRecord } from "./types"
import {
  mappleScheduleToPlacement,
  mappleScheduleToSlotRequestRow,
} from "./schedules-calendar-adapter"

const EMPTY_DECISION_SNAPSHOT = (): DecisionSnapshot => ({
  builtAt: new Date(),
  calendarToday: new Date(),
  byRequestId: {},
  byDisciplineId: {},
  competitionGroups: [],
  queueOrder: [],
})

function buildUtilizationSnapshots(locations: LocationNode[]): UtilizationSnapshot[] {
  const snapshots: UtilizationSnapshot[] = []
  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      snapshots.push({
        locationId: loc.id,
        disciplineId: disc.id,
        approvedSlots: disc.approvedSlots,
        capacity: disc.capacity,
        utilizationPct: Math.round((disc.approvedSlots / Math.max(1, disc.capacity)) * 100),
      })
    }
  }
  return snapshots
}

function disciplineIdForPlacement(p: Placement): string {
  return `${p.locationId}::${p.discipline.toLowerCase().replace(/\s+/g, "-")}`
}

/** Operations timeline bars — one placement per schedule with timelineKind schedule. */
function buildScheduleBarsFromPlacements(
  placements: Placement[],
  locations: LocationNode[],
): Map<string, Placement[]> {
  const byDisciplineId = new Map<string, Placement[]>()

  for (const p of placements) {
    if (!p.start || !p.end) continue
    const discId = disciplineIdForPlacement(p)
    const list = byDisciplineId.get(discId) ?? []
    list.push(p)
    byDisciplineId.set(discId, list)
  }

  const map = new Map<string, Placement[]>()
  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      map.set(disc.id, byDisciplineId.get(disc.id) ?? [])
    }
  }
  return map
}

/** One timeline bar per Mapple schedule — individual display for group and individual rows. */
export function buildSchedulesCalendarDataBundle(
  schedules: MappleScheduleRecord[],
): CalendarDataBundle {
  const rows = schedules.map(mappleScheduleToSlotRequestRow)
  const placements = schedules.map(mappleScheduleToPlacement)
  const locations = buildLocationTreeFromPlacements(placements)
  const scheduleBarsByDiscipline = buildScheduleBarsFromPlacements(placements, locations)
  const conflictRecords = detectConflicts(locations)

  const scheduleRecords: CalendarScheduleRecord[] = schedules.map((row) => {
    const placement = mappleScheduleToPlacement(row)
    const ref = new Date()
    return {
      id: row.id,
      slotRequestId: row.id,
      availabilityId: `ava-${row.id}`,
      locationId: placement.locationId,
      disciplineId: disciplineIdForPlacement(placement),
      discipline: row.discipline,
      school: row.school,
      slots: 1,
      start: placement.start!,
      end: placement.end!,
      status:
        placement.end! < ref
          ? "Completed"
          : placement.start! <= ref && ref <= placement.end!
            ? "Active"
            : "Scheduled",
      shiftPattern: row.shift ?? "",
      daysOfWeek: row.daysOfWeek ?? "",
    }
  })

  return {
    rows,
    availabilities: [],
    capacityRecords: [],
    placementRecords: [],
    scheduleRecords,
    conflictRecords,
    locations,
    utilizationSnapshots: buildUtilizationSnapshots(locations),
    scheduleBarsByDiscipline,
    decisionSnapshot: EMPTY_DECISION_SNAPSHOT(),
  }
}

export { siteKpis as schedulesSiteKpis }
