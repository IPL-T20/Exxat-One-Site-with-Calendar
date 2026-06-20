import { createPortal } from "react-dom"
import { buildAvailabilityHoverCopy } from "../../lib/slot-requests-calendar/availability-hover-copy"
import type { ApprovalObjectCluster } from "../../lib/slot-requests-calendar/approval-object-cluster"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import type { MedStarScenario } from "../../lib/medstar-data/types"
import { buildScheduleHoverCopy } from "../../lib/schedules/schedule-stripe-copy"
import { GoldPartnerStar } from "./gold-partner-star"
import { cn } from "../ui/utils"
import { computeCalendarHoverPlacement } from "../../lib/slot-requests-calendar/calendar-hover-placement"
import { CALENDAR_HOVER_LAYER_Z } from "../../lib/slot-requests-calendar/constants"

export type AvailabilityHoverTarget = {
  cluster: ApprovalObjectCluster
  rect: DOMRect
  scenario?: MedStarScenario
  schedulesContext?: boolean
  sidebarContext?: {
    rowLabel?: string
    parentLabel?: string
    groupBy?: CalendarGroupByMode
  }
}

const CARD_W = 312

const CARD_SHELL =
  "relative overflow-hidden rounded-xl border border-border/70 bg-popover text-popover-foreground shadow-[0_12px_36px_-10px_rgba(15,23,42,0.18),0_4px_12px_-6px_rgba(15,23,42,0.08)]"

function HoverMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/35 px-2.5 py-2 min-w-0 ring-1 ring-border/40">
      <p className="text-[10px] font-medium leading-none text-muted-foreground truncate">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums leading-none tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}

function HoverDetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium leading-none text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold leading-snug text-foreground truncate",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function AvailabilityHoverPreview({
  target,
  schedulesContext = false,
}: {
  target: AvailabilityHoverTarget | null
  schedulesContext?: boolean
}) {
  if (!target) return null

  const isScheduleHover = schedulesContext || target.schedulesContext
  const { left, top, transform, caretLeft } = computeCalendarHoverPlacement(target.rect, CARD_W)
  const hoverShellStyle = {
    left,
    top,
    zIndex: CALENDAR_HOVER_LAYER_Z,
    transform: transform === "none" ? undefined : transform,
  } as const
  const hoverShellClass =
    "fixed pointer-events-none w-[312px] animate-in fade-in-0 zoom-in-95 duration-150"
  const hoverTransformClass =
    transform === "translateY(-100%)" ? "-translate-y-full" : undefined

  if (isScheduleHover) {
    const copy = buildScheduleHoverCopy(target.cluster, {
      sidebarContext: target.sidebarContext,
    })

    return createPortal(
      <div
        className={cn(hoverShellClass, hoverTransformClass)}
        style={hoverShellStyle}
        role="tooltip"
        aria-live="polite"
      >
        <div className={CARD_SHELL}>
          <div className="px-4 pt-3.5 pb-3">
            {copy.contextLabel ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">
                {copy.contextLabel}
              </p>
            ) : null}

            {copy.title ? (
              <p
                className={cn(
                  "font-semibold leading-tight tracking-tight text-foreground truncate text-[15px]",
                  copy.contextLabel ? "mt-1" : undefined,
                )}
              >
                {copy.title}
              </p>
            ) : null}

            {copy.dateRange ? (
              <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">{copy.dateRange}</p>
            ) : null}
          </div>

          <div className="px-4 pb-3.5 grid grid-cols-2 gap-x-3 gap-y-3">
            <HoverDetailRow label="Schedule status" value={copy.scheduleStatus} />
            {copy.onboardingStatus ? (
              <HoverDetailRow label="Onboarding" value={copy.onboardingStatus} />
            ) : null}
            {copy.experienceType ? (
              <HoverDetailRow label="Experience" value={copy.experienceType} />
            ) : null}
            <HoverDetailRow label="Schedule ID" value={copy.scheduleId} mono />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-primary/[0.06] px-4 py-2.5">
            <span className="text-xs font-semibold text-primary">Click to open schedule detail</span>
            <span
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold leading-none"
              aria-hidden
            >
              →
            </span>
          </div>

          <div
            className="absolute -bottom-[5px] h-2.5 w-2.5 rotate-45 border-b border-r border-border/70 bg-popover"
            style={{ left: caretLeft }}
            aria-hidden
          />
        </div>
      </div>,
      document.body,
    )
  }

  const copy = buildAvailabilityHoverCopy(target.cluster, {
    scenario: target.scenario,
    sidebarContext: target.sidebarContext,
  })

  const showSchools = copy.schoolCount > 1 && copy.schools.length > 0
  const metrics: { label: string; value: number }[] = []
  if (copy.requestCount > 0) metrics.push({ label: "Slot requests", value: copy.requestCount })
  if (copy.slotsRequested != null) metrics.push({ label: "Slots requested", value: copy.slotsRequested })
  if (copy.schoolCount > 1) metrics.push({ label: "Schools competing", value: copy.schoolCount })

  return createPortal(
    <div
      className={cn(hoverShellClass, hoverTransformClass)}
      style={hoverShellStyle}
      role="tooltip"
      aria-live="polite"
    >
      <div className={CARD_SHELL}>
        <div className="px-4 pt-3.5 pb-3">
          {copy.contextLabel ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground truncate">
              {copy.contextLabel}
            </p>
          ) : null}

          {copy.title ? (
            <p
              className={cn(
                "font-semibold leading-tight tracking-tight text-foreground truncate text-[15px]",
                copy.contextLabel ? "mt-1" : undefined,
              )}
            >
              {copy.title}
            </p>
          ) : null}

          {copy.dateRange ? (
            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">{copy.dateRange}</p>
          ) : null}
        </div>

        {metrics.length > 0 ? (
          <div className="px-4 pb-3.5 grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
              <HoverMetric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </div>
        ) : null}

        {showSchools ? (
          <div className="border-t border-border/50 px-4 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Top schools
            </p>
            <div className="flex flex-wrap gap-1.5">
              {copy.schools.map((school) => (
                <span
                  key={school.name}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border/50"
                >
                  {school.gold ? <GoldPartnerStar size="xs" /> : null}
                  <span className="truncate">{school.name}</span>
                  {school.requestCount > 1 ? (
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      ×{school.requestCount}
                    </span>
                  ) : null}
                </span>
              ))}
              {copy.moreSchools > 0 ? (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  +{copy.moreSchools} more
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-primary/[0.06] px-4 py-2.5">
          <span className="text-xs font-semibold text-primary">Click to review</span>
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold leading-none"
            aria-hidden
          >
            →
          </span>
        </div>

        <div
          className="absolute -bottom-[5px] h-2.5 w-2.5 rotate-45 border-b border-r border-border/70 bg-popover"
          style={{ left: caretLeft }}
          aria-hidden
        />
      </div>
    </div>,
    document.body,
  )
}
