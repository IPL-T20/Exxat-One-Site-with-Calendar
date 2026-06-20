import { CALENDAR_TODAY, MS_DAY } from "./constants"
import { parseDurationRange } from "./parse"
import type { ConflictRecord, SlotRequestRow } from "./types"
import type { siteKpis } from "./build-tree"

/** Approval workflow — triage and decision queue framing. */
export interface ApprovalWorkflowKpis {
  pendingRequests: number
  inReview: number
  awaitingDecision: number
  avgApprovalAgeDays: number
  expiringThisWeek: number
}

/** Operations workflow — confirmed schedules and capacity framing. */
export interface OperationsWorkflowKpis {
  approvedPlacements: number
  scheduledStudents: number
  capacityUsedSlots: number
  capacityTotalSlots: number
  utilizationPct: number
  conflicts: number
}

const DECISION_STATUSES = new Set(["Request Pending", "Review"] as const)

function isAwaitingDecision(row: SlotRequestRow): boolean {
  return DECISION_STATUSES.has(row.status as "Request Pending" | "Review")
}

function placementStartsWithinWeek(
  row: SlotRequestRow,
  referenceDate: Date = CALENDAR_TODAY,
): boolean {
  const range = parseDurationRange(row.requestedDuration)
  if (!range) return false
  const start = range.start.getTime()
  const today = referenceDate.getTime()
  const weekEnd = today + 7 * MS_DAY
  return start >= today && start <= weekEnd
}

export function computeApprovalWorkflowKpis(
  rows: SlotRequestRow[],
  options?: { referenceDate?: Date },
): ApprovalWorkflowKpis {
  const referenceDate = options?.referenceDate ?? CALENDAR_TODAY
  const pendingRows = rows.filter((r) => r.status === "Request Pending")
  const reviewRows = rows.filter((r) => r.status === "Review")
  const decisionRows = rows.filter(isAwaitingDecision)

  const ageSum = decisionRows.reduce((s, r) => s + r.pendingDuration, 0)
  const avgApprovalAgeDays =
    decisionRows.length > 0 ? Math.round((ageSum / decisionRows.length) * 10) / 10 : 0

  const expiringThisWeek = decisionRows.filter((r) =>
    placementStartsWithinWeek(r, referenceDate),
  ).length

  return {
    pendingRequests: pendingRows.length,
    inReview: reviewRows.length,
    awaitingDecision: decisionRows.length,
    avgApprovalAgeDays,
    expiringThisWeek,
  }
}

export function computeOperationsWorkflowKpis(
  rows: SlotRequestRow[],
  treeKpis: ReturnType<typeof siteKpis>,
  conflicts: ConflictRecord[],
): OperationsWorkflowKpis {
  const approvedRows = rows.filter((r) => r.status === "Approved")
  const scheduledStudents = approvedRows.reduce((s, r) => s + r.requestedSlots, 0)

  return {
    approvedPlacements: approvedRows.length,
    scheduledStudents,
    capacityUsedSlots: treeKpis.approved,
    capacityTotalSlots: treeKpis.approved + treeKpis.openSlots,
    utilizationPct: treeKpis.capacityUsedPct,
    conflicts: conflicts.length,
  }
}
