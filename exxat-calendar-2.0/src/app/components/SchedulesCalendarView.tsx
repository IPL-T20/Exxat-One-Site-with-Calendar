import { useEffect, useMemo, useRef } from "react"
import { defaultViewportScrollLeft } from "../lib/slot-requests-calendar/calendar-timeline"
import { computeSchedulesCalendarKpis } from "../lib/schedules/schedules-calendar-lens"
import type { SchedulesCalendarQuickLens } from "../lib/schedules/schedules-calendar-lens"
import type { SchedulesMonthLayout } from "../lib/schedules/schedules-month-grid-lens"
import {
  computeMonthDayStatsMap,
  computeMonthGridRollup,
} from "../lib/schedules/schedules-month-grid-lens"
import type { ScheduleRecord } from "../lib/schedules/types"
import type { CalendarModel } from "./calendar/useCalendarModel"
import { CalendarToolbar } from "./calendar/calendar-shell"
import { ConceptCodaTimeline } from "./calendar/concept-coda"
import { ScheduleDetailModal } from "./calendar/schedule-detail-modal"
import { SchedulesAttentionKpiStrip } from "./schedules-attention-kpi-strip"
import { SchedulesCalendarActiveLens } from "./schedules-calendar-active-lens"
import { SchedulesMonthGridView } from "./schedules-month-grid-view"
import { formatPeriodNavLabel } from "../lib/slot-requests-calendar/calendar-period-nav"

export function SchedulesCalendarView({
  model,
  focusDate,
  referenceDate,
  scheduleRows,
  quickLens,
  onQuickLensChange,
  onPeriodAnchorChange,
  monthLayout,
}: {
  model: CalendarModel
  focusDate: Date
  referenceDate: string
  scheduleRows: ScheduleRecord[]
  quickLens: SchedulesCalendarQuickLens
  onQuickLensChange: (lens: SchedulesCalendarQuickLens) => void
  onPeriodAnchorChange: (anchor: Date) => void
  monthLayout: SchedulesMonthLayout
}) {
  const didScrollFixture = useRef(false)

  const showMonthGrid = model.zoom === "month" && monthLayout === "grid"

  const calendarKpis = useMemo(
    () =>
      computeSchedulesCalendarKpis(
        scheduleRows,
        referenceDate,
        model.periodAnchor,
        model.zoom,
      ),
    [scheduleRows, referenceDate, model.periodAnchor, model.zoom],
  )

  const monthGridKpis = useMemo(() => {
    if (!showMonthGrid) return null
    const statsByIso = computeMonthDayStatsMap(
      scheduleRows,
      referenceDate,
      model.periodAnchor,
    )
    return {
      rollup: computeMonthGridRollup(statsByIso),
      monthLabel: formatPeriodNavLabel("month", model.periodAnchor),
    }
  }, [showMonthGrid, scheduleRows, referenceDate, model.periodAnchor])

  useEffect(() => {
    onPeriodAnchorChange(model.periodAnchor)
  }, [model.periodAnchor, onPeriodAnchorChange])

  useEffect(() => {
    if (didScrollFixture.current || model.timelineWidth <= 0) return
    const el = model.scrollRef.current
    if (!el) return
    el.scrollTo({
      left: defaultViewportScrollLeft(
        model.zoom,
        model.timelineWidth,
        model.todayX,
        model.ppd,
        model.monthPxW,
        focusDate,
      ),
      behavior: "auto",
    })
    didScrollFixture.current = true
  }, [
    focusDate,
    model.zoom,
    model.ppd,
    model.monthPxW,
    model.timelineWidth,
    model.todayX,
    model.scrollRef,
  ])

  return (
    <div
      className="flex flex-col min-h-0 flex-1 bg-background text-foreground"
      aria-label="Schedules placement calendar"
    >
      <SchedulesAttentionKpiStrip
        metrics={calendarKpis}
        activeLens={quickLens}
        onSelectLens={onQuickLensChange}
        monthGrid={monthGridKpis}
      />

      <SchedulesCalendarActiveLens
        activeLens={quickLens}
        visibleCount={model.rows.length}
        totalCount={scheduleRows.length}
        onClear={() => onQuickLensChange("all")}
      />

      <CalendarToolbar
        model={model}
        showZoomSelector={false}
        showScopeSelector
        showPeriodControls={false}
        monthLayout={model.zoom === "month" ? monthLayout : undefined}
      />
      {showMonthGrid ? (
        <SchedulesMonthGridView
          model={model}
          scheduleRows={scheduleRows}
          referenceDate={referenceDate}
        />
      ) : (
        <ConceptCodaTimeline
          model={model}
          quickLens={quickLens}
          onQuickLensChange={onQuickLensChange}
        />
      )}
      <ScheduleDetailModal model={model} scheduleRows={scheduleRows} />
    </div>
  )
}
