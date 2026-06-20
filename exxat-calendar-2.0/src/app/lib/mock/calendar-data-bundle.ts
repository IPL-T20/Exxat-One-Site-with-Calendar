import { buildLocationTree, detectConflicts } from "../slot-requests-calendar/build-tree"
import { buildDecisionSnapshot } from "../slot-requests-calendar/decision-engine"
import type { DecisionSnapshot } from "../slot-requests-calendar/decision-engine"
import type {
  AvailabilityRecord,
  ConflictRecord,
  LocationCapacityRecord,
  LocationNode,
  Placement,
  PlacementRecord,
  ScheduleRecord,
  SlotRequestRow,
  UtilizationSnapshot,
} from "../slot-requests-calendar/types"
import {
  buildAvailabilityRecords,
  buildPlacementRecords,
  buildScheduleRecords,
  buildScheduleTimelineByDiscipline,
} from "./calendar-entity-factory"
import { buildLocationCapacityCatalog } from "./location-capacity-catalog"
import {
  applyEnterpriseCapacityOverrides,
  rowsUseEnterpriseCorpus,
} from "./enterprise-capacity-overrides"
import { mergeValidationRegistryIntoLocations } from "./validation-registry-tree"

export interface CalendarDataBundle {
  /** Source rows (reference — not copied). */
  rows: SlotRequestRow[]
  availabilities: AvailabilityRecord[]
  capacityRecords: LocationCapacityRecord[]
  placementRecords: PlacementRecord[]
  scheduleRecords: ScheduleRecord[]
  conflictRecords: ConflictRecord[]
  locations: LocationNode[]
  utilizationSnapshots: UtilizationSnapshot[]
  /** Operations-mode primary timeline bars keyed by discipline node id. */
  scheduleBarsByDiscipline: Map<string, Placement[]>
  /** P0 decision engine — footprint-aware competition + capacity snapshots. */
  decisionSnapshot: DecisionSnapshot
}

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

/** Assemble calendar entities from slot-request rows without mutating source fixtures. */
export function buildCalendarDataBundle(rows: SlotRequestRow[]): CalendarDataBundle {
  let capacityRecords = buildLocationCapacityCatalog(rows)
  if (rowsUseEnterpriseCorpus(rows)) {
    capacityRecords = applyEnterpriseCapacityOverrides(capacityRecords)
  }
  const availabilities = buildAvailabilityRecords(rows)
  const placementRecords = buildPlacementRecords(rows, availabilities)
  const scheduleRecords = buildScheduleRecords(rows, availabilities)
  const locationsRaw = buildLocationTree(rows, capacityRecords)
  const locations = rowsUseEnterpriseCorpus(rows)
    ? mergeValidationRegistryIntoLocations(locationsRaw, capacityRecords)
    : locationsRaw
  const conflictRecords = detectConflicts(locations)
  const rowsById = new Map(rows.map((r) => [r.id, r]))
  const scheduleBarsByDiscipline = buildScheduleTimelineByDiscipline(scheduleRecords, rowsById)
  const decisionSnapshot = buildDecisionSnapshot(rows, capacityRecords)

  return {
    rows,
    availabilities,
    capacityRecords,
    placementRecords,
    scheduleRecords,
    conflictRecords,
    locations,
    utilizationSnapshots: buildUtilizationSnapshots(locations),
    scheduleBarsByDiscipline,
    decisionSnapshot,
  }
}
