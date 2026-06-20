import type { Placement, SlotRequestRow } from "./types"

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

export function parseDurationRange(
  value: string,
): { start: Date; end: Date } | null {
  const normalized = value.replace(/[–—]/g, "-").trim()
  const match = normalized.match(
    /^([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+),\s*(\d{4})$/,
  )
  if (!match) return null

  const year = parseInt(match[5], 10)
  const startMonth = MONTH_MAP[match[1]]
  const endMonth = MONTH_MAP[match[3]]
  if (startMonth === undefined || endMonth === undefined) return null

  const startYear = startMonth > endMonth ? year - 1 : year
  return {
    start: new Date(startYear, startMonth, parseInt(match[2], 10)),
    end: new Date(year, endMonth, parseInt(match[4], 10)),
  }
}

export function parseLocationParts(requestedLocation: string) {
  const unit = requestedLocation.split("(")[0]?.trim() ?? requestedLocation
  const inner = requestedLocation.match(/\(([^)]+)\)/)?.[1] ?? ""
  const [facilityPart, groupPart] = inner.split(">").map((s) => s.trim())
  return {
    unit,
    facility: facilityPart ?? "",
    locationGroup: groupPart ?? "",
  }
}

export function parseDiscipline(programType: string): string {
  const match = programType.match(/\(([^)]+)\)\s*$/)
  if (match?.[1]) return match[1].trim()
  if (programType.toLowerCase().includes("nursing")) return "Nursing"
  return programType.split(" ")[0] || "General"
}

export function schoolShortName(school: string): string {
  return school.split(" - ")[0]?.trim() ?? school
}

export function locationId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export function rowToPlacement(row: SlotRequestRow): Placement {
  const { unit, locationGroup } = parseLocationParts(row.requestedLocation)
  const range = parseDurationRange(row.requestedDuration)
  return {
    id: row.id,
    locationId: locationId(unit),
    locationName: unit,
    locationGroup,
    discipline: parseDiscipline(row.programType),
    school: row.school,
    schoolShort: schoolShortName(row.school),
    availabilityName: row.availabilityName,
    experienceType: row.experienceType,
    requestedSlots: row.requestedSlots,
    pendingDuration: row.pendingDuration,
    status: row.status,
    requestedDuration: row.requestedDuration,
    requestedShifts: row.requestedShifts,
    requestedDaysOfWeek: row.requestedDaysOfWeek,
    programType: row.programType,
    partnerCategory: row.partnerCategory,
    start: range?.start ?? null,
    end: range?.end ?? null,
    timelineKind: "slot-request",
    slotRequestId: row.id,
  }
}

export function utilizationHealth(pct: number): "healthy" | "warning" | "critical" {
  if (pct >= 100) return "critical"
  if (pct >= 70) return "warning"
  return "healthy"
}
