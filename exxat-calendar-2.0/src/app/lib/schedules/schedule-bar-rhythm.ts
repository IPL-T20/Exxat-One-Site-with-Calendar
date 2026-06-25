import type { Placement } from "../slot-requests-calendar/types"

export type ScheduleRhythmKind = "weekday" | "month_day" | "block"

export interface ScheduleBlockRange {
  startDate: string
  endDate: string
}

export type ScheduleBarRhythm =
  | { kind: "weekday"; activeDays: readonly boolean[]; label: string }
  | { kind: "month_day"; days: number[]; overflow: number; label: string }
  | { kind: "block"; blocks: ScheduleBlockRange[]; label: string }

const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const

const DAY_PARSE: Record<string, number> = {
  MON: 0,
  MO: 0,
  TUE: 1,
  TU: 1,
  TUES: 1,
  WED: 2,
  WE: 2,
  THU: 3,
  TH: 3,
  THUR: 3,
  FRI: 4,
  FR: 4,
  SAT: 5,
  SA: 5,
  SUN: 6,
  SU: 6,
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

/**
 * Canonical rhythm hues — weekday violet · month-day rose · block indigo.
 * `default` = popover / neutral surfaces · `onBar` = inside status-colored stripes.
 * Active cells use ≥4.5:1 contrast pairs (WCAG AA).
 */
export const SCHEDULE_RHYTHM_THEME = {
  default: {
    weekday: {
      active:
        "border border-violet-600 bg-violet-700 text-white dark:border-violet-500 dark:bg-violet-500 dark:text-white",
      inactive:
        "border border-violet-600 bg-background text-violet-900 dark:border-violet-500 dark:bg-background dark:text-violet-200",
    },
    monthDay: {
      cellFill: "bg-rose-700 dark:bg-rose-600",
      cellText: "text-white",
      more: "rounded-sm border border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700/60 dark:bg-rose-950/45 dark:text-rose-100",
    },
    block: {
      connector: "bg-indigo-400/80 dark:bg-indigo-500/80",
      segment:
        "bg-indigo-100 text-indigo-950 ring-1 ring-inset ring-indigo-300/90 dark:bg-indigo-950/55 dark:text-indigo-100 dark:ring-indigo-600/55",
    },
  },
  onBar: {
    weekday: {
      active: "border border-violet-400 bg-violet-600 text-white",
      inactive: "border border-violet-400 bg-white text-violet-700",
    },
    monthDay: {
      cellFill: "bg-rose-700",
      cellText: "text-white",
      more: "rounded-sm border border-rose-200/90 bg-white px-0.5 text-rose-800",
    },
    block: {
      connector: "bg-indigo-300/90",
      segment:
        "bg-indigo-200/95 text-indigo-950 ring-1 ring-inset ring-indigo-400/45 shadow-sm",
    },
  },
} as const

export const SCHEDULE_COMPACT_STRIPE_H = 36

export function parseScheduleWeekdayMask(raw: string | null | undefined): boolean[] {
  const mask = Array.from({ length: 7 }, () => false)
  const value = raw?.trim()
  if (!value) return mask

  const parts = value.split(/[,+]/).map((part) => part.trim()).filter(Boolean)
  for (const part of parts) {
    const dayToken = part.replace(/\([^)]*\)/g, "").trim()
    const key = dayToken.slice(0, 3).toUpperCase()
    const index = DAY_PARSE[key] ?? DAY_PARSE[dayToken.slice(0, 2).toUpperCase()]
    if (index != null) mask[index] = true
  }
  return mask
}

function weekdayRhythmLabel(activeDays: readonly boolean[]): string {
  const names = DAY_KEYS.filter((_, i) => activeDays[i]).map((code) => {
    const full: Record<string, string> = {
      MON: "Monday",
      TUE: "Tuesday",
      WED: "Wednesday",
      THU: "Thursday",
      FRI: "Friday",
      SAT: "Saturday",
      SUN: "Sunday",
    }
    return full[code] ?? code
  })
  return names.length > 0 ? names.join(", ") : "No weekly pattern"
}

export function formatScheduleBarSpan(startIso: string, endIso: string): string {
  const start = parseIso(startIso)
  const end = parseIso(endIso)
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  const yearSuffix = `, ${end.getFullYear()}`

  if (startIso === endIso) {
    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}${yearSuffix}`
  }
  if (sameMonth) {
    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()} – ${end.getDate()}${yearSuffix}`
  }
  return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTH_SHORT[end.getMonth()]} ${end.getDate()}${yearSuffix}`
}

export function formatScheduleCompactRange(startIso: string, endIso: string): string {
  const start = parseIso(startIso)
  const end = parseIso(endIso)
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  const startPart = sameMonth
    ? `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}`
    : `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}`
  const endPart = sameMonth
    ? `${end.getDate()}`
    : `${MONTH_SHORT[end.getMonth()]} ${end.getDate()}`
  const yearSuffix = sameYear ? `, '${String(end.getFullYear()).slice(-2)}` : `, ${end.getFullYear()}`

  if (startIso === endIso) {
    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()}${yearSuffix}`
  }
  if (sameMonth) {
    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()} – ${end.getDate()}${yearSuffix}`
  }
  return `${startPart} – ${endPart}${yearSuffix}`
}

