import type { ReactNode, RefObject } from "react"
import {
  isGoldPartner,
  requestIdFromPlacement,
  type ApprovalObjectCluster,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import { STATUS_BAR_STYLE, STATUS_LABEL } from "../../lib/slot-requests-calendar/constants"
import type { Placement, SlotStatus } from "../../lib/slot-requests-calendar/types"
import type { CalendarModel } from "./useCalendarModel"
import { GoldPartnerLeading, GoldPartnerStar, GOLD_PARTNER_INLINE_GAP } from "./gold-partner-star"
import { buildClusterHeaderMeta } from "../../lib/slot-requests-calendar/cluster-decision-meta"
import type { UsabilitySurfaceSnapshot } from "../../lib/mock/usability-fixture-alignment"
import {
  CapacityStateBadge,
  CompetitionSeverityBadge,
  HoverDecisionHint,
} from "./decision-intelligence"
import { useWorkflowPrototype } from "./usability-prototype/workflow-prototype-context"
import { CalendarHoverPortal } from "./calendar-hover-portal"

export type ApprovalHoverTarget =
  | { kind: "single"; placement: Placement; rect: DOMRect; anchorEl?: HTMLElement }
  | { kind: "cluster"; cluster: ApprovalObjectCluster; rect: DOMRect; anchorEl?: HTMLElement }

function clusterStripeLabel(cluster: ApprovalObjectCluster): string {
  const n = cluster.stats.requestCount
  const s = cluster.stats.schoolCount
  return `${n} Request${n === 1 ? "" : "s"} · ${s} School${s === 1 ? "" : "s"}`
}

function HoverShell({
  anchor,
  anchorEl,
  scrollRootRef,
  hint,
  stripeLabel,
  children,
}: {
  anchor: DOMRect
  anchorEl?: HTMLElement
  scrollRootRef?: RefObject<HTMLElement | null>
  hint: string
  stripeLabel?: string | null
  children: ReactNode
}) {
  return (
    <CalendarHoverPortal
      anchorEl={anchorEl}
      fallbackRect={anchor}
      scrollRootRef={scrollRootRef}
      cardW={300}
      estimatedCardH={200}
      className="rounded-lg border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <span className="inline-flex size-5 items-center justify-center rounded text-muted-foreground" aria-hidden>
          ↗
        </span>
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      </div>
      {stripeLabel ? (
        <div className="border-b border-primary/15 bg-primary/[0.06] px-3 py-1.5">
          <span className="text-[11px] font-semibold text-foreground tabular-nums">{stripeLabel}</span>
        </div>
      ) : null}
      <div className="p-3 max-h-72 overflow-y-auto">{children}</div>
    </CalendarHoverPortal>
  )
}

function SingleHoverBody({
  placement,
  model,
  medstarMode,
}: {
  placement: Placement
  model: CalendarModel | null
  medstarMode?: boolean
}) {
  const statusStyle = STATUS_BAR_STYLE[placement.status]
  const programLine =
    placement.programType?.split(" - ").slice(1).join(" - ") ?? placement.discipline
  const requestId = requestIdFromPlacement(placement)
  const decision = model?.getRequestDecision(requestId)

  return (
    <>
      {isGoldPartner(placement) ? (
        <GoldPartnerLeading size="md" className="text-sm font-semibold text-foreground leading-snug">
          <span>{placement.school}</span>
        </GoldPartnerLeading>
      ) : (
        <p className="text-sm font-semibold text-foreground leading-snug">{placement.school}</p>
      )}
      {programLine ? <p className="text-xs text-muted-foreground mt-0.5">{programLine}</p> : null}
      <p className="text-xs text-muted-foreground mt-2 tabular-nums">{placement.requestedDuration}</p>
      <p className="text-xs font-medium text-foreground mt-2">
        {placement.requestedSlots} Requested Slot{placement.requestedSlots === 1 ? "" : "s"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Status:{" "}
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 font-medium text-foreground"
          style={{
            backgroundColor: statusStyle.fill,
            border: `1px solid ${statusStyle.border}`,
          }}
        >
          {STATUS_LABEL[placement.status]}
        </span>
      </p>
      {decision && !medstarMode ? <HoverDecisionHint snap={decision} /> : null}
      <div className="mt-3 pt-3 border-t border-border space-y-1">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Location</span>
          <br />
          {placement.locationName}
          {placement.locationGroup ? ` · ${placement.locationGroup}` : ""}
        </p>
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Discipline</span> {placement.discipline}
        </p>
        <p className="text-[11px] font-mono tabular-nums text-muted-foreground pt-1">
          Request ID: {requestId}
        </p>
      </div>
    </>
  )
}

function statusLines(counts: Record<SlotStatus, number>): string {
  return (["Request Pending", "Review", "Approved", "Declined", "Canceled"] as SlotStatus[])
    .filter((s) => counts[s] > 0)
    .map((s) => `${STATUS_LABEL[s]}: ${counts[s]}`)
    .join(" · ")
}

function ClusterHoverBody({
  cluster,
  model,
  surfaceOverride,
  medstarMode,
}: {
  cluster: ApprovalObjectCluster
  model: CalendarModel | null
  surfaceOverride?: UsabilitySurfaceSnapshot | null
  medstarMode?: boolean
}) {
  const { stats, decisionMeta } = cluster
  const schools = stats.schoolBreakdown
  const previewLimit = 8
  const requestIds = cluster.placements.map(requestIdFromPlacement)
  const slotDemand = cluster.placements.reduce((sum, p) => {
    if (p.status === "Declined" || p.status === "Canceled") return sum
    return sum + p.requestedSlots
  }, 0)
  const statusRows = cluster.placements.map((p) => ({ status: p.status }))
  const headerMeta =
    decisionMeta ??
    (model
      ? buildClusterHeaderMeta(
          requestIds,
          (id) => model.getRequestDecision(id),
          slotDemand,
          statusRows,
        )
      : undefined)
  const leadId = requestIdFromPlacement(cluster.placements[0])
  const leadDecision = model?.getRequestDecision(leadId)

  return (
    <>
      {surfaceOverride ? (
        <>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {surfaceOverride.footprintSecondary} · Behavioral Health
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
            <span className="font-medium tabular-nums text-foreground">
              {surfaceOverride.busiestDayPrimary}
            </span>
            <CompetitionSeverityBadge competitionClass={surfaceOverride.competitionClass} size="xs" />
            <CapacityStateBadge capacityState={surfaceOverride.capacityState} size="xs" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">{surfaceOverride.metaLine}</p>
          <p className="text-xs text-foreground mt-3 pt-3 border-t border-border leading-snug">
            <span className="font-medium">Why review:</span>{" "}
            {surfaceOverride.sequenceCount > 0
              ? "Partner sequence — decide Johns Hopkins first."
              : "Capacity is full — remaining schools need risk review."}
          </p>
          <p className="text-[11px] text-violet-700 font-medium mt-2">Click to compare linked decisions</p>
        </>
      ) : headerMeta && !medstarMode ? (
        <>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {headerMeta.footprintLabel} · {headerMeta.locationName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
            <span className="font-medium tabular-nums text-foreground">
              {headerMeta.totalSlotDemand}/{headerMeta.cap} slots
            </span>
            <CompetitionSeverityBadge competitionClass={headerMeta.worstCompetitionClass} size="xs" />
            <CapacityStateBadge capacityState={headerMeta.capacityState} size="xs" />
          </div>
        </>
      ) : headerMeta && medstarMode ? (
        <>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {headerMeta.footprintLabel} · {headerMeta.locationName}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.requestCount} request{stats.requestCount === 1 ? "" : "s"} · {stats.schoolCount}{" "}
            school{stats.schoolCount === 1 ? "" : "s"}
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {stats.requestCount} Request{stats.requestCount === 1 ? "" : "s"} Total
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.schoolCount} school{stats.schoolCount === 1 ? "" : "s"} · {statusLines(stats.statusCounts)}
          </p>
        </>
      )}
      {!surfaceOverride && !medstarMode && leadDecision ? (
        <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border leading-snug">
          <span className="font-medium text-foreground">Lead headroom if approved: </span>
          <span className="tabular-nums">
            {leadDecision.headroomAfterApproval >= 0
              ? `${leadDecision.headroomAfterApproval} slots`
              : `${Math.abs(leadDecision.headroomAfterApproval)} over cap`}
          </span>
        </p>
      ) : null}

      {surfaceOverride ? null : (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {schools.slice(0, previewLimit).map((s) => (
            <li
              key={s.schoolShort}
              className="text-xs text-foreground flex items-center justify-between gap-2"
            >
              <span
                className={`truncate inline-flex items-center ${GOLD_PARTNER_INLINE_GAP} min-w-0 text-xs`}
              >
                {s.gold && <GoldPartnerStar size="md" />}
                <span className="truncate">{s.schoolShort}</span>
              </span>
              <span className="tabular-nums text-muted-foreground flex-shrink-0">({s.count})</span>
            </li>
          ))}
          {schools.length > previewLimit && (
            <li className="text-xs text-muted-foreground">
              +{schools.length - previewLimit} more schools
            </li>
          )}
        </ul>
      )}
    </>
  )
}

export function ApprovalHoverCard({
  target,
  model,
  scrollRootRef,
}: {
  target: ApprovalHoverTarget | null
  model?: CalendarModel | null
  scrollRootRef?: RefObject<HTMLElement | null>
}) {
  const proto = useWorkflowPrototype()
  if (!target) return null

  const isSingle = target.kind === "single"
  const clusterSurface =
    !isSingle && proto.enabled && !proto.isMedStarWorkflow ? proto.surfaceSnapshot : null
  const hint = isSingle
    ? "Click to open request detail"
    : proto.enabled
      ? "Click to compare linked decisions"
      : `Click to browse ${target.kind === "cluster" ? target.cluster.stats.requestCount : 0} requests`

  return (
    <HoverShell
      anchor={target.rect}
      anchorEl={target.anchorEl}
      scrollRootRef={scrollRootRef}
      hint={hint}
      stripeLabel={
        isSingle
          ? `${target.placement.schoolShort} · ${target.placement.requestedSlots} slot${target.placement.requestedSlots === 1 ? "" : "s"}`
          : clusterStripeLabel(target.cluster)
      }
    >
      {isSingle ? (
        <SingleHoverBody
          placement={target.placement}
          model={model ?? null}
          medstarMode={proto.isMedStarWorkflow}
        />
      ) : (
        <ClusterHoverBody
          cluster={target.cluster}
          model={model ?? null}
          surfaceOverride={clusterSurface}
          medstarMode={proto.isMedStarWorkflow}
        />
      )}
    </HoverShell>
  )
}
