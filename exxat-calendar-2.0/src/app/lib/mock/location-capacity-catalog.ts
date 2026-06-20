import type { LocationCapacityRecord, Placement, SlotRequestRow } from "../slot-requests-calendar/types"
import { locationId, parseDiscipline, parseLocationParts, rowToPlacement } from "../slot-requests-calendar/parse"

/** Catalogued unit capacities from MedStar site-admin modeling (preserved from build-tree). */
export const KNOWN_LOCATION_CAPACITY: Record<string, number> = {
  "2f - stroke medical": 24,
  "5e - medical oncology": 20,
  "5c - orthopedics": 18,
  "2c - psych medical": 16,
  "behavioral health": 14,
  "intensive care": 12,
  "7e - imcu": 22,
  "emergency department": 18,
}

const DEFAULT_LOCATION_CAPACITY = 20

function peakApprovedSlots(placements: Placement[]): number {
  if (placements.length === 0) return 0
  const events: { t: number; delta: number }[] = []
  for (const p of placements) {
    if (p.status !== "Approved" || !p.start || !p.end) continue
    events.push({ t: p.start.getTime(), delta: p.requestedSlots })
    events.push({ t: p.end.getTime() + 86_400_000, delta: -p.requestedSlots })
  }
  events.sort((a, b) => a.t - b.t)
  let cur = 0
  let peak = 0
  for (const e of events) {
    cur += e.delta
    peak = Math.max(peak, cur)
  }
  return peak
}

function deriveDisciplineCapacity(
  locationCap: number,
  discipline: string,
  disciplineCount: number,
): number {
  const weight =
    discipline === "Nursing"
      ? 0.65
      : discipline === "PT"
        ? 0.2
        : 0.15 / Math.max(1, disciplineCount - 2)
  return Math.max(4, Math.round(locationCap * (disciplineCount <= 1 ? 1 : weight)))
}

export function resolveLocationTotalCapacity(locationName: string, peakApproved: number): {
  totalSlots: number
  source: "catalog" | "derived"
} {
  const key = locationName.toLowerCase()
  if (KNOWN_LOCATION_CAPACITY[key]) {
    return { totalSlots: KNOWN_LOCATION_CAPACITY[key], source: "catalog" }
  }
  return {
    totalSlots: Math.max(DEFAULT_LOCATION_CAPACITY, Math.ceil(peakApproved * 1.15)),
    source: "derived",
  }
}

/** Build location capacity profiles from slot-request rows without mutating source data. */
export function buildLocationCapacityCatalog(rows: SlotRequestRow[]): LocationCapacityRecord[] {
  const placements = rows.map(rowToPlacement).filter((p) => p.start && p.end)
  const byLocation = new Map<string, Placement[]>()

  for (const p of placements) {
    const list = byLocation.get(p.locationId) ?? []
    list.push(p)
    byLocation.set(p.locationId, list)
  }

  const records: LocationCapacityRecord[] = []

  for (const [, locationPlacements] of byLocation) {
    const name = locationPlacements[0]?.locationName ?? "Unknown"
    const locId = locationPlacements[0]?.locationId ?? locationId(name)
    const locationGroup = locationPlacements[0]?.locationGroup ?? ""
    const peak = peakApprovedSlots(locationPlacements)
    const { totalSlots, source } = resolveLocationTotalCapacity(name, peak)

    const byDiscipline = new Map<string, Placement[]>()
    for (const p of locationPlacements) {
      const list = byDiscipline.get(p.discipline) ?? []
      list.push(p)
      byDiscipline.set(p.discipline, list)
    }

    const disciplineCaps: Record<string, number> = {}
    for (const [disciplineName] of byDiscipline) {
      disciplineCaps[disciplineName] = deriveDisciplineCapacity(
        totalSlots,
        disciplineName,
        byDiscipline.size,
      )
    }

    records.push({
      locationId: locId,
      locationName: name,
      locationGroup,
      totalSlots,
      disciplineCaps,
      source,
    })
  }

  return records.sort((a, b) => a.locationName.localeCompare(b.locationName))
}

export function getLocationCapacityFromCatalog(
  catalog: LocationCapacityRecord[],
  locationIdKey: string,
): number {
  return catalog.find((r) => r.locationId === locationIdKey)?.totalSlots ?? DEFAULT_LOCATION_CAPACITY
}

export function getDisciplineCapacityFromCatalog(
  catalog: LocationCapacityRecord[],
  locationIdKey: string,
  discipline: string,
  fallbackLocationCap: number,
  disciplineCount: number,
): number {
  const record = catalog.find((r) => r.locationId === locationIdKey)
  if (record?.disciplineCaps[discipline]) return record.disciplineCaps[discipline]
  return deriveDisciplineCapacity(fallbackLocationCap, discipline, disciplineCount)
}

/** Utility for lineage docs — discipline from programType on a row. */
export function disciplineFromRow(row: SlotRequestRow): string {
  return parseDiscipline(row.programType)
}

export function locationPartsFromRow(row: SlotRequestRow) {
  return parseLocationParts(row.requestedLocation)
}
