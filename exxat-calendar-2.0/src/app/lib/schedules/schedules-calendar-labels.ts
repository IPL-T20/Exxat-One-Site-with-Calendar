import { schoolShortName } from "../slot-requests-calendar/parse"
import type { ScheduleRecord } from "./types"

export function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase()
  }
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase()
}

export function scheduleDisplayName(row: ScheduleRecord): string {
  if (row.experienceType === "Group") {
    if (row.preceptorName?.trim()) return row.preceptorName.trim()
    return `Group · ${schoolShortName(row.school)}`
  }
  if (row.studentName?.trim()) return row.studentName.trim()
  return "Schedule student"
}

export function scheduleLeafInitials(row: ScheduleRecord): string {
  if (row.experienceType === "Group") {
    if (row.preceptorName?.trim()) return personInitials(row.preceptorName)
    return "GR"
  }
  if (row.studentName?.trim()) return personInitials(row.studentName)
  return "?"
}

function formatShift(shift: string | null): string | null {
  const value = shift?.trim()
  if (!value || value === "—") return null
  return value.split(",")[0]?.trim() ?? null
}

export function scheduleLeafSubtitle(row: ScheduleRecord): string {
  const parts = [schoolShortName(row.school)]
  const shift = formatShift(row.shift)
  if (shift) parts.push(shift)
  return parts.join(" · ")
}

export function scheduleAllViewContext(row: ScheduleRecord): string {
  const site = row.location?.trim() ?? ""
  const dept = row.department?.trim() ?? ""
  if (site && dept) return `${site} › ${dept}`
  return site || dept
}
