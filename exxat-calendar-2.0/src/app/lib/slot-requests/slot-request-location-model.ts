/**
 * Mapple slot-request workbook column semantics.
 *
 * Pick location and department directly from the XLSX columns:
 *   Location (Level 1)        → master row in "View by Location"
 *   Department/Unit (Level 2) → child rows under that location (expand dropdown)
 *   Department/Unit (Level 3) → optional unit detail (list labels only, not tree grouping)
 *
 * `Discipline` is the student program (Nursing, PT, …) — filters/KPIs only.
 */

import type { SlotRequestRecord } from "./types"

/** XLSX column: `Location (Level 1)` */
export function slotRequestTreeLocation(row: SlotRequestRecord): string {
  return row.location?.trim() ?? ""
}

/** XLSX column: `Department/Unit (Level 2)` */
export function slotRequestTreeDepartment(row: SlotRequestRecord): string {
  return row.department?.trim() ?? ""
}

/** XLSX column: `Department/Unit (Level 3)` — optional sub-unit. */
export function slotRequestClinicalUnit(row: SlotRequestRecord): string | null {
  const unit = row.unit?.trim()
  return unit || null
}

/** Department label with unit suffix when Level 3 is present (list/grid display). */
export function slotRequestDepartmentLabel(row: SlotRequestRecord): string {
  const department = slotRequestTreeDepartment(row)
  const unit = slotRequestClinicalUnit(row)
  return unit ? `${department} - ${unit}` : department
}

/** XLSX column: `Discipline` */
export function slotRequestStudentDiscipline(row: SlotRequestRecord): string {
  return row.discipline?.trim() ?? ""
}

/**
 * Encoded location string for scope parsing.
 * Location = token before `(`. Inner parens carry department (± unit) and optional group.
 */
export function slotRequestRequestedLocation(row: SlotRequestRecord): string {
  const site = slotRequestTreeLocation(row)
  const department = slotRequestDepartmentLabel(row)
  const group = row.locationGroup?.trim()
  if (group) return `${site} (${department} > ${group})`
  if (department) return `${site} (${department})`
  return row.locationLabel?.trim() || site
}
