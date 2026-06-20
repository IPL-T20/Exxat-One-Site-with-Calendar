import { CALENDAR_TODAY } from "../slot-requests-calendar/constants"
import {
  locationId,
  parseDiscipline,
  parseDurationRange,
  parseLocationParts,
  rowToPlacement,
} from "../slot-requests-calendar/parse"
import type {
  AvailabilityRecord,
  Placement,
  PlacementRecord,
  ScheduleLifecycleStatus,
  ScheduleRecord,
  SlotRequestRow,
} from "../slot-requests-calendar/types"

function availabilityKey(row: SlotRequestRow): string {
  const { unit } = parseLocationParts(row.requestedLocation)
  return `${row.availabilityName}|${unit}|${row.programType}`.toLowerCase()
}

function availabilityIdFromKey(key: string): string {
  return `ava-${key.replace(/[^a-z0-9]+/g, "-").slice(0, 80)}`
}

function disciplineIdFor(locationIdKey: string, discipline: string): string {
  return `${locationIdKey}::${discipline.toLowerCase().replace(/\s+/g, "-")}`
}

function scheduleLifecycle(start: Date, end: Date): ScheduleLifecycleStatus {
  const today = CALENDAR_TODAY.getTime()
  if (end.getTime() < today) return "Completed"
  if (start.getTime() <= today && today <= end.getTime()) return "Active"
  return "Scheduled"
}

/** Deduplicated availability windows from slot-request rows. */
export function buildAvailabilityRecords(rows: SlotRequestRow[]): AvailabilityRecord[] {
  const map = new Map<string, AvailabilityRecord>()

  for (const row of rows) {
    const key = availabilityKey(row)
    const { unit, facility, locationGroup } = parseLocationParts(row.requestedLocation)
    const locId = locationId(unit)
    const discipline = parseDiscipline(row.programType)
    const id = availabilityIdFromKey(key)

    const existing = map.get(key)
    if (existing) {
      if (!existing.slotRequestIds.includes(row.id)) {
        existing.slotRequestIds.push(row.id)
      }
      continue
    }

    map.set(key, {
      id,
      availabilityName: row.availabilityName,
      locationId: locId,
      locationName: unit,
      facility,
      locationGroup,
      programType: row.programType,
      discipline,
      experienceType: row.experienceType,
      slotRequestIds: [row.id],
    })
  }

  return [...map.values()].sort((a, b) =>
    a.availabilityName.localeCompare(b.availabilityName),
  )
}

/** One placement record per slot request — preserves all request ids and statuses. */
export function buildPlacementRecords(
  rows: SlotRequestRow[],
  availabilities: AvailabilityRecord[],
): PlacementRecord[] {
  const availByRequest = new Map<string, string>()
  for (const av of availabilities) {
    for (const reqId of av.slotRequestIds) {
      availByRequest.set(reqId, av.id)
    }
  }

  return rows.map((row) => {
    const { unit } = parseLocationParts(row.requestedLocation)
    const range = parseDurationRange(row.requestedDuration)
    const approved = row.status === "Approved"
    return {
      id: `plc-${row.id}`,
      slotRequestId: row.id,
      scheduleId: approved ? `sch-${row.id}` : null,
      availabilityId: availByRequest.get(row.id) ?? availabilityIdFromKey(availabilityKey(row)),
      locationId: locationId(unit),
      discipline: parseDiscipline(row.programType),
      status: row.status,
      slots: row.requestedSlots,
      start: range?.start ?? null,
      end: range?.end ?? null,
    }
  })
}

/** Confirmed schedules — one per approved slot request with parsed date range. */
export function buildScheduleRecords(
  rows: SlotRequestRow[],
  availabilities: AvailabilityRecord[],
): ScheduleRecord[] {
  const availByRequest = new Map<string, AvailabilityRecord>()
  for (const av of availabilities) {
    for (const reqId of av.slotRequestIds) {
      availByRequest.set(reqId, av)
    }
  }

  const schedules: ScheduleRecord[] = []

  for (const row of rows) {
    if (row.status !== "Approved") continue
    const range = parseDurationRange(row.requestedDuration)
    if (!range) continue

    const { unit } = parseLocationParts(row.requestedLocation)
    const locId = locationId(unit)
    const discipline = parseDiscipline(row.programType)
    const av = availByRequest.get(row.id)

    schedules.push({
      id: `sch-${row.id}`,
      slotRequestId: row.id,
      availabilityId: av?.id ?? availabilityIdFromKey(availabilityKey(row)),
      locationId: locId,
      disciplineId: disciplineIdFor(locId, discipline),
      discipline,
      school: row.school,
      slots: row.requestedSlots,
      start: range.start,
      end: range.end,
      status: scheduleLifecycle(range.start, range.end),
      shiftPattern: row.requestedShifts,
      daysOfWeek: row.requestedDaysOfWeek,
    })
  }

  return schedules.sort((a, b) => a.start.getTime() - b.start.getTime())
}

/** Map a schedule record to a timeline `Placement` for Operations mode rendering. */
export function scheduleToTimelinePlacement(
  schedule: ScheduleRecord,
  row: SlotRequestRow,
): Placement {
  const base = rowToPlacement(row)
  return {
    ...base,
    id: schedule.id,
    status: "Approved",
    start: schedule.start,
    end: schedule.end,
    requestedSlots: schedule.slots,
    timelineKind: "schedule",
    slotRequestId: schedule.slotRequestId,
    scheduleId: schedule.id,
    availabilityId: schedule.availabilityId,
  }
}

export function buildScheduleTimelineByDiscipline(
  schedules: ScheduleRecord[],
  rowsById: Map<string, SlotRequestRow>,
): Map<string, Placement[]> {
  const map = new Map<string, Placement[]>()

  for (const schedule of schedules) {
    const row = rowsById.get(schedule.slotRequestId)
    if (!row) continue
    const bar = scheduleToTimelinePlacement(schedule, row)
    const list = map.get(schedule.disciplineId) ?? []
    list.push(bar)
    map.set(schedule.disciplineId, list)
  }

  for (const [, bars] of map) {
    bars.sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
  }

  return map
}
