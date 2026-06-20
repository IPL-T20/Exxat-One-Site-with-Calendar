import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { FontAwesomeIcon } from "../font-awesome-icon"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  locationId,
  parseDiscipline,
  parseLocationParts,
} from "../../lib/slot-requests-calendar/parse"
import { STATUS_LABEL } from "../../lib/slot-requests-calendar/constants"
import { isGoldPartner } from "../../lib/slot-requests-calendar/approval-timeline-density"
import {
  deriveClusterTriageColumns,
  deriveClusterUniformRisk,
  deriveSharedDateRange,
} from "../../lib/slot-requests-calendar/cluster-triage-helpers"
import type { SlotRequestRow, SlotStatus } from "../../lib/slot-requests-calendar/types"
import type { CalendarModel } from "./useCalendarModel"
import { GoldPartnerLeading, GoldPartnerStar, GOLD_PARTNER_INLINE_GAP } from "./gold-partner-star"
import { sortClusterRequestRows } from "../../lib/slot-requests-calendar/decision-engine"
import { buildClusterHeaderMeta } from "../../lib/slot-requests-calendar/cluster-decision-meta"
import {
  ClusterModalFooter,
  ClusterModalHeader,
  ClusterTriageCard,
  RequestDecisionPanel,
  WorkflowModalEyebrow,
} from "./decision-intelligence"
import { Button } from "../ui/button"
import {
  busiestDayRatioLabel,
  USABILITY_COMPETITION_LINE,
  USABILITY_SEQUENCE_LINE,
  sortUsabilityTriageRows,
  usabilityCapacityState,
  usabilityCompetitionClass,
  usabilitySuggestedOpenId,
  usabilityTriageRowMeta,
} from "../../lib/mock/usability-fixture-alignment"
import { USABILITY_FIXTURE_IDS } from "../../lib/mock/usability-prototype-rows"
import { useWorkflowPrototype } from "./usability-prototype/workflow-prototype-context"
import { WorkflowContinueBanner } from "./usability-prototype/prototype-chrome"
import { WorkflowReasonPicker } from "./usability-prototype/workflow-reason-picker"
import {
  WorkflowDetailSections,
  WorkflowVerdictBand,
} from "./usability-prototype/workflow-verdict-band"
import { DecisionCompareTable } from "./decision-compare-table"
import {
  DecisionIntelligenceBand,
  DecisionIntelligenceSections,
} from "./decision-intelligence-band"
import {
  REVIEW_ORDER_SUBTITLE,
  recommendedReviewRank,
} from "../../lib/decision-workflow/review-order"
import { useMedStarDataOptional } from "../../lib/medstar-data/medstar-data-context"
import { resolveScenarioForCluster } from "../../lib/medstar-data/scenario-lookup"
import { formatScenarioDateSpan, pressureBandLabel } from "../../lib/medstar-real/adapter"

const WORKFLOW_MODAL_BASE =
  "flex flex-col p-0 gap-0 overflow-hidden"

/** Shared shell — Step 1 cluster and Step 2 detail use the same width/height for progressive disclosure. */
const WORKFLOW_MODAL_SHELL = `${WORKFLOW_MODAL_BASE} max-w-[min(78vw,76rem)] w-[min(78vw,76rem)] h-[min(80vh,920px)] max-h-[min(80vh,920px)] sm:max-w-[min(78vw,76rem)]`

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

function findRow(model: CalendarModel, id: string): SlotRequestRow | undefined {
  return model.rows.find((r) => r.id === id) ?? model.allRows.find((r) => r.id === id)
}

