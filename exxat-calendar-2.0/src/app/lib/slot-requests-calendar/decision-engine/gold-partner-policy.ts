import type { SlotRequestRow, SlotStatus } from "../types"
import { isGoldPartnerEntity } from "../gold-partner-school"
import type {
  ApprovalRisk,
  CompetitionClass,
  QueuePriority,
  RequestDecisionSnapshot,
  SchedulingFootprint,
} from "./decision-types"

const WAITLIST_MARKERS = ["waitlist", "capacity full"]

/** Active statuses that participate in competition / capacity physics. */
export const ACTIVE_STATUSES: SlotStatus[] = ["Request Pending", "Review", "Approved"]

export const QUEUE_STATUSES: SlotStatus[] = ["Request Pending", "Review"]

export function isDeclinedOrCanceled(status: SlotStatus): boolean {
  return status === "Declined" || status === "Canceled"
}

export function isGoldPartner(row: Pick<SlotRequestRow, "school" | "partnerCategory">): boolean {
  return isGoldPartnerEntity(row)
}

export function isWaitlistRow(row: Pick<SlotRequestRow, "status" | "partnerCategory">): boolean {
  if (row.status !== "Review") return false
  const cat = (row.partnerCategory ?? "").toLowerCase()
  return WAITLIST_MARKERS.some((m) => cat.includes(m))
}

export function isUrgentRequest(
  footprint: Pick<SchedulingFootprint, "dateStart">,
  calendarToday: Date,
  urgentWithinDays = 14,
): boolean {
  const ms = footprint.dateStart.getTime() - calendarToday.getTime()
  const days = Math.ceil(ms / 86_400_000)
  return days >= 0 && days <= urgentWithinDays
}

/**
 * Gold affects queue ordering and strategic priority only — never capacity math.
 * Situations where Gold must NOT override physics:
 * - headroom / competition class / capacity state
 * - blocking approval when over cap (unless explicit policy override in modal)
 * - cross-discipline or cross-footprint priority inheritance
 */
export function computeStrategicPriority(input: {
  isGold: boolean
  isWaitlist: boolean
  isUrgent: boolean
  requestedSlots: number
  experienceType: SlotRequestRow["experienceType"]
  queueAgeDays: number
}): number {
  let score = 40
  if (input.isGold) score += 25
  if (input.isUrgent) score += 15
  if (input.experienceType === "Group") score += Math.min(10, input.requestedSlots)
  if (input.isWaitlist) score -= 20
  score += Math.min(10, Math.floor(input.queueAgeDays / 7))
  return Math.max(0, Math.min(100, score))
}

export function computeQueuePriority(input: {
  isGold: boolean
  isWaitlist: boolean
  isUrgent: boolean
}): QueuePriority {
  if (input.isWaitlist) return "waitlist"
  if (input.isGold && input.isUrgent) return "high"
  if (input.isGold) return "elevated"
  if (input.isUrgent) return "high"
  return "standard"
}

/**
 * Priority score for stable sort — higher first.
 * Tie-break order: Gold → waitlist lane → urgent → slots → age → school name.
 */
export function computePriorityScore(input: {
  isGold: boolean
  isWaitlist: boolean
  isUrgent: boolean
  requestedSlots: number
  queueAgeDays: number
  school: string
  requestId: string
}): number {
  let score = 0
  if (input.isGold) score += 1_000_000
  if (input.isWaitlist) score += 500_000
  if (input.isUrgent) score += 250_000
  score += input.requestedSlots * 10_000
  score += Math.min(99_999, input.queueAgeDays * 100)
  // Stable tie-break: invert lexicographic (lower school name = higher score component)
  score += Math.max(0, 999 - input.school.charCodeAt(0))
  return score
}

export function compareQueuePriority(
  a: {
    priorityScore: number
    school: string
    requestId: string
  },
  b: {
    priorityScore: number
    school: string
    requestId: string
  },
): number {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
  const schoolCmp = a.school.localeCompare(b.school)
  if (schoolCmp !== 0) return schoolCmp
  return a.requestId.localeCompare(b.requestId)
}

const CLUSTER_STATUS_ORDER: Record<SlotStatus, number> = {
  "Request Pending": 0,
  Review: 1,
  Approved: 2,
  Declined: 3,
  Canceled: 4,
}

function parseRequestedDateMs(value: string): number {
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : 0
}

const APPROVAL_RISK_RANK: Record<ApprovalRisk, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const COMPETITION_RANK: Record<CompetitionClass, number> = {
  over: 0,
  hard: 1,
  soft: 2,
  compatible: 3,
}

function isActiveQueue(status: SlotStatus): boolean {
  return status === "Request Pending" || status === "Review"
}

