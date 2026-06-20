import type { CalendarModel } from "./calendar/useCalendarModel"
import type { SchedulesCalendarQuickLens } from "../lib/schedules/schedules-calendar-lens"
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
}

export function SchedulesCalendarWorkspace({
  model,
  focusDate,
  referenceDate,
  scheduleRows,
  quickLens,
  onQuickLensChange,
  onPeriodAnchorChange,
}: SchedulesCalendarWorkspaceProps) {
  return (
    <SchedulesCalendarView
      model={model}
      focusDate={focusDate}
      referenceDate={referenceDate}
      scheduleRows={scheduleRows}
      quickLens={quickLens}
      onQuickLensChange={onQuickLensChange}
      onPeriodAnchorChange={onPeriodAnchorChange}
    />
  )
}
