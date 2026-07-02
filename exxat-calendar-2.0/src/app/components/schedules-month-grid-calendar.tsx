import { useMemo } from "react"
import { cn } from "./ui/utils"
import type { MonthDayStats } from "../lib/schedules/schedules-month-grid-lens"
import {
  CALENDAR_TODAY_COLUMN_BG,
  CALENDAR_TODAY_ON_SURFACE,
  CALENDAR_TODAY_SURFACE,
} from "../lib/slot-requests-calendar/constants"
import { GridMetricStrip } from "./schedules-month-grid-metrics"

const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function buildMonthGridDays(monthStart: Date): Date[] {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const first = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - first.getDay())
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    days.push(
      new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
    )
  }
  return days
}

function formatCellDateLabel(date: Date): string {
  if (date.getDate() === 1) {
    return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`
  }
  return String(date.getDate())
}

function cellAriaLabel(date: Date, stats: MonthDayStats | undefined): string {
  const base = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  if (!stats || stats.total === 0) return base
  return `${base}, ${stats.total} schedules, ${stats.starting} starting today, ${stats.atRisk} at risk`
}

function CellDateLabel({
  date,
  inMonth,
  isToday,
  isSelected,
}: {
  date: Date
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[1.75rem] items-center justify-center tabular-nums leading-none",
        isToday &&
          cn(
            "size-7 rounded-full text-[13px] font-semibold",
            CALENDAR_TODAY_SURFACE,
            CALENDAR_TODAY_ON_SURFACE,
          ),
        !isToday &&
          isSelected &&
          inMonth &&
          "size-7 rounded-full bg-primary/10 text-[13px] font-semibold text-primary",
        !isToday &&
          !isSelected &&
          inMonth &&
          "text-[13px] font-semibold text-foreground",
        !inMonth && "text-[12px] font-medium text-muted-foreground/55",
      )}
    >
      {formatCellDateLabel(date)}
    </span>
  )
}

/** Month grid — total schedules + starting today + at risk. */
export function SchedulesMonthGridCalendar({
  monthStart,
  statsByIso,
  calendarTodayIso,
  selectedIso,
  onDayClick,
}: {
  monthStart: Date
  statsByIso: Map<string, MonthDayStats>
  calendarTodayIso: string
  selectedIso: string | null
  onDayClick: (day: Date) => void
}) {
  const days = useMemo(() => buildMonthGridDays(monthStart), [monthStart])
  const monthIndex = monthStart.getMonth()

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-border/80">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2.5 text-center text-[11px] font-medium tracking-wide text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 border-l border-border/80">
        {days.map((date) => {
          const iso = isoDate(date)
          const stats = statsByIso.get(iso)
          const inMonth = date.getMonth() === monthIndex
          const isToday = iso === calendarTodayIso
          const isSelected = iso === selectedIso
          const hasLoad = inMonth && (stats?.total ?? 0) > 0

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onDayClick(date)}
              className={cn(
                "relative flex min-h-[4.5rem] flex-col overflow-hidden border-b border-r border-border/80 p-1.5 text-left transition-colors sm:min-h-0 sm:p-2",
                !inMonth && "bg-muted/20",
                inMonth && !isToday && "bg-background hover:bg-muted/25",
                isToday &&
                  inMonth &&
                  cn(
                    CALENDAR_TODAY_COLUMN_BG,
                    "relative z-[1] shadow-[inset_0_0_0_2px_var(--color-chart-1)] hover:bg-chart-1/10",
                  ),
                isSelected &&
                  inMonth &&
                  !isToday &&
                  "bg-primary/[0.04] ring-1 ring-inset ring-primary/25",
                isSelected &&
                  inMonth &&
                  isToday &&
                  "shadow-[inset_0_0_0_2px_var(--color-chart-1)]",
              )}
              aria-label={cellAriaLabel(date, stats)}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
            >
              <div className="flex shrink-0 justify-end">
                <CellDateLabel
                  date={date}
                  inMonth={inMonth}
                  isToday={isToday}
                  isSelected={isSelected}
                />
              </div>

              {hasLoad && stats ? (
                <div className="mt-auto min-h-0 space-y-px pt-1 pb-px">
                  <GridMetricStrip metricId="total" value={stats.total} emphasis />
                  <GridMetricStrip metricId="starting" value={stats.starting} />
                  <GridMetricStrip metricId="atRisk" value={stats.atRisk} />
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
