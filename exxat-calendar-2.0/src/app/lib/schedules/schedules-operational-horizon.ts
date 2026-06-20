/**
 * Operational reality for site schedules (Mapple / One — Sites).
 *
 * Processes finish ~3–4 weeks ahead; for today through +14 days, ~98% of
 * intersecting schedules are operationally on-track (Confirmed + Compliant,
 * or Confirmed + Not Applicable). Calendar stripes treat that as green —
 * exceptions are rare and intentional.
 */
export const SCHEDULES_OPERATIONAL_HORIZON_DAYS = 14

/** Target share of near-term schedules that render as on-track (green stripe). */
export const SCHEDULES_NEAR_TERM_ON_TRACK_TARGET = 0.98

/** Reserved exception rate inside the operational horizon (At risk lens demo). */
export const SCHEDULES_NEAR_TERM_EXCEPTION_RATE = 1 - SCHEDULES_NEAR_TERM_ON_TRACK_TARGET

/** @deprecated Use SCHEDULES_NEAR_TERM_ON_TRACK_TARGET */
export const SCHEDULES_NEAR_TERM_GREEN_TARGET = SCHEDULES_NEAR_TERM_ON_TRACK_TARGET
