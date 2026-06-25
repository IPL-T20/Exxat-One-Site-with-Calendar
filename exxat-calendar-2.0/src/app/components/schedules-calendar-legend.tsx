import { FontAwesomeIcon } from "./font-awesome-icon"
import {
  SCHEDULE_LEGEND_ITEMS,
  scheduleLegendSwatchStyle,
} from "../lib/schedules/schedule-legend"
import { cn } from "./ui/utils"

export function SchedulesCalendarLegend() {
  return (
    <div className="mt-2 border-t border-border/60 pt-2" role="group" aria-label="Schedule bar status">
      <p className="px-2 py-1 text-xs font-normal text-muted-foreground">Bar status</p>
      <ul className="flex flex-col gap-1">
        {SCHEDULE_LEGEND_ITEMS.map((item) => {
          const swatch = scheduleLegendSwatchStyle(item.placement)
          return (
            <li
              key={item.id}
              className="inline-flex items-center gap-2 rounded-sm px-2 py-1 text-xs text-foreground"
            >
              <span
                className="inline-flex h-3 w-7 shrink-0 overflow-hidden rounded-[3px]"
                style={{
                  backgroundColor: swatch.backgroundColor,
                  border: swatch.border,
                  borderStyle: swatch.borderStyle,
                  opacity: swatch.opacity,
                }}
                aria-hidden
              />
              <FontAwesomeIcon
                name={swatch.icon}
                className={cn("size-3 shrink-0", swatch.iconClass)}
                aria-hidden
              />
              {item.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
