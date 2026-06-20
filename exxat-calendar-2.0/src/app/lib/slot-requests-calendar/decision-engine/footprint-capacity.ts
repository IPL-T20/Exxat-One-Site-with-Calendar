import type { LocationCapacityRecord } from "../types"
import {
  getDisciplineCapacityFromCatalog,
  getLocationCapacityFromCatalog,
} from "../../mock/location-capacity-catalog"
import type {
  ApprovalRisk,
  CapacityState,
  CompetitionClass,
  SchedulingFootprint,
} from "./decision-types"
import { footprintCoversDate } from "./schedule-footprint"
import { QUEUE_STATUSES, slotsCountForStatus } from "./gold-partner-policy"

export interface PeakLoadResult {
  peakApproved: number
  peakDemand: number
  peakIfAllQueueApproved: number
  worstDay: Date | null
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function resolveCap(
  footprint: SchedulingFootprint,
  capacityRecords: LocationCapacityRecord[],
  disciplineCount = 1,
): number {
  const locationCap = getLocationCapacityFromCatalog(
    capacityRecords,
    footprint.locationId,
  )
  return getDisciplineCapacityFromCatalog(
    capacityRecords,
    footprint.locationId,
    footprint.discipline,
    locationCap,
    disciplineCount,
  )
}

/**
 * Capacity consumption model:
 * - Cap applies per unit × discipline × shift bucket (footprint pool).
 * - On each calendar day the footprint covers, approved slots consume cap.
 * - Pending/review slots contribute to forecast peak but not approved peak.
 * - Different shift buckets on same discipline row use independent cap tallies.
 * - Different weekday patterns only stack on shared active days.
 */
export function computePeakLoadForFootprint(
  target: SchedulingFootprint,
  pool: SchedulingFootprint[],
  options?: {
    /** Treat this request as approved in the forecast pass. */
    assumeApprovedId?: string
    /** Include all queue as approved in forecast. */
    assumeAllQueueApproved?: boolean
  },
): PeakLoadResult {
  let minT = target.dateStart.getTime()
  let maxT = target.dateEnd.getTime()
  for (const p of pool) {
    if (p.locationId !== target.locationId) continue
    if (p.discipline !== target.discipline) continue
    if (p.shiftBucket !== target.shiftBucket) continue
    minT = Math.min(minT, p.dateStart.getTime())
    maxT = Math.max(maxT, p.dateEnd.getTime())
  }

  let peakApproved = 0
  let peakDemand = 0
  let peakIfAllQueue = 0
  let worstDay: Date | null = null

  const cur = startOfDay(new Date(minT))
  const end = startOfDay(new Date(maxT))

  while (cur.getTime() <= end.getTime()) {
    let approved = 0
    let demand = 0
    let allQueue = 0

    for (const p of pool) {
      if (p.locationId !== target.locationId) continue
      if (p.discipline !== target.discipline) continue
      if (p.shiftBucket !== target.shiftBucket) continue
      if (cur.getTime() < p.dateStart.getTime() || cur.getTime() > p.dateEnd.getTime()) continue
      if (!footprintCoversDate(p, cur)) continue

      const slots = p.requestedSlots
      const treatAsApproved =
        p.status === "Approved" ||
        p.requestId === options?.assumeApprovedId ||
        (options?.assumeAllQueueApproved && QUEUE_STATUSES.includes(p.status))

      if (p.status === "Approved") approved += slots
      if (p.status === "Approved") demand += slots
      else if (QUEUE_STATUSES.includes(p.status)) demand += slots

      if (treatAsApproved) allQueue += slots
      else if (QUEUE_STATUSES.includes(p.status)) allQueue += slots
    }

    if (demand > peakDemand) {
      peakDemand = demand
      worstDay = new Date(cur)
    }
    peakApproved = Math.max(peakApproved, approved)
    peakIfAllQueue = Math.max(peakIfAllQueue, allQueue)
    cur.setDate(cur.getDate() + 1)
  }

  return { peakApproved, peakDemand, peakIfAllQueueApproved: peakIfAllQueue, worstDay }
}

export function deriveCapacityState(peakApproved: number, peakDemand: number, cap: number): CapacityState {
  if (cap <= 0) return "open"
  if (peakApproved > cap) return "overbooked"
  if (peakDemand >= cap) return "exhausted"
  if (peakDemand >= cap * 0.8 || peakApproved >= cap * 0.8) return "tight"
  return "open"
}

export function deriveCompetitionClass(
  competitorCount: number,
  peakApproved: number,
  peakIfApproved: number,
  cap: number,
): CompetitionClass {
  if (competitorCount === 0) return "compatible"
  if (peakApproved > cap) return "over"
  if (peakIfApproved > cap) return "hard"
  if (competitorCount > 0 && peakIfApproved <= cap) return "soft"
  return "compatible"
}

export function deriveApprovalRisk(input: {
  competitionClass: CompetitionClass
  capacityState: CapacityState
  isUrgent: boolean
  competingQueueDemand: number
  daysUntilStart: number
  futureCapacityRisk: ApprovalRisk
}): ApprovalRisk {
  if (input.capacityState === "overbooked" || input.competitionClass === "over") return "critical"
  if (input.competitionClass === "hard" || input.capacityState === "exhausted") return "high"
  if (
    input.futureCapacityRisk === "high" ||
    input.futureCapacityRisk === "critical" ||
    (input.isUrgent && input.competitionClass === "soft")
  ) {
    return "high"
  }
  if (input.competitionClass === "soft" || input.capacityState === "tight" || input.isUrgent) {
    return "medium"
  }
  return "low"
}

export function deriveFutureCapacityRisk(
  peakIfAllQueueApproved: number,
  cap: number,
  daysUntilStart: number,
): ApprovalRisk {
  if (cap <= 0) return "low"
  const ratio = peakIfAllQueueApproved / cap
  if (ratio > 1.2) return "critical"
  if (ratio > 1) return "high"
  if (ratio > 0.85 && daysUntilStart > 30) return "medium"
  return "low"
}

export function remainingHeadroom(peakApproved: number, cap: number): number {
  return Math.max(0, cap - peakApproved)
}

export function headroomAfterApproval(peakIfApproved: number, cap: number): number {
  return cap - peakIfApproved
}

export function slotsOverCapIfApproved(peakIfApproved: number, cap: number): number {
  return Math.max(0, peakIfApproved - cap)
}

export function getCapForFootprint(
  footprint: SchedulingFootprint,
  capacityRecords: LocationCapacityRecord[],
  disciplineCount = 1,
): number {
  return resolveCap(footprint, capacityRecords, disciplineCount)
}

export function sumSlotsByStatus(
  footprints: SchedulingFootprint[],
  statuses: SchedulingFootprint["status"][],
): number {
  return footprints.reduce(
    (sum, f) => sum + (statuses.includes(f.status) ? slotsCountForStatus(f.status, f.requestedSlots) : 0),
    0,
  )
}
