import { locationId, schoolShortName } from "../slot-requests-calendar/parse"
import type { Placement, SlotRequestRow, SlotStatus } from "../slot-requests-calendar/types"
import { parseIsoDate } from "../schedules/aggregations"
import type { SlotRequestRecord } from "./types"
import {
  slotRequestRequestedLocation,
  slotRequestStudentDiscipline,
  slotRequestTreeDepartment,
  slotRequestTreeLocation,
} from "./slot-request-location-model"
import { resolveGoldPartnerCategory } from "../slot-requests-calendar/gold-partner-school"

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

export function mapSlotRequestStatus(status: string): SlotStatus {
  switch (status) {
    case "Approved":
      return "Approved"
    case "Request Pending":
      return "Request Pending"
    case "Review In Progress":
      return "Review"
    case "Declined":
      return "Declined"
    case "Canceled":
    case "Cancelled":
      return "Canceled"
    default:
      return "Review"
  }
}

function slotRequestTimelineLabel(row: SlotRequestRecord): string {
  if (row.experienceType === "Group") {
    if (row.ciFacultyName?.trim()) {
      const parts = row.ciFacultyName.trim().split(/\s+/)
      return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0]
    }
    return `Group · ${schoolShortName(row.programName)}`
  }
  if (row.studentName?.trim()) {
    const parts = row.studentName.trim().split(/\s+/)
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0]
  }
  return "Schedule student"
}

export function mappleSlotRequestToPlacement(row: SlotRequestRecord): Placement {
  const site = slotRequestTreeLocation(row)
  const locKey = locationId(site)

  return {
    id: row.id,
    locationId: locKey,
    locationName: site,
    locationGroup: row.locationGroup ?? "",
    discipline: slotRequestTreeDepartment(row),
    school: row.programName,
    schoolShort: slotRequestTimelineLabel(row),
    availabilityName: row.availabilityName,
    experienceType: row.experienceType,
    requestedSlots: row.requestedSlots,
    pendingDuration: 0,
    status: mapSlotRequestStatus(row.status),
    requestedDuration: formatIsoDurationRange(row.startDate, row.endDate),
    requestedShifts: row.shifts ?? "",
    requestedDaysOfWeek: row.daysOfWeek ?? "",
    programType: `${row.discipline} (${row.specialization})`,
    partnerCategory: resolveGoldPartnerCategory(row.programName, row.programCategory),
    start: parseIsoDate(row.startDate),
    end: parseIsoDate(row.endDate),
    timelineKind: "slot-request",
    slotRequestId: row.id,
    scheduleId: null,
  }
}

export function mappleSlotRequestToSlotRequestRow(row: SlotRequestRecord): SlotRequestRow {
  const approved =
    row.approvedSlots != null
      ? String(row.approvedSlots)
      : row.status === "Approved"
        ? String(row.requestedSlots || "—")
        : "--"

  return {
    id: row.id,
    school: row.programName,
    availabilityName: row.availabilityName,
    experienceType: row.experienceType,
    requestedSlots: row.requestedSlots,
    pendingDuration: 0,
    requestedLocation: slotRequestRequestedLocation(row),
    programType: `${row.discipline} (${row.specialization})`,
    requestedShifts: row.shifts ?? "",
    requestedDaysOfWeek: row.daysOfWeek ?? "",
    requestedDate: row.requestedDate,
    requestedBy: row.createdBy ?? row.ciFacultyName ?? row.studentName ?? "",
    requestedDuration: formatIsoDurationRange(row.startDate, row.endDate),
    approvedInfo: approved,
    studentProfileShared: row.studentEmail ?? "",
    partnerCategory: resolveGoldPartnerCategory(row.programName, row.programCategory),
    status: mapSlotRequestStatus(row.status),
    scheduleDiscipline: slotRequestStudentDiscipline(row),
    scheduleSpecialization: row.specialization,
    scheduleStatusLabel: row.status,
    locationSite: slotRequestTreeLocation(row),
    locationDepartment: slotRequestTreeDepartment(row),
    timelineStartIso: row.startDate,
    timelineEndIso: row.endDate,
  }
}

export function mappleSlotRequestsToRows(records: SlotRequestRecord[]): SlotRequestRow[] {
  return records.map(mappleSlotRequestToSlotRequestRow)
}
