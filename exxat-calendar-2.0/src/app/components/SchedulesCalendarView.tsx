import { useEffect, useMemo, useRef } from "react"
import { defaultViewportScrollLeft } from "../lib/slot-requests-calendar/calendar-timeline"
import { computeSchedulesCalendarKpis } from "../lib/schedules/schedules-calendar-lens"
import type { SchedulesCalendarQuickLens } from "../lib/schedules/schedules-calendar-lens"
import type { ScheduleRecord } from "../lib/schedules/types"
import type { CalendarModel } from "./calendar/useCalendarModel"
import { CalendarToolbar } from "./calendar/calendar-shell"
import { ConceptCodaTimeline } from "./calendar/concept-coda"
import { ScheduleDetailModal } from "./calendar/schedule-detail-modal"
import { SchedulesAttentionKpiStrip } from "./schedules-attention-kpi-strip"
import { SchedulesCalendarActiveLens } from "./schedules-calendar-active-lens"

export function SchedulesCalendarView({
  model,
  focusDate,
  referenceDate,
  scheduleRows,
  quickLens,
  onQuickLensChange,
  onPeriodAnchorChange,
}: {
  model: CalendarModel
  focusDate: Date
  referenceDate: string
  scheduleRows: ScheduleRecord[]
  quickLens: SchedulesCalendarQuickLens
  onQuickLensChange: (lens: SchedulesCalendarQuickLens) => void
  onPeriodAnchorChange: (anchor: Date) => void
}) {
  const didScrollFixture = useRef(false)

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
      />
      <ConceptCodaTimeline model={model} />
      <ScheduleDetailModal model={model} scheduleRows={scheduleRows} />
    </div>
  )
}
