import { parseDiscipline, parseLocationParts } from "./parse"
import type { CalendarScope, ScopeDimension, SlotRequestRow } from "./types"

/** Maps UI dimension ids to CalendarScope Set keys. */
export const SCOPE_DIMENSION_KEY: Record<ScopeDimension, keyof CalendarScope> = {
  location: "locations",
  discipline: "disciplines",
  program: "programs",
  school: "schools",
  status: "statuses",
  locationGroup: "locationGroups",
}

export interface ScopeFacets {
  locations: string[]
  locationGroups: string[]
  disciplines: string[]
  programs: string[]
  schools: string[]
  statuses: string[]
}

export interface LocationHierarchyNode {
  id: string
  name: string
  group: string
  disciplines: { name: string; programs: string[] }[]
}

export function extractScopeFacets(rows: SlotRequestRow[]): ScopeFacets {
  const locations = new Set<string>()
  const locationGroups = new Set<string>()
  const disciplines = new Set<string>()
  const programs = new Set<string>()
  const schools = new Set<string>()
  const statuses = new Set<string>()

  for (const row of rows) {
    const { unit, locationGroup } = parseLocationParts(row.requestedLocation)
    if (unit) locations.add(unit)
    if (locationGroup) locationGroups.add(locationGroup)
    disciplines.add(parseDiscipline(row.programType))
    programs.add(row.programType)
    schools.add(row.school)
    statuses.add(row.status)
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

export function buildLocationHierarchy(rows: SlotRequestRow[]): LocationHierarchyNode[] {
  const map = new Map<string, LocationHierarchyNode>()

  for (const row of rows) {
    const { unit, locationGroup } = parseLocationParts(row.requestedLocation)
    if (!unit) continue
    const discipline = parseDiscipline(row.programType)

    let node = map.get(unit)
    if (!node) {
      node = { id: unit, name: unit, group: locationGroup || "Other", disciplines: [] }
      map.set(unit, node)
    }

    let disc = node.disciplines.find((d) => d.name === discipline)
    if (!disc) {
      disc = { name: discipline, programs: [] }
      node.disciplines.push(disc)
    }
    if (!disc.programs.includes(row.programType)) {
      disc.programs.push(row.programType)
    }
  }

  return [...map.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => ({
      ...n,
      disciplines: n.disciplines
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({
          ...d,
          programs: d.programs.sort((a, b) => a.localeCompare(b)),
        })),
    }))
}

export function rowMatchesScope(row: SlotRequestRow, scope: CalendarScope): boolean {
  const { unit, locationGroup } = parseLocationParts(row.requestedLocation)
  const discipline = parseDiscipline(row.programType)

  if (scope.locations.size > 0 && !scope.locations.has(unit)) return false
  if (scope.locationGroups.size > 0 && !scope.locationGroups.has(locationGroup)) return false
  if (scope.disciplines.size > 0 && !scope.disciplines.has(discipline)) return false
  if (scope.programs.size > 0 && !scope.programs.has(row.programType)) return false
  if (scope.schools.size > 0 && !scope.schools.has(row.school)) return false
  if (scope.statuses.size > 0 && !scope.statuses.has(row.status)) return false
  return true
}

function countLabel(n: number, singular: string, plural?: string): string {
  return `${n} ${n === 1 ? singular : plural ?? `${singular}s`}`
}

/** Compact summary for scope trigger (value only — prefix "Scope:" in UI). */
export function formatScopeSummary(scope: CalendarScope): string {
  const empty =
    scope.locations.size === 0 &&
    scope.disciplines.size === 0 &&
    scope.programs.size === 0 &&
    scope.schools.size === 0 &&
    scope.statuses.size === 0 &&
    scope.locationGroups.size === 0

  if (empty) return "Entire Site"

  const onlyPending =
    scope.statuses.size === 1 &&
    scope.statuses.has("Request Pending") &&
    scope.locations.size === 0 &&
    scope.disciplines.size === 0 &&
    scope.programs.size === 0 &&
    scope.schools.size === 0 &&
    scope.locationGroups.size === 0

  if (onlyPending) return "Pending Requests"

  const awaitingDecision =
    scope.statuses.size === 2 &&
    scope.statuses.has("Request Pending") &&
    scope.statuses.has("Review") &&
    scope.locations.size === 0 &&
    scope.disciplines.size === 0 &&
    scope.programs.size === 0 &&
    scope.schools.size === 0 &&
    scope.locationGroups.size === 0

  if (awaitingDecision) return "Awaiting Decision"

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
    const labels = [...scope.statuses].map((s) =>
      s === "Request Pending" ? "Pending" : s,
    )
    if (labels.length <= 2) parts.push(labels.join(", "))
    else parts.push(countLabel(scope.statuses.size, "Status"))
  }

  return parts.join(" • ") || "Custom scope"
}

export function toggleScopeValue(
  scope: CalendarScope,
  dimension: ScopeDimension,
  value: string,
): CalendarScope {
  const key = SCOPE_DIMENSION_KEY[dimension]
  const next = new Set(scope[key])
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return { ...scope, [key]: next }
}

export function clearScope(scope: CalendarScope): CalendarScope {
  return {
    locations: new Set(),
    disciplines: new Set(),
    programs: new Set(),
    schools: new Set(),
    statuses: new Set(),
    locationGroups: new Set(),
  }
}

/** Stable string for effect deps when scope Sets change. */
export function scopeSignature(scope: CalendarScope): string {
  const part = (key: keyof CalendarScope) => [...scope[key]].sort().join("\0")
  return [
    part("locations"),
    part("disciplines"),
    part("programs"),
    part("schools"),
    part("statuses"),
    part("locationGroups"),
  ].join("|")
}
