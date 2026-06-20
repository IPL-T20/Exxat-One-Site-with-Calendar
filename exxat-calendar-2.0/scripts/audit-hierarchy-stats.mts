/**
 * Audit location → discipline hierarchy: registry vs data-driven UI tree.
 * Run: npx vite-node scripts/audit-hierarchy-stats.mts
 */
import { VALIDATION_LOCATIONS, VALIDATION_LOCATION_TIER_STATS } from "../src/app/lib/mock/enterprise-validation-locations.ts"
import { ENTERPRISE_VALIDATION_SLOT_REQUESTS } from "../src/app/lib/mock/slot-requests-enterprise-validation.ts"
import { buildCalendarDataBundle } from "../src/app/lib/mock/calendar-data-bundle.ts"
import { parseDiscipline, parseLocationParts } from "../src/app/lib/slot-requests-calendar/parse.ts"

function bucket(n: number): string {
  if (n === 1) return "1"
  if (n === 2) return "2"
  if (n >= 3 && n <= 5) return "3-5"
  if (n >= 6 && n <= 10) return "6-10"
  if (n >= 11 && n <= 15) return "11-15"
  return "16+"
}

function distribution(counts: number[]) {
  const dist: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3-5": 0,
    "6-10": 0,
    "11-15": 0,
    "16+": 0,
  }
  for (const c of counts) dist[bucket(c)]++
  return dist
}

function summary(counts: number[]) {
  const sorted = [...counts].sort((a, b) => a - b)
  const sum = counts.reduce((a, b) => a + b, 0)
  return {
    count: counts.length,
    avg: counts.length ? +(sum / counts.length).toFixed(2) : 0,
    median: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
    min: sorted.length ? sorted[0] : 0,
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  }
}

function topBy(
  items: { unit: string; value: number }[],
  n: number,
): { unit: string; value: number }[] {
  return [...items].sort((a, b) => b.value - a.value).slice(0, n)
}

// ── Registry ────────────────────────────────────────────────────────────────
const regCounts = VALIDATION_LOCATIONS.map((l) => l.disciplines.length)
const allRegDisc = new Set(VALIDATION_LOCATIONS.flatMap((l) => l.disciplines))

// ── Data per location ───────────────────────────────────────────────────────
const reqByLoc = new Map<string, number>()
const slotsByLoc = new Map<string, number>()
const discByLoc = new Map<string, Set<string>>()

for (const r of ENTERPRISE_VALIDATION_SLOT_REQUESTS) {
  const { unit } = parseLocationParts(r.requestedLocation)
  if (!unit) continue
  reqByLoc.set(unit, (reqByLoc.get(unit) ?? 0) + 1)
  slotsByLoc.set(unit, (slotsByLoc.get(unit) ?? 0) + r.requestedSlots)
  const disc = parseDiscipline(r.programType)
  if (!discByLoc.has(unit)) discByLoc.set(unit, new Set())
  discByLoc.get(unit)!.add(disc)
}

const dataDiscCounts = VALIDATION_LOCATIONS.map((l) => discByLoc.get(l.unit)?.size ?? 0)

// ── UI tree (registry-merged — what Approval Calendar renders) ─────────────
const bundle = buildCalendarDataBundle(ENTERPRISE_VALIDATION_SLOT_REQUESTS)
const tree = bundle.locations
const treeById = new Map(tree.map((l) => [l.id, l]))
const uiDiscCounts = VALIDATION_LOCATIONS.map((l) => treeById.get(l.slug)?.disciplines.length ?? 0)
const uiWithRequests = VALIDATION_LOCATIONS.map((l) => {
  const node = treeById.get(l.slug)
  return node?.disciplines.filter((d) => d.placementCount > 0).length ?? 0
})

