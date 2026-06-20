import type { SlotRequestRow, SlotStatus } from "../slot-requests-calendar/types"
import type { MedStarRequest } from "./types"

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

export function mapMedStarStatus(apiStatus: string): SlotStatus {
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

function formatShifts(shiftName: string | null, shiftDuration: string | null): string {
  if (!shiftName) return "—"
  const dur = shiftDuration?.replace(/\s/g, "") ?? ""
  return dur ? `${shiftName}(${dur})` : shiftName
}

function formatLocation(location: string | null, locationPath: string | null): string {
  const unit = location?.trim() || "General"
  const path = locationPath?.trim()
  if (!path) return unit
  return `${unit} (${path})`
}

function deriveProgramType(req: MedStarRequest): string {
  const path = req.locationPath?.toLowerCase() ?? ""
  if (path.includes("nursing") || req.school.toLowerCase().includes("nursing")) {
    return "Pre-Licensure (Nursing)"
  }
  if (req.experienceType === "Individual") return "Individual Placement"
  return "Pre-Licensure (Nursing)"
}

export function medStarRequestToRow(req: MedStarRequest): SlotRequestRow {
  const approved =
    req.approvedSlots != null
      ? String(req.approvedSlots)
      : req.status === "Approved"
        ? String(req.requestedSlots ?? "—")
        : "--"

  const experienceType =
    req.experienceType === "Individual" ? "Individual" : "Group"

  return {
    id: String(req.id),
    school: req.school.trim(),
    availabilityName: req.availName ?? "—",
    experienceType,
    requestedSlots: req.requestedSlots ?? 0,
    pendingDuration: req.reqPendingDuration ?? 0,
    requestedLocation: formatLocation(req.location, req.locationPath),
    programType: deriveProgramType(req),
    requestedShifts: formatShifts(req.shiftName, req.shiftDuration),
    requestedDaysOfWeek: "",
    requestedDate: formatIsoDate(req.startDate),
    requestedBy: req.actionBy ?? "—",
    requestedDuration: formatDuration(req.startDate, req.endDate),
    approvedInfo: approved,
    studentProfileShared: "",
    partnerCategory: "",
    status: mapMedStarStatus(req.status),
  }
}

export function medStarRequestsToRows(requests: readonly MedStarRequest[]): SlotRequestRow[] {
  return requests.map(medStarRequestToRow)
}
