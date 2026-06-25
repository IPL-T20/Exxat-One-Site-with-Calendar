import { formatIsoDurationRange } from "./schedules-calendar-adapter"
import { mapOnboardingBucket } from "./aggregations"
import {
  formatScheduleListLocation,
  formatScheduleProgramType,
} from "./schedules-list"
import type { ExperienceType, OnboardingStatus, ScheduleRecord } from "./types"
import type { ScheduleBarRhythm } from "./schedule-bar-rhythm"
import { resolveScheduleBarRhythmFromRecord } from "./schedule-bar-rhythm"
import {
  scheduleDepartmentLabel,
  scheduleStudentDiscipline,
  scheduleTreeDepartment,
  scheduleTreeLocation,
} from "./schedule-location-model"

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const
const DAY_CHIP_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const

export type SlotMemberStatus =
  | "compliant"
  | "not_compliant"
  | "not_invited"
  | "action_needed"
  | "not_started"
  | "not_applicable"

export interface ScheduleSlotMember {
  id: string
  name: string
  role: "student" | "faculty"
  status: SlotMemberStatus
  email: string | null
  scheduleId: string | null
  actionable: boolean
}

export interface ScheduleDetailBundle {
  primary: ScheduleRecord
  related: ScheduleRecord[]
  experienceType: ExperienceType
  isGroup: boolean
  referenceLabel: string
  schoolTitle: string
  dateRange: string
  locationPrimary: string
  locationHierarchy: string
  programLabel: string
  shiftLabel: string | null
  activeDays: readonly boolean[]
  scheduleRhythm: ScheduleBarRhythm | null
  studentCount: number
  facultyCount: number
  unassignedStudentCount: number
  unassignedFacultyCount: number
  slotMembers: ScheduleSlotMember[]
  scheduleStatusLabel: string
  onboardingStatus: OnboardingStatus
  requirementsPending: number
  assignmentHeadline: string | null
  showScheduleStudentCta: boolean
}

export function groupFootprintKey(row: ScheduleRecord): string {
  return [
    row.school,
    row.startDate,
    row.endDate,
    row.location,
    row.department,
    row.unit ?? "",
    row.experienceType,
  ].join("|")
}

function scheduleStatusLabel(status: ScheduleRecord["scheduleStatus"]): string {
  switch (status) {
    case "Confirmed":
      return "Confirmed"
    case "Not Confirmed":
      return "Not confirmed"
    case "To be Scheduled":
      return "To be scheduled"
    case "Cancelled":
      return "Cancelled"
  }
}

function personToken(name: string | null | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return "Schedule"
  const parts = trimmed.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? parts[0] : trimmed
}

export function buildScheduleReferenceLabel(row: ScheduleRecord): string {
  const tail = row.id.replace(/\D/g, "").slice(-4) || row.id.slice(-4)
  const start = new Date(`${row.startDate}T12:00:00`)
  const dayMonth = `${start.getDate()}${MONTH_SHORT[start.getMonth()]}`
  const who =
    row.experienceType === "Group"
      ? personToken(row.preceptorName) || personToken(scheduleTreeLocation(row))
      : personToken(row.studentName)
  return `R${tail} - ${dayMonth} - ${who} ${row.experienceType}`
}

export function parseActiveDaysOfWeek(raw: string | null | undefined): readonly boolean[] {
  const tokens = new Set(
    (raw ?? "")
      .split(",")
      .map((t) => t.trim().slice(0, 3).toUpperCase())
      .filter(Boolean),
  )
  return DAY_ORDER.map((day) => tokens.has(day))
}

function slotMemberStatus(row: ScheduleRecord, role: "student" | "faculty"): SlotMemberStatus {
  const named =
    role === "student" ? Boolean(row.studentName?.trim()) : Boolean(row.preceptorName?.trim())

  if (!named) return "not_invited"
  if (row.onboardingStatus === "Not Applicable") return "not_applicable"
  if (row.onboardingStatus === "Not Compliant") return "not_compliant"
  if (row.onboardingStatus === "Compliant") return "compliant"

  const bucket = mapOnboardingBucket(row)
  if (bucket === "actionNeeded") return "action_needed"
  if (bucket === "notStarted") return "not_started"
  if (row.requirements.pending > 0 || row.requirements.notApproved > 0) return "action_needed"
  return "not_started"
}

function buildStudentMembers(rows: ScheduleRecord[]): ScheduleSlotMember[] {
  return rows.map((row) => {
    const named = Boolean(row.studentName?.trim())
    const status = slotMemberStatus(row, "student")
    return {
      id: `student-${row.id}`,
      name: named ? row.studentName!.trim() : "Student to be assigned",
      role: "student",
      status,
      email: row.studentEmail,
      scheduleId: row.id,
      actionable: status === "action_needed" || status === "not_started" || !named,
    }
  })
}

function buildFacultyMembers(rows: ScheduleRecord[]): ScheduleSlotMember[] {
  const seen = new Set<string>()
  const members: ScheduleSlotMember[] = []

  for (const row of rows) {
    const name = row.preceptorName?.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const status = slotMemberStatus(row, "faculty")
    members.push({
      id: `faculty-${key}`,
      name,
      role: "faculty",
      status,
      email: row.preceptorEmail,
      scheduleId: row.id,
      actionable: status === "action_needed" || status === "not_started",
    })
  }

  return members
}

