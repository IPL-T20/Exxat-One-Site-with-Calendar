import {
  SCHEDULES_SIDEBAR_KPI_DEFS,
  SCHEDULES_SIDEBAR_KPI_TAG,
} from "../../lib/schedules/schedules-kpi-visual"
import type { ScheduleRowKpis } from "../../lib/schedules/schedules-row-kpis"
import type { SchedulesSidebarKpiTone } from "../../lib/schedules/schedules-sidebar-level"
import { cn } from "../ui/utils"

/**
 * Sidebar period metrics — ghost tags: whisper bg wash, semantic number, neutral label.
 * Fixed metric order aids vertical scan; parent row owns the screen-reader summary.
 */
export function SchedulesSidebarKpiChips({
  kpis,
  tone = "strong",
}: {
  kpis: ScheduleRowKpis
  tone?: SchedulesSidebarKpiTone
}) {
  const items = SCHEDULES_SIDEBAR_KPI_DEFS.map((def) => ({
    ...def,
    value: kpis[def.field],
  })).filter((item) => item.value > 0)

  if (items.length === 0) {
    return null
  }

  return (
    <p
      className={cn(
        "flex max-w-full flex-wrap items-center gap-1",
        tone === "soft" && "opacity-90",
      )}
      aria-hidden
    >
      {items.map((item) => {
        const tag = SCHEDULES_SIDEBAR_KPI_TAG[item.styleKey]

        return (
          <span
            key={item.field}
            className={cn(
              "inline-flex items-baseline gap-1 rounded-[3px] px-1.5 py-0.5 tabular-nums",
              tag.wash,
              tone === "soft" && "px-1 py-0.5",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold leading-none tracking-tight",
                tag.value,
                tone === "soft" && "font-medium",
              )}
            >
              {item.value}
            </span>
            <span
              className={cn(
                "text-[10px] font-normal leading-none text-muted-foreground",
                tone === "soft" && "text-[9px]",
              )}
            >
              {item.label}
            </span>
          </span>
        )
      })}
    </p>
  )
}
