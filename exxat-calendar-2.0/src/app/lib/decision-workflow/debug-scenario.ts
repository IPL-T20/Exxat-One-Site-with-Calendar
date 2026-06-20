import { MEDSTAR_SCENARIO_ID } from "../medstar-real/types"

/** Internal QA deep-link — not part of production UX. */
export function debugScenarioFromUrl(search: string): string | null {
  if (typeof window === "undefined" && !search) return null
  const params = new URLSearchParams(search || (typeof window !== "undefined" ? window.location.search : ""))
  return params.get("debugScenario")
}

export function isDebugMedStarScenario(search: string): boolean {
  const id = debugScenarioFromUrl(search)
  return id === MEDSTAR_SCENARIO_ID
}
