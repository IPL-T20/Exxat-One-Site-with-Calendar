import { useState } from "react"
import { FontAwesomeIcon } from "../font-awesome-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import type { CalendarModel } from "./useCalendarModel"
import { GoldPartnerStar, GOLD_PARTNER_FILTER_STAR_SIZE } from "./gold-partner-star"
import { Button } from "../ui/button"
import { cn } from "../ui/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { ToolbarSegmentButton, ToolbarSegmentTrack } from "../toolbar-segment"
import { PERIOD_NAV_WIDTH_CLASS } from "../../lib/slot-requests-calendar/calendar-period-nav"
import {
  APPROVAL_KPI_VALUE_COLOR,
  CALENDAR_LIVE_DOT,
  CALENDAR_SIDEBAR_EDGE,
  CALENDAR_SIDEBAR_INSET,
  CALENDAR_TOOLBAR_PERIOD_LABEL,
  CALENDAR_TOOLBAR_TODAY_AWAY,
  CALENDAR_TOOLBAR_TODAY_CURRENT,
  OPERATIONS_KPI_VALUE_COLOR,
  SIDEBAR_W,
} from "../../lib/slot-requests-calendar/constants"
import { emptyScope, type CalendarLayers, type CalendarMode, type CalendarScope } from "../../lib/slot-requests-calendar/types"
import type { ApprovalWorkflowKpis, OperationsWorkflowKpis } from "../../lib/slot-requests-calendar/calendar-workflow-kpis"

const APPROVAL_KPI_CARDS = [
  {
    id: "pendingRequests" as const,
    label: "Pending Requests",
    info: "School slot requests waiting for an initial site response. Count reflects requests in your current scope.",
  },
  {
    id: "inReview" as const,
    label: "In Review",
    info: "Requests actively being evaluated by coordinators before a final approve or decline decision.",
  },
  {
    id: "awaitingDecision" as const,
    label: "To review",
    info: "Total requests still in the approval queue — pending plus in review — that need a coordinator decision.",
  },
  {
    id: "avgApprovalAge" as const,
    label: "Avg Approval Age",
    info: "Average days requests have been waiting in the queue (pending and in review), based on pending duration in the dataset.",
  },
  {
    id: "expiringThisWeek" as const,
    label: "Expiring This Week",
    info: "Queued requests whose placement start falls within the next seven days — prioritize before the window opens.",
  },
] as const

const OPERATIONS_KPI_CARDS = [
  {
    id: "approvedPlacements" as const,
    label: "Approved Placements",
    info: "Confirmed placement records in scope — each represents a school request that cleared approval.",
  },
  {
    id: "scheduledStudents" as const,
    label: "Scheduled Students",
    info: "Total student slots across approved placements. Derived from requested slot counts on approved requests.",
  },
  {
    id: "capacityUsed" as const,
    label: "Capacity Used",
    info: "Approved slots booked against modeled location capacity in the current scope.",
  },
  {
    id: "utilization" as const,
    label: "Utilization %",
    info: "Share of total modeled capacity currently filled by approved placements.",
  },
  {
    id: "conflicts" as const,
    label: "Conflicts",
    info: "Scheduling overlaps where booked or pending slots exceed discipline capacity for the same period.",
  },
] as const

type ApprovalKpiId = (typeof APPROVAL_KPI_CARDS)[number]["id"]
type OperationsKpiId = (typeof OPERATIONS_KPI_CARDS)[number]["id"]

function approvalKpiValue(id: ApprovalKpiId, kpis: ApprovalWorkflowKpis): string {
  switch (id) {
    case "pendingRequests":
      return String(kpis.pendingRequests)
    case "inReview":
      return String(kpis.inReview)
    case "awaitingDecision":
      return String(kpis.awaitingDecision)
    case "avgApprovalAge":
      return kpis.avgApprovalAgeDays === 0 ? "—" : `${kpis.avgApprovalAgeDays}d`
    case "expiringThisWeek":
      return String(kpis.expiringThisWeek)
  }
}

function operationsKpiValue(id: OperationsKpiId, kpis: OperationsWorkflowKpis): string {
  switch (id) {
    case "approvedPlacements":
      return String(kpis.approvedPlacements)
    case "scheduledStudents":
      return String(kpis.scheduledStudents)
    case "capacityUsed":
      return String(kpis.capacityUsedSlots)
    case "utilization":
      return `${kpis.utilizationPct}%`
    case "conflicts":
      return String(kpis.conflicts)
  }
}

