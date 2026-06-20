/**
 * Frozen usability fixture alignment — MedStar BH OT Oct 2026.
 * Single source for capacity grain, triage order, and surface signals.
 */
import type { CompetitionClass, CapacityState } from "../slot-requests-calendar/decision-engine/decision-types"
import type { SlotRequestRow } from "../slot-requests-calendar/types"
import { USABILITY_FIXTURE_IDS } from "./usability-prototype-rows"

export const USABILITY_BUSIEST_DAY_CAP = 10
export const USABILITY_FIXTURE_FOCUS_DATE = new Date(2026, 9, 15)

export const USABILITY_SEQUENCE_LINE =
  "Decide Johns Hopkins University first — partner obligation · shared Wednesdays"

export const USABILITY_COMPETITION_LINE =
  "3 schools competing for 10 slots on shared days"

export const USABILITY_TRIAGE_ORDER = [
  USABILITY_FIXTURE_IDS.hopkins,
  USABILITY_FIXTURE_IDS.towson,
  USABILITY_FIXTURE_IDS.duke,
] as const

export const USABILITY_CONTEXT_ONLY_IDS = new Set<string>([USABILITY_FIXTURE_IDS.villanova])

export type UsabilityDecisionPosture = "decide-first" | "risk" | "hold" | "ready"

export const POSTURE_RAIL_COLOR: Record<UsabilityDecisionPosture, string> = {
  "decide-first": "#7c3aed",
  risk: "#d97706",
  hold: "#2563eb",
  ready: "#16a34a",
}

export function isFacilitatorMode(search: string): boolean {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(search)
  return params.get("facilitator") === "1" || params.get("facilitator") === "true"
}

export function busiestDayLoad(hopkinsApproved: boolean): number {
  return hopkinsApproved
    ? USABILITY_BUSIEST_DAY_CAP
    : USABILITY_BUSIEST_DAY_CAP - 1
}

export function busiestDayRatioLabel(load: number, short = false): string {
  const grain = short ? "Busiest Wed" : "Busiest Wed Oct 15"
  return `${load}/${USABILITY_BUSIEST_DAY_CAP} · ${grain}`
}

export function deriveUsabilityPosture(
  hopkinsApproved: boolean,
  holdIds: ReadonlyMap<string, string>,
): UsabilityDecisionPosture {
  if (holdIds.size > 0) return "hold"
  if (!hopkinsApproved) return "decide-first"
  return "risk"
}

export function usabilityCompetitionClass(): CompetitionClass {
  return "hard"
}

export function usabilityCapacityState(load: number): CapacityState {
  if (load >= USABILITY_BUSIEST_DAY_CAP) return "exhausted"
  if (load >= USABILITY_BUSIEST_DAY_CAP - 1) return "tight"
  return "open"
}

export function isUsabilityActiveTriageRow(
  row: SlotRequestRow,
  declinedIds: ReadonlySet<string>,
): boolean {
  if (USABILITY_CONTEXT_ONLY_IDS.has(row.id)) return false
  if (declinedIds.has(row.id)) return false
  if (row.status === "Approved" || row.status === "Declined" || row.status === "Canceled") {
    return false
  }
  return true
}

export function sortUsabilityTriageRows(
  rows: SlotRequestRow[],
  declinedIds: ReadonlySet<string>,
): SlotRequestRow[] {
  const active = rows.filter((r) => isUsabilityActiveTriageRow(r, declinedIds))
  return USABILITY_TRIAGE_ORDER.map((id) => active.find((r) => r.id === id)).filter(
    (r): r is SlotRequestRow => Boolean(r),
  )
}

export function usabilitySuggestedOpenId(hopkinsApproved: boolean): string {
  return hopkinsApproved ? USABILITY_FIXTURE_IDS.towson : USABILITY_FIXTURE_IDS.hopkins
}

