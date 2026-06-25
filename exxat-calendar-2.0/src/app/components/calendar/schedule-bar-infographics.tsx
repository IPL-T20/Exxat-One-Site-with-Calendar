import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import type { FontAwesomeIconName } from "../font-awesome-icon"
import { FontAwesomeIcon } from "../font-awesome-icon"
import { cn } from "../ui/utils"
import {
  formatBlockSegmentOnBar,
  SCHEDULE_RHYTHM_THEME,
  SCHEDULE_WEEKDAY_LABELS,
  type ScheduleBarRhythm,
} from "../../lib/schedules/schedule-bar-rhythm"

export type ScheduleRhythmVisualVariant = "default" | "onBar"

/** Unified rhythm cell metrics — same text size across circle, hex, and block. */
const RHYTHM_CELL = "size-4"
const RHYTHM_HEX_BOX = "h-4 w-[18px]"
const RHYTHM_TEXT = "text-[9px] font-semibold leading-none tabular-nums"
const RHYTHM_BLOCK_H = "h-4"
const RHYTHM_BLOCK_PX = "px-1"
const RHYTHM_GAP = "gap-0.5"

/** Flat-top hex — proportional in 18×16 box (width:height ≈ 1.125). */
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"

/** Sidebar card — icon-only Group / Individual marker (not on timeline bar). */
export function ScheduleExperienceTypeIcon({
  type,
  className,
}: {
  type: "Group" | "Individual"
  className?: string
}) {
  const isGroup = type === "Group"
  const label = isGroup ? "Group schedule" : "Individual schedule"
  return (
    <span
      className={cn(
        "inline-flex size-3.5 shrink-0 items-center justify-center",
        isGroup
          ? "text-violet-600 dark:text-violet-400"
          : "text-muted-foreground",
        className,
      )}
      title={label}
      aria-label={label}
    >
      <FontAwesomeIcon name={isGroup ? "users" : "user"} className="size-3" aria-hidden />
    </span>
  )
}

/** @deprecated Use ScheduleExperienceTypeIcon */
export const ScheduleExperienceTypePill = ScheduleExperienceTypeIcon

export function ScheduleBarZoneSeparator({ className }: { className?: string }) {
  return (
    <span
      className={cn("h-3 w-px shrink-0 bg-current opacity-20", className)}
      aria-hidden
    />
  )
}

function rhythmTheme(kind: ScheduleBarRhythm["kind"], variant: ScheduleRhythmVisualVariant) {
  if (variant === "onBar") return SCHEDULE_RHYTHM_THEME.onBar[kind]
  return SCHEDULE_RHYTHM_THEME.default[kind]
}

export function ScheduleWeekdayCircleRail({
  activeDays,
  compact: _compact = false,
  variant = "default",
}: {
  activeDays: readonly boolean[]
  compact?: boolean
  variant?: ScheduleRhythmVisualVariant
}) {
  const theme = rhythmTheme("weekday", variant)

  return (
    <div className={cn("inline-flex shrink-0 items-center", RHYTHM_GAP)} role="img" aria-hidden>
      {SCHEDULE_WEEKDAY_LABELS.map((label, index) => {
        const active = activeDays[index]
        return (
          <span
            key={`${label}-${index}`}
            className={cn(
              "inline-flex shrink-0 self-center items-center justify-center rounded-full",
              RHYTHM_CELL,
              RHYTHM_TEXT,
              active ? theme.active : theme.inactive,
            )}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}

function MonthDayHex({
  value,
  variant,
}: {
  value: number | "more"
  compact?: boolean
  variant?: ScheduleRhythmVisualVariant
}) {
  const theme = rhythmTheme("monthDay", variant ?? "default")
  const isMore = value === "more"

  if (isMore) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 self-center items-center justify-center rounded-[3px] px-0.5",
          RHYTHM_CELL,
          RHYTHM_TEXT,
          theme.more,
        )}
      >
        +
      </span>
    )
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 self-center items-center justify-center",
        RHYTHM_HEX_BOX,
        RHYTHM_TEXT,
        theme.cellText,
      )}
    >
      <span
        className={cn("pointer-events-none absolute inset-0", theme.cellFill)}
        style={{ clipPath: HEX_CLIP }}
        aria-hidden
      />
      <span className="relative z-[1]">{value}</span>
    </span>
  )
}

export function ScheduleMonthDayHexRail({
  days,
  overflow,
  compact = false,
  variant = "default",
}: {
  days: number[]
  overflow: number
  compact?: boolean
  variant?: ScheduleRhythmVisualVariant
}) {
  const cells: (number | "more")[] = [...days]
  if (overflow > 0) cells.push("more")

  return (
    <div className={cn("inline-flex max-w-full shrink-0 items-center", RHYTHM_GAP)} role="img" aria-hidden>
      {cells.map((cell, index) => (
        <MonthDayHex key={`${cell}-${index}`} value={cell} variant={variant} />
      ))}
    </div>
  )
}

