export type SlotRequestStatus =
  | "Request Pending"
  | "Approved"
  | "Review In Progress"
  | "Declined"
  | "Canceled"

export type ExperienceType = "Group" | "Individual"

export interface SlotRequestRecord {
  id: string
  programName: string
  programCategory: string | null
  availabilityName: string
  availabilityId: string
  locationLabel: string
  location: string
  department: string
  unit: string | null
  locationGroup: string | null
  discipline: string
  specialization: string
  startDate: string
  endDate: string
  requestedSlots: number
  studentName: string | null
  studentEmail: string | null
  ciFacultyName: string | null
  ciFacultyEmail: string | null
  approvedSlots: number | null
  approvedSlotsWithStudents: number | null
  approvedSlotsWithoutStudents: number | null
  status: string
  approvedOn: string | null
  requestedDate: string
  experienceType: ExperienceType
  shifts: string | null
  daysOfWeek: string | null
  preceptor: string | null
  semester: string | null
  rotationNumber: string | null
  graduationMonth: string | null
  graduationYear: string | null
  createdBy: string | null
}

export interface SlotRequestsManifest {
  version: number
  source: string
  sourcePath?: string
  generatedAt: string
  slotRequestCount: number
  disciplines: string[]
  statuses: string[]
  sheets: Record<string, number>
}

export interface SlotRequestMonthBucketEntry {
  month: string
  requestId: string
  status: string
  startDate: string
}

export type SlotRequestsByMonth = Record<string, SlotRequestMonthBucketEntry[]>
