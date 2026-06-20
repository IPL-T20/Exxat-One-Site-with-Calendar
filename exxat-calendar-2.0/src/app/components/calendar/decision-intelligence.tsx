import type { ReactNode } from "react"
import { parseDiscipline } from "../../lib/slot-requests-calendar/parse"
import type {
  ApprovalRisk,
  CapacityState,
  CompetitionClass,
  RequestDecisionSnapshot,
  WeekdayCode,
} from "../../lib/slot-requests-calendar/decision-engine/decision-types"
import {
  formatClusterPressureLine,
  formatClusterStatusMix,
  type ClusterDecisionMeta,
} from "../../lib/slot-requests-calendar/cluster-decision-meta"
import {
  deriveRowRankSignals,
  formatHeadroomTriage,
  type ClusterTriageColumnFlags,
  type RowRankSignal,
} from "../../lib/slot-requests-calendar/cluster-triage-helpers"
import { STATUS_LABEL } from "../../lib/slot-requests-calendar/constants"
import type { SlotRequestRow, SlotStatus } from "../../lib/slot-requests-calendar/types"
import { GoldPartnerStar } from "./gold-partner-star"
import { Button } from "../ui/button"
import { capacityBadgeClass } from "../../lib/slot-requests-calendar/capacity-coordinator-copy"

const COMPETITION_LABEL: Record<CompetitionClass, string> = {
  compatible: "No overlap",
  soft: "Soft competition",
  hard: "Hard competition",
  over: "Over capacity",
}

const COMPETITION_BADGE: Record<CompetitionClass, string | null> = {
  compatible: null,
  soft: "Soft",
  hard: "Hard",
  over: "Over",
}

const CAPACITY_LABEL: Record<CapacityState, string> = {
  open: "Open capacity",
  tight: "Tight capacity",
  exhausted: "At capacity",
  overbooked: "Overbooked",
}

const CAPACITY_SHORT: Record<CapacityState, string> = {
  open: "Open",
  tight: "Tight",
  exhausted: "Full",
  overbooked: "Over",
}

const RISK_LABEL: Record<ApprovalRisk, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  critical: "Critical risk",
}

export function formatCompetitionClass(c: CompetitionClass): string {
  return COMPETITION_LABEL[c]
}

export function formatCapacityState(c: CapacityState): string {
  return CAPACITY_LABEL[c]
}

export function formatCapacityStateShort(c: CapacityState): string {
  return CAPACITY_SHORT[c]
}

export function formatApprovalRisk(r: ApprovalRisk): string {
  return RISK_LABEL[r]
}

const COMPETITION_BADGE_CLASS: Record<Exclude<CompetitionClass, "compatible">, string> = {
  soft: "bg-amber-100 text-amber-900 border-amber-200",
  hard: "bg-orange-100 text-orange-900 border-orange-200",
  over: "bg-red-100 text-red-900 border-red-200",
}

export function CompetitionSeverityBadge({
  competitionClass,
  size = "sm",
}: {
  competitionClass: CompetitionClass
  size?: "sm" | "xs"
}) {
  const label = COMPETITION_BADGE[competitionClass]
  if (!label) return null

  return (
    <span
      className={`inline-flex items-center rounded border font-medium tabular-nums ${
        size === "xs" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]"
      } ${COMPETITION_BADGE_CLASS[competitionClass]}`}
    >
      {label}
    </span>
  )
}

