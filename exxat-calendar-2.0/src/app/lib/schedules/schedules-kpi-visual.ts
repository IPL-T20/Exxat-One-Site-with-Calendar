import type { FontAwesomeIconName } from "../../components/font-awesome-icon"
import type { SchedulesCalendarKpiId } from "./schedules-calendar-lens"
import type { ScheduleRowKpis } from "./schedules-row-kpis"

/** Shared icon vocabulary — headline KPI strip only. */
export const SCHEDULES_KPI_ICON: Record<SchedulesCalendarKpiId, FontAwesomeIconName> = {
  active: "chartLine",
  starting: "calendar",
  ending: "clock",
  needs_attention: "triangleExclamation",
}

export const SCHEDULES_SIDEBAR_KPI_DEFS: {
  field: keyof ScheduleRowKpis
  label: string
  styleKey: SchedulesCalendarKpiId
}[] = [
  { field: "active", label: "active", styleKey: "active" },
  { field: "starting", label: "start", styleKey: "starting" },
  { field: "ending", label: "end", styleKey: "ending" },
  { field: "atRisk", label: "risk", styleKey: "needs_attention" },
]

/** Sidebar ghost tags — semantic wash + number hue; labels stay neutral for AA contrast. */
export const SCHEDULES_SIDEBAR_KPI_TAG: Record<
  SchedulesCalendarKpiId,
  { wash: string; value: string }
> = {
  active: {
    wash: "bg-blue-600/[0.06] dark:bg-blue-400/[0.09]",
    value: "text-blue-800 dark:text-blue-300",
  },
  starting: {
    wash: "bg-emerald-600/[0.06] dark:bg-emerald-400/[0.09]",
    value: "text-emerald-800 dark:text-emerald-300",
  },
  ending: {
    wash: "bg-foreground/[0.04] dark:bg-foreground/[0.06]",
    value: "text-foreground/75 dark:text-foreground/80",
  },
  needs_attention: {
    wash: "bg-amber-600/[0.07] dark:bg-amber-400/[0.1]",
    value: "text-amber-900 dark:text-amber-200",
  },
}
