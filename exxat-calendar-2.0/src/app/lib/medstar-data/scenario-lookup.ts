import type { MedStarDataStore } from "./MedStarDataStore"
import type { MedStarScenario } from "./types"

/**
 * Exact scenario match only — every cluster request ID must belong to the scenario.
 * Tie-break: smallest scenario (fewest members) → highest activeCount → id lex order.
 *
 * Do NOT use when `scenarioId` is already known from cluster surface; use getScenarioById instead.
 */
export function findExactScenario(
  store: MedStarDataStore,
  requestIds: string[],
): MedStarScenario | undefined {
  if (requestIds.length === 0) return undefined
  const nums = requestIds.map((id) => Number(id))

  const matches = store
    .getScenarios()
    .filter((scenario) => nums.every((id) => scenario.requestIds.includes(id)))

  if (matches.length === 0) return undefined

  return matches.sort(
    (a, b) =>
      a.requestIds.length - b.requestIds.length ||
      b.activeCount - a.activeCount ||
      a.id.localeCompare(b.id),
  )[0]
}

/** Resolve scenario for compare workflow — exact id wins over cluster inference. */
export function resolveScenarioForCluster(
  store: MedStarDataStore,
  requestIds: string[],
  scenarioId?: string | null,
): MedStarScenario | undefined {
  if (scenarioId) {
    return store.getScenarioById(scenarioId) ?? undefined
  }
  return findExactScenario(store, requestIds)
}
