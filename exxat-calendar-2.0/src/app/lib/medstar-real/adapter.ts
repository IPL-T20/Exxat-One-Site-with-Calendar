import type { SlotRequestRow, SlotStatus } from "../slot-requests-calendar/types"
import type { MedStarScenario, MedStarScenarioRecord } from "./types"

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

function mapStatus(apiStatus: string): SlotStatus {
  switch (apiStatus) {
    case "In-Progress":
      return "Review"
    case "Approved":
      return "Approved"
    case "Rejected":
      return "Declined"
    case "Revoked":
      return "Canceled"
    case "Draft":
      return "Request Pending"
    default:
      return "Review"
  }
}

function formatIsoDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—"
  const s = new Date(start)
  const e = new Date(end)
  return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}–${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`
}

function formatShift(name: string | null, duration: string | null): string {
  if (!name) return "—"
  const dur = duration?.replace(/\s/g, "") ?? ""
  return dur ? `${name}(${dur})` : name
}

function locationLabel(scenario: MedStarScenario): string {
  const unit = scenario.location ?? "Medical Surgical"
  const hospital = scenario.hospital ?? "MedStar Health"
  return `${unit} (${hospital} > ${unit})`
}

export function medStarRecordToRow(
  record: MedStarScenarioRecord,
  scenario: MedStarScenario,
): SlotRequestRow {
  const approved =
    record.approvedSlots != null
      ? String(record.approvedSlots)
      : record.status === "Approved"
        ? String(record.requestedSlots ?? "—")
        : "--"

  return {
    id: String(record.id),
    school: record.school.trim(),
    availabilityName: record.availName ?? "—",
    experienceType: "Group",
    requestedSlots: record.requestedSlots ?? 0,
    pendingDuration: record.reqPendingDuration ?? 0,
    requestedLocation: locationLabel(scenario),
    programType: "Pre-Licensure (Nursing)",
    requestedShifts: formatShift(scenario.shiftName, scenario.shiftDuration),
    requestedDaysOfWeek: "",
    requestedDate: formatIsoDate(record.startDate),
    requestedBy: "School",
    requestedDuration: formatDuration(record.startDate, record.endDate),
    approvedInfo: approved,
    studentProfileShared: "",
    partnerCategory: "",
    status: mapStatus(record.status),
  }
}

export function medStarScenarioToRows(scenario: MedStarScenario): SlotRequestRow[] {
  return scenario.records.map((r) => medStarRecordToRow(r, scenario))
}

export function isActiveMedStarRow(row: SlotRequestRow): boolean {
  return row.status === "Review" || row.status === "Request Pending"
}

export function formatScenarioDateSpan(scenario: MedStarScenario): string {
  if (!scenario.earliestStart || !scenario.latestEnd) return "—"
  const s = new Date(scenario.earliestStart)
  const e = new Date(scenario.latestEnd)
  return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()} – ${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`
}

export function pressureBandLabel(band: string): string {
  const map: Record<string, string> = {
    low: "Low pressure",
    moderate: "Moderate pressure",
    dense: "High pressure",
    extreme: "Extreme pressure",
  }
  return map[band] ?? "Extreme pressure"
}
