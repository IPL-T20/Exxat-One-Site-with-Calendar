import { useState } from "react"
import { createPortal } from "react-dom"
import type {
  FocusPeriodInsight,
  FocusPeriodInsightKind,
  PeriodTimelineBucket,
  SchedulesFocusPeriodSnapshot,
} from "../../lib/schedules/schedules-focus-period-snapshot"
import type { SchedulesCalendarQuickLens } from "../../lib/schedules/schedules-calendar-lens"
import { CALENDAR_FOCUS_INSIGHTS_Z } from "../../lib/slot-requests-calendar/constants"
import { FontAwesomeIcon, type FontAwesomeIconName } from "../font-awesome-icon"
import { CalendarChevron } from "./calendar-chevron"
import { cn } from "../ui/utils"

const INSIGHT_ICON: Record<FocusPeriodInsightKind, FontAwesomeIconName> = {
  risk: "triangleExclamation",
  peak: "chartBar",
  readiness: "clipboardCheck",
  momentum: "chartLine",
}

function MetricChip({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string
  value: number | string
  sub?: string
  tone?: "neutral" | "risk" | "join" | "end"
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-md px-2 py-2 text-center",
        tone === "neutral" && "bg-muted/60",
        tone === "risk" && Number(value) > 0 ? "bg-red-50" : "bg-muted/60",
        tone === "join" && "bg-emerald-50/80",
        tone === "end" && "bg-sky-50/80",
      )}
    >
      <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-['Roboto'] text-lg font-bold tabular-nums leading-none",
          tone === "risk" && Number(value) > 0 ? "text-red-600" : "text-foreground",
          Number(value) === 0 && tone !== "risk" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function PeriodLoadChart({
  buckets,
  periodNoun,
  avgConcurrent,
  peakConcurrent,
  peakLabel,
}: {
  buckets: PeriodTimelineBucket[]
  periodNoun: string
  avgConcurrent: number
  peakConcurrent: number
  peakLabel: string | null
}) {
  const max = Math.max(1, peakConcurrent)
  const showLabels = buckets.length <= 12

  return (
    <section aria-label={`Load across this ${periodNoun}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold text-foreground">Period load</p>
        <p className="text-[9px] tabular-nums text-muted-foreground">
          avg {avgConcurrent}
          {peakLabel ? ` · peak ${peakConcurrent}` : ""}
        </p>
      </div>
      <div className="flex h-14 items-end gap-px rounded-md bg-muted/30 px-1.5 pb-1 pt-2">
        {buckets.map((bucket) => {
          const h = Math.max(4, Math.round((bucket.load / max) * 100))
          return (
            <div
              key={`${bucket.label}-${bucket.shortLabel}`}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5"
              title={`${bucket.label}: ${bucket.load} active${bucket.starts ? `, ${bucket.starts} starting` : ""}${bucket.ends ? `, ${bucket.ends} ending` : ""}`}
            >
              <div
                className={cn(
                  "w-full min-w-[3px] max-w-full rounded-t transition-colors",
                  bucket.isPeak && "bg-indigo-600",
                  !bucket.isPeak && bucket.isToday && "bg-indigo-500",
                  !bucket.isPeak && !bucket.isToday && "bg-indigo-300/90",
                )}
                style={{ height: `${h}%` }}
              />
              {showLabels ? (
                <span
                  className={cn(
                    "w-full truncate text-center text-[8px] leading-none",
                    bucket.isToday ? "font-semibold text-indigo-700" : "text-muted-foreground",
                  )}
                >
                  {bucket.shortLabel}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
      {peakLabel ? (
        <p className="mt-1 text-[9px] text-muted-foreground">
          Busiest on <span className="font-medium text-foreground">{peakLabel}</span>
        </p>
      ) : null}
    </section>
  )
}

function AtRiskLocationTags({
  locations,
}: {
  locations: { location: string; count: number }[]
}) {
  if (locations.length === 0) return null

  return (
    <section aria-label="At-risk locations">
      <p className="mb-1.5 text-[10px] font-semibold text-foreground">At-risk locations</p>
      <div className="flex flex-wrap gap-1">
        {locations.map(({ location, count }) => (
          <span
            key={location}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] leading-tight text-amber-900"
            title={location}
          >
            <FontAwesomeIcon name="triangleExclamation" className="size-2.5 shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
            <span className="shrink-0 font-semibold tabular-nums">{count}</span>
          </span>
        ))}
      </div>
    </section>
  )
}

function AlertCard({ insight }: { insight: FocusPeriodInsight }) {
  return (
    <div className="rounded-md bg-muted/30 px-2.5 py-2">
      <div className="flex gap-2">
        <FontAwesomeIcon
          name={INSIGHT_ICON[insight.kind]}
          className="mt-0.5 size-3.5 shrink-0 text-indigo-600"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold leading-snug text-foreground">{insight.title}</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{insight.detail}</p>
        </div>
      </div>
    </div>
  )
}

export function SchedulesFocusPeriodLegend({
  snapshot,
  quickLens = "all",
  onQuickLensChange,
  className,
}: {
  snapshot: SchedulesFocusPeriodSnapshot
  quickLens?: SchedulesCalendarQuickLens
  onQuickLensChange?: (lens: SchedulesCalendarQuickLens) => void
  className?: string
}) {
  const [expanded, setExpanded] = useState(true)

  const joiningSub =
    snapshot.groupJoining > 0
      ? `${snapshot.individualJoining} ind · ${snapshot.groupJoining} grp`
      : snapshot.individualJoining > 0
        ? "students"
        : undefined

  const secondaryInsights = snapshot.insights.filter(
    (i) => i.title !== snapshot.primaryAlert?.title,
  )

  if (typeof document === "undefined") return null

  return createPortal(
    <aside
      className={cn(
        "pointer-events-auto fixed bottom-4 right-4 w-[min(calc(100vw-2rem),22.5rem)] overflow-hidden rounded-xl border border-border/80 bg-white/98 text-popover-foreground shadow-2xl backdrop-blur-md",
        className,
      )}
      style={{ zIndex: CALENDAR_FOCUS_INSIGHTS_Z }}
      aria-label={`Insights for ${snapshot.periodLabel}`}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/25"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm"
          aria-hidden
        >
          <FontAwesomeIcon name="sparkles" className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-['Roboto'] text-sm font-semibold leading-tight">Insights</p>
          <p className="truncate text-[10px] text-muted-foreground">
            {expanded ? snapshot.periodLabel : snapshot.headline}
          </p>
        </div>
        <CalendarChevron use="disclosure" open={expanded} className="shrink-0" />
      </button>

      {expanded ? (
        <div className="max-h-[min(52vh,26rem)] space-y-3 overflow-y-auto border-t border-border/60 px-3 pb-3 pt-2.5">
          <div className="flex gap-1.5">
            <MetricChip label="Active" value={snapshot.active} />
            <MetricChip
              label="Joining"
              value={snapshot.startingInPeriod}
              sub={joiningSub}
              tone="join"
            />
            <MetricChip
              label="Ending"
              value={snapshot.endingInPeriod}
              tone="end"
            />
            <MetricChip label="At risk" value={snapshot.atRisk} tone="risk" />
          </div>

          {snapshot.periodTimeline.length > 0 ? (
            <PeriodLoadChart
              buckets={snapshot.periodTimeline}
              periodNoun={snapshot.periodNoun}
              avgConcurrent={snapshot.avgConcurrent}
              peakConcurrent={snapshot.peakConcurrent}
              peakLabel={snapshot.peakLabel}
            />
          ) : null}

          <p className="text-[10px] leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground/90">Ending soon</span>
            {" · "}
            {snapshot.endingToday} today · {snapshot.endingThisWeek} this week ·{" "}
            {snapshot.endingThisMonth} this month
          </p>

          {snapshot.loadMomentum ? (
            <p className="rounded-md bg-indigo-50/90 px-2 py-1.5 text-[10px] font-medium leading-snug text-indigo-900">
              {snapshot.loadMomentum}
            </p>
          ) : null}

          <AtRiskLocationTags locations={snapshot.atRiskLocations} />

          {snapshot.primaryAlert ? <AlertCard insight={snapshot.primaryAlert} /> : null}

          {secondaryInsights.map((insight) => (
            <AlertCard key={`${insight.kind}-${insight.title}`} insight={insight} />
          ))}

          {snapshot.atRisk > 0 && onQuickLensChange ? (
            <button
              type="button"
              className={cn(
                "w-full rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition-colors",
                quickLens === "at_risk"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-border bg-white text-indigo-700 hover:bg-indigo-50/60",
              )}
              onClick={() => onQuickLensChange("at_risk")}
            >
              {quickLens === "at_risk" ? "Showing at-risk only" : "Show at-risk only"}
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>,
    document.body,
  )
}
