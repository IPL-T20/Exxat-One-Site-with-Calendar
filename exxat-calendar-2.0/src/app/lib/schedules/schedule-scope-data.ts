import { parseLocationParts } from "../slot-requests-calendar/parse"
import type { ScopeFacets } from "../slot-requests-calendar/scope-data"
import type { CalendarScope, SlotRequestRow } from "../slot-requests-calendar/types"
import type { ScheduleStatus } from "./types"

/** Scope Location tab — XLSX `Location` (facility), parsed from `scheduleRequestedLocation`. */
export function scheduleScopeUnit(row: SlotRequestRow): string {
  return parseLocationParts(row.requestedLocation).unit
}

/** Excel `Discipline` column. */
export function scheduleScopeDiscipline(row: SlotRequestRow): string {
  if (row.scheduleDiscipline?.trim()) return row.scheduleDiscipline.trim()
  const trimmed = row.programType.trim()
  const withoutSpec = trimmed.replace(/\s*\([^)]*\)\s*$/, "").trim()
  return withoutSpec || trimmed
}

/** Excel `Specialization` column. */
export function scheduleScopeProgram(row: SlotRequestRow): string {
  if (row.scheduleSpecialization?.trim()) return row.scheduleSpecialization.trim()
  const match = row.programType.match(/\(([^)]+)\)\s*$/)
  return match?.[1]?.trim() ?? row.programType
}

/** Excel `Schedule Status` column. */
export function scheduleScopeStatus(row: SlotRequestRow): ScheduleStatus {
  const raw = row.scheduleStatusLabel?.trim() || row.approvedInfo?.trim()
  if (
    raw === "Confirmed" ||
    raw === "Not Confirmed" ||
    raw === "To be Scheduled" ||
    raw === "Cancelled"
  ) {
    return raw
  }
  switch (row.status) {
    case "Approved":
      return "Confirmed"
    case "Review":
      return "Not Confirmed"
    case "Request Pending":
      return "To be Scheduled"
    case "Canceled":
      return "Cancelled"
    default:
      return "To be Scheduled"
  }
}

export function scheduleScopeLocationGroup(row: SlotRequestRow): string {
  return parseLocationParts(row.requestedLocation).locationGroup
}

/** Facets for the schedules scope popover — one entry per Excel column semantics. */
export function extractScheduleScopeFacets(rows: SlotRequestRow[]): ScopeFacets {
  const locations = new Set<string>()
  const locationGroups = new Set<string>()
  const disciplines = new Set<string>()
  const programs = new Set<string>()
  const schools = new Set<string>()
  const statuses = new Set<string>()

  for (const row of rows) {
    const unit = scheduleScopeUnit(row)
    if (unit) locations.add(unit)
    const group = scheduleScopeLocationGroup(row)
    if (group) locationGroups.add(group)
    disciplines.add(scheduleScopeDiscipline(row))
    programs.add(scheduleScopeProgram(row))
    schools.add(row.school)
    statuses.add(scheduleScopeStatus(row))
  }

  const sort = (a: string, b: string) => a.localeCompare(b)
  return {
    locations: [...locations].sort(sort),
    locationGroups: [...locationGroups].sort(sort),
    disciplines: [...disciplines].sort(sort),
    programs: [...programs].sort(sort),
    schools: [...schools].sort(sort),
    statuses: [...statuses].sort(sort),
  }
}

export function scheduleRowMatchesScope(row: SlotRequestRow, scope: CalendarScope): boolean {
  const unit = scheduleScopeUnit(row)
  const locationGroup = scheduleScopeLocationGroup(row)

  if (scope.locations.size > 0 && !scope.locations.has(unit)) return false
  if (scope.locationGroups.size > 0 && !scope.locationGroups.has(locationGroup)) return false
  if (scope.disciplines.size > 0 && !scope.disciplines.has(scheduleScopeDiscipline(row))) {
    return false
  }
  if (scope.programs.size > 0 && !scope.programs.has(scheduleScopeProgram(row))) return false
  if (scope.schools.size > 0 && !scope.schools.has(row.school)) return false
  if (scope.statuses.size > 0 && !scope.statuses.has(scheduleScopeStatus(row))) return false
  return true
}

/** Checkbox / summary label for schedule status values. */
export function formatScheduleScopeStatusLabel(status: string): string {
  return status
}

function countLabel(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`
}

/** Scope trigger summary for schedules calendar — uses Excel schedule status labels. */
export function formatScheduleScopeSummary(scope: CalendarScope): string {
  const empty =
    scope.locations.size === 0 &&
    scope.disciplines.size === 0 &&
    scope.programs.size === 0 &&
    scope.schools.size === 0 &&
    scope.statuses.size === 0 &&
    scope.locationGroups.size === 0

  if (empty) return "All"

  const parts: string[] = []

  if (scope.disciplines.size === 1) {
    parts.push([...scope.disciplines][0])
  } else if (scope.disciplines.size > 1) {
    parts.push(countLabel(scope.disciplines.size, "Discipline"))
  }

  if (scope.locations.size > 0) {
    parts.push(countLabel(scope.locations.size, "Location"))
  } else if (scope.locationGroups.size > 0) {
    parts.push(countLabel(scope.locationGroups.size, "Location Group", "Location Groups"))
  }

  if (scope.schools.size > 0) {
    parts.push(countLabel(scope.schools.size, "School"))
  }

  if (scope.programs.size > 0 && scope.disciplines.size === 0) {
    parts.push(countLabel(scope.programs.size, "Program"))
  }

  if (scope.statuses.size > 0) {
    const labels = [...scope.statuses].map(formatScheduleScopeStatusLabel)
    if (labels.length <= 2) parts.push(labels.join(", "))
    else parts.push(countLabel(scope.statuses.size, "Status"))
  }

  return parts.join(" • ") || "Custom scope"
}
