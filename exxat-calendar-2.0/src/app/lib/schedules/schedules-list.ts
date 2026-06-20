import type {
  ExperienceType,
  OnboardingStatus,
  ScheduleRecord,
  ScheduleStatus,
} from "./types"
import { parseIsoDate } from "./aggregations"
import {
  formatScheduleListLocation,
  scheduleClinicalUnit,
  scheduleStudentDiscipline,
  scheduleTreeLocation,
} from "./schedule-location-model"

export { formatScheduleListLocation } from "./schedule-location-model"

export type ScheduleTimingFilter = "all" | "upcoming" | "current" | "completed"

export interface ScheduleListFilterState {
  disciplines: string[]
  programs: string[]
  schools: string[]
  locationGroups: string[]
  locations: string[]
  scheduleStatuses: ScheduleStatus[]
  onboardingStatuses: OnboardingStatus[]
}

export const EMPTY_LIST_FILTERS: ScheduleListFilterState = {
  disciplines: [],
  programs: [],
  schools: [],
  locationGroups: [],
  locations: [],
  scheduleStatuses: [],
  onboardingStatuses: [],
}

export interface ScheduleListFilterOptions {
  disciplines: string[]
  programs: string[]
  schools: string[]
  locationGroups: string[]
  locations: string[]
  scheduleStatuses: ScheduleStatus[]
  onboardingStatuses: OnboardingStatus[]
}

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v?.trim())))].sort((a, b) =>
    a.localeCompare(b),
  )
}

export function extractListFilterOptions(rows: ScheduleRecord[]): ScheduleListFilterOptions {
  return {
    disciplines: uniqueSorted(rows.map(scheduleStudentDiscipline)),
    programs: uniqueSorted(rows.map((r) => r.specialization)),
    schools: uniqueSorted(rows.map((r) => r.school)),
    locationGroups: uniqueSorted(rows.map((r) => r.locationGroup)),
    locations: uniqueSorted(rows.map(scheduleTreeLocation)),
    scheduleStatuses: uniqueSorted(rows.map((r) => r.scheduleStatus)) as ScheduleStatus[],
    onboardingStatuses: uniqueSorted(rows.map((r) => r.onboardingStatus)) as OnboardingStatus[],
  }
}

function seasonLabel(iso: string): string {
  const d = parseIsoDate(iso)
  const month = d.getMonth()
  const year = d.getFullYear()
  if (month < 4) return `Spring ${year}`
  if (month < 8) return `Summer ${year}`
  return `Fall ${year}`
}

function abbreviateLocation(location: string): string {
  return location
    .replace(/Mapple University Medical Center/gi, "MGUH")
    .replace(/Mapple /gi, "")
    .trim()
}

/** Compose availability label from Excel-backed schedule fields (no separate column in source). */
export function formatAvailabilityLabel(row: ScheduleRecord): string {
  const parts = [
    seasonLabel(row.startDate),
    abbreviateLocation(scheduleTreeLocation(row)),
    scheduleStudentDiscipline(row),
    scheduleClinicalUnit(row)?.split(" - ")[0] ?? "",
  ].filter(Boolean)
  return parts.length >= 2 ? parts.join(" ") : "NA"
}

function matchesMultiSelect<T extends string>(
  selected: T[],
  value: T,
): boolean {
  return selected.length === 0 || selected.includes(value)
}

export function filterSchedulesListRows(
  rows: ScheduleRecord[],
  options: {
    referenceDate: string
    /** Omit in calendar view — show group and individual schedules together. */
    experienceType?: ExperienceType
    timing: ScheduleTimingFilter
    studentSearch: string
    filters: ScheduleListFilterState
  },
): ScheduleRecord[] {
  const q = options.studentSearch.trim().toLowerCase()
  const today = parseIsoDate(options.referenceDate)
  const { filters } = options

  return rows.filter((row) => {
    if (
      options.experienceType != null &&
      row.experienceType !== options.experienceType
    ) {
      return false
    }

    if (!matchesMultiSelect(filters.disciplines, scheduleStudentDiscipline(row))) return false
    if (!matchesMultiSelect(filters.programs, row.specialization)) return false
    if (!matchesMultiSelect(filters.schools, row.school)) return false
    if (row.locationGroup && !matchesMultiSelect(filters.locationGroups, row.locationGroup)) {
      return false
    }
    if (filters.locationGroups.length > 0 && !row.locationGroup) return false
    if (!matchesMultiSelect(filters.locations, scheduleTreeLocation(row))) return false
    if (!matchesMultiSelect(filters.scheduleStatuses, row.scheduleStatus)) return false
    if (!matchesMultiSelect(filters.onboardingStatuses, row.onboardingStatus)) return false

    if (options.timing !== "all") {
      const start = parseIsoDate(row.startDate)
      const end = parseIsoDate(row.endDate)
      if (options.timing === "upcoming" && !(start > today)) return false
      if (options.timing === "current" && !(start <= today && end >= today)) return false
      if (options.timing === "completed" && !(end < today)) return false
    }

    if (!q) return true
    return (
      (row.studentName?.toLowerCase().includes(q) ?? false) ||
      (row.studentEmail?.toLowerCase().includes(q) ?? false) ||
      row.id.toLowerCase().includes(q) ||
      row.school.toLowerCase().includes(q)
    )
  })
}

