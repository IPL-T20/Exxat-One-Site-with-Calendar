import type {
  ConflictInterval,
  DisciplineNode,
  LocationCapacityRecord,
  LocationNode,
  Placement,
  SlotRequestRow,
} from "./types"
import {
  locationId,
  rowToPlacement,
  utilizationHealth,
} from "./parse"
import {
  getDisciplineCapacityFromCatalog,
  getLocationCapacityFromCatalog,
  resolveLocationTotalCapacity,
} from "../mock/location-capacity-catalog"

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

export function buildLocationTreeFromPlacements(
  placements: Placement[],
  capacityCatalog?: LocationCapacityRecord[],
): LocationNode[] {
  const withDates = placements.filter((p) => p.start && p.end)
  const byLocation = new Map<string, Placement[]>()

  for (const p of withDates) {
    const list = byLocation.get(p.locationId) ?? []
    list.push(p)
    byLocation.set(p.locationId, list)
  }

  const locations: LocationNode[] = []

  for (const [, locationPlacements] of byLocation) {
    const name = locationPlacements[0]?.locationName ?? "Unknown"
    const locId = locationPlacements[0]?.locationId ?? locationId(name)
    const locationGroup = locationPlacements[0]?.locationGroup ?? ""

    const byDiscipline = new Map<string, Placement[]>()
    for (const p of locationPlacements) {
      const list = byDiscipline.get(p.discipline) ?? []
      list.push(p)
      byDiscipline.set(p.discipline, list)
    }

    const peak = peakApprovedSlots(locationPlacements)
    const capacity = capacityCatalog
      ? getLocationCapacityFromCatalog(capacityCatalog, locId)
      : resolveLocationTotalCapacity(name, peak).totalSlots
    const approvedSlots = locationPlacements
      .filter((p) => p.status === "Approved")
      .reduce((s, p) => s + p.requestedSlots, 0)

    const disciplines: DisciplineNode[] = Array.from(byDiscipline.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([disciplineName, dPlacements]) => {
        const dApproved = dPlacements
          .filter((p) => p.status === "Approved")
          .reduce((s, p) => s + p.requestedSlots, 0)
        return {
          id: `${locId}::${disciplineName.toLowerCase().replace(/\s+/g, "-")}`,
          name: disciplineName,
          locationId: locId,
          capacity: capacityCatalog
            ? getDisciplineCapacityFromCatalog(
                capacityCatalog,
                locId,
                disciplineName,
                capacity,
                byDiscipline.size,
              )
            : getDisciplineCapacityFromCatalog([], locId, disciplineName, capacity, byDiscipline.size),
          placements: dPlacements.sort((a, b) => {
            const ta = a.start?.getTime() ?? 0
            const tb = b.start?.getTime() ?? 0
            return ta - tb
          }),
          approvedSlots: dApproved,
          pendingCount: dPlacements.filter((p) => p.status === "Request Pending").length,
          reviewCount: dPlacements.filter((p) => p.status === "Review").length,
          placementCount: dPlacements.length,
        }
      })

    const starts = locationPlacements.map((p) => p.start!.getTime())
    const ends = locationPlacements.map((p) => p.end!.getTime())
    const utilizationPct = Math.round((approvedSlots / capacity) * 100)

    locations.push({
      id: locId,
      name,
      locationGroup,
      capacity,
      disciplines,
      approvedSlots,
      pendingCount: locationPlacements.filter((p) => p.status === "Request Pending").length,
      reviewCount: locationPlacements.filter((p) => p.status === "Review").length,
      utilizationPct,
      health: utilizationHealth(utilizationPct),
      placementCount: locationPlacements.length,
      earliest: new Date(Math.min(...starts)),
      latest: new Date(Math.max(...ends)),
    })
  }

  return locations.sort((a, b) => {
    if (b.utilizationPct !== a.utilizationPct) return b.utilizationPct - a.utilizationPct
    return b.pendingCount - a.pendingCount
  })
}

export function buildLocationTree(
  rows: SlotRequestRow[],
  capacityCatalog?: LocationCapacityRecord[],
): LocationNode[] {
  return buildLocationTreeFromPlacements(
    rows.map(rowToPlacement).filter((p) => p.start && p.end),
    capacityCatalog,
  )
}

export function detectConflicts(locations: LocationNode[]): ConflictInterval[] {
  const conflicts: ConflictInterval[] = []

  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      const timed = disc.placements.filter((p) => p.start && p.end)
      if (timed.length === 0) continue

      const events: { t: number; delta: number; id: string; pending: boolean }[] = []
      for (const p of timed) {
        if (p.status === "Declined" || p.status === "Canceled") continue
        const pending = p.status === "Request Pending" || p.status === "Review"
        events.push({ t: p.start!.getTime(), delta: p.requestedSlots, id: p.id, pending })
        events.push({ t: p.end!.getTime() + 86_400_000, delta: -p.requestedSlots, id: p.id, pending })
      }
      events.sort((a, b) => a.t - b.t)

      let cur = 0
      let curPending = 0
      let intervalStart: number | null = null
      let activeIds = new Set<string>()

      const flush = (endT: number, kind: ConflictInterval["kind"], slotsOver: number) => {
        if (intervalStart === null || slotsOver <= 0) return
        conflicts.push({
          id: `${disc.id}-${intervalStart}-${endT}`,
          locationId: loc.id,
          disciplineId: disc.id,
          start: new Date(intervalStart),
          end: new Date(endT),
          kind,
          placementIds: [...activeIds],
          slotsOver,
        })
      }

      for (const e of events) {
        const prev = cur
        cur += e.delta
        if (e.pending) curPending += e.delta
        else if (e.delta > 0) activeIds.add(e.id)
        else activeIds.delete(e.id)

        const overCap = Math.max(0, cur - disc.capacity)
        const wasOver = Math.max(0, prev - disc.capacity)

        if (overCap > 0 && wasOver === 0) intervalStart = e.t
        if (overCap === 0 && wasOver > 0 && intervalStart !== null) {
          flush(e.t, curPending > 0 ? "forecast" : "capacity", wasOver)
          intervalStart = null
        }
      }
    }
  }

  return conflicts
}

export function siteKpis(locations: LocationNode[]) {
  const pending = locations.reduce((s, l) => s + l.pendingCount, 0)
  const review = locations.reduce((s, l) => s + l.reviewCount, 0)
  const approved = locations.reduce(
    (s, l) => s + l.disciplines.reduce((d, disc) => d + disc.approvedSlots, 0),
    0,
  )
  const capacity = locations.reduce((s, l) => s + l.capacity, 0)
  const overCap = locations.filter((l) => l.utilizationPct >= 100).length
  return {
    pending,
    review,
    approved,
    capacityUsedPct: capacity ? Math.round((approved / capacity) * 100) : 0,
    overCapLocations: overCap,
    openSlots: Math.max(0, capacity - approved),
  }
}
