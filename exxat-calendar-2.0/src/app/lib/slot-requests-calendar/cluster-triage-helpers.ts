import type {
  ApprovalRisk,
  CompetitionClass,
  RequestDecisionSnapshot,
} from "./decision-engine/decision-types"
import type { SlotRequestRow } from "./types"

export interface ClusterTriageColumnFlags {
  showHeadroom: boolean
  showStatus: boolean
}

export interface RowRankSignal {
  id: string
  label: string
  tone: "brand" | "warning" | "danger" | "info"
}

export function formatHeadroomTriage(headroom: number): string {
  if (headroom > 0) return `+${headroom}`
  return String(headroom)
}

/** Hide status (and optional headroom) when every active row shares the same value. */
export function deriveClusterTriageColumns(
  rows: SlotRequestRow[],
  getDecision: (id: string) => RequestDecisionSnapshot | undefined,
): ClusterTriageColumnFlags {
  if (rows.length === 0) {
    return { showHeadroom: false, showStatus: false }
  }

  const headrooms = rows.map((r) => getDecision(r.id)?.headroomAfterApproval ?? 0)
  const statuses = rows.map((r) => r.status)

  return {
    showHeadroom: new Set(headrooms).size > 1,
    showStatus: new Set(statuses).size > 1,
  }
}

/** When every row shares the same approval risk, suppress per-row risk chips. */
export function deriveClusterUniformRisk(
  rows: SlotRequestRow[],
  getDecision: (id: string) => RequestDecisionSnapshot | undefined,
): ApprovalRisk | null {
  const risks = rows
    .map((r) => getDecision(r.id)?.approvalRisk)
    .filter((r): r is ApprovalRisk => Boolean(r))
  if (risks.length === 0) return null
  const unique = new Set(risks)
  return unique.size === 1 ? risks[0]! : null
}

/** Shared date range for cluster header when every row matches. */
export function deriveSharedDateRange(rows: SlotRequestRow[]): string | null {
  if (rows.length === 0) return null
  const first = rows[0]!.requestedDuration
  return rows.every((r) => r.requestedDuration === first) ? first : null
}

/** Rank-driver chip for a triage card (max 1). Urgent / waitlist / over-cap always surface. */
export function deriveRowRankSignals(
  snap: RequestDecisionSnapshot | undefined,
  uniformRisk: ApprovalRisk | null,
): RowRankSignal[] {
  if (!snap) return []

  const signals: RowRankSignal[] = []

  if (snap.isUrgent) {
    signals.push({ id: "urgent", label: "Urgent", tone: "danger" })
  }
  if (snap.isWaitlist) {
    signals.push({ id: "waitlist", label: "Waitlist", tone: "warning" })
  }
  if (snap.competitionClass === "over") {
    signals.push({ id: "competition-over", label: "Over cap", tone: "danger" })
  }

  const riskDiffers =
    uniformRisk === null ||
    (snap.approvalRisk === "critical" && uniformRisk !== "critical") ||
    (snap.approvalRisk === "high" && uniformRisk !== "high") ||
    (snap.approvalRisk === "medium" && uniformRisk !== "medium") ||
    (snap.approvalRisk === "low" && uniformRisk !== "low")

  if (riskDiffers) {
    if (snap.approvalRisk === "critical") {
      signals.push({ id: "risk-critical", label: "Critical risk", tone: "danger" })
    } else if (snap.approvalRisk === "high") {
      signals.push({ id: "risk-high", label: "High risk", tone: "warning" })
    } else if (snap.approvalRisk === "medium") {
      signals.push({ id: "risk-medium", label: "Medium risk", tone: "info" })
    }
  }

  return signals.slice(0, 1)
}
