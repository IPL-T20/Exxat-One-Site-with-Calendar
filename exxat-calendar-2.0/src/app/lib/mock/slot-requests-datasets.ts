/**
 * Dataset selection for slot-request fixtures.
 * Baseline (45) preserved for regression; enterprise-validation is the primary
 * enterprise-scale Approval Calendar stress corpus.
 */
import { SLOT_REQUESTS } from "./slot-requests"
import { ENTERPRISE_SLOT_REQUESTS, ENTERPRISE_CORPUS_STATS } from "./slot-requests-enterprise"
import {
  ENTERPRISE_STRESS_CORPUS_STATS,
  ENTERPRISE_STRESS_SLOT_REQUESTS,
} from "./slot-requests-enterprise-stress"
import {
  ENTERPRISE_VALIDATION_CORPUS_STATS,
  ENTERPRISE_VALIDATION_SLOT_REQUESTS,
} from "./slot-requests-enterprise-validation"
import { USABILITY_PROTOTYPE_ROWS } from "./usability-prototype-rows"
import scenarioJson from "../../data/medical-surgical-scenario.json"
import { medStarScenarioToRows } from "../medstar-real/adapter"
import type { MedStarScenario } from "../medstar-real/types"
import { isDebugMedStarScenario } from "../decision-workflow/debug-scenario"
import type { SlotRequest } from "./slot-requests"

const MEDSTAR_MEDICAL_SURGICAL_ROWS = medStarScenarioToRows(
  scenarioJson as MedStarScenario,
)

export type SlotRequestDatasetId =
  | "baseline"
  | "enterprise"
  | "enterprise-stress"
  | "enterprise-validation"
  | "usability-prototype"
  | "medstar-medical-surgical"

export const SLOT_REQUEST_DATASETS = {
  baseline: {
    id: "baseline" as const,
    label: "Baseline MedStar (45)",
    rows: SLOT_REQUESTS,
  },
  enterprise: {
    id: "enterprise" as const,
    label: `Enterprise corpus (${ENTERPRISE_CORPUS_STATS.totalRows})`,
    rows: ENTERPRISE_SLOT_REQUESTS,
  },
  "enterprise-stress": {
    id: "enterprise-stress" as const,
    label: `Enterprise stress (${ENTERPRISE_STRESS_CORPUS_STATS.totalRows} · ${ENTERPRISE_STRESS_CORPUS_STATS.goldPartnerPct}% Gold)`,
    rows: ENTERPRISE_STRESS_SLOT_REQUESTS,
  },
  "enterprise-validation": {
    id: "enterprise-validation" as const,
    label: `Enterprise validation (${ENTERPRISE_VALIDATION_CORPUS_STATS.totalRows} · ${ENTERPRISE_VALIDATION_CORPUS_STATS.uniqueLocations} locs)`,
    rows: ENTERPRISE_VALIDATION_SLOT_REQUESTS,
  },
  "usability-prototype": {
    id: "usability-prototype" as const,
    label: "Usability prototype (F1–F8 · BH OT Oct 2026)",
    rows: USABILITY_PROTOTYPE_ROWS,
  },
  "medstar-medical-surgical": {
    id: "medstar-medical-surgical" as const,
    label: "MedStar Health · Medical Surgical (55 real records)",
    rows: MEDSTAR_MEDICAL_SURGICAL_ROWS,
  },
} as const

export function resolveSlotRequestDataset(id?: string | null): SlotRequestDatasetId {
  if (id === "medstar-medical-surgical") return "medstar-medical-surgical"
  if (id === "usability-prototype") return "usability-prototype"
  if (id === "enterprise-validation") return "enterprise-validation"
  if (id === "enterprise-stress") return "enterprise-stress"
  if (id === "enterprise") return "enterprise"
  if (id === "baseline") return "baseline"
  return "usability-prototype"
}

export function getSlotRequestRows(id: SlotRequestDatasetId = "baseline"): SlotRequest[] {
  return SLOT_REQUEST_DATASETS[id].rows
}

/**
 * @deprecated Use productDatasetFromUrl — ?dataset= is ignored on the product path.
 */
export function slotRequestDatasetFromUrl(search: string): SlotRequestDatasetId {
  if (isDebugMedStarScenario(search)) return "medstar-medical-surgical"
  return "usability-prototype"
}

export {
  ENTERPRISE_CORPUS_STATS,
  ENTERPRISE_STRESS_CORPUS_STATS,
  ENTERPRISE_VALIDATION_CORPUS_STATS,
}