console.log("\n=== REGISTRY (enterprise-validation-locations) ===")
console.log({
  totalLocations: VALIDATION_LOCATION_TIER_STATS.total,
  uniqueDisciplines: VALIDATION_LOCATION_TIER_STATS.uniqueDisciplines,
  avg: VALIDATION_LOCATION_TIER_STATS.avgDisciplinesPerLocation,
  median: VALIDATION_LOCATION_TIER_STATS.medianDisciplinesPerLocation,
  min: VALIDATION_LOCATION_TIER_STATS.minDisciplinesPerLocation,
  max: VALIDATION_LOCATION_TIER_STATS.maxDisciplinesPerLocation,
  distribution: VALIDATION_LOCATION_TIER_STATS.distribution,
})

console.log("\n=== DATA — disciplines with ≥1 request per location ===")
console.log({
  ...summary(dataDiscCounts),
  distribution: distribution(dataDiscCounts),
})

console.log("\n=== UI TREE — registry-merged (Approval Calendar hierarchy) ===")
console.log({
  locationsInTree: tree.length,
  ...summary(uiDiscCounts),
  distribution: distribution(uiDiscCounts),
  disciplinesWithRequests: {
    ...summary(uiWithRequests),
    distribution: distribution(uiWithRequests),
  },
})

const shallowGap = VALIDATION_LOCATIONS.filter(
  (l) => l.disciplines.length >= 5 && (discByLoc.get(l.unit)?.size ?? 0) <= 2,
).length
console.log("\n=== GAP ===")
console.log({
  registryGte5ButDataLte2: shallowGap,
  registryGte10ButUiLte2: VALIDATION_LOCATIONS.filter(
    (l) => l.disciplines.length >= 10 && (treeById.get(l.slug)?.disciplines.length ?? 0) <= 2,
  ).length,
})

console.log("\n=== TOP 20 BY REGISTRY DISCIPLINE COUNT ===")
topBy(
  VALIDATION_LOCATIONS.map((l) => ({ unit: l.unit, value: l.disciplines.length })),
  20,
).forEach((r, i) => console.log(`${i + 1}. ${r.unit} — ${r.value} disciplines (data: ${discByLoc.get(r.unit)?.size ?? 0}, UI: ${treeById.get(VALIDATION_LOCATIONS.find((x) => x.unit === r.unit)!.slug)?.disciplines.length ?? 0})`))

console.log("\n=== TOP 20 BY REQUEST COUNT ===")
topBy(
  VALIDATION_LOCATIONS.map((l) => ({ unit: l.unit, value: reqByLoc.get(l.unit) ?? 0 })),
  20,
).forEach((r, i) => console.log(`${i + 1}. ${r.unit} — ${r.value} requests`))

console.log("\n=== TOP 20 BY SLOT DEMAND ===")
topBy(
  VALIDATION_LOCATIONS.map((l) => ({ unit: l.unit, value: slotsByLoc.get(l.unit) ?? 0 })),
  20,
).forEach((r, i) => console.log(`${i + 1}. ${r.unit} — ${r.value} slots`))

console.log("\n=== UI VERIFICATION — locations with 5+ / 10+ / 15+ visible disciplines ===")
const ui5 = VALIDATION_LOCATIONS.filter((l) => (treeById.get(l.slug)?.disciplines.length ?? 0) >= 5)
const ui10 = VALIDATION_LOCATIONS.filter((l) => (treeById.get(l.slug)?.disciplines.length ?? 0) >= 10)
const ui15 = VALIDATION_LOCATIONS.filter((l) => (treeById.get(l.slug)?.disciplines.length ?? 0) >= 15)
console.log({
  uiGte5: ui5.length,
  uiGte10: ui10.length,
  uiGte15: ui15.length,
  examples5: ui5.slice(0, 5).map((l) => `${l.unit} (${treeById.get(l.slug)?.disciplines.length})`),
  examples10: ui10.slice(0, 5).map((l) => `${l.unit} (${treeById.get(l.slug)?.disciplines.length})`),
  examples15: ui15.slice(0, 5).map((l) => `${l.unit} (${treeById.get(l.slug)?.disciplines.length})`),
})
