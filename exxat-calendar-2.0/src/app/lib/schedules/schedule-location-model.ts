import type { ScheduleRecord } from "./types"

/**
 * Mapple schedule workbook column semantics.
 *
 * Calendar left anchor (no UI change — uses `Placement.locationName` + `Placement.discipline`):
 *   Location  →  parent row  (XLSX `Location` column — facility / site)
 *   Department → child row   (XLSX `Department` column)
 *
 * Other XLSX columns:
 *   Unit         — sub-unit detail (appended to department in list labels when present)
 *   Location Group — grouping metadata under the facility
 *   Discipline   — student program discipline (Nursing, PT, …); scope + list filters only
 */

/** XLSX `Location` — facility / site; calendar tree parent row. */
export function scheduleTreeLocation(row: ScheduleRecord): string {
  return row.location?.trim() ?? ""
}

/** XLSX `Department` — calendar tree child row (stored on `Placement.discipline`). */
export function scheduleTreeDepartment(row: ScheduleRecord): string {
  return row.department?.trim() ?? ""
}

/** XLSX `Unit` — optional sub-unit within the department. */
export function scheduleClinicalUnit(row: ScheduleRecord): string | null {
  const unit = row.unit?.trim()
  return unit || null
}

/** Department label with unit suffix when the workbook provides one. */
export function scheduleDepartmentLabel(row: ScheduleRecord): string {
  const department = scheduleTreeDepartment(row)
  const unit = scheduleClinicalUnit(row)
  return unit ? `${department} - ${unit}` : department
}

/** XLSX `Discipline` — student clinical discipline (not the calendar tree child). */
export function scheduleStudentDiscipline(row: ScheduleRecord): string {
  return row.discipline?.trim() ?? ""
}

/** @deprecated Use `scheduleTreeLocation`. */
export function scheduleSiteName(row: ScheduleRecord): string {
  return scheduleTreeLocation(row)
}

/** @deprecated Use `scheduleTreeDepartment`. */
export function scheduleClinicalDepartment(row: ScheduleRecord): string {
  return scheduleTreeDepartment(row)
}

/** @deprecated Use `scheduleStudentDiscipline`. */
export function scheduleDisciplineName(row: ScheduleRecord): string {
  return scheduleStudentDiscipline(row)
}

/**
 * Encoded location string for slot-request compatibility + scope parsing.
 * Site name is the token before `(` — parsed as scope Location.
 * Inner parens carry department (± unit) and optional location group.
 */
export function scheduleRequestedLocation(row: ScheduleRecord): string {
  const site = scheduleTreeLocation(row)
  const department = scheduleDepartmentLabel(row)
  const group = row.locationGroup?.trim()
  if (group) return `${site} (${department} > ${group})`
  if (department) return `${site} (${department})`
  return site
}

/** Schedules list grid — `{location} > {department}` (+ unit / group when present). */
export function formatScheduleListLocation(row: ScheduleRecord): string {
  const site = scheduleTreeLocation(row)
  const department = scheduleDepartmentLabel(row)
  const group = row.locationGroup?.trim()
  if (group) return `${site} > ${department} | ${group}`
  return `${site} > ${department}`
}

/** Activity / summary lines — same Location > Department shape. */
export function formatScheduleLocationDepartment(row: ScheduleRecord): string {
  return formatScheduleListLocation(row)
}
