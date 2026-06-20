import { formatScenarioDateSpan, pressureBandLabel } from "./adapter"
import type { MedStarScenario } from "./types"

export interface MedStarClusterSurface {
  scenarioId: string
  unit: string
  shift: string
  dateSpan: string
  totalRequests: number
  activeCount: number
  schoolCount: number
  requestedSlots: number
  approvedSlots: number
  pressureLabel: string
  cardPrimary: string
  cardSecondary: string
  cardMeta: string
  ariaLabel: string
  postureColor: string
}

const EXTREME_RAIL = "#dc2626"

export function buildMedStarClusterSurface(
  scenario: MedStarScenario,
  activeCount: number,
): MedStarClusterSurface {
  const unit = scenario.location ?? "Medical Surgical"
  const shift = scenario.shiftName ?? "Day Shift (12-Hours)"
  const dateSpan = formatScenarioDateSpan(scenario)
  const pressureLabel = pressureBandLabel(scenario.pressureBand)

  return {
    scenarioId: scenario.id,
    unit,
    shift,
    dateSpan,
    totalRequests: scenario.recordCount,
    activeCount,
    schoolCount: scenario.schoolCount,
    requestedSlots: scenario.requestedSlotsTotal,
    approvedSlots: scenario.approvedSlotsTotal,
    pressureLabel,
    cardPrimary: `${activeCount} in progress`,
    cardSecondary: `${unit} · ${shift}`,
    cardMeta: `${scenario.recordCount} requests · ${scenario.schoolCount} schools · ${scenario.requestedSlotsTotal} req / ${scenario.approvedSlotsTotal} appr · ${pressureLabel}`,
    ariaLabel: `${unit}, ${shift}, ${dateSpan}. ${scenario.recordCount} requests, ${activeCount} in progress, ${scenario.schoolCount} schools. ${pressureLabel}. Compare requests.`,
    postureColor: EXTREME_RAIL,
  }
}

export interface MedStarHoverContent {
  whyImportant: string
  pressureSource: string
  schoolCount: number
  activeCount: number
  openAction: string
  unit: string
  shift: string
  dateSpan: string
  slotTotals: string
  statusMix: string
}

export function buildMedStarHoverContent(
  scenario: MedStarScenario,
  activeCount: number,
): MedStarHoverContent {
  const mix = (scenario.detailSummary ?? scenario.hoverSummary ?? "")
    .replace("Status mix: ", "")
    .replace(/\.$/, "")
  return {
    whyImportant: `${pressureBandLabel(scenario.pressureBand)} — ${activeCount} active requests competing on one unit in a tight window.`,
    pressureSource: `Heavy request load: ${scenario.recordCount} total requests, ${scenario.schoolCount} schools, ${scenario.requestedSlotsTotal} slots requested, ${scenario.approvedSlotsTotal} already approved. ${mix}`,
    schoolCount: scenario.schoolCount,
    activeCount,
    openAction: `Compare ${activeCount} school requests on ${scenario.location ?? "Medical Surgical"} · ${scenario.shiftName ?? "Day 12h"}`,
    unit: scenario.location ?? "Medical Surgical",
    shift: scenario.shiftName ?? "Day Shift (12-Hours)",
    dateSpan: formatScenarioDateSpan(scenario),
    slotTotals: `${scenario.requestedSlotsTotal} requested · ${scenario.approvedSlotsTotal} approved`,
    statusMix: mix,
  }
}
