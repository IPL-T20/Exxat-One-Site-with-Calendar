import { useCallback, useEffect, useMemo, useState } from "react"
import { useCalendarModel } from "./calendar/useCalendarModel"
import { SchedulesCalendarToolbar } from "./schedules-calendar-toolbar"
import { SchedulesCalendarWorkspace } from "./SchedulesCalendarWorkspace"
import {
  formatCalendarDateIso,
  getZonedCalendarDate,
} from "../lib/slot-requests-calendar/calendar-date"
import {
  filterSchedulesForLens,
  type SchedulesCalendarQuickLens,
} from "../lib/schedules/schedules-calendar-lens"
import {
  mappleScheduleToSlotRequestRow,
} from "../lib/schedules/schedules-calendar-adapter"
import { buildSchedulesCalendarDataBundle } from "../lib/schedules/schedules-calendar-bundle"
import type { SlotRequestRow } from "../lib/slot-requests-calendar/types"
import type { CalendarZoom } from "../lib/slot-requests-calendar/types"
import type { ScheduleRecord } from "../lib/schedules/types"
import {
  filterSchedulesListRows,
} from "../lib/schedules/schedules-list"

export function SchedulesCalendarTabView({
  rows,
  referenceDate: _referenceDate,
}: {
  rows: ScheduleRecord[]
  referenceDate: string
}) {
  const [quickLens, setQuickLens] = useState<SchedulesCalendarQuickLens>("all")
  const calendarToday = getZonedCalendarDate()
  const calendarReferenceDate = formatCalendarDateIso(calendarToday)
  const [calendarPeriodAnchor, setCalendarPeriodAnchor] = useState<Date>(() => calendarToday)

  const filtered = useMemo(
    () =>
      filterSchedulesListRows(rows, {
        referenceDate: calendarReferenceDate,
        timing: "all",
        studentSearch: "",
        filters: {
          disciplines: [],
          programs: [],
          schools: [],
          locationGroups: [],
          locations: [],
          scheduleStatuses: [],
          onboardingStatuses: [],
        },
      }),
    [rows, calendarReferenceDate],
  )

  const calendarSlotRows = useMemo(
    () => filtered.map(mappleScheduleToSlotRequestRow),
    [filtered],
  )

  const focusDate = calendarToday

  const buildSchedulesBundle = useCallback(
    (
      scopedRows: SlotRequestRow[],
      ctx: { zoom: CalendarZoom; periodAnchor: Date },
    ) => {
      const ids = new Set(scopedRows.map((r) => r.id))
      const scoped = filterSchedulesForLens(
        filtered.filter((s) => ids.has(s.id)),
        quickLens,
        calendarReferenceDate,
        ctx.periodAnchor,
        ctx.zoom,
      )
      return buildSchedulesCalendarDataBundle(scoped)
    },
    [filtered, quickLens, calendarReferenceDate],
  )

  const calendarModel = useCalendarModel(calendarSlotRows, {
    buildBundle: buildSchedulesBundle,
    kpiReferenceDate: calendarToday,
    schedulesContext: true,
    scheduleSourceRows: filtered,
    scheduleReferenceDate: calendarReferenceDate,
  })

  const applyQuickLens = useCallback(
    (lens: SchedulesCalendarQuickLens) => {
      const next = quickLens === lens && lens !== "all" ? "all" : lens
      setQuickLens(next)
    },
    [quickLens],
  )

  useEffect(() => {
    setQuickLens("all")
    calendarModel.setGroupBy("live")
    calendarModel.setZoom("week")
    calendarModel.setLayers((layers) => ({ ...layers, focusPeriod: true }))
    calendarModel.scrollToToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entry setup for calendar tab
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background min-h-0">
      <SchedulesCalendarToolbar calendarModel={calendarModel} />
      <SchedulesCalendarWorkspace
        model={calendarModel}
        focusDate={focusDate}
        referenceDate={calendarReferenceDate}
        scheduleRows={filtered}
        quickLens={quickLens}
        onQuickLensChange={applyQuickLens}
        onPeriodAnchorChange={setCalendarPeriodAnchor}
      />
    </div>
  )
}
