import { useEffect, useMemo, useState } from "react"
import type { CalendarModel } from "./calendar/useCalendarModel"
import type { ScheduleRecord } from "../lib/schedules/types"
import {
  computeMonthDayStatsMap,
  monthRangeFromAnchor,
} from "../lib/schedules/schedules-month-grid-lens"
import { SchedulesMonthGridCalendar } from "./schedules-month-grid-calendar"
import { SchedulesMonthGridInsights } from "./schedules-month-grid-insights"

export function SchedulesMonthGridView({
  model,
  scheduleRows,
  referenceDate,
}: {
  model: CalendarModel
  scheduleRows: ScheduleRecord[]
  referenceDate: string
}) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => {
    const [y, m, d] = referenceDate.split("-").map(Number)
    const today = new Date(y, m - 1, d)
    if (
      today.getFullYear() === model.periodAnchor.getFullYear() &&
      today.getMonth() === model.periodAnchor.getMonth()
    ) {
      return today
    }
    return null
  })

  useEffect(() => {
    const [y, m, d] = referenceDate.split("-").map(Number)
    const today = new Date(y, m - 1, d)
    if (
      today.getFullYear() === model.periodAnchor.getFullYear() &&
      today.getMonth() === model.periodAnchor.getMonth()
    ) {
      setSelectedDay(today)
    } else {
      setSelectedDay(null)
    }
  }, [referenceDate, model.periodAnchor])

  const statsByIso = useMemo(
    () => computeMonthDayStatsMap(scheduleRows, referenceDate, model.periodAnchor),
    [scheduleRows, referenceDate, model.periodAnchor],
  )

  const monthStart = useMemo(() => {
    const { start } = monthRangeFromAnchor(model.periodAnchor)
    return start
  }, [model.periodAnchor])

  const selectedIso = selectedDay
    ? `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`
    : null

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <SchedulesMonthGridCalendar
          monthStart={monthStart}
          statsByIso={statsByIso}
          calendarTodayIso={referenceDate}
          selectedIso={selectedIso}
          onDayClick={setSelectedDay}
        />
      </div>

      <aside className="flex w-[min(100%,20rem)] shrink-0 flex-col overflow-hidden border-l border-border bg-background sm:w-[22rem] lg:w-[26rem] xl:w-[28rem]">
        <SchedulesMonthGridInsights
          day={selectedDay}
          scheduleRows={scheduleRows}
          referenceDate={referenceDate}
          onOpenSchedule={(id) => model.setScheduleDetailIds([id])}
        />
      </aside>
    </div>
  )
}
