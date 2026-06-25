import type { ReactNode } from "react"
import { cn } from "../ui/utils"
import { CalendarSectionSeparator } from "./calendar-shared"

/** Shared KPI strip chrome — 72px metrics, used by slot-request and schedules calendars. */
export function KpiStripShell({
  children,
  ariaLabel,
  className,
  showSeparator = true,
}: {
  children: ReactNode
  ariaLabel?: string
  className?: string
  showSeparator?: boolean
}) {
  return (
    <div
      className={cn("relative flex-shrink-0 bg-muted/20 px-4 py-2.5", className)}
      aria-label={ariaLabel}
    >
      {children}
      {showSeparator ? <CalendarSectionSeparator /> : null}
    </div>
  )
}

export function KpiStripBar({
  children,
  ariaLabel,
  className,
}: {
  children: ReactNode
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap overflow-hidden rounded border border-border bg-card shadow-sm",
        "divide-y divide-border sm:flex-nowrap sm:divide-x sm:divide-y-0",
        className,
      )}
      role="list"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

export function KpiStripMetric({
  children,
  className,
  title,
  "aria-label": ariaLabel,
}: {
  children: ReactNode
  className?: string
  title?: string
  "aria-label"?: string
}) {
  return (
    <div
      role="listitem"
      title={title}
      aria-label={ariaLabel}
      className={cn(
        "flex h-[72px] min-w-[9rem] flex-1 items-center bg-card px-4",
        className,
      )}
    >
      {children}
    </div>
  )
}
