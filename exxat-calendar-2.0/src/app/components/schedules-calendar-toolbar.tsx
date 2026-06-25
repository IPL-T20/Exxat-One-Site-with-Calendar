import {
  CalendarFocusPeriodToggle,
  CalendarPeriodNav,
  CalendarTodayButton,
  CalendarZoomSegment,
} from "./calendar/calendar-shell"
import type { CalendarModel } from "./calendar/useCalendarModel"

/** Calendar tab — 2nd level below page tabs (view scale, period navigation). */
export function SchedulesCalendarToolbar({ calendarModel }: { calendarModel: CalendarModel }) {
  return (
    <div className="flex-shrink-0 border-b border-border bg-card px-4 py-2">
      <div className="flex min-h-9 w-full flex-wrap items-center gap-x-3 gap-y-2">
        <div className="inline-flex flex-wrap items-center gap-2">
          <CalendarZoomSegment model={calendarModel} className="inline-flex" />
          <CalendarPeriodNav model={calendarModel} />
          <CalendarTodayButton model={calendarModel} />
          <CalendarFocusPeriodToggle model={calendarModel} />
        </div>
      </div>
    </div>
  )
}
