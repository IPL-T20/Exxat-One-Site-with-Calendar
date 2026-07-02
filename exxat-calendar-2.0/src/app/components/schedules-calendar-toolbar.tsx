import {
  CalendarFocusPeriodToggle,
  CalendarPeriodNav,
  CalendarTodayButton,
  CalendarZoomSegment,
} from "./calendar/calendar-shell"
import type { CalendarModel } from "./calendar/useCalendarModel"
import type { SchedulesMonthLayout } from "../lib/schedules/schedules-month-grid-lens"
import { ToolbarSegmentButton, ToolbarSegmentTrack } from "./toolbar-segment"

/** Calendar tab — 2nd level below page tabs (view scale, period navigation). */
export function SchedulesCalendarToolbar({
  calendarModel,
  monthLayout,
  onMonthLayoutChange,
}: {
  calendarModel: CalendarModel
  monthLayout?: SchedulesMonthLayout
  onMonthLayoutChange?: (layout: SchedulesMonthLayout) => void
}) {
  const showMonthLayoutSwitcher =
    calendarModel.zoom === "month" && monthLayout != null && onMonthLayoutChange != null

  return (
    <div className="flex-shrink-0 border-b border-border bg-card px-4 py-2">
      <div className="flex min-h-9 w-full flex-wrap items-center gap-x-3 gap-y-2">
        <div className="inline-flex flex-wrap items-center gap-2">
          <CalendarZoomSegment model={calendarModel} className="inline-flex" />
          {showMonthLayoutSwitcher ? (
            <ToolbarSegmentTrack aria-label="Month layout" size="sm">
              <ToolbarSegmentButton
                active={monthLayout === "timeline"}
                onClick={() => onMonthLayoutChange!("timeline")}
                icon="chartLine"
                label="Timeline"
                size="sm"
              />
              <ToolbarSegmentButton
                active={monthLayout === "grid"}
                onClick={() => onMonthLayoutChange!("grid")}
                icon="tableCells"
                label="Grid"
                size="sm"
              />
            </ToolbarSegmentTrack>
          ) : null}
          <CalendarPeriodNav model={calendarModel} />
          <CalendarTodayButton model={calendarModel} />
          <CalendarFocusPeriodToggle model={calendarModel} />
        </div>
      </div>
    </div>
  )
}