export function ScheduleBlockSegmentRail({
  blocks,
  compact = false,
  variant = "default",
}: {
  blocks: readonly { startDate: string; endDate: string }[]
  compact?: boolean
  variant?: ScheduleRhythmVisualVariant
}) {
  const theme = rhythmTheme("block", variant)
  const connectorSize = compact ? "h-px w-2" : "h-px w-2.5"

  return (
    <div className={cn("inline-flex max-w-full shrink-0 items-center", RHYTHM_GAP)} role="img" aria-hidden>
      {blocks.map((block, index) => (
        <Fragment key={`${block.startDate}-${block.endDate}-${index}`}>
          {index > 0 ? (
            <span
              className={cn("shrink-0 rounded-full", connectorSize, theme.connector)}
              aria-hidden
            />
          ) : null}
          <span
            className={cn(
              "inline-flex shrink-0 self-center items-center justify-center whitespace-nowrap rounded-[4px] tracking-tight",
              RHYTHM_TEXT,
              RHYTHM_BLOCK_H,
              RHYTHM_BLOCK_PX,
              theme.segment,
            )}
          >
            {formatBlockSegmentOnBar(block.startDate, block.endDate)}
          </span>
        </Fragment>
      ))}
    </div>
  )
}

export function ScheduleBarRhythmInfographic({
  rhythm,
  compact = false,
  variant = "default",
}: {
  rhythm: ScheduleBarRhythm
  compact?: boolean
  variant?: ScheduleRhythmVisualVariant
}) {
  switch (rhythm.kind) {
    case "weekday":
      return (
        <ScheduleWeekdayCircleRail
          activeDays={rhythm.activeDays}
          compact={compact}
          variant={variant}
        />
      )
    case "month_day":
      return (
        <ScheduleMonthDayHexRail
          days={rhythm.days}
          overflow={rhythm.overflow}
          compact={compact}
          variant={variant}
        />
      )
    case "block":
      return (
        <ScheduleBlockSegmentRail blocks={rhythm.blocks} compact={compact} variant={variant} />
      )
  }
}

/** Trailing fade when content exceeds bar width — mask only, no ellipsis. */
function ScheduleBarOverflowFade({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  const syncOverflow = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    setOverflowing(el.scrollWidth > el.clientWidth + 1)
  }, [])

  useEffect(() => {
    syncOverflow()
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(syncOverflow)
    ro.observe(el)
    return () => ro.disconnect()
  }, [syncOverflow, children])

  const fadeMask = overflowing
    ? {
        maskImage: "linear-gradient(to right, #000 calc(100% - 1.25rem), transparent)",
        WebkitMaskImage: "linear-gradient(to right, #000 calc(100% - 1.25rem), transparent)",
      }
    : undefined

  return (
    <div className={cn("relative min-w-0 overflow-hidden", className)}>
      <div
        ref={contentRef}
        className="flex w-max max-w-none flex-nowrap items-center gap-1.5"
        style={fadeMask}
      >
        {children}
      </div>
    </div>
  )
}

/** Horizontal bar zones: status · name · rhythm · date span (tight content cluster). */
export function ScheduleHorizontalBarContent({
  signalIcon,
  signalIconClass,
  name,
  rhythm,
  showRhythm,
  dateRange,
  showDateRange,
  compact = false,
  micro = false,
}: {
  signalIcon?: FontAwesomeIconName
  signalIconClass?: string
  name: string | null | undefined
  rhythm: ScheduleBarRhythm | null
  showRhythm: boolean
  dateRange: string | null | undefined
  showDateRange: boolean
  compact?: boolean
  micro?: boolean
}) {
  const barZone = "shrink-0 whitespace-nowrap"

  if (micro) {
    return (
      <ScheduleBarOverflowFade>
        <div className="flex items-center gap-1 whitespace-nowrap">
          {signalIcon ? (
            <FontAwesomeIcon
              name={signalIcon}
              className={cn("size-3 shrink-0 self-center", signalIconClass)}
              aria-hidden
            />
          ) : null}
          {name ? (
            <span className={cn(barZone, "text-[9px] font-semibold leading-none")}>{name}</span>
          ) : null}
        </div>
      </ScheduleBarOverflowFade>
    )
  }

  return (
    <div className="flex min-w-0 w-full items-center gap-1.5 overflow-hidden">
      {name || signalIcon ? (
        <ScheduleBarOverflowFade className="min-w-0 shrink">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {signalIcon ? (
              <FontAwesomeIcon
                name={signalIcon}
                className={cn("size-3 shrink-0 self-center", signalIconClass)}
                aria-hidden
              />
            ) : null}
            {signalIcon && name ? <ScheduleBarZoneSeparator /> : null}
            {name ? (
              <span className="text-[11px] font-semibold leading-none">{name}</span>
            ) : null}
          </div>
        </ScheduleBarOverflowFade>
      ) : null}

      {showRhythm && rhythm ? (
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <ScheduleBarZoneSeparator />
          <ScheduleBarRhythmInfographic rhythm={rhythm} compact={compact} variant="onBar" />
        </span>
      ) : null}

      {showDateRange && dateRange ? (
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <ScheduleBarZoneSeparator />
          <span className="whitespace-nowrap text-[10px] font-medium tabular-nums leading-none">
            {dateRange}
          </span>
        </span>
      ) : null}
    </div>
  )
}
