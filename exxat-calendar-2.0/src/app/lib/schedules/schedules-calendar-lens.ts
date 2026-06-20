import { parseIsoDate } from "./aggregations"
import type { ScheduleRecord } from "./types"

export type SchedulesCalendarQuickLens =
  | "today"
  | "at_risk"
  | "this_week"
  | "starting_soon"
  | "capacity"

export const SCHEDULES_QUICK_LENS_OPTIONS: {
  id: SchedulesCalendarQuickLens
  label: string
}[] = [
  { id: "today", label: "Today" },
  { id: "at_risk", label: "At risk" },
  { id: "this_week", label: "This week" },
  { id: "starting_soon", label: "Starting soon" },
  { id: "capacity", label: "Capacity" },
]

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
  anchorDay: Date,
): ScheduleRecord[] {
  const today = parseIsoDate(referenceDate)
  const todayIso = isoDate(today)
  const soonEnd = new Date(today)
  soonEnd.setDate(soonEnd.getDate() + STARTING_SOON_DAYS)
  const soonEndIso = isoDate(soonEnd)

  switch (lens) {
    case "today":
      return rows.filter((r) => scheduleIntersectsDay(r, anchorDay))
    case "at_risk":
      return rows
        .filter((r) => isScheduleAtRisk(r, referenceDate))
        .sort((a, b) => {
          const sa = atRiskSeverity(getScheduleAtRiskReasons(a, referenceDate))
          const sb = atRiskSeverity(getScheduleAtRiskReasons(b, referenceDate))
          if (sb !== sa) return sb - sa
          return a.startDate.localeCompare(b.startDate)
        })
    case "this_week":
      return rows
        .filter((r) => scheduleIntersectsWeek(r, anchorDay))
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
    case "starting_soon":
      return rows
        .filter((r) => r.startDate > todayIso && r.startDate <= soonEndIso)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
    case "capacity":
      return rows
    default:
      return rows
  }
}

export function defaultZoomForLens(lens: SchedulesCalendarQuickLens): "day" | "week" | "month" {
  if (lens === "capacity") return "month"
  if (lens === "this_week" || lens === "starting_soon") return "week"
  return "day"
}

/** Briefing card → quick lens mapping */
export type BriefingCardId =
  | "today_total"
  | "starting_today"
  | "active_today"
  | "at_risk"
  | "starting_in_7"

export function briefingCardToLens(id: BriefingCardId): SchedulesCalendarQuickLens {
  switch (id) {
    case "at_risk":
      return "at_risk"
    case "starting_in_7":
      return "starting_soon"
    default:
      return "today"
  }
}

export function isSameDayAsReference(anchor: Date, referenceDate: string): boolean {
  return isSameDay(anchor, parseIsoDate(referenceDate))
}
