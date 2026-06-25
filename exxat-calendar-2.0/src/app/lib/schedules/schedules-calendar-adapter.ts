import { locationId, schoolShortName } from "../slot-requests-calendar/parse"
import type { Placement, SlotRequestRow, SlotStatus } from "../slot-requests-calendar/types"
import type { ScheduleRecord, ScheduleStatus } from "./types"
import { formatAvailabilityLabel } from "./schedules-list"
import { parseIsoDate } from "./aggregations"
import {
  scheduleRequestedLocation,
  scheduleStudentDiscipline,
  scheduleTreeDepartment,
  scheduleTreeLocation,
} from "./schedule-location-model"

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

export function formatIsoDurationRange(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()
  const year = endYear
  const startMonth = start.getMonth()
  const endMonth = end.getMonth()
  const adjustedStartYear = startMonth > endMonth ? year - 1 : startYear
  if (adjustedStartYear !== year) {
    return `${MONTH_LABELS[startMonth]} ${start.getDate()}, ${adjustedStartYear} - ${MONTH_LABELS[endMonth]} ${end.getDate()}, ${year}`
  }
  return `${MONTH_LABELS[startMonth]} ${start.getDate()} - ${MONTH_LABELS[endMonth]} ${end.getDate()}, ${year}`
}

/** @deprecated Use `scheduleRequestedLocation` from `schedule-location-model`. */
export function scheduleLocationLabel(row: ScheduleRecord): string {
  return scheduleRequestedLocation(row)
}

export function mapScheduleStatusToSlotStatus(status: ScheduleStatus): SlotStatus {
  switch (status) {
    case "Confirmed":
      return "Approved"
    case "Not Confirmed":
      return "Review"
    case "To be Scheduled":
      return "Request Pending"
    case "Cancelled":
      return "Canceled"
  }
}

/** Bar label — group shows clinical instructor; individual shows student. */
export function scheduleTimelineLabel(row: ScheduleRecord): string {
  if (row.experienceType === "Group") {
    if (row.preceptorName?.trim()) {
      const parts = row.preceptorName.trim().split(/\s+/)
      return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0]
    }
    return `Group · ${schoolShortName(row.school)}`
  }
  if (row.studentName?.trim()) {
    const parts = row.studentName.trim().split(/\s+/)
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0]
  }
  return "Schedule student"
}

export function mappleScheduleToPlacement(row: ScheduleRecord): Placement {
  const site = scheduleTreeLocation(row)
  const locKey = locationId(site)

  return {
    id: row.id,
    locationId: locKey,
    locationName: site,
    locationGroup: row.locationGroup ?? "",
    discipline: scheduleTreeDepartment(row),
    school: row.school,
    schoolShort: scheduleTimelineLabel(row),
    availabilityName: formatAvailabilityLabel(row),
    experienceType: row.experienceType,
    requestedSlots: 1,
    pendingDuration: 0,
    status: mapScheduleStatusToSlotStatus(row.scheduleStatus),
    requestedDuration: formatIsoDurationRange(row.startDate, row.endDate),
    requestedShifts: row.shift ?? "",
    requestedDaysOfWeek: row.daysOfWeek ?? "",
    programType: `${row.discipline} (${row.specialization})`,
    partnerCategory: row.onboardingStatus,
    start: parseIsoDate(row.startDate),
    end: parseIsoDate(row.endDate),
    timelineKind: "schedule",
    slotRequestId: row.id,
    scheduleId: row.id,
    scheduleMonthDays: row.monthDays ?? null,
    scheduleBlocks: row.scheduleBlocks ?? null,
    scheduleRhythmKind: row.scheduleRhythmKind ?? null,
  }
}

export function mappleScheduleToSlotRequestRow(row: ScheduleRecord): SlotRequestRow {
  return {
    id: row.id,
    school: row.school,
    availabilityName: formatAvailabilityLabel(row),
    experienceType: row.experienceType,
    requestedSlots: 1,
    pendingDuration: 0,
    requestedLocation: scheduleRequestedLocation(row),
    programType: `${row.discipline} (${row.specialization})`,
    requestedShifts: row.shift ?? "",
    requestedDaysOfWeek: row.daysOfWeek ?? "",
    requestedDate: row.startDate,
    requestedBy: row.preceptorName ?? row.studentName ?? "",
    requestedDuration: formatIsoDurationRange(row.startDate, row.endDate),
    approvedInfo: row.scheduleStatus,
    studentProfileShared: row.studentEmail ?? "",
    partnerCategory: row.onboardingStatus,
    status: mapScheduleStatusToSlotStatus(row.scheduleStatus),
    scheduleDiscipline: scheduleStudentDiscipline(row),
    scheduleSpecialization: row.specialization,
    scheduleStatusLabel: row.scheduleStatus,
  }
}
