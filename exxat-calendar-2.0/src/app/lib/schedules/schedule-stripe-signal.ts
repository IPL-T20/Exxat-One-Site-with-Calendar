import type { Placement } from "../slot-requests-calendar/types"
import {
  getScheduleClusterStripeSemantics,
  getScheduleStripeSemantics,
  type ScheduleStripeSignal,
  type ScheduleStripeSignalIcon,
} from "./schedule-stripe-semantics"

export type { ScheduleStripeSignal, ScheduleStripeSignalIcon } from "./schedule-stripe-semantics"

type StripePlacement = Pick<Placement, "status" | "partnerCategory">

export function scheduleStripeSignal(placement: StripePlacement): ScheduleStripeSignal {
  return getScheduleStripeSemantics(placement).signal
}

export function scheduleClusterStripeSignal(placements: StripePlacement[]): ScheduleStripeSignal {
  return getScheduleClusterStripeSemantics(placements).signal
}

/** Non-color cue for screen readers — border style + accent rail (WCAG 1.4.1). */
export function scheduleStripePatternLabel(placement: StripePlacement): string | null {
  return getScheduleStripeSemantics(placement).patternLabel
}

export function scheduleClusterPatternLabel(placements: StripePlacement[]): string | null {
  return getScheduleClusterStripeSemantics(placements).patternLabel
}