export function CapacityStateBadge({
  capacityState,
  size = "sm",
}: {
  capacityState: CapacityState
  size?: "sm" | "xs"
}) {
  const badgeLabel =
    capacityState === "overbooked"
      ? "Over capacity"
      : capacityState === "exhausted"
        ? "At capacity"
        : capacityState === "tight"
          ? "Near capacity"
          : "Room available"

  const tone =
    capacityState === "overbooked"
      ? "critical"
      : capacityState === "exhausted"
        ? "pressure"
        : capacityState === "tight"
          ? "caution"
          : "healthy"

  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${
        size === "xs" ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]"
      } ${capacityBadgeClass(tone)}`}
    >
      {badgeLabel}
    </span>
  )
}

const WEEKDAY_STRIP_ORDER: WeekdayCode[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

const WEEKDAY_STRIP_LABEL: Record<WeekdayCode, string> = {
  sun: "S",
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "T",
  fri: "F",
  sat: "S",
}

function statusStyles(status: SlotStatus): string {
  const map: Record<SlotStatus, string> = {
    "Request Pending": "bg-amber-100 text-amber-900 border-amber-200",
    Review: "bg-blue-100 text-blue-900 border-blue-200",
    Approved: "bg-green-100 text-green-900 border-green-200",
    Declined: "bg-red-100 text-red-900 border-red-200",
    Canceled: "bg-gray-100 text-gray-600 border-gray-200",
  }
  return map[status]
}

const RANK_SIGNAL_TONE: Record<RowRankSignal["tone"], string> = {
  brand: "bg-primary/10 text-primary border-primary/25",
  warning: "bg-amber-100 text-amber-900 border-amber-200",
  danger: "bg-red-100 text-red-900 border-red-200",
  info: "bg-blue-100 text-blue-900 border-blue-200",
}

export function WorkflowModalEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
      {children}
    </p>
  )
}

export function RowRankSignalChip({ signal }: { signal: RowRankSignal }) {
  return (
    <span
      className={`inline-flex px-1.5 py-0 rounded text-[10px] font-medium border whitespace-nowrap ${RANK_SIGNAL_TONE[signal.tone]}`}
    >
      {signal.label}
    </span>
  )
}

export function FootprintWeekdayStrip({ weekdays }: { weekdays: WeekdayCode[] }) {
  const active = new Set(weekdays.length === 7 ? WEEKDAY_STRIP_ORDER : weekdays)

  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`Active weekdays: ${weekdays.length === 7 ? "Daily" : weekdays.join(", ")}`}
    >
      {WEEKDAY_STRIP_ORDER.map((code) => {
        const on = active.has(code)
        return (
          <span
            key={code}
            className={`inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium leading-none ${
              on
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {WEEKDAY_STRIP_LABEL[code]}
          </span>
        )
      })}
    </div>
  )
}

export interface UsabilityCompareHeader {
  linkedCount: number
  busiestDayPrimary: string
  competitionLine: string
  sequenceLine: string
  competitionClass: CompetitionClass
  capacityState: CapacityState
}

