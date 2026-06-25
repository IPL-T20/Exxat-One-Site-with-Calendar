import type { FontAwesomeIconName } from "./font-awesome-icon"
import { FontAwesomeIcon } from "./font-awesome-icon"
import {
  KpiStripBar,
  KpiStripMetric,
  KpiStripShell,
} from "./calendar/kpi-strip-shell"
import { cn } from "./ui/utils"
import { SCHEDULES_CALENDAR_KPI_TILE } from "../lib/slot-requests-calendar/constants"
import {
  SCHEDULES_CALENDAR_KPI_OPTIONS,
  type SchedulesCalendarKpiId,
  type SchedulesCalendarKpis,
  type SchedulesCalendarQuickLens,
} from "../lib/schedules/schedules-calendar-lens"
import { SCHEDULES_KPI_ICON } from "../lib/schedules/schedules-kpi-visual"

function kpiValue(id: SchedulesCalendarKpiId, metrics: SchedulesCalendarKpis): number {
  switch (id) {
    case "active":
      return metrics.active
    case "starting":
      return metrics.starting
    case "ending":
      return metrics.ending
    case "needs_attention":
      return metrics.needsAttention
  }
}

function KpiMetricContent({
  label,
  value,
  icon,
  tileClass,
  iconClass,
}: {
  label: string
  value: number
  icon: FontAwesomeIconName
  tileClass: string
  iconClass: string
}) {
  return (
    <>
      <div className="min-w-0">
        <p className="truncate font-['Roboto'] text-sm leading-tight text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 font-['Roboto'] text-[22px] font-bold leading-none tabular-nums text-foreground",
            value === 0 && "text-muted-foreground",
          )}
        >
          {value}
        </p>
      </div>
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-sm",
          tileClass,
        )}
        aria-hidden
      >
        <FontAwesomeIcon name={icon} className={cn("size-4", iconClass)} />
      </span>
    </>
  )
}

export function SchedulesAttentionKpiStrip({
  metrics,
  activeLens,
  onSelectLens,
}: {
  metrics: SchedulesCalendarKpis
  activeLens: SchedulesCalendarQuickLens
  onSelectLens: (lens: SchedulesCalendarQuickLens) => void
}) {
  return (
    <KpiStripShell ariaLabel="Schedules calendar summary">
      <KpiStripBar ariaLabel="Schedules calendar metrics">
        {SCHEDULES_CALENDAR_KPI_OPTIONS.map(({ id, label, info, filterLens }) => {
          const tile = SCHEDULES_CALENDAR_KPI_TILE[id]
          const icon = SCHEDULES_KPI_ICON[id]
          const value = kpiValue(id, metrics)
          const cardLabel = label(metrics.periodNoun)
          const isFilter = filterLens != null
          const isActive = isFilter && activeLens === filterLens

          if (isFilter && filterLens) {
            return (
              <KpiStripMetric
                key={id}
                className={cn(
                  isActive && "bg-primary/5 ring-1 ring-inset ring-primary/15",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex h-full min-w-0 flex-1 items-center justify-between gap-3 text-left",
                    "transition-colors hover:bg-accent/40",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  )}
                  onClick={() => onSelectLens(isActive ? "all" : filterLens)}
                  aria-pressed={isActive}
                  aria-label={`${cardLabel}: ${value}. Filter calendar to at-risk schedules.`}
                  title={info}
                >
                  <KpiMetricContent
                    label={cardLabel}
                    value={value}
                    icon={icon}
                    tileClass={tile.tileClass}
                    iconClass={tile.iconClass}
                  />
                </button>
              </KpiStripMetric>
            )
          }

          return (
            <KpiStripMetric key={id} title={info} aria-label={`${cardLabel}: ${value}`}>
              <div className="flex h-full w-full items-center justify-between gap-3">
                <KpiMetricContent
                  label={cardLabel}
                  value={value}
                  icon={icon}
                  tileClass={tile.tileClass}
                  iconClass={tile.iconClass}
                />
              </div>
            </KpiStripMetric>
          )
        })}
      </KpiStripBar>
    </KpiStripShell>
  )
}
