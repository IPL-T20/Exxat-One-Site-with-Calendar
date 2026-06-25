import { parseIsoDate } from "./aggregations"
import type { ScheduleRecord } from "./types"
import type { CalendarZoom } from "../slot-requests-calendar/types"

export type SchedulesCalendarQuickLens =
  | "all"
  | "to_be_scheduled"
  | "not_confirmed"
  | "not_compliant"
  | "at_risk"

export const SCHEDULES_ATTENTION_KPI_OPTIONS: {
  id: Exclude<SchedulesCalendarQuickLens, "all">
  label: string
  info: string
}[] = [
  {
    id: "to_be_scheduled",
    label: "To be scheduled",
    info: "Schedules not yet placed on the calendar — need dates or placement confirmed.",
  },
  {
    id: "not_confirmed",
    label: "Not confirmed",
    info: "Schedules awaiting site confirmation before students can onboard.",
  },
  {
    id: "not_compliant",
    label: "Not compliant",
    info: "Confirmed schedules with onboarding gaps — requirements or compliance incomplete.",
  },
  {
    id: "at_risk",
    label: "At risk",
    info: "Schedules flagged by compliance, assignment, or timing rules in the next two weeks.",
  },
]

/** @deprecated KPI strip replaces quick-lens toolbar chips */
export const SCHEDULES_QUICK_LENS_OPTIONS: { id: SchedulesCalendarQuickLens; label: string }[] =
  SCHEDULES_ATTENTION_KPI_OPTIONS.map(({ id, label }) => ({ id, label }))

export type ScheduleAtRiskReason =
  | "compliance_gap"
  | "requirements_pending"
  | "unassigned_student"
  | "unassigned_preceptor"
  | "unconfirmed_near_start"
  | "recently_cancelled"
  | "ending_offboarding"
  | "starting_imminent_gap"

export const AT_RISK_REASON_LABELS: Record<ScheduleAtRiskReason, string> = {
  compliance_gap: "Onboarding not compliant",
  requirements_pending: "Requirements pending",
  unassigned_student: "Student not assigned",
  unassigned_preceptor: "Preceptor not assigned",
  unconfirmed_near_start: "Not confirmed near start",
  recently_cancelled: "Recently cancelled",
  ending_offboarding: "Ending — offboarding incomplete",
  starting_imminent_gap: "Starting within 48h — assignment or compliance gap",
}

const DAY_MS = 86_400_000
const RISK_HORIZON_DAYS = 14
const RISK_URGENT_DAYS = 2
const OFFBOARDING_HORIZON_DAYS = 7
const STARTING_SOON_DAYS = 14

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function daysUntil(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS)
}

function isSameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b)
}

/** Schedule overlaps a calendar day (inclusive). */
export function scheduleIntersectsDay(row: ScheduleRecord, day: Date): boolean {
  const d = isoDate(day)
  return row.startDate <= d && d <= row.endDate
}

export function scheduleStartsOnDay(row: ScheduleRecord, day: Date): boolean {
  return row.startDate === isoDate(day)
}

export function scheduleEndsOnDay(row: ScheduleRecord, day: Date): boolean {
  return row.endDate === isoDate(day)
}

export function scheduleActiveOnDay(row: ScheduleRecord, day: Date): boolean {
  const d = isoDate(day)
  return row.startDate < d && d <= row.endDate
}

/** Ongoing, starting today, or ending today — the live schedule window. */
export function isScheduleLiveToday(row: ScheduleRecord, referenceDate: string): boolean {
  const today = parseIsoDate(referenceDate)
  return (
    scheduleIntersectsDay(row, today) &&
    (scheduleStartsOnDay(row, today) ||
      scheduleEndsOnDay(row, today) ||
      scheduleActiveOnDay(row, today))
  )
}

export type ScheduleLiveSortTier = "live" | "upcoming" | "past"

export function scheduleLiveSortTier(
  row: ScheduleRecord,
  referenceDate: string,
): ScheduleLiveSortTier {
  const todayIso = referenceDate
  if (row.startDate <= todayIso && row.endDate >= todayIso) return "live"
  if (row.startDate > todayIso) return "upcoming"
  return "past"
}

const LIVE_TIER_ORDER: Record<ScheduleLiveSortTier, number> = {
  live: 0,
  upcoming: 1,
  past: 2,
}

