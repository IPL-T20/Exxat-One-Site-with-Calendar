/** Types aligned with validated calendar_scenarios.json — Medical Surgical cluster. */

export const MEDSTAR_SCENARIO_ID =
  "SC-Medical_Surgical--Day_Shift_(12-Hours)---2026-08-23-79" as const

export const MEDSTAR_FOCUS_DATE = new Date(2026, 9, 15)

export interface MedStarScenarioRecord {
  id: number
  school: string
  status: string
  requestedSlots: number | null
  approvedSlots: number | null
  reqPendingDuration: number | null
  startDate: string | null
  endDate: string | null
  availName: string | null
  availId: string | null
}

export interface MedStarScenario {
  id: string
  recordCount: number
  schools: string[]
  schoolCount: number
  location: string | null
  hospital: string | null
  locationPath: string | null
  shiftName: string | null
  shiftDuration: string | null
  footprint: string
  earliestStart: string | null
  latestEnd: string | null
  requestedSlotsTotal: number
  approvedSlotsTotal: number
  activeCount: number
  statusMix: Record<string, number>
  pressureBand: string
  hoverSummary: string
  detailSummary: string
  availabilityContext: string[]
  records: MedStarScenarioRecord[]
}

export type MedStarOutcomeType = "approve" | "hold" | "decline"

export interface MedStarOutcome {
  type: MedStarOutcomeType
  requestId: string
  school: string
  remainingActive: number
  message: string
}
