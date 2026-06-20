export type {
  ApprovalRisk,
  CapacityState,
  CompetitionClass,
  CompetitionGroupSnapshot,
  CompetingSchoolSummary,
  DecisionSnapshot,
  DisciplineRowDecisionSnapshot,
  QueuePriority,
  RequestDecisionSnapshot,
  SchedulingFootprint,
  ShiftBucket,
  WeekdayCode,
} from "./decision-types"

export {
  buildDecisionSnapshot,
  getCompetitionGroup,
  getDisciplineDecision,
  getRequestDecision,
} from "./build-decision-snapshot"

export {
  buildCompetitionGroupMembers,
  competitionGroupId,
  findCompetitors,
  requestsTrulyCompete,
  sharedCompetitionDates,
} from "./footprint-competition"

export {
  computePeakLoadForFootprint,
  deriveApprovalRisk,
  deriveCapacityState,
  deriveCompetitionClass,
  deriveFutureCapacityRisk,
  getCapForFootprint,
  headroomAfterApproval,
  remainingHeadroom,
  slotsOverCapIfApproved,
} from "./footprint-capacity"

export {
  ACTIVE_STATUSES,
  QUEUE_STATUSES,
  compareQueuePriority,
  sortClusterRequestRows,
  computePriorityScore,
  computeStrategicPriority,
  goldTieBreak,
  isGoldPartner,
  isUrgentRequest,
  isWaitlistRow,
} from "./gold-partner-policy"

export {
  buildFootprintKey,
  buildFootprintLabel,
  buildPlacementFootprintMeta,
  buildSchedulingFootprint,
  dateRangesOverlap,
  disciplineNodeId,
  footprintActiveDates,
  footprintCoversDate,
  normalizeShiftBucket,
  parseWeekdays,
  extractShiftTimeWindow,
  shiftLabel,
  weekdaysIntersect,
  weekdaysLabel,
} from "./schedule-footprint"

export { computeQueueAgeDays, formatSlotRequestDate, requestedDateDaysAgo } from "../queue-age"

export { runDecisionEngineExamples } from "./decision-examples"
