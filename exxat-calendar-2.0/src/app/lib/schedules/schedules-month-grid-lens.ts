import {
  atRiskSeverity,
  getScheduleAtRiskReasons,
  isScheduleAtRisk,
  scheduleEndsOnDay,
  scheduleIntersectsDay,
  scheduleStartsOnDay,
  AT_RISK_REASON_LABELS,
  type ScheduleAtRiskReason,
  type SchedulesCalendarKpiId,
  type SchedulesCalendarQuickLens,
} from "./schedules-calendar-lens"
import type { ScheduleRecord } from "./types"

export type MonthDaySignal = "urgent" | "attention" | "motion" | "steady" | "clear"

export type MonthDayStats = {
  iso: string
  total: number
  starting: number
  ending: number
  atRisk: number
  urgentCount: number
  actionCount: number
  signal: MonthDaySignal
}

export type MonthGridRollup = {
  daysWithLoad: number
  peakLoad: number
  peakLoadIso: string | null
  urgentDays: number
  attentionDays: number
  monthUrgent: number
  monthAttention: number
}

export type DayActionCategory =
  | "act_now"
  | "confirm"
  | "starting"
  | "ending"
  | "running"

export type DayActionItem = {
  scheduleId: string
  category: DayActionCategory
  priority: number
  actionLabel: string
  subject: string
  context: string
  tags: string[]
}

export type DayActionGroup = {
  category: DayActionCategory
  label: string
  count: number
  items: DayActionItem[]
}

export type SchedulesDaySnapshot = {
  dayLabel: string
  iso: string
  total: number
  active: number
  starting: number
  ending: number
  atRisk: number
  urgentCount: number
  actionTotal: number
  criticalHeadline: string
  scanLine: string
  schedules: ScheduleRecord[]
  actionGroups: DayActionGroup[]
  topLocations: { location: string; count: number }[]
}

const ACTION_GROUP_META: Record<
  DayActionCategory,
  { label: string; order: number }
> = {
  act_now: { label: "Act now", order: 0 },
  confirm: { label: "Confirm & place", order: 1 },
  starting: { label: "Starting", order: 2 },
  ending: { label: "Ending", order: 3 },
  running: { label: "Running on track", order: 4 },
}

