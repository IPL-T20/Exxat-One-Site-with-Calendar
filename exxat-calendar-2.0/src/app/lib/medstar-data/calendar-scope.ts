import { parseDurationRange } from "../slot-requests-calendar/parse"
import type { SlotRequestRow } from "../slot-requests-calendar/types"
import type { MedStarDataStore } from "./MedStarDataStore"

const SCOPE_START = new Date(2026, 7, 1)
const SCOPE_END = new Date(2026, 11, 31, 23, 59, 59, 999)

/** True when the row's requested duration overlaps Aug–Dec 2026. */
export function rowOverlapsAugDec2026(row: SlotRequestRow): boolean {
  const range = parseDurationRange(row.requestedDuration)
  if (!range) return false
  return range.start <= SCOPE_END && range.end >= SCOPE_START
}

/**
 * Calendar display scope — active + top scenarios in Aug–Dec 2026.
 * Full request set remains available for KPIs via kpiRows.
 */
export function buildMedStarCalendarScopeRows(
  allRows: SlotRequestRow[],
  store: MedStarDataStore,
): SlotRequestRow[] {
  const rowById = new Map(allRows.map((r) => [r.id, r]))
  const requestIds = new Set<string>()

  const scenarioPool = [
    ...store.getTopScenarios("activeCount"),
    ...store.getTopScenarios("pressureScore"),
    ...store.getScenarios().filter((s) => s.activeCount > 0),
  ]

  const seenScenarios = new Set<string>()
  for (const scenario of scenarioPool) {
    if (seenScenarios.has(scenario.id)) continue
    seenScenarios.add(scenario.id)
    for (const id of scenario.requestIds) {
      const row = rowById.get(String(id))
      if (row && rowOverlapsAugDec2026(row)) requestIds.add(row.id)
    }
  }

  if (requestIds.size === 0) {
    return allRows.filter(rowOverlapsAugDec2026)
  }

  return allRows.filter((r) => requestIds.has(r.id))
}