function expandRelatedRecords(
  primary: ScheduleRecord,
  allRows: ScheduleRecord[],
  selectedIds: string[],
): ScheduleRecord[] {
  const selected = new Set(selectedIds.length > 0 ? selectedIds : [primary.id])
  const selectedRows = allRows.filter((row) => selected.has(row.id))
  const seed = selectedRows.length > 0 ? selectedRows : [primary]

  if (primary.experienceType !== "Group") {
    return [primary]
  }

  const footprintKeys = new Set(seed.map(groupFootprintKey))
  const siblings = allRows.filter(
    (row) =>
      row.experienceType === "Group" &&
      footprintKeys.has(groupFootprintKey(row)),
  )

  const byId = new Map<string, ScheduleRecord>()
  for (const row of [...seed, ...siblings]) {
    byId.set(row.id, row)
  }
  return [...byId.values()].sort((a, b) =>
    (a.studentName ?? "").localeCompare(b.studentName ?? ""),
  )
}

export function resolveScheduleDetailBundle(
  selectedIds: string[],
  allRows: ScheduleRecord[],
): ScheduleDetailBundle | null {
  const primaryId = selectedIds[0]
  if (!primaryId) return null

  const primary = allRows.find((row) => row.id === primaryId)
  if (!primary) return null

  const related = expandRelatedRecords(primary, allRows, selectedIds)
  const isGroup = primary.experienceType === "Group"
  const studentRows = related
  const studentCount = studentRows.length
  const unassignedStudentCount = studentRows.filter((row) => !row.studentName?.trim()).length
  const facultyMembers = buildFacultyMembers(related)
  const facultyCount = facultyMembers.length
  const unassignedFacultyCount = isGroup && facultyCount === 0 ? 1 : 0

  const studentMembers = buildStudentMembers(studentRows)
  let slotMembers: ScheduleSlotMember[] = isGroup
    ? [...studentMembers, ...facultyMembers]
    : studentMembers.length > 0
      ? studentMembers
      : [
          {
            id: `student-${primary.id}`,
            name: primary.studentName?.trim() || "Student to be assigned",
            role: "student" as const,
            status: slotMemberStatus(primary, "student"),
            email: primary.studentEmail,
            scheduleId: primary.id,
            actionable:
              !primary.studentName?.trim() || slotMemberStatus(primary, "student") !== "compliant",
          },
        ]

  if (isGroup && facultyMembers.length === 0) {
    slotMembers = [
      ...slotMembers,
      {
        id: `faculty-open-${primary.id}`,
        name: "Clinical instructor to be assigned",
        role: "faculty",
        status: "not_invited",
        email: null,
        scheduleId: null,
        actionable: true,
      },
    ]
  }

  const displayFacultyCount = slotMembers.filter((m) => m.role === "faculty").length

  const requirementsPending = related.reduce(
    (sum, row) => sum + row.requirements.pending + row.requirements.notApproved,
    0,
  )

  const department = scheduleDepartmentLabel(primary)
  const site = scheduleTreeLocation(primary)
  const treeDept = scheduleTreeDepartment(primary)

  let assignmentHeadline: string | null = null
  if (!isGroup) {
    assignmentHeadline = primary.studentName?.trim()
      ? primary.studentName.trim()
      : "Student to be assigned"
  }

  return {
    primary,
    related,
    experienceType: primary.experienceType,
    isGroup,
    referenceLabel: buildScheduleReferenceLabel(primary),
    schoolTitle: primary.school,
    dateRange: formatIsoDurationRange(primary.startDate, primary.endDate),
    locationPrimary: department || site,
    locationHierarchy:
      department && site
        ? `${department} (${site} > ${treeDept})`
        : formatScheduleListLocation(primary),
    programLabel: formatScheduleProgramType(primary),
    shiftLabel: primary.shift?.trim() || null,
    activeDays: parseActiveDaysOfWeek(primary.daysOfWeek),
    scheduleRhythm: resolveScheduleBarRhythmFromRecord(primary),
    studentCount,
    facultyCount: displayFacultyCount,
    unassignedStudentCount,
    unassignedFacultyCount,
    slotMembers,
    scheduleStatusLabel: scheduleStatusLabel(primary.scheduleStatus),
    onboardingStatus: primary.onboardingStatus,
    requirementsPending,
    assignmentHeadline,
    showScheduleStudentCta: unassignedStudentCount > 0 || (!isGroup && !primary.studentName?.trim()),
  }
}

export const SLOT_MEMBER_STATUS_LABEL: Record<SlotMemberStatus, string> = {
  compliant: "Compliant",
  not_compliant: "Non-Compliant",
  not_invited: "Not Invited",
  action_needed: "Some Action Needed",
  not_started: "Not Started",
  not_applicable: "Not Applicable",
}

export const SLOT_MEMBER_STATUS_STYLES: Record<SlotMemberStatus, string> = {
  compliant: "bg-emerald-500 text-white border-emerald-600",
  not_compliant: "bg-red-100 text-red-800 border-red-200",
  not_invited: "bg-rose-100 text-rose-800 border-rose-200",
  action_needed: "bg-amber-100 text-amber-900 border-amber-200",
  not_started: "bg-muted text-muted-foreground border-border",
  not_applicable: "bg-muted text-muted-foreground border-border",
}

export function groupRosterSummary(bundle: ScheduleDetailBundle): string {
  const students = `${bundle.studentCount} Student${bundle.studentCount === 1 ? "" : "s"}`
  const faculty = `${bundle.facultyCount} Faculty`
  return `${students} | ${faculty}`
}

export function studentDisciplineLine(row: ScheduleRecord): string {
  return scheduleStudentDiscipline(row)
}
