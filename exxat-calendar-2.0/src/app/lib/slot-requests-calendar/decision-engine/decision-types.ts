import type { SlotRequestRow, SlotStatus } from "../types"

/** Canonical competition severity for a request vs its footprint pool. */
export type CompetitionClass = "compatible" | "soft" | "hard" | "over"

/** Discipline-row / footprint pool utilization state. */
export type CapacityState = "open" | "tight" | "exhausted" | "overbooked"

/** Composite approval risk (capacity + time + competition density). */
export type ApprovalRisk = "low" | "medium" | "high" | "critical"

/** Queue lane for sort/display — derived, not stored on row. */
export type QueuePriority = "standard" | "elevated" | "high" | "waitlist"

export type ShiftBucket = "day12" | "day8" | "night12" | "evening8" | "custom" | "unknown"

export type WeekdayCode = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

/** Normalized schedule footprint — competition unit for capacity physics. */
export interface SchedulingFootprint {
  requestId: string
  /** Unit slug (locationId). */
  locationId: string
  locationName: string
  locationGroup: string
  facility: string
  discipline: string
  /** `${locationId}::${discipline}` */
  disciplineId: string
  programType: string
  school: string
  schoolShort: string
  dateStart: Date
  dateEnd: Date
  requestedDuration: string
  shiftRaw: string
  shiftBucket: ShiftBucket
  shiftLabel: string
  daysRaw: string
  /** Sorted weekday codes; empty = all days (daily). */
  weekdays: WeekdayCode[]
  /** Human label e.g. "Fri · Day 12h". */
  footprintLabel: string
  /** Stable merge/cluster key: unit + discipline + shift + weekday pattern. */
  footprintKey: string
  requestedSlots: number
  experienceType: SlotRequestRow["experienceType"]
  status: SlotStatus
  partnerCategory: string
  pendingDuration: number
  requestedDate: string
}

export interface CompetingSchoolSummary {
  school: string
  schoolShort: string
  requestIds: string[]
  slotDemand: number
  isGoldPartner: boolean
  dominantStatus: SlotStatus
}

/** Per-request decision output — primary UI consumption unit. */
export interface RequestDecisionSnapshot {
  requestId: string
  footprint: SchedulingFootprint
  /** True when partnerCategory or school matches Gold policy. */
  isGoldPartner: boolean
  isWaitlist: boolean
  isUrgent: boolean
  queueAgeDays: number
  queuePriority: QueuePriority
  /** 0–100; Gold/urgency/group size — does not override capacity math. */
  strategicPriority: number
  /** Sort key; higher = review first. Gold affects sort only. */
  priorityScore: number
  competitionClass: CompetitionClass
  capacityState: CapacityState
  approvalRisk: ApprovalRisk
  cap: number
  /** Peak approved slots on worst footprint day (same shift bucket). */
  peakApprovedSlots: number
  /** Peak if all active queue + approved counted on worst day. */
  peakDemandSlots: number
  /** Peak if this request were approved (pending/review only). */
  peakIfApproved: number
  /** Peak if every pending/review competitor in pool were approved. */
  peakIfAllPendingApproved: number
  /** cap − peakApprovedSlots (≥0 clamped). */
  remainingHeadroom: number
  /** cap − peakIfApproved (≥0 clamped; negative = over). */
  headroomAfterApproval: number
  /** Slots over cap on worst day if this request approved (<0 = none). */
  slotsOverCapIfApproved: number
  competingRequestIds: string[]
  competingSchools: CompetingSchoolSummary[]
  /** Σ slots (approved + pending/review) from competing requests on shared instances. */
  competingSlotDemand: number
  /** Σ pending/review competitor slots only. */
  competingQueueDemand: number
  /** Footprint-scoped competition group id. */
  competitionGroupId: string | null
  /** Days until placement start from calendar today (negative = started). */
  daysUntilStart: number
  /** Future peak risk if all pending in discipline row approve. */
  futureCapacityRisk: ApprovalRisk
}

/** Row-level rollup for discipline timeline sidebar. */
export interface DisciplineRowDecisionSnapshot {
  disciplineId: string
  locationId: string
  locationName: string
  discipline: string
  cap: number
  approvedSlots: number
  pendingCount: number
  reviewCount: number
  capacityState: CapacityState
  /** Worst peak demand across footprint pools in row. */
  forecastPeakSlots: number
  futureCapacityRisk: ApprovalRisk
  /** Worst competition class among active queue in row. */
  worstCompetitionClass: CompetitionClass
  goldPartnerQueueCount: number
}

/** Transitive group of requests sharing footprintKey + overlapping date range. */
export interface CompetitionGroupSnapshot {
  id: string
  footprintKey: string
  footprintLabel: string
  shiftBucket: ShiftBucket
  weekdays: WeekdayCode[]
  disciplineId: string
  locationId: string
  locationName: string
  discipline: string
  windowStart: Date
  windowEnd: Date
  requestIds: string[]
  cap: number
  approvedSlotDemand: number
  queueSlotDemand: number
  totalSlotDemand: number
  competingSchoolCount: number
  goldRequestCount: number
  worstCompetitionClass: CompetitionClass
  capacityState: CapacityState
  approvalRisk: ApprovalRisk
}

/** Canonical decision engine output — consumed by all Approval surfaces. */
export interface DecisionSnapshot {
  builtAt: Date
  calendarToday: Date
  byRequestId: Record<string, RequestDecisionSnapshot>
  byDisciplineId: Record<string, DisciplineRowDecisionSnapshot>
  competitionGroups: CompetitionGroupSnapshot[]
  /** Stable sort order for queue (ids descending priority). */
  queueOrder: string[]
}