function sumSlotsForStatuses(model: CalendarModel, statuses: Set<string>): number {
  let total = 0
  for (const row of model.rows) {
    if (statuses.has(row.status)) total += row.requestedSlots
  }
  return total
}

function approvalKpiCaption(id: ApprovalKpiId, model: CalendarModel): string {
  const { approvalKpis } = model
  const pendingSlots = sumSlotsForStatuses(model, new Set(["Request Pending"]))
  const reviewSlots = sumSlotsForStatuses(model, new Set(["Review"]))

  switch (id) {
    case "pendingRequests":
      return pendingSlots === 1
        ? "1 slot awaiting approval"
        : `${pendingSlots} slots awaiting approval`
    case "inReview":
      return reviewSlots === 1 ? "1 slot in review" : `${reviewSlots} slots in review`
    case "awaitingDecision":
      return approvalKpis.awaitingDecision === 1
        ? "1 request to review"
        : `${approvalKpis.awaitingDecision} requests to review`
    case "avgApprovalAge":
      return approvalKpis.awaitingDecision === 0
        ? "No items in queue"
        : "Days in pending + review"
    case "expiringThisWeek":
      return approvalKpis.expiringThisWeek === 0
        ? "None starting soon"
        : approvalKpis.expiringThisWeek === 1
          ? "1 start date this week"
          : `${approvalKpis.expiringThisWeek} start dates this week`
  }
}

function operationsKpiCaption(id: OperationsKpiId, model: CalendarModel): string {
  const { operationsKpis } = model

  switch (id) {
    case "approvedPlacements":
      return operationsKpis.approvedPlacements === 1
        ? "1 active placement"
        : `${operationsKpis.approvedPlacements} active placements`
    case "scheduledStudents":
      return operationsKpis.scheduledStudents === 1
        ? "1 student slot scheduled"
        : `${operationsKpis.scheduledStudents} student slots scheduled`
    case "capacityUsed":
      return `${operationsKpis.capacityUsedSlots} of ${operationsKpis.capacityTotalSlots} slots`
    case "utilization":
      return operationsKpis.utilizationPct >= 100
        ? "At or over capacity"
        : `${operationsKpis.capacityTotalSlots - operationsKpis.capacityUsedSlots} open slots`
    case "conflicts":
      if (operationsKpis.conflicts === 0) return "None detected"
      return operationsKpis.conflicts === 1
        ? "1 scheduling overlap"
        : `${operationsKpis.conflicts} scheduling overlaps`
  }
}

function approvalKpiValueColor(id: ApprovalKpiId, kpis: ApprovalWorkflowKpis): string {
  if (id === "expiringThisWeek" && kpis.expiringThisWeek === 0) return "#94a3b8"
  return APPROVAL_KPI_VALUE_COLOR[id]
}

function operationsKpiValueColor(id: OperationsKpiId, kpis: OperationsWorkflowKpis): string {
  if (id === "conflicts" && kpis.conflicts === 0) return "#94a3b8"
  return OPERATIONS_KPI_VALUE_COLOR[id]
}

function applyApprovalKpiScope(id: ApprovalKpiId, setScope: (s: CalendarScope) => void) {
  switch (id) {
    case "pendingRequests":
      setScope({ ...emptyScope(), statuses: new Set(["Request Pending"]) })
      break
    case "inReview":
      setScope({ ...emptyScope(), statuses: new Set(["Review"]) })
      break
    case "awaitingDecision":
      setScope({
        ...emptyScope(),
        statuses: new Set(["Request Pending", "Review"]),
      })
      break
    default:
      break
  }
}

function approvalKpiFilterable(id: ApprovalKpiId): boolean {
  return id === "pendingRequests" || id === "inReview" || id === "awaitingDecision"
}

