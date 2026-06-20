import type { SlotRequestDatasetId } from "../mock/slot-requests-datasets"
import { isDebugMedStarScenario } from "./debug-scenario"

export const PRODUCTION_DATASET: SlotRequestDatasetId = "usability-prototype"

/** Single production data source — debug scenario is the only URL exception. */
export function productDatasetFromUrl(search: string): SlotRequestDatasetId {
  if (isDebugMedStarScenario(search)) return "medstar-medical-surgical"
  return PRODUCTION_DATASET
}

/** Strip ?dataset= from the URL — it must not alter the product experience. */
export function sanitizeProductSearchParams(search: string): string {
  const params = new URLSearchParams(search)
  if (!params.has("dataset")) return search
  params.delete("dataset")
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/** Keep canonical product URL; preserve ?debugScenario= when present. */
export function syncCanonicalProductUrl(pathname: string, search: string): void {
  if (typeof window === "undefined") return
  const cleaned = sanitizeProductSearchParams(search)
  const target = `${pathname}${cleaned}`
  const current = `${window.location.pathname}${window.location.search}`
  if (target !== current) {
    window.history.replaceState(null, "", target)
  }
}