export function applyUsabilityRowOverrides(
  rows: SlotRequestRow[],
  state: {
    hopkinsApproved: boolean
    approvedIds: ReadonlySet<string>
    declinedIds: ReadonlySet<string>
    holdIds: ReadonlyMap<string, string>
  },
): SlotRequestRow[] {
  return rows.map((row) => {
    if (state.declinedIds.has(row.id)) {
      return { ...row, status: "Declined" }
    }
    if (state.approvedIds.has(row.id) || (row.id === USABILITY_FIXTURE_IDS.hopkins && state.hopkinsApproved)) {
      return { ...row, status: "Approved" }
    }
    if (state.holdIds.has(row.id)) {
      return { ...row, status: "Review" }
    }
    return row
  })
}

export interface UsabilityTriageRowMeta {
  reviewFirst: boolean
  sequenceBlocked: boolean
  headroomLabel: string
  queueAgeDays: number
}

export function usabilityTriageRowMeta(
  rowId: string,
  hopkinsApproved: boolean,
): UsabilityTriageRowMeta {
  const queueAges: Record<string, number> = {
    [USABILITY_FIXTURE_IDS.hopkins]: 4,
    [USABILITY_FIXTURE_IDS.towson]: 6,
    [USABILITY_FIXTURE_IDS.duke]: 3,
  }

  if (rowId === USABILITY_FIXTURE_IDS.hopkins) {
    return {
      reviewFirst: true,
      sequenceBlocked: false,
      headroomLabel: "0 left on busiest Wed",
      queueAgeDays: queueAges[rowId] ?? 0,
    }
  }

  if (rowId === USABILITY_FIXTURE_IDS.towson) {
    return {
      reviewFirst: false,
      sequenceBlocked: !hopkinsApproved,
      headroomLabel: "0 left on busiest Wed",
      queueAgeDays: queueAges[rowId] ?? 0,
    }
  }

  return {
    reviewFirst: false,
    sequenceBlocked: false,
    headroomLabel: hopkinsApproved ? "Would block" : "0 left on busiest Wed",
    queueAgeDays: queueAges[rowId] ?? 0,
  }
}

export interface UsabilitySurfaceSnapshot {
  busiestDayLoad: number
  busiestDayCap: number
  busiestDayPrimary: string
  competitionClass: CompetitionClass
  capacityState: CapacityState
  posture: UsabilityDecisionPosture
  needDecisionCount: number
  schoolCount: number
  goldPartnerCount: number
  sequenceCount: number
  statusMixLine: string
  footprintSecondary: string
  metaLine: string
  ariaLabel: string
}

export function buildUsabilitySurfaceSnapshot(
  rows: SlotRequestRow[],
  hopkinsApproved: boolean,
  holdIds: ReadonlyMap<string, string>,
  declinedIds: ReadonlySet<string>,
): UsabilitySurfaceSnapshot {
  const load = busiestDayLoad(hopkinsApproved)
  const posture = deriveUsabilityPosture(hopkinsApproved, holdIds)
  const active = rows.filter((r) => isUsabilityActiveTriageRow(r, declinedIds))
  const pending = active.filter((r) => r.status === "Request Pending").length
  const review = active.filter((r) => r.status === "Review").length
  const approvedInCluster = rows.filter((r) => r.status === "Approved").length

  const parts: string[] = []
  if (pending > 0) parts.push(`Pending: ${pending}`)
  if (review > 0) parts.push(`Review: ${review}`)
  if (approvedInCluster > 0) parts.push(`Approved: ${approvedInCluster}`)

  const needDecision = active.length
  const schoolCount = 3

  return {
    busiestDayLoad: load,
    busiestDayCap: USABILITY_BUSIEST_DAY_CAP,
    busiestDayPrimary: busiestDayRatioLabel(load, true),
    competitionClass: usabilityCompetitionClass(),
    capacityState: usabilityCapacityState(load),
    posture,
    needDecisionCount: needDecision,
    schoolCount,
    goldPartnerCount: 2,
    sequenceCount: hopkinsApproved ? 0 : 1,
    statusMixLine: parts.join(" · "),
    footprintSecondary: "Wed+Fri · Day 12h",
    metaLine: `${needDecision} need decision · Compare`,
    ariaLabel: `Linked decisions: ${load} of ${USABILITY_BUSIEST_DAY_CAP} on busiest Wednesday, ${needDecision} need decision, ${schoolCount} schools, hard competition. Click to compare.`,
  }
}