function mockHistory(row: SlotRequestRow): { when: string; text: string; kind: string }[] {
  const items: { when: string; text: string; kind: string }[] = [
    { when: row.requestedDate, text: `Submitted by ${row.requestedBy}`, kind: "submitted" },
  ]
  if (row.status === "Review") {
    items.push({
      when: row.requestedDate,
      text: "Moved to review — coordinator evaluating placement fit",
      kind: "reviewed",
    })
  }
  if (row.pendingDuration >= 7) {
    items.push({
      when: row.requestedDate,
      text: `Queue age ${row.pendingDuration} days — escalation recommended`,
      kind: "audit",
    })
  }
  if (row.status === "Approved" && row.approvedInfo && row.approvedInfo !== "--") {
    items.push({
      when: row.requestedDate,
      text: `${row.approvedInfo} slot(s) approved`,
      kind: "approved",
    })
  }
  if (row.status === "Declined") {
    items.push({
      when: row.requestedDate,
      text: "Request declined by site coordinator",
      kind: "declined",
    })
  }
  return items
}

function mockComments(row: SlotRequestRow) {
  return [
    {
      author: "Diana Somoza",
      when: "Jun 4, 2026",
      text: `Reviewing ${row.requestedSlots} slot(s) for ${row.availabilityName}.`,
    },
    {
      author: "System",
      when: row.requestedDate,
      text: "Request logged — awaiting site action.",
    },
  ]
}

function placementContext(model: CalendarModel, row: SlotRequestRow) {
  const { unit } = parseLocationParts(row.requestedLocation)
  const discipline = parseDiscipline(row.programType)
  const locId = locationId(unit)

  for (const loc of model.locations) {
    for (const disc of loc.disciplines) {
      if (loc.id === locId && disc.name === discipline) {
        const open = Math.max(0, disc.capacity - disc.approvedSlots)
        const conflictCount = model.conflicts.filter((c) => c.disciplineId === disc.id).length
        return {
          locationName: loc.name,
          discipline,
          capacity: disc.capacity,
          approvedSlots: disc.approvedSlots,
          open,
          utilizationPct: Math.round((disc.approvedSlots / Math.max(1, disc.capacity)) * 100),
          conflictCount,
        }
      }
    }
  }
  return null
}

function relatedRequests(model: CalendarModel, row: SlotRequestRow): SlotRequestRow[] {
  const { unit } = parseLocationParts(row.requestedLocation)
  const discipline = parseDiscipline(row.programType)
  return model.rows.filter((r) => {
    if (r.id === row.id) return false
    const { unit: u } = parseLocationParts(r.requestedLocation)
    return u === unit && parseDiscipline(r.programType) === discipline
  })
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-8 py-5 border-b border-border last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        {title}
      </h3>
      {children}
    </section>
  )
}

function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">{children}</dl>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-muted-foreground mb-1">{label}</dt>
      <dd className="text-sm text-foreground break-words">{value}</dd>
    </div>
  )
}

