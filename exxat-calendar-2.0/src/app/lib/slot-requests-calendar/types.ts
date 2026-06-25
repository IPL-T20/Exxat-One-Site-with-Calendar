export type SlotStatus =
  | "Request Pending"
  | "Approved"
  | "Review"
  | "Declined"
  | "Canceled"

/** Approval = slot-request queue; Operations = confirmed schedule lens. */
export type CalendarMode = "approval" | "operations"

export type CalendarZoom = "day" | "week" | "month" | "year"
/** Compact scope popover dimension ids. */
export type ScopeDimension =
  | "location"
  | "discipline"
  | "program"
  | "school"
  | "status"
  | "locationGroup"

/** Empty set on a dimension = no filter (all values). */
export interface CalendarScope {
  locations: Set<string>
  disciplines: Set<string>
  programs: Set<string>
  schools: Set<string>
  statuses: Set<string>
  locationGroups: Set<string>
}

export function emptyScope(): CalendarScope {
  return {
    locations: new Set(),
    disciplines: new Set(),
    programs: new Set(),
    schools: new Set(),
    statuses: new Set(),
    locationGroups: new Set(),
  }
}

export function scopeIsEmpty(scope: CalendarScope): boolean {
  return (
    scope.locations.size === 0 &&
    scope.disciplines.size === 0 &&
    scope.programs.size === 0 &&
    scope.schools.size === 0 &&
    scope.statuses.size === 0 &&
    scope.locationGroups.size === 0
  )
}

export type CapacityHealth = "healthy" | "warning" | "critical"

export type PlacementEmphasis = "primary" | "secondary" | "muted"

export interface SlotRequestRow {
  id: string
  school: string
  availabilityName: string
  experienceType: "Group" | "Individual"
  requestedSlots: number
  pendingDuration: number
  requestedLocation: string
  programType: string
  requestedShifts: string
  requestedDaysOfWeek: string
  requestedDate: string
  requestedBy: string
  requestedDuration: string
  approvedInfo: string
  studentProfileShared: string
  partnerCategory: string
  status: SlotStatus
  /** Mapple schedule XLSX — `Discipline` column (schedules scope only). */
  scheduleDiscipline?: string
  /** Mapple schedule XLSX — `Specialization` column (schedules scope only). */
  scheduleSpecialization?: string
  /** Mapple schedule XLSX — `Schedule Status` column (schedules scope only). */
  scheduleStatusLabel?: string
  /** Mapple slot-request XLSX — `Location (Level 1)` (calendar tree parent). */
  locationSite?: string
  /** Mapple slot-request XLSX — `Department/Unit (Level 2)` (calendar tree child). */
  locationDepartment?: string
  /** ISO start date — preferred for timeline placement when present. */
  timelineStartIso?: string
  /** ISO end date — preferred for timeline placement when present. */
  timelineEndIso?: string
}

/** Timeline bar provenance — slot request vs confirmed schedule record. */
export type TimelineRecordKind = "slot-request" | "schedule"

export interface Placement {
  id: string
  locationId: string
  locationName: string
  locationGroup: string
  discipline: string
  school: string
  schoolShort: string
  availabilityName: string
  experienceType: "Group" | "Individual"
  requestedSlots: number
  pendingDuration: number
  status: SlotStatus
  requestedDuration: string
  requestedShifts: string
  requestedDaysOfWeek: string
  programType?: string
  partnerCategory?: string
  start: Date | null
  end: Date | null
  /** Present on schedule-derived timeline bars in Operations mode. */
  timelineKind?: TimelineRecordKind
  /** Canonical slot-request id (equals `id` for request bars). */
  slotRequestId?: string
  scheduleId?: string | null
  availabilityId?: string
  /** Schedules bar rhythm — month-day hex rail. */
  scheduleMonthDays?: number[] | null
  /** Schedules bar rhythm — block segment ranges (ISO dates). */
  scheduleBlocks?: { startDate: string; endDate: string }[] | null
  scheduleRhythmKind?: "weekday" | "month_day" | "block" | null
}

/** Site-published availability window linked to one or more slot requests. */
export interface AvailabilityRecord {
  id: string
  availabilityName: string
  locationId: string
  locationName: string
  facility: string
  locationGroup: string
  programType: string
  discipline: string
  experienceType: "Group" | "Individual"
  slotRequestIds: string[]
}

/** Location-level capacity profile for utilization modeling. */
export interface LocationCapacityRecord {
  locationId: string
  locationName: string
  locationGroup: string
  totalSlots: number
  disciplineCaps: Record<string, number>
  source: "catalog" | "derived"
}

export type ScheduleLifecycleStatus = "Scheduled" | "Active" | "Completed"

/** Confirmed placement schedule — primary Operations timeline object. */
export interface ScheduleRecord {
  id: string
  slotRequestId: string
  availabilityId: string
  locationId: string
  disciplineId: string
  discipline: string
  school: string
  slots: number
  start: Date
  end: Date
  status: ScheduleLifecycleStatus
  shiftPattern: string
  daysOfWeek: string
}

/** Placement entity linking a slot request to optional schedule + availability. */
export interface PlacementRecord {
  id: string
  slotRequestId: string
  scheduleId: string | null
  availabilityId: string
  locationId: string
  discipline: string
  status: SlotStatus
  slots: number
  start: Date | null
  end: Date | null
}

/** Point-in-time utilization snapshot (derived at build time). */
export interface UtilizationSnapshot {
  locationId: string
  disciplineId: string
  approvedSlots: number
  capacity: number
  utilizationPct: number
}

export interface DisciplineNode {
  id: string
  name: string
  locationId: string
  capacity: number
  placements: Placement[]
  approvedSlots: number
  pendingCount: number
  reviewCount: number
  placementCount: number
}

export interface LocationNode {
  id: string
  name: string
  locationGroup: string
  capacity: number
  disciplines: DisciplineNode[]
  approvedSlots: number
  pendingCount: number
  reviewCount: number
  utilizationPct: number
  health: CapacityHealth
  placementCount: number
  earliest: Date | null
  latest: Date | null
}

export interface ConflictInterval {
  id: string
  locationId: string
  disciplineId: string
  start: Date
  end: Date
  kind: "capacity" | "overlap" | "forecast"
  placementIds: string[]
  slotsOver: number
}

/** Alias — conflicts are materialized from capacity/overlap detection. */
export type ConflictRecord = ConflictInterval

export interface CalendarLayers {
  capacity: boolean
  conflicts: boolean
  declined: boolean
  /** Show discipline rows with zero visible requests (registry placeholders). */
  showEmptyDisciplines: boolean
  /** When true, timeline shows only slot requests from gold partner schools. */
  goldPartnersOnly: boolean
  /** Clip stripes to the toolbar navigator period (day / week / month / year). */
  focusPeriod: boolean
}