function formatBlockSegmentLabel(startIso: string, endIso: string): string {
  const start = parseIso(startIso)
  const end = parseIso(endIso)
  const month = MONTH_SHORT[start.getMonth()].toUpperCase()
  if (startIso === endIso) return `${start.getDate()} ${month}`
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} ${month}`
  }
  const endMonth = MONTH_SHORT[end.getMonth()].toUpperCase()
  return `${start.getDate()} ${month} – ${end.getDate()} ${endMonth}`
}

/** Shorter mixed-case labels for block segments on timeline bars (≥9px text). */
export function formatBlockSegmentOnBar(startIso: string, endIso: string): string {
  const start = parseIso(startIso)
  const end = parseIso(endIso)
  const startMonth = MONTH_SHORT[start.getMonth()]
  const endMonth = MONTH_SHORT[end.getMonth()]
  if (startIso === endIso) return `${startMonth} ${start.getDate()}`
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()}–${end.getDate()}`
  }
  return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}`
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

type RhythmPlacement = Pick<
  Placement,
  "requestedDaysOfWeek" | "scheduleMonthDays" | "scheduleBlocks" | "scheduleRhythmKind"
>

export function resolveScheduleBarRhythm(placement: RhythmPlacement): ScheduleBarRhythm | null {
  const forced = placement.scheduleRhythmKind

  if (forced === "block" || (!forced && placement.scheduleBlocks?.length)) {
    const blocks = placement.scheduleBlocks ?? []
    if (blocks.length === 0) return null
    return {
      kind: "block",
      blocks,
      label: blocks
        .map((block) => formatBlockSegmentLabel(block.startDate, block.endDate))
        .join("; "),
    }
  }

  if (forced === "month_day" || (!forced && placement.scheduleMonthDays?.length)) {
    const days = [...(placement.scheduleMonthDays ?? [])].sort((a, b) => a - b)
    if (days.length === 0) return null
    const visible = days.slice(0, 6)
    const overflow = Math.max(0, days.length - 6)
    return {
      kind: "month_day",
      days: visible,
      overflow,
      label: overflow > 0 ? `${days.join(", ")} (+${overflow} more)` : days.join(", "),
    }
  }

  const activeDays = parseScheduleWeekdayMask(placement.requestedDaysOfWeek)
  if (forced === "weekday" || activeDays.some(Boolean)) {
    return {
      kind: "weekday",
      activeDays,
      label: weekdayRhythmLabel(activeDays),
    }
  }

  return null
}

export function scheduleRhythmAriaSummary(rhythm: ScheduleBarRhythm | null): string | null {
  if (!rhythm) return null
  switch (rhythm.kind) {
    case "weekday":
      return `Weekly days: ${rhythm.label}`
    case "month_day":
      return `Month days: ${rhythm.label}`
    case "block":
      return `Schedule blocks: ${rhythm.label}`
  }
}

export function scheduleRhythmSectionLabel(rhythm: ScheduleBarRhythm): string {
  switch (rhythm.kind) {
    case "weekday":
      return "Schedule days"
    case "month_day":
      return "Schedule dates"
    case "block":
      return "Schedule blocks"
  }
}

/** Distinguishes rhythm from placement span — not a duplicate of day numbers. */
export function scheduleRhythmContextHint(rhythm: ScheduleBarRhythm): string {
  switch (rhythm.kind) {
    case "weekday":
      return "Weekly on-site days during the placement"
    case "month_day":
      return "Recurring days each month during the placement"
    case "block":
      return "Scheduled blocks within the placement"
  }
}

export function scheduleBarShowsRhythmInfographic(
  zoom: import("../slot-requests-calendar/types").CalendarZoom,
  rhythm: ScheduleBarRhythm | null,
  cardW: number,
  isMulti: boolean,
): boolean {
  if (!rhythm || isMulti) return false
  if (zoom !== "week" && zoom !== "month") return false
  return cardW >= 72
}

/** Date span yields to rhythm when the bar is tight. */
export function scheduleBarShowsDateRange(
  cardW: number,
  rhythmVisible: boolean,
  microStripe: boolean,
): boolean {
  if (microStripe) return false
  if (rhythmVisible) return cardW >= 148
  return cardW >= 88
}

export function resolveScheduleStripeHeight(
  _schedulesContext: boolean,
  _zoom: import("../slot-requests-calendar/types").CalendarZoom,
  _rhythm: ScheduleBarRhythm | null,
  _isMulti: boolean,
): number {
  return SCHEDULE_COMPACT_STRIPE_H
}

export { DAY_LABELS as SCHEDULE_WEEKDAY_LABELS }

export function formatBlockSegmentShort(startIso: string, endIso: string): string {
  return formatBlockSegmentLabel(startIso, endIso)
}

type RhythmRecord = Pick<
  import("./types").ScheduleRecord,
  "daysOfWeek" | "monthDays" | "scheduleBlocks" | "scheduleRhythmKind"
>

export function resolveScheduleBarRhythmFromRecord(row: RhythmRecord): ScheduleBarRhythm | null {
  return resolveScheduleBarRhythm({
    requestedDaysOfWeek: row.daysOfWeek ?? "",
    scheduleMonthDays: row.monthDays ?? null,
    scheduleBlocks: row.scheduleBlocks ?? null,
    scheduleRhythmKind: row.scheduleRhythmKind ?? null,
  })
}