export const ONBOARDING_BADGE_STYLES: Record<OnboardingStatus, string> = {
  Compliant: "bg-green-500 text-white border border-green-600",
  "Not Applicable": "bg-gray-100 text-gray-600 border border-gray-200",
  "Not Compliant": "bg-red-100 text-red-800 border border-red-200",
}

export const SCHEDULE_STATUS_BADGE_STYLES: Record<ScheduleStatus, string> = {
  Confirmed: "bg-green-100 text-green-800 border border-green-200",
  "Not Confirmed": "bg-amber-100 text-amber-800 border border-amber-200",
  "To be Scheduled": "bg-gray-100 text-gray-600 border border-gray-200",
  Cancelled: "bg-red-100 text-red-800 border border-red-200",
}

export type PhaseComplianceStatus =
  | "Compliant"
  | "Not Applicable"
  | "Not Started"
  | "Not Compliant"

export const PHASE_BADGE_STYLES: Record<PhaseComplianceStatus, string> = {
  Compliant: "bg-green-500 text-white border border-green-600",
  "Not Applicable": "bg-gray-100 text-gray-600 border border-gray-200",
  "Not Started": "bg-gray-100 text-gray-600 border border-gray-200",
  "Not Compliant": "bg-red-100 text-red-800 border border-red-200",
}

const DAY_ABBREV_TO_NAME: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
}


/** Program type from school track + specialization (Excel has no dedicated column). */
export function formatScheduleProgramType(row: ScheduleRecord): string {
  const parts = row.school.split(" - ").map((p) => p.trim())
  if (parts.length >= 3) {
    const track = parts.slice(2).join(" - ")
    return `${track} (${row.specialization})`
  }
  if (parts.length === 2) {
    return `${parts[1]} (${row.specialization})`
  }
  return `${row.discipline} (${row.specialization})`
}

export function formatDaysOfWeekDisplay(raw: string | null): string {
  if (!raw?.trim()) return ""
  const tokens = raw.split(",").map((t) => t.trim()).filter(Boolean)
  if (tokens.length === 0) return ""
  const key = tokens[0].slice(0, 3).toUpperCase()
  const first = DAY_ABBREV_TO_NAME[key] ?? tokens[0]
  return tokens.length === 1 ? first : `${first} +${tokens.length - 1}`
}

export function formatShiftDisplay(shift: string | null): string {
  if (!shift?.trim()) return ""
  const parts = shift.split(",").map((s) => s.trim()).filter(Boolean)
  if (parts.length <= 1) return parts[0] ?? ""
  return `${parts[0]} +${parts.length - 1}`
}

/** Ongoing / offboarding are not in the Excel export — derived from dates + onboarding. */
export function deriveOngoingStatus(
  row: ScheduleRecord,
  referenceDate: string,
): PhaseComplianceStatus {
  if (row.scheduleStatus === "Cancelled" || row.onboardingStatus === "Not Applicable") {
    return "Not Applicable"
  }
  const today = parseIsoDate(referenceDate)
  const start = parseIsoDate(row.startDate)
  const end = parseIsoDate(row.endDate)
  if (start > today || end < today) return "Not Applicable"
  if (row.onboardingStatus === "Compliant") return "Compliant"
  if (row.onboardingStatus === "Not Compliant") return "Not Compliant"
  return "Not Applicable"
}

export function deriveOffboardingStatus(
  row: ScheduleRecord,
  referenceDate: string,
): PhaseComplianceStatus {
  if (row.scheduleStatus === "Cancelled" || row.onboardingStatus === "Not Applicable") {
    return "Not Applicable"
  }
  const today = parseIsoDate(referenceDate)
  const end = parseIsoDate(row.endDate)
  if (end >= today) return "Not Started"
  if (row.onboardingStatus === "Compliant") return "Compliant"
  return "Not Started"
}
