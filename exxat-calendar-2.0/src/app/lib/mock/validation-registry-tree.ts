/**
 * Merge validation location registry disciplines into the data-driven location tree
 * so empty disciplines appear in the Approval Calendar hierarchy.
 */
import {
  VALIDATION_LOCATIONS,
  VALIDATION_LOCATION_BY_SLUG,
  type ValidationDisciplineKey,
} from "./enterprise-validation-locations"
import { getDisciplineCapacityFromCatalog } from "./location-capacity-catalog"
import type { DisciplineNode, LocationCapacityRecord, LocationNode } from "../slot-requests-calendar/types"

export function mergeValidationRegistryIntoLocations(
  locations: LocationNode[],
  capacityCatalog: LocationCapacityRecord[],
): LocationNode[] {
  const byId = new Map(locations.map((l) => [l.id, l]))
  const registrySlugs = new Set(VALIDATION_LOCATIONS.map((l) => l.slug))

  const merged: LocationNode[] = []

  for (const reg of VALIDATION_LOCATIONS) {
    const loc = byId.get(reg.slug)
    if (!loc) continue

    const existing = new Map(loc.disciplines.map((d) => [d.name, d]))
    const disciplines: DisciplineNode[] = []

    for (const discKey of reg.disciplines) {
      const existingNode = existing.get(discKey)
      if (existingNode) {
        disciplines.push(existingNode)
        continue
      }
      disciplines.push(
        emptyDisciplineNode(reg.slug, discKey, loc.capacity, capacityCatalog, reg.disciplines.length),
      )
    }

    merged.push({
      ...loc,
      disciplines: disciplines.sort((a, b) => a.name.localeCompare(b.name)),
    })
  }

  for (const loc of locations) {
    if (!registrySlugs.has(loc.id)) merged.push(loc)
  }

  return merged.sort((a, b) => {
    if (b.utilizationPct !== a.utilizationPct) return b.utilizationPct - a.utilizationPct
    return b.pendingCount - a.pendingCount
  })
}

function emptyDisciplineNode(
  locId: string,
  discKey: ValidationDisciplineKey,
  locationCap: number,
  catalog: LocationCapacityRecord[],
  registryDiscCount: number,
): DisciplineNode {
  const name = discKey
  return {
    id: `${locId}::${name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    locationId: locId,
    capacity: getDisciplineCapacityFromCatalog(
      catalog,
      locId,
      name,
      locationCap,
      registryDiscCount,
    ),
    placements: [],
    approvedSlots: 0,
    pendingCount: 0,
    reviewCount: 0,
    placementCount: 0,
  }
}

export function validationRegistryDisciplineNames(slug: string): ValidationDisciplineKey[] {
  return VALIDATION_LOCATION_BY_SLUG.get(slug)?.disciplines ?? []
}