const REASON_ACTION: Partial<Record<ScheduleAtRiskReason, string>> = {
  compliance_gap: "Resolve onboarding",
  requirements_pending: "Clear requirements",
  unassigned_student: "Assign student",
  unassigned_preceptor: "Assign preceptor",
  unconfirmed_near_start: "Confirm placement",
  starting_imminent_gap: "Close go-live gaps",
  ending_offboarding: "Finish offboarding",
  recently_cancelled: "Review cancellation",
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export function formatScheduleDayLabel(day: Date): string {
  return `${DAY_NAMES[day.getDay()]}, ${MONTH_NAMES[day.getMonth()]} ${day.getDate()}`
}

export function monthRangeFromAnchor(anchor: Date): { start: Date; end: Date } {
  return {
    start: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
  }
}

function scheduleSubject(row: ScheduleRecord): string {
  if (row.experienceType === "Group") return `Group · ${row.school}`
  return row.studentName?.trim() || row.school || "Schedule"
}

function scheduleContext(row: ScheduleRecord): string {
  const loc = row.location?.trim()
  const dept = row.department?.trim()
  if (loc && dept) return `${loc} · ${dept}`
  return loc || dept || "—"
}

function primaryActionLabel(
  row: ScheduleRecord,
  day: Date,
  referenceDate: string,
): { label: string; category: DayActionCategory; priority: number; tags: string[] } {
  const reasons = getScheduleAtRiskReasons(row, referenceDate)
  const tags: string[] = []

  if (reasons.length > 0) {
    const top = [...reasons].sort(
      (a, b) =>
        (REASON_ACTION[b] ? 1 : 0) - (REASON_ACTION[a] ? 1 : 0) ||
        atRiskSeverity([b]) - atRiskSeverity([a]),
    )[0]
    tags.push(AT_RISK_REASON_LABELS[top])
    return {
      label: REASON_ACTION[top] ?? "Review risk",
      category: "act_now",
      priority: 100 + atRiskSeverity(reasons),
      tags,
    }
  }

  if (scheduleStartsOnDay(row, day)) {
    if (row.scheduleStatus === "To be Scheduled") {
      return { label: "Place on calendar", category: "confirm", priority: 70, tags: ["Starting"] }
    }
    if (row.scheduleStatus === "Not Confirmed") {
      return { label: "Confirm before start", category: "confirm", priority: 75, tags: ["Starting"] }
    }
    if (row.onboardingStatus === "Not Compliant") {
      return { label: "Clear onboarding", category: "act_now", priority: 80, tags: ["Starting"] }
    }
    return { label: "Go-live check", category: "starting", priority: 40, tags: ["Starting"] }
  }

  if (scheduleEndsOnDay(row, day)) {
    if (row.onboardingStatus === "Not Compliant") {
      return { label: "Finish offboarding", category: "act_now", priority: 65, tags: ["Ending"] }
    }
    return { label: "Wrap up placement", category: "ending", priority: 35, tags: ["Ending"] }
  }

  if (row.scheduleStatus === "To be Scheduled") {
    return { label: "Schedule dates", category: "confirm", priority: 55, tags: [] }
  }
  if (row.scheduleStatus === "Not Confirmed") {
    return { label: "Confirm placement", category: "confirm", priority: 50, tags: [] }
  }
  if (row.onboardingStatus === "Not Compliant") {
    return { label: "Resolve compliance", category: "act_now", priority: 45, tags: [] }
  }

  return { label: "Monitor", category: "running", priority: 10, tags: [] }
}

const URGENT_REASONS = new Set<ScheduleAtRiskReason>([
  "starting_imminent_gap",
  "unconfirmed_near_start",
  "unassigned_student",
  "unassigned_preceptor",
])

function isScheduleUrgent(row: ScheduleRecord, day: Date, referenceDate: string): boolean {
  const reasons = getScheduleAtRiskReasons(row, referenceDate)
  if (reasons.some((reason) => URGENT_REASONS.has(reason))) return true
  if (scheduleStartsOnDay(row, day)) {
    if (row.scheduleStatus === "Not Confirmed" || row.scheduleStatus === "To be Scheduled") return true
    if (row.onboardingStatus === "Not Compliant") return true
  }
  if (scheduleEndsOnDay(row, day) && row.onboardingStatus === "Not Compliant") return true
  return false
}

function buildDayActionItem(
  row: ScheduleRecord,
  day: Date,
  referenceDate: string,
): DayActionItem {
  const { label, category, priority, tags } = primaryActionLabel(row, day, referenceDate)
  return {
    scheduleId: row.id,
    category,
    priority,
    actionLabel: label,
    subject: scheduleSubject(row),
    context: scheduleContext(row),
    tags,
  }
}

function buildCellSignal(
  stats: Pick<MonthDayStats, "total" | "urgentCount" | "atRisk" | "starting" | "ending">,
): MonthDaySignal {
  if (stats.total === 0) return "clear"
  if (stats.urgentCount > 0) return "urgent"
  if (stats.atRisk > 0) return "attention"
  if (stats.starting > 0 || stats.ending > 0) return "motion"
  return "steady"
}

function finalizeMonthStats(
  stats: Omit<MonthDayStats, "signal">,
): MonthDayStats {
  return { ...stats, signal: buildCellSignal(stats) }
}

export function computeMonthDayStatsMap(
  rows: ScheduleRecord[],
  referenceDate: string,
  monthAnchor: Date,
): Map<string, MonthDayStats> {
  const { start, end } = monthRangeFromAnchor(monthAnchor)
  const map = new Map<string, MonthDayStats>()

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d)
    let total = 0
    let starting = 0
    let ending = 0
    let atRisk = 0
    let urgentCount = 0
    let actionCount = 0

    for (const row of rows) {
      if (row.scheduleStatus === "Cancelled") continue
      if (!scheduleIntersectsDay(row, day)) continue
      total += 1
      if (scheduleStartsOnDay(row, day)) starting += 1
      if (scheduleEndsOnDay(row, day)) ending += 1
      const action = buildDayActionItem(row, day, referenceDate)
      if (action.category !== "running") actionCount += 1
      if (isScheduleUrgent(row, day, referenceDate)) urgentCount += 1
      if (isScheduleAtRisk(row, referenceDate)) atRisk += 1
    }

    const iso = isoDate(day)
    map.set(
      iso,
      finalizeMonthStats({ iso, total, starting, ending, atRisk, urgentCount, actionCount }),
    )
  }

  return map
}

