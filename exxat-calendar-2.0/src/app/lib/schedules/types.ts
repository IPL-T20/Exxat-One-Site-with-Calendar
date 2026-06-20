export type ScheduleStatus =
  | "Confirmed"
  | "To be Scheduled"
  | "Not Confirmed"
  | "Cancelled"

export type OnboardingStatus = "Compliant" | "Not Applicable" | "Not Compliant"

export type ExperienceType = "Group" | "Individual"

export interface ScheduleRequirements {
  total: number
  pending: number
  notApproved: number
  approved: number
  names: string[]
}

export interface ScheduleRecord {
  id: string
  studentName: string | null
  studentEmail: string | null
  school: string
  /** XLSX `Discipline` — student program discipline (scope + list filters; not the tree child). */
  discipline: string
  specialization: string
  experienceType: ExperienceType
  /** XLSX `Location` — facility; calendar tree parent row. */
  location: string
  /** XLSX `Department` — calendar tree child row. */
  department: string
  /** XLSX `Unit` — optional sub-unit; combined with `department` for the sidebar anchor. */
  unit: string | null
  locationGroup: string | null
  startDate: string
  endDate: string
  shift: string | null
  daysOfWeek: string | null
  hours: number | null
  preceptorName: string | null
  preceptorEmail: string | null
  scheduleStatus: ScheduleStatus
  onboardingStatus: OnboardingStatus
  requirements: ScheduleRequirements
  flaggedForHire: boolean
  flaggedForHireCount: number
  flaggedBy: string | null
  hiringRemarks: string | null
}

export interface SchedulesManifest {
  version: number
  source: string
  sourcePath?: string
  generatedAt: string
  scheduleCount: number
  disciplines: string[]
  referenceDate: string
  sheets: Record<string, number>
}

export interface MonthBucketEntry {
  month: string
  scheduleId: string
  scheduleStatus: ScheduleStatus
  onboardingStatus: OnboardingStatus
  startDate: string
}

export type SchedulesByMonth = Record<string, MonthBucketEntry[]>

export interface ScheduleActivity {
  id: string
  description: string
  discipline: string | null
  /** `Location > Department` label for activity feed. */
  location: string
  scheduleStatus: ScheduleStatus
}

export interface KpiCardData {
  count: number
  schoolCount: number
}

export interface ScheduleStatusSlice {
  name: string
  value: number
  key: ScheduleStatus | "onboarding"
}

export interface OnboardingSlice {
  name: string
  value: number
  key: "compliant" | "actionNeeded" | "notStarted"
}

export interface MonthBarPoint {
  month: string
  label: string
  approved: number
  confirmed: number
  compliant: number
}