/** Sidebar Live sort — live schedules first, then upcoming, then past. */
export function compareSchedulesForLiveSort(
  a: ScheduleRecord,
  b: ScheduleRecord,
  referenceDate: string,
): number {
  const todayIso = referenceDate
  const ta = scheduleLiveSortTier(a, referenceDate)
  const tb = scheduleLiveSortTier(b, referenceDate)
  if (ta !== tb) return LIVE_TIER_ORDER[ta] - LIVE_TIER_ORDER[tb]

  if (ta === "live") {
    const aStarting = a.startDate === todayIso ? 0 : 1
    const bStarting = b.startDate === todayIso ? 0 : 1
    if (aStarting !== bStarting) return aStarting - bStarting
    const aEnding = a.endDate === todayIso ? 0 : 1
    const bEnding = b.endDate === todayIso ? 0 : 1
    if (aEnding !== bEnding) return aEnding - bEnding
    return a.startDate.localeCompare(b.startDate)
  }

  if (ta === "upcoming") return a.startDate.localeCompare(b.startDate)
  return b.endDate.localeCompare(a.endDate)
}

function weekRange(anchor: Date): { start: Date; end: Date } {
  const day = startOfDay(anchor)
  const dow = day.getDay()
  const start = new Date(day)
  start.setDate(day.getDate() - dow)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

export function scheduleIntersectsWeek(row: ScheduleRecord, anchor: Date): boolean {
  const { start, end } = weekRange(anchor)
  const startIso = isoDate(start)
  const endIso = isoDate(end)
  return row.startDate <= endIso && row.endDate >= startIso
}

function monthRange(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
  return { start, end }
}

function yearRange(anchor: Date): { start: Date; end: Date } {
  return {
    start: new Date(anchor.getFullYear(), 0, 1),
    end: new Date(anchor.getFullYear(), 11, 31),
  }
}

/** Visible calendar period for KPI grain — follows zoom + navigator anchor. */
export function kpiPeriodRange(
  anchor: Date,
  zoom: CalendarZoom,
): { start: Date; end: Date } {
  switch (zoom) {
    case "day":
      return { start: startOfDay(anchor), end: startOfDay(anchor) }
    case "week":
      return weekRange(anchor)
    case "month":
      return monthRange(anchor)
    case "year":
      return yearRange(anchor)
  }
}

export function kpiPeriodNoun(zoom: CalendarZoom): string {
  switch (zoom) {
    case "day":
      return "day"
    case "week":
      return "week"
    case "month":
      return "month"
    case "year":
      return "year"
  }
}

function scheduleIntersectsRange(
  row: ScheduleRecord,
  startIso: string,
  endIso: string,
): boolean {
  return row.startDate <= endIso && row.endDate >= startIso
}

function scheduleStartsInRange(
  row: ScheduleRecord,
  startIso: string,
  endIso: string,
): boolean {
  return row.startDate >= startIso && row.startDate <= endIso
}

function scheduleEndsInRange(
  row: ScheduleRecord,
  startIso: string,
  endIso: string,
): boolean {
  return row.endDate >= startIso && row.endDate <= endIso
}

export type SchedulesCalendarKpiId = "active" | "starting" | "ending" | "needs_attention"

export interface SchedulesCalendarKpis {
  active: number
  starting: number
  ending: number
  needsAttention: number
  periodNoun: string
}

export const SCHEDULES_CALENDAR_KPI_OPTIONS: {
  id: SchedulesCalendarKpiId
  label: (periodNoun: string) => string
  info: string
  filterLens: SchedulesCalendarQuickLens | null
}[] = [
  {
    id: "active",
    label: (p) => `Active this ${p}`,
    info: "Schedules running during the navigated day, week, month, or year.",
    filterLens: null,
  },
  {
    id: "starting",
    label: (p) => `Starting this ${p}`,
    info: "Schedules whose start date falls inside the visible period.",
    filterLens: null,
  },
  {
    id: "ending",
    label: (p) => `Ending this ${p}`,
    info: "Schedules whose end date falls inside the visible period.",
    filterLens: null,
  },
  {
    id: "needs_attention",
    label: () => "Needs attention",
    info: "At-risk schedules in scope that intersect the visible period — compliance, assignment, or timing flags.",
    filterLens: "at_risk",
  },
]

/** Period-aware headline KPIs — recomputes when scope, zoom, or navigator anchor changes. */
export function computeSchedulesCalendarKpis(
  rows: ScheduleRecord[],
  referenceDate: string,
  periodAnchor: Date,
  zoom: CalendarZoom,
): SchedulesCalendarKpis {
  const { start, end } = kpiPeriodRange(periodAnchor, zoom)
  const startIso = isoDate(start)
  const endIso = isoDate(end)
  const periodNoun = kpiPeriodNoun(zoom)

  let active = 0
  let starting = 0
  let ending = 0
  let needsAttention = 0

  for (const row of rows) {
    const inPeriod = scheduleIntersectsRange(row, startIso, endIso)
    if (inPeriod) active += 1
    if (scheduleStartsInRange(row, startIso, endIso)) starting += 1
    if (scheduleEndsInRange(row, startIso, endIso)) ending += 1
    if (inPeriod && isScheduleAtRisk(row, referenceDate)) needsAttention += 1
  }

  return { active, starting, ending, needsAttention, periodNoun }
}

export function getScheduleAtRiskReasons(
  row: ScheduleRecord,
  referenceDate: string,
): ScheduleAtRiskReason[] {
  const today = parseIsoDate(referenceDate)
  const start = parseIsoDate(row.startDate)
  const end = parseIsoDate(row.endDate)
  const untilStart = daysUntil(today, start)
  const untilEnd = daysUntil(today, end)
  const activeOrStartingSoon =
    untilStart <= RISK_HORIZON_DAYS && untilEnd >= 0

  const reasons: ScheduleAtRiskReason[] = []

  if (row.onboardingStatus === "Not Compliant" && activeOrStartingSoon) {
    reasons.push("compliance_gap")
  }
  if (
    (row.requirements.pending > 0 || row.requirements.notApproved > 0) &&
    activeOrStartingSoon
  ) {
    reasons.push("requirements_pending")
  }
  if (
    row.experienceType === "Individual" &&
    !row.studentName?.trim() &&
    untilStart <= RISK_HORIZON_DAYS &&
    untilStart >= 0
  ) {
    reasons.push("unassigned_student")
  }
  if (
    row.experienceType === "Group" &&
    !row.preceptorName?.trim() &&
    untilStart <= RISK_HORIZON_DAYS &&
    untilStart >= 0
  ) {
    reasons.push("unassigned_preceptor")
  }
  if (
    (row.scheduleStatus === "Not Confirmed" || row.scheduleStatus === "To be Scheduled") &&
    untilStart <= RISK_HORIZON_DAYS &&
    untilStart >= 0
  ) {
    reasons.push("unconfirmed_near_start")
  }
  if (row.scheduleStatus === "Cancelled") {
    const todayIso = isoDate(today)
    const intersectsToday = row.startDate <= todayIso && row.endDate >= todayIso
    const startsWithinHorizon = untilStart >= 0 && untilStart <= RISK_HORIZON_DAYS
    if (intersectsToday || startsWithinHorizon) {
      reasons.push("recently_cancelled")
    }
  }
  if (
    untilEnd >= 0 &&
    untilEnd <= OFFBOARDING_HORIZON_DAYS &&
    row.onboardingStatus === "Not Compliant"
  ) {
    reasons.push("ending_offboarding")
  }
  if (
    untilEnd < 0 &&
    untilEnd >= -OFFBOARDING_HORIZON_DAYS &&
    row.onboardingStatus === "Not Compliant"
  ) {
    reasons.push("ending_offboarding")
  }
  if (untilStart <= RISK_URGENT_DAYS && untilStart >= 0) {
    const gap =
      (row.experienceType === "Individual" && !row.studentName?.trim()) ||
      (row.experienceType === "Group" && !row.preceptorName?.trim()) ||
      row.onboardingStatus === "Not Compliant" ||
      row.requirements.pending > 0
    if (gap) reasons.push("starting_imminent_gap")
  }

  return [...new Set(reasons)]
}

export function isScheduleAtRisk(row: ScheduleRecord, referenceDate: string): boolean {
  return getScheduleAtRiskReasons(row, referenceDate).length > 0
}

export function atRiskSeverity(reasons: ScheduleAtRiskReason[]): number {
  const weights: Record<ScheduleAtRiskReason, number> = {
    starting_imminent_gap: 100,
    compliance_gap: 90,
    unassigned_student: 85,
    unassigned_preceptor: 85,
    requirements_pending: 80,
    unconfirmed_near_start: 75,
    ending_offboarding: 60,
    recently_cancelled: 50,
  }
  return Math.max(0, ...reasons.map((r) => weights[r] ?? 0))
}

export interface SchedulesAttentionKpis {
  toBeScheduled: number
  notConfirmed: number
  notCompliant: number
  atRisk: number
}

export function computeSchedulesAttentionKpis(
  rows: ScheduleRecord[],
  referenceDate: string,
): SchedulesAttentionKpis {
  let toBeScheduled = 0
  let notConfirmed = 0
  let notCompliant = 0
  let atRisk = 0

  for (const row of rows) {
    if (row.scheduleStatus === "To be Scheduled") toBeScheduled += 1
    if (row.scheduleStatus === "Not Confirmed") notConfirmed += 1
    if (row.onboardingStatus === "Not Compliant") notCompliant += 1
    if (isScheduleAtRisk(row, referenceDate)) atRisk += 1
  }

  return { toBeScheduled, notConfirmed, notCompliant, atRisk }
}

export interface SchedulesBriefingMetrics {
  todayTotal: number
  startingToday: number
  activeToday: number
  atRisk: number
  startingIn7Days: number
}

export function computeSchedulesBriefingMetrics(
  rows: ScheduleRecord[],
  referenceDate: string,
): SchedulesBriefingMetrics {
  const today = parseIsoDate(referenceDate)
  const todayIso = isoDate(today)
  const in7 = new Date(today)
  in7.setDate(in7.getDate() + 7)
  const in7Iso = isoDate(in7)

  let todayTotal = 0
  let startingToday = 0
  let activeToday = 0
  let atRisk = 0
  let startingIn7Days = 0

  for (const row of rows) {
    if (scheduleIntersectsDay(row, today)) todayTotal += 1
    if (row.startDate === todayIso) startingToday += 1
    if (scheduleActiveOnDay(row, today)) activeToday += 1
    if (isScheduleAtRisk(row, referenceDate)) atRisk += 1
    if (row.startDate > todayIso && row.startDate <= in7Iso) startingIn7Days += 1
  }

  return { todayTotal, startingToday, activeToday, atRisk, startingIn7Days }
}

export function filterSchedulesForLens(
  rows: ScheduleRecord[],
  lens: SchedulesCalendarQuickLens,
  referenceDate: string,
  periodAnchor: Date,
  zoom: CalendarZoom = "month",
): ScheduleRecord[] {
  switch (lens) {
    case "all":
      return rows
    case "to_be_scheduled":
      return rows
        .filter((r) => r.scheduleStatus === "To be Scheduled")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
    case "not_confirmed":
      return rows
        .filter((r) => r.scheduleStatus === "Not Confirmed")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
    case "not_compliant":
      return rows
        .filter((r) => r.onboardingStatus === "Not Compliant")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
    case "at_risk": {
      const { start, end } = kpiPeriodRange(periodAnchor, zoom)
      const startIso = isoDate(start)
      const endIso = isoDate(end)
      return rows
        .filter(
          (r) =>
            isScheduleAtRisk(r, referenceDate) &&
            scheduleIntersectsRange(r, startIso, endIso),
        )
        .sort((a, b) => {
          const sa = atRiskSeverity(getScheduleAtRiskReasons(a, referenceDate))
          const sb = atRiskSeverity(getScheduleAtRiskReasons(b, referenceDate))
          if (sb !== sa) return sb - sa
          return a.startDate.localeCompare(b.startDate)
        })
    }
    default:
      return rows
  }
}

export function defaultZoomForLens(lens: SchedulesCalendarQuickLens): "day" | "week" | "month" {
  if (lens === "at_risk") return "week"
  return "month"
}

/** @deprecated Briefing cards removed — use attention KPI strip */
export function briefingCardToLens(): SchedulesCalendarQuickLens {
  return "all"
}

export function isSameDayAsReference(anchor: Date, referenceDate: string): boolean {
  return isSameDay(anchor, parseIsoDate(referenceDate))
}
