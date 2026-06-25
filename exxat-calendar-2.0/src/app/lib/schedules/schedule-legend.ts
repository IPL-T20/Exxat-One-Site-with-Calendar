import type { Placement } from "../slot-requests-calendar/types"
import {
  getScheduleStripeSemantics,
  type ScheduleStripeScenario,
} from "./schedule-stripe-semantics"

export interface ScheduleLegendItem {
  id: ScheduleStripeScenario
  label: string
  placement: Pick<Placement, "status" | "partnerCategory">
}

/** Schedules calendar stripe legend — one row per canonical bar scenario. */
export const SCHEDULE_LEGEND_ITEMS: ScheduleLegendItem[] = [
  {
    id: "on_track",
    label: "Confirmed · on track",
    placement: { status: "Approved", partnerCategory: "Compliant" },
  },
  {
    id: "confirmed",
    label: "Confirmed · onboarding N/A",
    placement: { status: "Approved", partnerCategory: "Not Applicable" },
  },
  {
    id: "not_confirmed",
    label: "Not confirmed",
    placement: { status: "Review", partnerCategory: undefined },
  },
  {
    id: "to_schedule",
    label: "To be scheduled",
    placement: { status: "Request Pending", partnerCategory: undefined },
  },
  {
    id: "at_risk",
    label: "Not compliant / at risk",
    placement: { status: "Approved", partnerCategory: "Not Compliant" },
  },
  {
    id: "cancelled",
    label: "Cancelled",
    placement: { status: "Canceled", partnerCategory: undefined },
  },
]

export function scheduleLegendSwatchStyle(placement: Pick<Placement, "status" | "partnerCategory">) {
  const { surface, signal } = getScheduleStripeSemantics(placement)
  return {
    backgroundColor: surface.backgroundColor,
    border: surface.border,
    borderStyle: surface.borderStyle,
    opacity: surface.opacity,
    icon: signal.icon,
    iconClass: signal.iconClass,
  } as const
}