function RequestActions({ rowId }: { rowId: string }) {
  const [status, setStatus] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md bg-[#3F51B5] text-white hover:opacity-90"
          onClick={() =>
            setStatus(`Approved ${rowId} — mock only; wire to API when backend is ready.`)
          }
        >
          Approve
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md border border-destructive text-destructive hover:bg-destructive/5"
          onClick={() => setStatus(`Declined ${rowId} — mock only.`)}
        >
          Decline
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted"
          onClick={() => setStatus("Change request sent to school — mock only.")}
        >
          Request Changes
        </button>
      </div>
      {status ? (
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  )
}

function ObjectNavigation({ model }: { model: CalendarModel }) {
  const { approvalDetailRequestId, approvalNavigationIds, approvalDetailPrev, approvalDetailNext } =
    model
  const index = approvalDetailRequestId
    ? approvalNavigationIds.indexOf(approvalDetailRequestId)
    : -1
  const total = approvalNavigationIds.length

  if (index < 0 || total === 0) return null

  return (
    <div className="flex items-center justify-center gap-3 py-3 border-t border-border bg-muted/30">
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Previous request"
        disabled={index <= 0}
        onClick={approvalDetailPrev}
      >
        <FontAwesomeIcon name="angleLeft" className="size-3.5" aria-hidden />
      </button>
      <span className="text-sm text-muted-foreground tabular-nums min-w-[7rem] text-center">
        <span className="font-medium text-foreground">{index + 1}</span>
        {" of "}
        {total}
      </span>
      <button
        type="button"
        className="inline-flex size-8 items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Next request"
        disabled={index >= total - 1}
        onClick={approvalDetailNext}
      >
        <FontAwesomeIcon name="angleRight" className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}

function RequestDetailModalBody({ model, row }: { model: CalendarModel; row: SlotRequestRow }) {
  const { unit, locationGroup } = parseLocationParts(row.requestedLocation)
  const discipline = parseDiscipline(row.programType)
  const ctx = placementContext(model, row)
  const related = relatedRequests(model, row)
  const history = mockHistory(row)
  const comments = mockComments(row)
  const decision = model.getRequestDecision(row.id)

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {decision ? (
        <div className="px-8 pt-5">
          <RequestDecisionPanel snap={decision} />
        </div>
      ) : null}
      <Section title="Request details">
        <FieldGrid>
          <Field
            label="School"
            value={
              isGoldPartner(row) ? (
                <GoldPartnerLeading size="md" className="text-sm">
                  {row.school}
                </GoldPartnerLeading>
              ) : (
                row.school
              )
            }
          />
          <Field label="Program" value={row.programType} />
          <Field label="Discipline" value={discipline} />
          <Field label="Location" value={locationGroup ? `${unit} · ${locationGroup}` : unit} />
          <Field
            label="Requested slots"
            value={`${row.requestedSlots} (${row.experienceType})`}
          />
          <Field label="Date range" value={row.requestedDuration} />
          <Field label="Submission date" value={row.requestedDate} />
          <Field label="Requestor" value={row.requestedBy} />
          <Field label="Availability" value={row.availabilityName} />
          {row.partnerCategory ? (
            <Field label="Partner category" value={row.partnerCategory} />
          ) : null}
        </FieldGrid>
      </Section>

      <Section title="Capacity &amp; placement context">
        {ctx ? (
          <FieldGrid>
            <Field
              label="Available capacity"
              value={`${ctx.open} open · ${ctx.capacity} total at ${ctx.locationName}`}
            />
            <Field
              label="Utilization"
              value={`${ctx.utilizationPct}% (${ctx.approvedSlots} slots booked)`}
            />
            <Field
              label="Conflicts"
              value={
                ctx.conflictCount === 0
                  ? "None detected in this discipline row"
                  : `${ctx.conflictCount} overlap${ctx.conflictCount === 1 ? "" : "s"} in scope`
              }
            />
            <Field
              label="Related requests"
              value={
                related.length === 0
                  ? "No other requests in this location · discipline"
                  : `${related.length} other request${related.length === 1 ? "" : "s"}: ${related
                      .slice(0, 3)
                      .map((r) => r.school.split(" - ")[0])
                      .join(", ")}${related.length > 3 ? "…" : ""}`
              }
            />
          </FieldGrid>
        ) : (
          <p className="text-sm text-muted-foreground">No capacity model for this placement row.</p>
        )}
      </Section>

      <Section title="Notes &amp; history">
        <ol className="relative border-l border-border ml-2 space-y-4">
          {history.map((item, i) => (
            <li key={i} className="ml-4">
              <span
                className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-background bg-muted-foreground/40"
                aria-hidden
              />
              <p className="text-[11px] text-muted-foreground tabular-nums">{item.when}</p>
              <p className="text-sm text-foreground mt-0.5">{item.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Comments">
        <ul className="space-y-4">
          {comments.map((c, i) => (
            <li key={i} className="rounded-lg border border-border bg-muted/20 px-4 py-3">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{c.author}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{c.when}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Comment thread placeholder — mock collaboration for design review.
        </div>
      </Section>
    </div>
  )
}

function WorkflowDetailModal({ model, row }: { model: CalendarModel; row: SlotRequestRow }) {
  const proto = useWorkflowPrototype()
  const [ackChecked, setAckChecked] = useState(false)
  const [picker, setPicker] = useState<"hold" | "decline" | null>(null)

  const discipline = parseDiscipline(row.programType)
  const navIndex = model.approvalNavigationIds.indexOf(row.id)
  const navTotal = model.approvalNavigationIds.length
  const navPosition = navIndex >= 0 ? navIndex + 1 : 1
  const variant = proto.getDetailVariant(row.id)
  const recommendation = proto.getRecommendedAction(row)
  const reviewRank = recommendedReviewRank(row.id, proto.primaryRows)
  const showAck = proto.isMedStarWorkflow ? variant === "approve-with-risk" : variant !== "decide-first"

  const frame =
    variant === "decide-first" ? "F4" : variant === "approve-with-risk" ? "F6" : "F5"

  useEffect(() => {
    if (!proto.outcome) proto.setCurrentFrame(frame)
  }, [frame, proto])

  const returnToCompare = () => {
    model.backFromApprovalDetail()
    proto.setCurrentFrame("F3")
  }

  const handleApprove = () => {
    proto.applyApprove(row.id, row.school, () => {
      model.backFromApprovalDetail()
    })
  }

  return (
    <Dialog
      open={Boolean(model.approvalDetailRequestId && row)}
      onOpenChange={(open) => {
        if (!open) model.exitApprovalWorkflow()
      }}
    >
      <DialogContent className={WORKFLOW_MODAL_SHELL}>
        <DecisionIntelligenceBand recommendation={recommendation} />
        <WorkflowVerdictBand
          variant={variant}
          medstarMode={proto.isMedStarWorkflow}
          ackChecked={ackChecked}
          onAckChange={setAckChecked}
          showAck={showAck}
          onApprove={handleApprove}
          onModify={() => {}}
          onHold={() => setPicker("hold")}
          onDecline={() => setPicker("decline")}
          onOpenHopkins={
            !proto.isMedStarWorkflow && variant === "decide-first"
              ? () => {
                  proto.showContinueBanner("Return to recommended order in compare")
                  returnToCompare()
                }
              : undefined
          }
        />
        <WorkflowContinueBanner />
        <DialogHeader className="px-8 pt-4 pb-4 border-b border-border text-left shrink-0 space-y-3">
          {model.approvalDetailFromCluster ? (
            <div className="pr-10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={model.backFromApprovalDetail}
              >
                <FontAwesomeIcon name="angleLeft" className="size-3.5 mr-1.5" aria-hidden />
                Back to compare
              </Button>
            </div>
          ) : null}
          <WorkflowModalEyebrow>
            Decide · Step 2 of 2
            {navTotal > 1 ? ` · ${navPosition} of ${navTotal} from compare` : ""}
          </WorkflowModalEyebrow>
          {proto.enabled && !proto.isMedStarWorkflow && variant === "decide-first" ? (
            <p className="text-sm text-violet-700 -mt-1">
              Sequence blocked — resolve the recommended-first request before approving this one.
            </p>
          ) : null}
          <DialogTitle
            className={`text-2xl font-semibold leading-tight pr-10 inline-flex items-center ${GOLD_PARTNER_INLINE_GAP}`}
          >
            {isGoldPartner(row) && <GoldPartnerStar size="lg" />}
            <span>{row.school}</span>
          </DialogTitle>
          <DialogDescription>
            {proto.clusterLabel} · {STATUS_LABEL[row.status]} · {row.pendingDuration} days pending
            {reviewRank ? ` · Recommended order ${reviewRank} of ${proto.activeCount}` : ""}
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{row.programType}</span>
            <span aria-hidden>·</span>
            <span>{discipline}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyles(row.status)}`}
            >
              {STATUS_LABEL[row.status]}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {row.requestedSlots} slot{row.requestedSlots === 1 ? "" : "s"} · {row.requestedDuration}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <DecisionIntelligenceSections row={row} recommendation={recommendation} />
          {!proto.isMedStarWorkflow ? (
            <WorkflowDetailSections variant={variant} hideSupportAccordions={proto.enabled} />
          ) : null}
        </div>
        <ObjectNavigation model={model} />
        {picker === "hold" ? (
          <WorkflowReasonPicker
            title="Place on hold"
            reasons={["Ops", "Interview", "Info needed", "Other"]}
            onConfirm={(reason) => {
              setPicker(null)
              proto.applyHold(row.id, row.school, reason as "Ops", returnToCompare)
            }}
            onCancel={() => setPicker(null)}
          />
        ) : picker === "decline" ? (
          <WorkflowReasonPicker
            title="Decline request"
            reasons={["Capacity", "Eligibility", "Other"]}
            onConfirm={(reason) => {
              setPicker(null)
              proto.applyDecline(row.id, row.school, reason as "Capacity", returnToCompare)
            }}
            onCancel={() => setPicker(null)}
          />
        ) : proto.enabled ? null : (
          <div className="shrink-0 px-8 py-4 border-t border-border bg-muted/20 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={variant === "decide-first" || (showAck && !ackChecked)}
              onClick={handleApprove}
            >
              Approve
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPicker("hold")}>
              Hold
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setPicker("decline")}>
              Decline
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ApprovalRequestDetailModal({ model }: { model: CalendarModel }) {
  const proto = useWorkflowPrototype()
  const row = model.approvalDetailRequestId
    ? findRow(model, model.approvalDetailRequestId)
    : null

  if (!row) return null
  if (proto.enabled) return <WorkflowDetailModal model={model} row={row} />

  const discipline = parseDiscipline(row.programType)
  const navIndex = model.approvalNavigationIds.indexOf(row.id)
  const navTotal = model.approvalNavigationIds.length
  const navPosition = navIndex >= 0 ? navIndex + 1 : 1

  return (
    <Dialog
      open={Boolean(model.approvalDetailRequestId && row)}
      onOpenChange={(open) => {
        if (!open) model.exitApprovalWorkflow()
      }}
    >
      <DialogContent className={WORKFLOW_MODAL_SHELL}>
        <DialogHeader className="px-8 pt-6 pb-4 border-b border-border text-left shrink-0 space-y-3">
          {model.approvalDetailFromCluster ? (
            <div className="pr-10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground"
                onClick={model.backFromApprovalDetail}
              >
                <FontAwesomeIcon name="angleLeft" className="size-3.5 mr-1.5" aria-hidden />
                Back to cluster
              </Button>
            </div>
          ) : null}
          <WorkflowModalEyebrow>
            Review request · Step 2 of 2
            {navTotal > 1 ? ` · ${navPosition} of ${navTotal} in cluster` : ""}
          </WorkflowModalEyebrow>
          <DialogTitle
            className={`text-2xl font-semibold leading-tight pr-10 inline-flex items-center ${GOLD_PARTNER_INLINE_GAP}`}
          >
            {isGoldPartner(row) && <GoldPartnerStar size="lg" />}
            <span>{row.school}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review slot request {row.id} for {row.school}
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{row.programType}</span>
            <span aria-hidden>·</span>
            <span>{discipline}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyles(row.status)}`}
            >
              {STATUS_LABEL[row.status]}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground tabular-nums">
            <span>
              <span className="font-medium text-foreground">ID </span>
              <span className="font-mono">{row.id}</span>
            </span>
            <span>
              <span className="font-medium text-foreground">Dates </span>
              {row.requestedDuration}
            </span>
          </div>
        </DialogHeader>

        <RequestDetailModalBody model={model} row={row} />
        <ObjectNavigation model={model} />
        <div className="shrink-0 px-8 py-4 border-t border-border bg-muted/20">
          <RequestActions rowId={row.id} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ApprovalClusterModal({ model }: { model: CalendarModel }) {
  const proto = useWorkflowPrototype()
  const medstarData = useMedStarDataOptional()
  const cluster = model.approvalCluster
  const memberIds = cluster?.requestIds ?? []
  const listRef = useRef<HTMLUListElement>(null)

  const activeScenario = useMemo(() => {
    if (!medstarData?.store) return null
    if (memberIds.length === 0 && !cluster?.scenarioId) return null
    return (
      resolveScenarioForCluster(medstarData.store, memberIds, cluster?.scenarioId) ?? null
    )
  }, [medstarData, cluster?.scenarioId, memberIds])

  useEffect(() => {
    if (!proto.enabled) return
    proto.setActiveScenario(activeScenario)
    return () => {
      proto.setActiveScenario(null)
    }
  }, [proto.enabled, activeScenario, proto])

  const memberRows = memberIds
    .map((id) => findRow(model, id))
    .filter((r): r is SlotRequestRow => Boolean(r))
    .filter((r) => !proto.enabled || !proto.isRequestDeclined(r.id))

  const rows = proto.isFixtureFallback
    ? sortUsabilityTriageRows(memberRows, proto.declinedIds)
    : sortClusterRequestRows(
        memberRows,
        (id) => model.getRequestDecision(id),
        memberIds,
      )

  useEffect(() => {
    if (proto.enabled && cluster && !model.approvalDetailRequestId && !proto.outcome) {
      proto.setCurrentFrame("F3")
    }
  }, [proto, cluster, model.approvalDetailRequestId])
  const sortedIds = rows.map((r) => r.id)
  const slotDemand = rows.reduce((sum, row) => {
    if (row.status === "Declined" || row.status === "Canceled") return sum
    return sum + row.requestedSlots
  }, 0)
  const headerMeta =
    cluster && rows.length > 0
      ? buildClusterHeaderMeta(sortedIds, (id) => model.getRequestDecision(id), slotDemand, rows)
      : undefined
  const getDecision = (id: string) => model.getRequestDecision(id)
  const columnFlags = deriveClusterTriageColumns(rows, getDecision)
  const uniformRisk = deriveClusterUniformRisk(rows, getDecision)
  const sharedDateRange = deriveSharedDateRange(rows)

  useEffect(() => {
    const el = listRef.current
    if (!el || model.approvalClusterScrollTop <= 0) return
    el.scrollTop = model.approvalClusterScrollTop
  }, [model.approvalClusterScrollTop])

  const openFromCluster = (requestId: string) => {
    if (listRef.current) {
      model.setApprovalClusterScrollTop(listRef.current.scrollTop)
    }
    model.openApprovalDetail(requestId, sortedIds, { fromCluster: true })
  }

  const openHighestPriority = () => {
    const targetId = proto.isFixtureFallback
      ? usabilitySuggestedOpenId(proto.hopkinsApproved)
      : comparePrimaryRows[0]?.id ?? rows[0]?.id
    if (!targetId) return
    openFromCluster(targetId)
  }

  const usabilityHeader =
    proto.enabled && proto.surfaceSnapshot && proto.isFixtureFallback
      ? {
          linkedCount: 4,
          busiestDayPrimary: busiestDayRatioLabel(proto.surfaceSnapshot.busiestDayLoad, false),
          competitionLine: USABILITY_COMPETITION_LINE,
          sequenceLine: USABILITY_SEQUENCE_LINE,
          competitionClass: usabilityCompetitionClass(),
          capacityState: usabilityCapacityState(proto.surfaceSnapshot.busiestDayLoad),
        }
      : undefined

  const comparePrimaryRows = proto.enabled ? proto.primaryRows : rows
  const compareContextRows = proto.enabled ? proto.contextRows : []
  const compareReadOnly = proto.isMedStarWorkflow && comparePrimaryRows.length === 0
  const compareOpen = Boolean(
    cluster &&
      !model.approvalDetailRequestId &&
      (comparePrimaryRows.length > 0 || compareContextRows.length > 0 || memberRows.length > 0),
  )

  return (
    <Dialog
      open={compareOpen}
      onOpenChange={(open) => {
        if (!open) model.exitApprovalWorkflow()
      }}
    >
      <DialogContent className={WORKFLOW_MODAL_SHELL}>
        <DialogHeader className="px-8 pt-6 pb-4 border-b border-border text-left shrink-0 space-y-2">
          {proto.enabled ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                Compare requests · MedStar Health
              </p>
              {proto.isMedStarWorkflow && activeScenario ? (
                <>
                  <DialogTitle className="text-xl font-semibold">
                    {activeScenario.location} · {activeScenario.shiftName}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {formatScenarioDateSpan(activeScenario)} · {activeScenario.recordCount} requests ·{" "}
                    {activeScenario.schoolCount} schools · {comparePrimaryRows.length} in progress ·{" "}
                    {activeScenario.requestedSlotsTotal} requested / {activeScenario.approvedSlotsTotal}{" "}
                    approved
                  </DialogDescription>
                  <p className="text-sm font-medium text-red-700 mt-2">
                    Inferred from current request pattern:{" "}
                    {pressureBandLabel(activeScenario.pressureBand)}
                  </p>
                  {compareReadOnly ? (
                    <p className="text-sm text-muted-foreground">
                      Read-only compare — no active requests remain; context rows available below.
                    </p>
                  ) : null}
                </>
              ) : headerMeta ? (
                <>
                  <DialogTitle className="sr-only">
                    {headerMeta.footprintLabel} cluster — {comparePrimaryRows.length} requests
                  </DialogTitle>
                  <ClusterModalHeader
                    meta={headerMeta}
                    sharedDateRange={sharedDateRange}
                    uniformRisk={uniformRisk}
                    usabilityHeader={usabilityHeader}
                  />
                </>
              ) : (
                <DialogTitle className="text-xl font-semibold pr-8 leading-snug">
                  {comparePrimaryRows.length} overlapping requests
                </DialogTitle>
              )}
              <p className="text-xs text-muted-foreground mt-1">{REVIEW_ORDER_SUBTITLE}</p>
            </>
          ) : headerMeta ? (
            <>
              <DialogTitle className="sr-only">
                {headerMeta.footprintLabel} cluster — {rows.length} requests
              </DialogTitle>
              <ClusterModalHeader
                meta={headerMeta}
                sharedDateRange={sharedDateRange}
                uniformRisk={uniformRisk}
                usabilityHeader={usabilityHeader}
              />
            </>
          ) : (
            <>
              <DialogTitle className="text-xl font-semibold pr-8 leading-snug">
                {rows.length} overlapping requests
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Select a request to open its detail view. The timeline stays visible behind this
                dialog.
              </DialogDescription>
            </>
          )}
        </DialogHeader>

        {proto.enabled ? (
          <DecisionCompareTable
            primaryRows={comparePrimaryRows}
            contextRows={compareContextRows}
            readOnly={compareReadOnly}
            onSelectRow={(requestId, orderedIds) => {
              model.openApprovalDetail(requestId, orderedIds, { fromCluster: true })
            }}
          />
        ) : (
          <ul
            ref={listRef}
            className="flex-1 overflow-y-auto min-h-0 px-8 divide-y divide-border"
          >
            {rows.map((row, index) => (
              <ClusterTriageCard
                key={row.id}
                rank={index + 1}
                row={row}
                decision={getDecision(row.id)}
                columnFlags={columnFlags}
                uniformRisk={uniformRisk}
                reviewFirst={index === 0}
                onSelect={() => openFromCluster(row.id)}
              />
            ))}
          </ul>
        )}

        <ClusterModalFooter
          shown={proto.enabled ? comparePrimaryRows.length : rows.length}
          total={proto.enabled ? comparePrimaryRows.length : rows.length}
          contextNote={
            proto.enabled && compareContextRows.length > 0
              ? `${compareContextRows.length} context row${compareContextRows.length === 1 ? "" : "s"} available via toggle above`
              : undefined
          }
          onOpenHighestPriority={compareReadOnly ? undefined : openHighestPriority}
        />
      </DialogContent>
    </Dialog>
  )
}
