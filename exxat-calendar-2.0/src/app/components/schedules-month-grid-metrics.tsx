import type { FontAwesomeIconName } from "./font-awesome-icon"
import { cn } from "./ui/utils"
import {
  SCHEDULES_KPI_ICON,
  SCHEDULES_SIDEBAR_KPI_TAG,
} from "../lib/schedules/schedules-kpi-visual"
import type { SchedulesCalendarKpiId } from "../lib/schedules/schedules-calendar-lens"

export type GridDayMetricId = "total" | "starting" | "atRisk"

const METRIC_DOT: Record<SchedulesCalendarKpiId, string> = {
  active: "bg-blue-600/80",
  starting: "bg-emerald-600/80",
  ending: "bg-foreground/35",
  needs_attention: "bg-amber-500",
}

export const GRID_DAY_METRICS: Record<
  GridDayMetricId,
  {
    styleKey: SchedulesCalendarKpiId
    icon: FontAwesomeIconName
    stripLabel: string
    chipLabel: string
  }
> = {
  total: {
    styleKey: "active",
    icon: SCHEDULES_KPI_ICON.active,
    stripLabel: "schedules",
    chipLabel: "Schedules",
  },
  starting: {
    styleKey: "starting",
    icon: SCHEDULES_KPI_ICON.starting,
    stripLabel: "starting today",
    chipLabel: "Starting",
  },
  atRisk: {
    styleKey: "needs_attention",
    icon: SCHEDULES_KPI_ICON.needs_attention,
    stripLabel: "at risk",
    chipLabel: "At risk",
  },
}

/** Compact strip for month grid cells — semantic dot + number + label. */
export function GridMetricStrip({
  metricId,
  value,
  emphasis = false,
}: {
  metricId: GridDayMetricId
  value: number
  emphasis?: boolean
}) {
  const def = GRID_DAY_METRICS[metricId]
  const tag = SCHEDULES_SIDEBAR_KPI_TAG[def.styleKey]
  const dot = METRIC_DOT[def.styleKey]

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 rounded-[3px] px-1 py-px leading-none",
        tag.wash,
      )}
      title={`${value} ${def.stripLabel}`}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden />
      <span
        className={cn(
          "shrink-0 tabular-nums",
          emphasis ? "text-[11px] font-semibold" : "text-[10px] font-medium",
          tag.value,
        )}
      >
        {value}
      </span>
      <span className="min-w-0 truncate text-[10px] text-muted-foreground/85">{def.stripLabel}</span>
    </div>
  )
}

/** Metric chip for insights — numbers only layer; icon stays label-sized. */
export function DayMetricChip({
  metricId,
  value,
}: {
  metricId: GridDayMetricId
  value: number
}) {
  const def = GRID_DAY_METRICS[metricId]
  const tag = SCHEDULES_SIDEBAR_KPI_TAG[def.styleKey]
  const dot = METRIC_DOT[def.styleKey]

  return (
    <div className={cn("min-w-0 flex-1 rounded-md px-2 py-2 text-center", tag.wash)}>
      <div className="flex items-center justify-center gap-1">
        <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden />
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          {def.chipLabel}
        </p>
      </div>
      <p className={cn("mt-1 font-['Roboto'] text-lg font-bold tabular-nums leading-none", tag.value)}>
        {value}
      </p>
    </div>
  )
}

/** Proportional view only — shown when risk exists; does not repeat chip counts. */
export function DayLoadMeter({
  total,
  atRisk,
}: {
  total: number
  atRisk: number
}) {
  if (total <= 0 || atRisk <= 0) return null

  const atRiskPct = Math.round((atRisk / total) * 100)

  return (
    <section aria-label="Risk share of day load">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold text-foreground">Load mix</p>
        <p className="text-[9px] tabular-nums text-muted-foreground">{atRiskPct}% needs attention</p>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-blue-600/15">
        <div
          className="h-full bg-blue-600/55"
          style={{ width: `${100 - atRiskPct}%` }}
          aria-hidden
        />
        <div
          className="h-full bg-amber-500/85"
          style={{ width: `${atRiskPct}%` }}
          aria-hidden
        />
      </div>
    </section>
  )
}
