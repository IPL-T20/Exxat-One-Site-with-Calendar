import { useEffect, useRef } from "react"
import { FontAwesomeIcon } from "./font-awesome-icon"
import { Button } from "./ui/button"
import {
  SCHEDULES_ATTENTION_KPI_OPTIONS,
  type SchedulesCalendarQuickLens,
} from "../lib/schedules/schedules-calendar-lens"

export function SchedulesCalendarActiveLens({
  activeLens,
  visibleCount,
  totalCount,
  onClear,
}: {
  activeLens: SchedulesCalendarQuickLens
  visibleCount: number
  totalCount: number
  onClear: () => void
}) {
  const liveRef = useRef<HTMLSpanElement>(null)
  const lensLabel =
    SCHEDULES_ATTENTION_KPI_OPTIONS.find((o) => o.id === activeLens)?.label ?? activeLens

  useEffect(() => {
    if (activeLens === "all" || !liveRef.current) return
    liveRef.current.textContent = `Showing ${visibleCount} of ${totalCount} schedules filtered by ${lensLabel}.`
  }, [activeLens, visibleCount, totalCount, lensLabel])

  if (activeLens === "all") return null

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border/70 bg-muted/25 px-4 py-1.5">
      <p className="min-w-0 text-xs text-muted-foreground">
        <span ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
        <span aria-hidden>
          Showing{" "}
          <span className="font-semibold tabular-nums text-foreground">{visibleCount}</span> of{" "}
          <span className="tabular-nums">{totalCount}</span> schedules ·{" "}
          <span className="font-medium text-foreground">{lensLabel}</span>
        </span>
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={onClear}
        aria-label={`Clear ${lensLabel} filter`}
      >
        <FontAwesomeIcon name="x" className="size-3" aria-hidden />
        Clear filter
      </Button>
    </div>
  )
}