function KpiMetricLabel({ label, info }: { label: string; info: string }) {
  return (
    <div className="flex items-center gap-1 mb-1.5">
      <span className="text-[11px] text-gray-500 font-['Roboto'] leading-none">{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-5 min-h-5 min-w-5 items-center justify-center rounded-sm text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F51B5]/40"
            aria-label={`About ${label}`}
          >
            <FontAwesomeIcon name="circleInfo" className="size-3" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-left leading-snug">
          {info}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function CalendarKpiCards({ model }: { model: CalendarModel }) {
  const isApproval = model.mode === "approval"

  if (isApproval) {
    return (
      <div
        className="bg-white rounded border border-gray-200 flex flex-wrap sm:flex-nowrap divide-y sm:divide-y-0 sm:divide-x divide-gray-200 shadow-sm"
        role="list"
        aria-label="Approval workflow metrics"
      >
        {APPROVAL_KPI_CARDS.map(({ id, label, info }) => {
          const value = approvalKpiValue(id, model.approvalKpis)
          const caption = approvalKpiCaption(id, model)
          const valueColor = approvalKpiValueColor(id, model.approvalKpis)
          const filterable = approvalKpiFilterable(id)

          return (
            <div key={id} role="listitem" className="flex-1 px-4 py-3 min-w-[9rem] bg-white">
              <KpiMetricLabel label={label} info={info} />
              {filterable ? (
                <button
                  type="button"
                  className="w-full text-left rounded-md -mx-1 px-1 py-0.5 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F51B5]/40"
                  onClick={() => applyApprovalKpiScope(id, model.setScope)}
                  aria-label={`${label}: ${value}. Filter calendar to this queue.`}
                >
                  <p
                    className="text-[22px] font-bold font-['Roboto'] leading-none tabular-nums"
                    style={{ color: valueColor }}
                  >
                    {value}
                  </p>
                  <p className="text-[11px] font-['Roboto'] mt-1.5 leading-snug text-gray-400">
                    {caption}
                  </p>
                </button>
              ) : (
                <>
                  <p
                    className="text-[22px] font-bold font-['Roboto'] leading-none tabular-nums"
                    style={{ color: valueColor }}
                  >
                    {value}
                  </p>
                  <p className="text-[11px] font-['Roboto'] mt-1.5 leading-snug text-gray-400">
                    {caption}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded border border-gray-200 flex flex-wrap sm:flex-nowrap divide-y sm:divide-y-0 sm:divide-x divide-gray-200 shadow-sm"
      role="list"
      aria-label="Operations workflow metrics"
    >
      {OPERATIONS_KPI_CARDS.map(({ id, label, info }) => {
        const value = operationsKpiValue(id, model.operationsKpis)
        const caption = operationsKpiCaption(id, model)
        const valueColor = operationsKpiValueColor(id, model.operationsKpis)

        return (
          <div
            key={id}
            role="listitem"
            className="flex-1 px-4 py-3 min-w-[9rem] bg-white"
          >
            <KpiMetricLabel label={label} info={info} />
            <p
              className="text-[22px] font-bold font-['Roboto'] leading-none tabular-nums"
              style={{ color: valueColor }}
            >
              {value}
            </p>
            <p className="text-[11px] font-['Roboto'] mt-1.5 leading-snug text-gray-400">
              {caption}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function CalendarModeSwitch({ model }: { model: CalendarModel }) {
  const { mode } = model

  return (
    <ToolbarSegmentTrack aria-label="Calendar workflow mode">
      {(
        [
          ["approval", "Approval", "clipboardList"],
          ["operations", "Operations", "sliders"],
        ] as const
      ).map(([m, label, icon]) => (
        <ToolbarSegmentButton
          key={m}
          active={mode === m}
          onClick={() => model.setMode(m as CalendarMode)}
          icon={icon}
          label={label}
        />
      ))}
    </ToolbarSegmentTrack>
  )
}

export function CalendarKpiStrip({ model }: { model: CalendarModel }) {
  return (
    <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
      <CalendarKpiCards model={model} />
    </div>
  )
}

export function CalendarGroupByControl({ model }: { model: CalendarModel }) {
  if (model.mode !== "approval") return null

  const available = model.groupByOptions.filter((o) => o.status === "available")
  const comingSoon = model.groupByOptions.filter((o) => o.status === "coming_soon")

  return (
    <div className="inline-flex items-center gap-3 flex-wrap">
      <div className="inline-flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
          Available today
        </span>
        <div
          className="inline-flex items-center rounded-lg bg-muted p-0.5 gap-0.5"
          role="group"
          aria-label="Calendar grouping — available views"
        >
          {available.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              title={opt.description}
              disabled={!opt.enabled}
              onClick={() => opt.enabled && model.setGroupBy(opt.mode)}
              aria-pressed={model.groupBy === opt.mode}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                model.groupBy === opt.mode
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {comingSoon.length > 0 ? (
        <div className="inline-flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 whitespace-nowrap">
            Coming soon
          </span>
          <div className="inline-flex items-center gap-1" role="group" aria-label="Calendar grouping — coming soon">
            {comingSoon.map((opt) => (
              <span
                key={opt.mode}
                title={opt.description}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-dashed border-border/80 text-muted-foreground/60 cursor-not-allowed select-none"
                aria-disabled="true"
              >
                {opt.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function CalendarToolbar({ model }: { model: CalendarModel }) {
  const { zoom, mode, layers } = model
  const expandableGroups = model.calendarViewGroups.filter((g) => !g.flat)
  const allExpanded =
    expandableGroups.length > 0 && model.expanded.size >= expandableGroups.length

  const displayFilters: {
    key: keyof CalendarLayers
    label: string
    goldIcon?: boolean
  }[] =
    mode === "operations"
      ? [
          { key: "capacity", label: "Capacity" },
          { key: "conflicts", label: "Conflicts" },
          { key: "declined", label: "Declined" },
        ]
      : [
          { key: "declined", label: "Declined & canceled" },
          { key: "showEmptyDisciplines", label: "Empty disciplines" },
          { key: "goldPartnersOnly", label: "Gold partners only", goldIcon: true },
        ]

  const activeDisplayCount = displayFilters.filter(({ key }) => layers[key]).length

  return (
    <div className="flex-shrink-0 border-b border-border bg-card">
      <div className="flex items-stretch">
        <div
          className={cn(
            "flex shrink-0 items-center py-2.5 bg-background",
            CALENDAR_SIDEBAR_EDGE,
            CALENDAR_SIDEBAR_INSET,
          )}
          style={{ width: SIDEBAR_W, boxShadow: model.sideShadow }}
        >
          <ToolbarSegmentTrack
            size="sm"
            className="flex w-full min-w-0"
            aria-label="Time scale — choose before navigating"
          >
            {(["day", "week", "month", "year"] as const).map((z) => (
              <ToolbarSegmentButton
                key={z}
                size="sm"
                className="min-w-0 flex-1 justify-center"
                active={zoom === z}
                onClick={() => model.setZoom(z)}
                label={z}
              />
            ))}
          </ToolbarSegmentTrack>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2.5 pr-4">
          <div className="inline-flex flex-wrap items-center gap-2">
            <div
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-md border border-gray-200 bg-white px-0.5",
                PERIOD_NAV_WIDTH_CLASS,
              )}
              role="group"
              aria-label={`Navigate by ${model.periodNavUnit}`}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7 shrink-0 p-0 text-foreground hover:bg-gray-100"
                aria-label={`Previous ${model.periodNavUnit}`}
                onClick={() => model.scrollPeriod(-1)}
              >
                <FontAwesomeIcon name="chevronLeft" className="size-3" aria-hidden />
              </Button>
              <span
                className={cn(
                  "min-w-0 flex-1 select-none truncate px-0.5 text-center font-['Roboto']",
                  CALENDAR_TOOLBAR_PERIOD_LABEL,
                )}
                aria-live="polite"
                title={model.periodLabel}
              >
                {model.periodLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7 shrink-0 p-0 text-foreground hover:bg-gray-100"
                aria-label={`Next ${model.periodNavUnit}`}
                onClick={() => model.scrollPeriod(1)}
              >
                <FontAwesomeIcon name="chevronRight" className="size-3" aria-hidden />
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={model.scrollToToday}
              className={cn(
                "gap-1.5",
                model.isViewingToday
                  ? CALENDAR_TOOLBAR_TODAY_CURRENT
                  : CALENDAR_TOOLBAR_TODAY_AWAY,
              )}
              aria-label="Jump to today"
              aria-current={model.isViewingToday ? "date" : undefined}
            >
              <span
                className={cn(
                  CALENDAR_LIVE_DOT,
                  !model.isViewingToday && "animate-live-dot-breathe",
                )}
                aria-hidden
              />
              Today
            </Button>

            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted/40">
              <input
                type="checkbox"
                checked={layers.focusPeriod}
                onChange={() =>
                  model.setLayers((l) => ({ ...l, focusPeriod: !l.focusPeriod }))
                }
                className="size-3.5 shrink-0 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="Focus period — clip stripes to the navigated day, week, month, or year"
              />
              Focus period
            </label>
          </div>

          <div className="inline-flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={model.toggleAll}
              className="text-foreground"
              aria-label={allExpanded ? "Collapse all locations" : "Expand all locations"}
            >
              <FontAwesomeIcon
                name={allExpanded ? "chevronUp" : "chevronDown"}
                className="size-3"
                aria-hidden
              />
              {allExpanded ? "Collapse all" : "Expand all"}
            </Button>

            <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-foreground"
                aria-label="Display options"
                aria-haspopup="dialog"
              >
                <FontAwesomeIcon name="sliders" className="size-3" aria-hidden />
                Display
                {activeDisplayCount > 0 ? (
                  <span className="inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-semibold tabular-nums text-primary">
                    {activeDisplayCount}
                  </span>
                ) : null}
                <FontAwesomeIcon name="chevronDown" className="size-2.5 opacity-60" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="z-[600] w-52 p-2">
              <p className="px-2 py-1 text-xs font-normal text-muted-foreground">
                Show on timeline
              </p>
              <div className="flex flex-col gap-0.5" role="group" aria-label="Display filters">
                {displayFilters.map(({ key, label, goldIcon }) => (
                  <label
                    key={key}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs leading-none text-foreground transition-colors hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={() =>
                        model.setLayers((l) => ({ ...l, [key]: !l[key] }))
                      }
                      className="size-3.5 shrink-0 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
                    {goldIcon ? <GoldPartnerStar size={GOLD_PARTNER_FILTER_STAR_SIZE} /> : null}
                    {label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CalendarDetailPanel({ model }: { model: CalendarModel }) {
  const [opsStatus, setOpsStatus] = useState<string | null>(null)
  const p = model.selectedPlacement
  if (!p) return null

  const schedule =
    p.timelineKind === "schedule" ||
    (model.mode === "operations" && p.status === "Approved") ||
    (model.schedulesContext && p.status === "Approved")

  return (
    <div className="flex flex-col border-t border-border bg-card flex-shrink-0 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{p.school}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {p.locationName} · {p.discipline} · {p.requestedDuration}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">{p.availabilityName}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
            <span className="rounded-md border border-border px-2 py-0.5 tabular-nums">
              {p.requestedSlots} slot{p.requestedSlots === 1 ? "" : "s"}
            </span>
            <span className="rounded-md border border-border px-2 py-0.5">{p.experienceType}</span>
            <span className="rounded-md border border-border px-2 py-0.5 font-mono tabular-nums">{p.id}</span>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground flex-shrink-0"
          aria-label="Close detail panel"
          onClick={() => model.setSelectedId(null)}
        >
          <FontAwesomeIcon name="x" className="size-3.5" aria-hidden />
        </button>
      </div>

      {model.mode === "approval" && !schedule && (
        <div className="px-4 pb-3 border-t border-border/60 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#3F51B5] text-white hover:opacity-90"
              onClick={() => setOpsStatus("Approved — mock only.")}
            >
              Approve
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted"
              onClick={() => setOpsStatus("Moved to review — mock only.")}
            >
              Review
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-destructive text-destructive hover:bg-destructive/5"
              onClick={() => setOpsStatus("Declined — mock only.")}
            >
              Decline
            </button>
          </div>
          {opsStatus ? (
            <p className="text-[10px] text-muted-foreground" role="status" aria-live="polite">
              {opsStatus}
            </p>
          ) : null}
        </div>
      )}

      {(model.mode === "operations" || model.schedulesContext) && schedule && (
        <div className="px-4 pb-3 border-t border-border/60 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted"
              onClick={() => setOpsStatus("Opening schedule view — mock only.")}
            >
              View schedule
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted"
              onClick={() => setOpsStatus("Edit dates — mock only.")}
            >
              Edit dates
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted"
              onClick={() => setOpsStatus("Contact school — mock only.")}
            >
              Contact school
            </button>
          </div>
          {opsStatus ? (
            <p className="text-[10px] text-muted-foreground" role="status" aria-live="polite">
              {opsStatus}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
