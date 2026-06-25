import type { Placement } from "../slot-requests-calendar/types"
import {
  getScheduleClusterStripeSemantics,
  getScheduleStripeSemantics,
  type ScheduleStripeSurface,
} from "./schedule-stripe-semantics"

export type { ScheduleStripeSurface } from "./schedule-stripe-semantics"

type StripePlacement = Pick<Placement, "status" | "partnerCategory">

export function scheduleStripeSurface(placement: StripePlacement): ScheduleStripeSurface {
  return getScheduleStripeSemantics(placement).surface
}

export function scheduleClusterStripeSurface(placements: StripePlacement[]): ScheduleStripeSurface {
  return getScheduleClusterStripeSemantics(placements).surface
}
