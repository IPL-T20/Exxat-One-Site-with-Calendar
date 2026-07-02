import type { CalendarModel } from "./calendar/useCalendarModel"
import type { SchedulesCalendarQuickLens } from "../lib/schedules/schedules-calendar-lens"
import type { SchedulesMonthLayout } from "../lib/schedules/schedules-month-grid-lens"
import type { ScheduleRecord } from "../lib/schedules/types"
import { SchedulesCalendarView } from "./SchedulesCalendarView"

interface SchedulesCalendarWorkspaceProps {
  model: CalendarModel
  focusDate: Date
  referenceDate: string
  scheduleRows: ScheduleRecord[]
  quickLens: SchedulesCalendarQuickLens
  onQuickLensChange: (lens: SchedulesCalendarQuickLens) => void
  onPeriodAnchorChange: (anchor: Date) => void
  monthLayout: SchedulesMonthLayout
}

export function SchedulesCalendarWorkspace({
  model,
  focusDate,
  referenceDate,
  scheduleRows,
  quickLens,
  onQuickLensChange,
  onPeriodAnchorChange,
  monthLayout,
}: SchedulesCalendarWorkspaceProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SchedulesCalendarView
      model={model}
      focusDate={focusDate}
      referenceDate={referenceDate}
      scheduleRows={scheduleRows}
      quickLens={quickLens}
      onQuickLensChange={onQuickLensChange}
      onPeriodAnchorChange={onPeriodAnchorChange}
      monthLayout={monthLayout}
    />
    </div>
  )
}