function isTrueClusterCompetitor(
  snap: RequestDecisionSnapshot,
  memberIds: Set<string>,
): boolean {
  if (memberIds.size <= 1) return true
  return snap.competingRequestIds.some(
    (id) => id !== snap.requestId && memberIds.has(id),
  )
}

/**
 * Cluster modal inspection order — review-first stack:
 * active queue → true competitors → gold → waitlist → urgent → risk → competition → headroom → priority score.
 */
export function sortClusterRequestRows(
  rows: SlotRequestRow[],
  getDecision?: (id: string) => RequestDecisionSnapshot | undefined,
  clusterMemberIds?: string[],
): SlotRequestRow[] {
  const memberSet = new Set(clusterMemberIds ?? rows.map((r) => r.id))

  return [...rows].sort((a, b) => {
    const snapA = getDecision?.(a.id)
    const snapB = getDecision?.(b.id)

    const activeA = isActiveQueue(a.status) ? 0 : 1
    const activeB = isActiveQueue(b.status) ? 0 : 1
    if (activeA !== activeB) return activeA - activeB

    if (snapA && snapB) {
      const trueA = isTrueClusterCompetitor(snapA, memberSet) ? 0 : 1
      const trueB = isTrueClusterCompetitor(snapB, memberSet) ? 0 : 1
      if (trueA !== trueB) return trueA - trueB

      if (snapA.isGoldPartner !== snapB.isGoldPartner) {
        return snapA.isGoldPartner ? -1 : 1
      }
      if (snapA.isWaitlist !== snapB.isWaitlist) {
        return snapA.isWaitlist ? -1 : 1
      }
      if (snapA.isUrgent !== snapB.isUrgent) {
        return snapA.isUrgent ? -1 : 1
      }

      const riskCmp =
        APPROVAL_RISK_RANK[snapA.approvalRisk] - APPROVAL_RISK_RANK[snapB.approvalRisk]
      if (riskCmp !== 0) return riskCmp

      const compCmp =
        COMPETITION_RANK[snapA.competitionClass] - COMPETITION_RANK[snapB.competitionClass]
      if (compCmp !== 0) return compCmp

      if (snapA.headroomAfterApproval !== snapB.headroomAfterApproval) {
        return snapA.headroomAfterApproval - snapB.headroomAfterApproval
      }

      if (snapB.priorityScore !== snapA.priorityScore) {
        return snapB.priorityScore - snapA.priorityScore
      }

      if (b.requestedSlots !== a.requestedSlots) return b.requestedSlots - a.requestedSlots

      if (snapB.queueAgeDays !== snapA.queueAgeDays) return snapB.queueAgeDays - snapA.queueAgeDays

      const statusCmp = CLUSTER_STATUS_ORDER[a.status] - CLUSTER_STATUS_ORDER[b.status]
      if (statusCmp !== 0) return statusCmp

      return compareQueuePriority(
        { priorityScore: snapA.priorityScore, school: a.school, requestId: a.id },
        { priorityScore: snapB.priorityScore, school: b.school, requestId: b.id },
      )
    }

    const goldA = snapA?.isGoldPartner ?? isGoldPartner(a) ? 1 : 0
    const goldB = snapB?.isGoldPartner ?? isGoldPartner(b) ? 1 : 0
    if (goldB !== goldA) return goldB - goldA

    const statusCmp = CLUSTER_STATUS_ORDER[a.status] - CLUSTER_STATUS_ORDER[b.status]
    if (statusCmp !== 0) return statusCmp

    const dateCmp = parseRequestedDateMs(a.requestedDate) - parseRequestedDateMs(b.requestedDate)
    if (dateCmp !== 0) return dateCmp

    if (b.requestedSlots !== a.requestedSlots) return b.requestedSlots - a.requestedSlots

    const schoolCmp = a.school.localeCompare(b.school)
    if (schoolCmp !== 0) return schoolCmp
    return a.id.localeCompare(b.id)
  })
}

/** Gold tie-break when two Gold partners compete on identical footprint. */
export function goldTieBreak(
  a: { isGold: boolean; priorityScore: number; requestedSlots: number; queueAgeDays: number },
  b: { isGold: boolean; priorityScore: number; requestedSlots: number; queueAgeDays: number },
): number {
  if (a.isGold !== b.isGold) return a.isGold ? -1 : 1
  if (b.requestedSlots !== a.requestedSlots) return b.requestedSlots - a.requestedSlots
  if (b.queueAgeDays !== a.queueAgeDays) return b.queueAgeDays - a.queueAgeDays
  return b.priorityScore - a.priorityScore
}

export function slotsCountForStatus(status: SlotStatus, requestedSlots: number): number {
  if (status === "Approved") return requestedSlots
  if (status === "Request Pending" || status === "Review") return requestedSlots
  return 0
}
