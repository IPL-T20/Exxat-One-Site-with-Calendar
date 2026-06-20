/**
 * Interaction audit helpers — cluster click resolution + density edge cases.
 * Run: npx vite-node scripts/audit-interaction-integrity.mts
 */
import { buildCalendarDataBundle } from "../src/app/lib/mock/calendar-data-bundle.ts"
import { ENTERPRISE_VALIDATION_SLOT_REQUESTS } from "../src/app/lib/mock/slot-requests-enterprise-validation.ts"
import { visiblePlacements } from "../src/app/lib/slot-requests-calendar/calendar-mode.ts"
import {
  clusterApprovalObjects,
  requestIdFromPlacement,
} from "../src/app/lib/slot-requests-calendar/approval-object-cluster.ts"
import { buildGrid, useTimelineMetrics } from "../src/app/lib/slot-requests-calendar/calendar-timeline.ts"
import type { CalendarZoom } from "../src/app/lib/slot-requests-calendar/types.ts"

const SIDEBAR_W = 280
const TIMELINE_W = 1200
const layers = { capacity: true, conflicts: true, declined: false, showEmptyDisciplines: false }

function auditLocation(unitFragment: string, zoom: CalendarZoom = "month") {
  const bundle = buildCalendarDataBundle(ENTERPRISE_VALIDATION_SLOT_REQUESTS)
  const loc = bundle.locations.find((l) => l.name.toLowerCase().includes(unitFragment.toLowerCase()))
  if (!loc) return { error: `Location not found: ${unitFragment}` }

  const { ppd, monthPxW } = useTimelineMetrics(TIMELINE_W, zoom)
  const disc = loc.disciplines.find((d) => d.name === "Nursing") ?? loc.disciplines[0]
  const requests = visiblePlacements(disc.placements, "approval", layers)
  const clusters = clusterApprovalObjects(requests, zoom, ppd, monthPxW)

  const rowIds = new Set(ENTERPRISE_VALIDATION_SLOT_REQUESTS.map((r) => r.id))
  const clusterReport = clusters.map((c) => {
    const ids = c.placements.map(requestIdFromPlacement)
    const missing = ids.filter((id) => !rowIds.has(id))
    const display = c.stats.requestCount
    return {
      clusterId: c.id.slice(0, 40),
      requestCount: c.stats.requestCount,
      level: c.level,
      idsResolved: missing.length === 0,
      missingIds: missing.slice(0, 3),
      requestIds: ids.length,
      modalWouldOpen: missing.length === 0 && ids.length > 0,
    }
  })

  return {
    location: loc.name,
    discipline: disc.name,
    visibleRequests: requests.length,
    clusterCount: clusters.length,
    clusters: clusterReport,
  }
}

function deadClickCandidates(zoom: CalendarZoom) {
  const bundle = buildCalendarDataBundle(ENTERPRISE_VALIDATION_SLOT_REQUESTS)
  const { ppd, monthPxW } = useTimelineMetrics(TIMELINE_W, zoom)
  const rowIds = new Set(ENTERPRISE_VALIDATION_SLOT_REQUESTS.map((r) => r.id))
  let multiClusters = 0
  let unresolvedMulti = 0
  let dashboardClusters = 0

  for (const loc of bundle.locations) {
    for (const disc of loc.disciplines) {
      const requests = visiblePlacements(disc.placements, "approval", layers)
      const clusters = clusterApprovalObjects(requests, zoom, ppd, monthPxW)
      for (const c of clusters) {
        if (c.stats.requestCount > 1) {
          multiClusters++
          const ids = c.placements.map(requestIdFromPlacement)
          if (ids.some((id) => !rowIds.has(id))) unresolvedMulti++
        }
        if (c.stats.requestCount >= 5) dashboardClusters++
      }
    }
  }
  return { zoom, multiClusters, unresolvedMulti, dashboardClusters }
}

console.log("\n=== 5T Med Surg Neuro/Stroke — Nursing cluster audit (month) ===")
console.log(JSON.stringify(auditLocation("5t - med surg neuro"), null, 2))

console.log("\n=== Dead-click risk: cluster IDs not in row corpus ===")
for (const zoom of ["day", "week", "month", "year"] as CalendarZoom[]) {
  console.log(deadClickCandidates(zoom))
}

console.log("\n=== Empty discipline rows (0 placements, visible in tree) ===")
const bundle = buildCalendarDataBundle(ENTERPRISE_VALIDATION_SLOT_REQUESTS)
let emptyDisc = 0
for (const loc of bundle.locations) {
  for (const d of loc.disciplines) {
    if (d.placementCount === 0) emptyDisc++
  }
}
console.log({ emptyDisciplineRows: emptyDisc })

console.log("\n=== DecisionSnapshot wired to UI? ===")
console.log({
  snapshotRequests: Object.keys(bundle.decisionSnapshot.byRequestId).length,
  exposedInModel: true,
  renderedOnTimeline: false,
})