export function ClusterModalHeader({
  meta,
  sharedDateRange,
  uniformRisk,
  usabilityHeader,
}: {
  meta: ClusterDecisionMeta
  sharedDateRange?: string | null
  uniformRisk?: ApprovalRisk | null
  usabilityHeader?: UsabilityCompareHeader
}) {
  if (usabilityHeader) {
    return (
      <div className="space-y-2.5">
        <WorkflowModalEyebrow>
          Compare linked decisions · Step 1 of 2 · {usabilityHeader.linkedCount} linked
        </WorkflowModalEyebrow>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pr-8">
          <p className="text-base font-semibold leading-snug text-foreground">{meta.footprintLabel}</p>
          <FootprintWeekdayStrip weekdays={meta.weekdays} />
        </div>
        {meta.shiftTimeWindow ? (
          <p className="text-xs text-muted-foreground tabular-nums">{meta.shiftTimeWindow}</p>
        ) : null}
        <p className="text-sm text-muted-foreground leading-snug">
          {meta.locationName} · {meta.discipline}
          {sharedDateRange ? (
            <>
              <span aria-hidden> · </span>
              <span className="tabular-nums">{sharedDateRange}</span>
            </>
          ) : null}
        </p>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {usabilityHeader.busiestDayPrimary}
        </p>
        <p className="text-sm text-muted-foreground">{usabilityHeader.competitionLine}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <CompetitionSeverityBadge competitionClass={usabilityHeader.competitionClass} size="xs" />
          <CapacityStateBadge capacityState={usabilityHeader.capacityState} size="xs" />
        </div>
        <p className="text-sm font-medium text-violet-700 leading-snug">
          <span aria-hidden>↪ </span>
          {usabilityHeader.sequenceLine}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sorted by review priority — open row 1 first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <WorkflowModalEyebrow>
        Compare linked decisions · Step 1 of 2 · {meta.requestCount} linked
      </WorkflowModalEyebrow>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pr-8">
        <p className="text-base font-semibold leading-snug text-foreground">{meta.footprintLabel}</p>
        <FootprintWeekdayStrip weekdays={meta.weekdays} />
      </div>
      {meta.shiftTimeWindow ? (
        <p className="text-xs text-muted-foreground tabular-nums">{meta.shiftTimeWindow}</p>
      ) : null}
      <p className="text-sm text-muted-foreground leading-snug">
        {meta.locationName} · {meta.discipline}
        {sharedDateRange ? (
          <>
            <span aria-hidden> · </span>
            <span className="tabular-nums">{sharedDateRange}</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">
          {meta.totalSlotDemand}/{meta.cap} slots
        </span>
        <span aria-hidden>·</span>
        <span>
          {meta.requestCount} request{meta.requestCount === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>{formatClusterStatusMix(meta.statusMix)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <CompetitionSeverityBadge competitionClass={meta.worstCompetitionClass} size="xs" />
        <CapacityStateBadge capacityState={meta.capacityState} size="xs" />
        {uniformRisk && uniformRisk !== "low" ? (
          <span
            className={`inline-flex px-1.5 py-0 rounded text-[10px] font-medium border ${
              uniformRisk === "critical"
                ? "bg-red-100 text-red-900 border-red-200"
                : uniformRisk === "high"
                  ? "bg-amber-100 text-amber-900 border-amber-200"
                  : "bg-blue-100 text-blue-900 border-blue-200"
            }`}
          >
            {formatApprovalRisk(uniformRisk)}
          </span>
        ) : null}
        <span>{formatClusterPressureLine(meta)}</span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Sorted by review priority — open row 1 first.
      </p>
    </div>
  )
}

export function ClusterTriageCard({
  rank,
  row,
  decision,
  columnFlags,
  uniformRisk,
  reviewFirst,
  reviewFirstReason,
  sequenceBlocked,
  headroomLabel,
  queueAgeOverride,
  onSelect,
}: {
  rank: number
  row: SlotRequestRow
  decision?: RequestDecisionSnapshot
  columnFlags: ClusterTriageColumnFlags
  uniformRisk: ApprovalRisk | null
  reviewFirst?: boolean
  reviewFirstReason?: string
  sequenceBlocked?: boolean
  headroomLabel?: string
  queueAgeOverride?: number
  onSelect: () => void
}) {
  const headroom = decision?.headroomAfterApproval ?? 0
  const queueAge = queueAgeOverride ?? decision?.queueAgeDays ?? 0
  const gold = decision?.isGoldPartner ?? false
  const discipline = parseDiscipline(row.programType)
  const rankSignal = deriveRowRankSignals(decision, uniformRisk)[0]
  const slotLabel =
    row.requestedSlots === 1 ? "1 slot" : `${row.requestedSlots} slots`
  const ageLabel = queueAge > 0 ? `${queueAge}d` : null

  return (
    <li>
      <button
        type="button"
        className="w-full text-left py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset hover:bg-muted/25"
        onClick={onSelect}
        aria-label={`${rank}. ${row.school}${reviewFirst ? ", suggested first" : ""}, ${slotLabel}${ageLabel ? `, ${ageLabel} in queue` : ""}`}
      >
        <div className="flex items-start gap-3">
          <span
            className="tabular-nums text-xs font-medium text-muted-foreground pt-0.5 min-w-[1.25rem]"
            aria-hidden
          >
            {rank}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground leading-snug min-w-0">
                <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                  {gold ? <GoldPartnerStar size="md" /> : null}
                  <span className="break-words">{row.school}</span>
                  {reviewFirst ? (
                    <span className="text-xs font-normal text-muted-foreground whitespace-nowrap">
                      · Review first
                      {reviewFirstReason ? ` · ${reviewFirstReason}` : ""}
                    </span>
                  ) : null}
                </span>
              </p>

              {columnFlags.showStatus ? (
                <span
                  className={`inline-flex flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-medium border ${statusStyles(row.status)}`}
                >
                  {STATUS_LABEL[row.status]}
                </span>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {row.programType}
              <span aria-hidden> · </span>
              {discipline}
            </p>

            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="text-foreground font-medium">{slotLabel}</span>
              {ageLabel ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{ageLabel} in queue</span>
                </>
              ) : null}
              {headroomLabel ? (
                <>
                  <span aria-hidden>·</span>
                  <span
                    className={
                      headroomLabel.includes("block") ? "text-destructive font-medium" : undefined
                    }
                  >
                    {headroomLabel}
                  </span>
                </>
              ) : columnFlags.showHeadroom ? (
                <>
                  <span aria-hidden>·</span>
                  <span className={headroom < 0 ? "text-destructive font-medium" : undefined}>
                    {formatHeadroomTriage(headroom)} headroom
                  </span>
                </>
              ) : null}
              {sequenceBlocked ? (
                <>
                  <span aria-hidden>·</span>
                  <RowRankSignalChip
                    signal={{ id: "sequence-blocked", label: "Sequence blocked", tone: "brand" }}
                  />
                </>
              ) : null}
              {rankSignal && !sequenceBlocked ? (
                <>
                  <span aria-hidden>·</span>
                  <RowRankSignalChip signal={rankSignal} />
                </>
              ) : null}
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}

export function ClusterModalFooter({
  shown,
  total,
  contextNote,
  onOpenHighestPriority,
}: {
  shown: number
  total: number
  contextNote?: string
  onOpenHighestPriority?: () => void
}) {
  return (
    <div className="shrink-0 flex items-center justify-between gap-4 px-8 py-3 border-t border-border bg-background">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground tabular-nums">
          {shown} of {total} request{total === 1 ? "" : "s"}
        </p>
        {contextNote ? (
          <p className="text-xs text-muted-foreground mt-0.5">{contextNote}</p>
        ) : null}
      </div>
      {onOpenHighestPriority ? (
        <Button type="button" size="sm" onClick={onOpenHighestPriority}>
          Open suggested request →
        </Button>
      ) : null}
    </div>
  )
}

export function RequestDecisionPanel({ snap }: { snap: RequestDecisionSnapshot }) {
  const competitors =
    snap.competingSchools.length > 0
      ? snap.competingSchools
          .slice(0, 4)
          .map((s) => `${s.schoolShort} (${s.slotDemand} slots)`)
          .join(" · ")
      : "None on this footprint"

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-2 text-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Scheduling intelligence
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <dt className="text-muted-foreground">Footprint</dt>
          <dd className="font-medium text-foreground">{snap.footprint.footprintLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Competition</dt>
          <dd className="font-medium text-foreground flex items-center gap-1.5">
            <CompetitionSeverityBadge competitionClass={snap.competitionClass} size="xs" />
            <span>{formatCompetitionClass(snap.competitionClass)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Capacity</dt>
          <dd className="font-medium text-foreground flex items-center gap-1.5">
            <CapacityStateBadge capacityState={snap.capacityState} size="xs" />
            <span>{formatCapacityState(snap.capacityState)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Headroom if approved</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {snap.headroomAfterApproval >= 0
              ? `${snap.headroomAfterApproval} slots`
              : `${Math.abs(snap.headroomAfterApproval)} over cap`}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Approval risk</dt>
          <dd className="font-medium text-foreground">{formatApprovalRisk(snap.approvalRisk)}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground leading-snug pt-1 border-t border-border">
        <span className="font-medium text-foreground">Competitors: </span>
        {competitors}
        {snap.competingSchools.length > 4 ? ` · +${snap.competingSchools.length - 4} more` : ""}
      </p>
    </div>
  )
}

export function ClusterDecisionSummary({
  requestIds,
  getDecision,
}: {
  requestIds: string[]
  getDecision: (id: string) => RequestDecisionSnapshot | undefined
}) {
  const snaps = requestIds.map((id) => getDecision(id)).filter(Boolean) as RequestDecisionSnapshot[]
  if (snaps.length === 0) return null

  const worstCompetition = snaps.reduce<CompetitionClass>((w, s) => {
    const order: CompetitionClass[] = ["compatible", "soft", "hard", "over"]
    return order.indexOf(s.competitionClass) > order.indexOf(w) ? s.competitionClass : w
  }, "compatible")

  const worstCapacity = snaps.reduce<CapacityState>((w, s) => {
    const order: CapacityState[] = ["open", "tight", "exhausted", "overbooked"]
    return order.indexOf(s.capacityState) > order.indexOf(w) ? s.capacityState : w
  }, "open")

  const minHeadroom = Math.min(...snaps.map((s) => s.headroomAfterApproval))
  const cap = snaps[0]?.cap ?? 0
  const totalDemand = snaps.reduce((sum, s) => sum + s.footprint.requestedSlots, 0)

  return (
    <div className="mx-8 mt-3 mb-5 rounded-lg border border-border bg-muted/15 px-5 py-3.5 text-xs text-muted-foreground leading-relaxed">
      <span className="font-medium text-foreground">Cluster pressure: </span>
      <span className="font-medium tabular-nums text-foreground">
        {totalDemand}/{cap} slots
      </span>
      {" · "}
      <CompetitionSeverityBadge competitionClass={worstCompetition} size="xs" />
      {" "}
      <CapacityStateBadge capacityState={worstCapacity} size="xs" />
      {minHeadroom < 0
        ? ` · ${Math.abs(minHeadroom)} slots over cap if worst case approves`
        : ` · ${minHeadroom} slots headroom (tightest request)`}
    </div>
  )
}

export function HoverDecisionHint({ snap }: { snap: RequestDecisionSnapshot }) {
  return (
    <div className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border leading-snug space-y-1.5">
      <p className="font-medium text-foreground">{snap.footprint.footprintLabel}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <CompetitionSeverityBadge competitionClass={snap.competitionClass} size="xs" />
        <CapacityStateBadge capacityState={snap.capacityState} size="xs" />
      </div>
      <p>
        <span className="font-medium text-foreground">Headroom if approved: </span>
        <span className="tabular-nums">
          {snap.headroomAfterApproval >= 0
            ? `${snap.headroomAfterApproval} slots`
            : `${Math.abs(snap.headroomAfterApproval)} over cap`}
        </span>
      </p>
    </div>
  )
}
