import type { Placement, SlotRequestRow } from "./types"
import { resolveGoldPartnerCategory } from "./gold-partner-school"

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseIsoDateOnly(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function parseDurationRange(
  value: string,
): { start: Date; end: Date } | null {
  const normalized = value.replace(/[–—]/g, "-").trim()

  const crossYear = normalized.match(
    /^([A-Za-z]+)\s+(\d+),\s*(\d{4})\s*-\s*([A-Za-z]+)\s+(\d+),\s*(\d{4})$/,
  )
  if (crossYear) {
    const startMonth = MONTH_MAP[crossYear[1]]
    const endMonth = MONTH_MAP[crossYear[4]]
    if (startMonth === undefined || endMonth === undefined) return null
    return {
      start: new Date(parseInt(crossYear[3], 10), startMonth, parseInt(crossYear[2], 10)),
      end: new Date(parseInt(crossYear[6], 10), endMonth, parseInt(crossYear[5], 10)),
    }
  }

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

export function rowLocationName(row: SlotRequestRow): string {
  return row.locationSite?.trim() || parseLocationParts(row.requestedLocation).unit
}

export function rowTreeDepartment(row: SlotRequestRow): string {
  return row.locationDepartment?.trim() || parseDiscipline(row.programType)
}

export function rowToPlacement(row: SlotRequestRow): Placement {
  const { locationGroup } = parseLocationParts(row.requestedLocation)
  const site = rowLocationName(row)
  const range = parseDurationRange(row.requestedDuration)
  const start = row.timelineStartIso
    ? parseIsoDateOnly(row.timelineStartIso)
    : range?.start ?? null
  const end = row.timelineEndIso
    ? parseIsoDateOnly(row.timelineEndIso)
    : range?.end ?? null
  return {
    id: row.id,
    locationId: locationId(site),
    locationName: site,
    locationGroup,
    discipline: rowTreeDepartment(row),
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
    partnerCategory: resolveGoldPartnerCategory(row.school, row.partnerCategory),
    start,
    end,
    timelineKind: "slot-request",
    slotRequestId: row.id,
  }
}

export function utilizationHealth(pct: number): "healthy" | "warning" | "critical" {
  if (pct >= 100) return "critical"
  if (pct >= 70) return "warning"
  return "healthy"
}
