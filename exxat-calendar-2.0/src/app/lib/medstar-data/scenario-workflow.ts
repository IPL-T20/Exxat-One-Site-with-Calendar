import {
  isActiveReviewRow,
  sortPrimaryReviewRows,
} from "../decision-workflow/review-order"
import { STATUS_LABEL } from "../slot-requests-calendar/constants"
import type { SlotRequestRow } from "../slot-requests-calendar/types"
import { formatScenarioDateSpan, pressureBandLabel } from "../medstar-real/adapter"
import type { RecommendedAction } from "../../components/calendar/decision-intelligence-band"
import type { MedStarScenario } from "./types"

export interface ScenarioOutcomeImpactRow {
  school: string
  slots: number
  status: string
  effect: string
  effectTone?: "default" | "amber" | "destructive" | "muted"
}

export interface ScenarioWorkflowOutcome {
  type: "approve" | "hold" | "decline"
  requestId: string
  school: string
  reason?: string
  consequenceLead: string
  consequenceDetail: string
  impactTitle: string
  impactRows: ScenarioOutcomeImpactRow[]
  calendarDelta: string
  nextLabel: string
  nextAction: () => void
  remainingActive?: number
  continueCompareIds?: string[]
  scenarioId?: string
}

export function scenarioClusterLabel(scenario: MedStarScenario): string {
  const unit = scenario.location ?? "Unit"
  const shift = scenario.shiftName ?? "Shift"
  return `${unit} · ${shift}`
}

export function rowsForScenario(
  allRows: readonly SlotRequestRow[],
  scenario: MedStarScenario,
): SlotRequestRow[] {
  const byId = new Map(allRows.map((r) => [r.id, r]))
  return scenario.requestIds
    .map((id) => byId.get(String(id)))
    .filter((r): r is SlotRequestRow => Boolean(r))
}

export function splitScenarioRows(
  memberRows: SlotRequestRow[],
  declinedIds: ReadonlySet<string>,
): { primaryRows: SlotRequestRow[]; contextRows: SlotRequestRow[] } {
  const active = memberRows.filter(
    (r) => isActiveReviewRow(r) && !declinedIds.has(r.id),
  )
  const context = memberRows.filter(
    (r) =>
      r.status === "Approved" ||
      r.status === "Declined" ||
      r.status === "Canceled" ||
      declinedIds.has(r.id),
  )
  return {
    primaryRows: sortPrimaryReviewRows(active),
    contextRows: context,
  }
}

export function buildScenarioRecommendedAction(
  row: SlotRequestRow,
  primaryRows: SlotRequestRow[],
  scenario: MedStarScenario,
): RecommendedAction {
  const rank = primaryRows.findIndex((r) => r.id === row.id) + 1
  const activeCount = primaryRows.length
  const others = Math.max(0, activeCount - 1)
  const unit = scenario.location ?? "this unit"
  const shift = scenario.shiftName ?? "shift"
  const dateSpan = formatScenarioDateSpan(scenario)
  const pressure = pressureBandLabel(scenario.pressureBand)
  const action: RecommendedAction["action"] = rank === 1 ? "Approve" : "Hold"

  return {
    action,
    why:
      rank <= 0
        ? "No active requests remain in this scenario."
        : rank === 1
          ? `Recommended: ${row.pendingDuration} days pending — highest in recommended order (${rank} of ${activeCount}).`
          : `Recommended: Review after higher-priority requests — rank ${rank} of ${activeCount} in recommended order.`,
    potentialImpact: `Potential impact: Approving ${row.requestedSlots} slot${row.requestedSlots === 1 ? "" : "s"} adds load on ${unit} · ${shift} — ${scenario.requestedSlotsTotal} slots requested across ${scenario.recordCount} requests (${pressure}).`,
    otherAffected: `Other requests affected: ${others} active school request${others === 1 ? "" : "s"} on ${unit} · ${shift} (${dateSpan}).`,
    remains: `What remains unresolved: ${Math.max(0, activeCount - 1)} of ${activeCount} active request${activeCount === 1 ? "" : "s"} in this scenario after this decision.`,
  }
}

function impactRowsFromRemaining(remaining: SlotRequestRow[]): ScenarioOutcomeImpactRow[] {
  return remaining.slice(0, 4).map((r) => ({
    school: r.school.split(" - ")[0] ?? r.school,
    slots: r.requestedSlots,
    status: STATUS_LABEL[r.status],
    effect: "Still needs review",
    effectTone: "amber" as const,
  }))
}

export function buildScenarioOutcome(
  type: "approve" | "hold" | "decline",
  requestId: string,
  school: string,
  primaryRows: SlotRequestRow[],
  scenario: MedStarScenario,
  options?: { reason?: string; onNext: () => void },
): ScenarioWorkflowOutcome {
  const unit = scenario.location ?? "this scenario"
  const remainingAfter =
    type === "decline"
      ? primaryRows.filter((r) => r.id !== requestId)
      : type === "approve"
        ? primaryRows.filter((r) => r.id !== requestId)
        : primaryRows
  const afterCount = remainingAfter.length

  if (type === "approve") {
    return {
      type: "approve",
      requestId,
      school,
      scenarioId: scenario.id,
      remainingActive: afterCount,
      continueCompareIds: remainingAfter.map((r) => r.id),
      consequenceLead: "1 request approved.",
      consequenceDetail: `${afterCount} request${afterCount === 1 ? "" : "s"} in this scenario still need review.`,
      impactTitle: "What changed",
      impactRows:
        afterCount > 0
          ? impactRowsFromRemaining(remainingAfter)
          : [{ school: unit, slots: 0, status: "—", effect: "No active requests remain", effectTone: "muted" }],
      calendarDelta: `${afterCount} active request${afterCount === 1 ? "" : "s"} remain on ${unit}`,
      nextLabel: afterCount > 0 ? "Continue compare →" : "View on calendar",
      nextAction: options?.onNext ?? (() => {}),
    }
  }

  if (type === "hold") {
    return {
      type: "hold",
      requestId,
      school,
      scenarioId: scenario.id,
      reason: options?.reason,
      remainingActive: primaryRows.length,
      continueCompareIds: primaryRows.map((r) => r.id),
      consequenceLead: "Request held in queue.",
      consequenceDetail: "No change to other active requests in this scenario.",
      impactTitle: "What stayed the same",
      impactRows: impactRowsFromRemaining(primaryRows).map((r) => ({
        ...r,
        effect: r.school === school.split(" - ")[0] ? "On hold" : "Unchanged",
        effectTone: "muted" as const,
      })),
      calendarDelta: `${primaryRows.length} active request${primaryRows.length === 1 ? "" : "s"} remain on ${unit}`,
      nextLabel: "Return to compare →",
      nextAction: options?.onNext ?? (() => {}),
    }
  }

  return {
    type: "decline",
    requestId,
    school,
    scenarioId: scenario.id,
    reason: options?.reason,
    remainingActive: afterCount,
    continueCompareIds: remainingAfter.map((r) => r.id),
    consequenceLead: "1 request declined.",
    consequenceDetail: `${afterCount} request${afterCount === 1 ? "" : "s"} in this scenario still need review.`,
    impactTitle: "What changed for others",
    impactRows: impactRowsFromRemaining(remainingAfter),
    calendarDelta: `${afterCount} active request${afterCount === 1 ? "" : "s"} remain on ${unit}`,
    nextLabel: afterCount > 0 ? "Continue compare →" : "View on calendar",
    nextAction: options?.onNext ?? (() => {}),
  }
}