function buildActionGroups(items: DayActionItem[]): DayActionGroup[] {
  const byCategory = new Map<DayActionCategory, DayActionItem[]>()
  for (const item of items) {
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  return [...byCategory.entries()]
    .map(([category, groupItems]) => ({
      category,
      label: ACTION_GROUP_META[category].label,
      count: groupItems.length,
      items: groupItems.sort((a, b) => b.priority - a.priority),
    }))
    .sort((a, b) => ACTION_GROUP_META[a.category].order - ACTION_GROUP_META[b.category].order)
}

function buildCriticalHeadline(
  urgentCount: number,
  actionTotal: number,
  atRisk: number,
  starting: number,
  ending: number,
  total: number,
): { criticalHeadline: string; scanLine: string } {
  if (total === 0) {
    return { criticalHeadline: "Nothing scheduled", scanLine: "No placements on this day." }
  }
  if (actionTotal === 0) {
    return {
      criticalHeadline: "On track",
      scanLine: `${total} placement${total === 1 ? "" : "s"} running with no open actions.`,
    }
  }
  if (urgentCount > 0) {
    return {
      criticalHeadline: `${urgentCount} urgent`,
      scanLine: `${atRisk} need attention · ${actionTotal} open across ${total} placements${starting ? ` · ${starting} starting` : ""}${ending ? ` · ${ending} ending` : ""}.`,
    }
  }
  if (atRisk > 0) {
    return {
      criticalHeadline: `${atRisk} need attention`,
      scanLine: `${actionTotal} open across ${total} placements${starting ? ` · ${starting} starting` : ""}${ending ? ` · ${ending} ending` : ""}.`,
    }
  }
  return {
    criticalHeadline: `${actionTotal} open`,
    scanLine: `${total} placements${starting ? ` · ${starting} starting` : ""}${ending ? ` · ${ending} ending` : ""}.`,
  }
}

export function computeMonthGridRollup(statsByIso: Map<string, MonthDayStats>): MonthGridRollup {
  let daysWithLoad = 0
  let peakLoad = 0
  let peakLoadIso: string | null = null
  let urgentDays = 0
  let attentionDays = 0
  let monthUrgent = 0
  let monthAttention = 0

  for (const stats of statsByIso.values()) {
    if (stats.total === 0) continue
    daysWithLoad += 1
    if (stats.total > peakLoad) {
      peakLoad = stats.total
      peakLoadIso = stats.iso
    }
    if (stats.urgentCount > 0) {
      urgentDays += 1
      monthUrgent += stats.urgentCount
    }
    if (stats.atRisk > 0) {
      attentionDays += 1
      monthAttention += stats.atRisk
    }
  }

  return {
    daysWithLoad,
    peakLoad,
    peakLoadIso,
    urgentDays,
    attentionDays,
    monthUrgent,
    monthAttention,
  }
}

export function computeSchedulesDaySnapshot(
  rows: ScheduleRecord[],
  day: Date,
  referenceDate: string,
): SchedulesDaySnapshot {
  const iso = isoDate(day)
  const schedules = rows.filter(
    (row) => row.scheduleStatus !== "Cancelled" && scheduleIntersectsDay(row, day),
  )

  const actionItems = schedules
    .map((row) => buildDayActionItem(row, day, referenceDate))
    .sort((a, b) => b.priority - a.priority)

  const actionGroups = buildActionGroups(actionItems)
  const actionTotal = actionItems.filter((i) => i.category !== "running").length
  const urgentCount = schedules.filter((row) => isScheduleUrgent(row, day, referenceDate)).length

  let active = 0
  let starting = 0
  let ending = 0
  let atRisk = 0
  const locationCounts = new Map<string, number>()

  for (const row of schedules) {
    if (scheduleStartsOnDay(row, day)) starting += 1
    else if (scheduleEndsOnDay(row, day)) ending += 1
    else active += 1
    if (isScheduleAtRisk(row, referenceDate)) {
      atRisk += 1
      const loc = row.location?.trim() || "Unknown location"
      locationCounts.set(loc, (locationCounts.get(loc) ?? 0) + 1)
    }
  }

  const topLocations = [...locationCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([location, count]) => ({ location, count }))

  const { criticalHeadline, scanLine } = buildCriticalHeadline(
    urgentCount,
    actionTotal,
    atRisk,
    starting,
    ending,
    schedules.length,
  )

  return {
    dayLabel: formatScheduleDayLabel(day),
    iso,
    total: schedules.length,
    active,
    starting,
    ending,
    atRisk,
    urgentCount,
    actionTotal,
    criticalHeadline,
    scanLine,
    schedules: (() => {
      const priorityById = new Map(actionItems.map((i) => [i.scheduleId, i.priority]))
      return [...schedules].sort(
        (a, b) => (priorityById.get(b.id) ?? 0) - (priorityById.get(a.id) ?? 0),
      )
    })(),
    actionGroups,
    topLocations,
  }
}

export type SchedulesMonthLayout = "timeline" | "grid"

export type MonthGridKpiId = "active_days" | "peak_load" | "urgent_days" | "attention_days"

export const MONTH_GRID_KPI_OPTIONS: {
  id: MonthGridKpiId
  label: (monthLabel: string) => string
  info: string
  filterLens: SchedulesCalendarQuickLens | null
  iconKey: SchedulesCalendarKpiId
  value: (rollup: MonthGridRollup) => number
  warnWhenPositive?: boolean
}[] = [
  {
    id: "active_days",
    label: (monthLabel) => monthLabel,
    info: "Days in this month with at least one active placement.",
    filterLens: null,
    iconKey: "active",
    value: (rollup) => rollup.daysWithLoad,
  },
  {
    id: "peak_load",
    label: () => "Peak load",
    info: "Highest number of concurrent placements on a single day this month.",
    filterLens: null,
    iconKey: "starting",
    value: (rollup) => rollup.peakLoad,
  },
  {
    id: "urgent_days",
    label: () => "Urgent days",
    info: "Days with at least one time-sensitive action — imminent starts, gaps, or unconfirmed placements.",
    filterLens: null,
    iconKey: "ending",
    value: (rollup) => rollup.urgentDays,
    warnWhenPositive: true,
  },
  {
    id: "attention_days",
    label: () => "Need attention",
    info: "Days with schedules flagged for compliance, assignment, or timing risk. Filter the calendar to at-risk schedules.",
    filterLens: "at_risk",
    iconKey: "needs_attention",
    value: (rollup) => rollup.attentionDays,
    warnWhenPositive: true,
  },
]
