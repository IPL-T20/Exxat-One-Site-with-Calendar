import type { FontAwesomeIconName } from "../../components/font-awesome-icon"
import type { Placement } from "../slot-requests-calendar/types"

/** Canonical schedule-bar scenarios — every placement resolves to exactly one. */
export type ScheduleStripeScenario =
  | "on_track"
  | "confirmed"
  | "at_risk"
  | "not_confirmed"
  | "to_schedule"
  | "cancelled"

export interface ScheduleStripeSurface {
  backgroundColor: string
  border: string
  color: string
  borderStyle: "solid" | "dashed"
  opacity?: number
}

export type ScheduleStripeSignalIcon = FontAwesomeIconName

export interface ScheduleStripeSignal {
  icon: ScheduleStripeSignalIcon
  shortLabel: string
  iconClass: string
  secondaryClass: string
}

export interface ScheduleStripeSemantics {
  scenario: ScheduleStripeScenario
  surface: ScheduleStripeSurface
  signal: ScheduleStripeSignal
  patternLabel: string | null
}

type StripePlacement = Pick<Placement, "status" | "partnerCategory">

const CHART_3 = "var(--chart-3, #2563eb)"
const CHART_4 = "var(--chart-4, #d97706)"

/** Energetic on-track green — distinct from pale confirmed tint. */
const ON_TRACK_FILL = "oklch(0.50 0.17 145)"
const ON_TRACK_BORDER = "oklch(0.40 0.14 145)"

function darkerOutline(hue: string, amount = "65%"): string {
  return `color-mix(in oklch, ${hue} ${amount}, black)`
}

/** Severity for cluster merge — higher wins. */
export const SCHEDULE_STRIPE_SCENARIO_RANK: Record<ScheduleStripeScenario, number> = {
  cancelled: 0,
  on_track: 1,
  confirmed: 2,
  to_schedule: 3,
  not_confirmed: 4,
  at_risk: 5,
}

export function resolveScheduleStripeScenario(placement: StripePlacement): ScheduleStripeScenario {
  switch (placement.status) {
    case "Canceled":
      return "cancelled"
    case "Request Pending":
      return "to_schedule"
    case "Review":
      return "not_confirmed"
    case "Approved":
      if (placement.partnerCategory === "Not Compliant") return "at_risk"
      if (placement.partnerCategory === "Not Applicable") return "confirmed"
      return "on_track"
    default:
      return "to_schedule"
  }
}

const SEMANTICS: Record<ScheduleStripeScenario, Omit<ScheduleStripeSemantics, "scenario">> = {
  on_track: {
    surface: {
      backgroundColor: ON_TRACK_FILL,
      border: `1px solid ${ON_TRACK_BORDER}`,
      color: "#fff",
      borderStyle: "solid",
    },
    signal: {
      icon: "circleCheck",
      shortLabel: "On track",
      iconClass: "text-white/95",
      secondaryClass: "text-emerald-50/90",
    },
    patternLabel: "solid bar",
  },
  confirmed: {
    surface: {
      backgroundColor: `color-mix(in oklch, ${ON_TRACK_FILL} 14%, var(--card))`,
      border: `1px solid color-mix(in oklch, ${ON_TRACK_FILL} 52%, black)`,
      color: `color-mix(in oklch, ${ON_TRACK_FILL} 38%, var(--foreground))`,
      borderStyle: "solid",
    },
    signal: {
      icon: "circleCheck",
      shortLabel: "Confirmed",
      iconClass: "text-emerald-700 dark:text-emerald-300",
      secondaryClass: "text-emerald-800/85 dark:text-emerald-200/85",
    },
    patternLabel: "mint fill, green outline",
  },
  at_risk: {
    surface: {
      backgroundColor: `color-mix(in oklch, ${CHART_4} 30%, var(--card))`,
      border: `1px solid ${darkerOutline(CHART_4)}`,
      color: "var(--foreground)",
      borderStyle: "solid",
    },
    signal: {
      icon: "triangleExclamation",
      shortLabel: "At risk",
      iconClass: "text-amber-900 dark:text-amber-100",
      secondaryClass: "text-amber-950 dark:text-amber-100",
    },
    patternLabel: "amber fill, amber outline",
  },
  not_confirmed: {
    surface: {
      backgroundColor: `color-mix(in oklch, ${CHART_3} 18%, var(--card))`,
      border: `1px dashed ${darkerOutline(CHART_3)}`,
      color: "var(--foreground)",
      borderStyle: "dashed",
    },
    signal: {
      icon: "clock",
      shortLabel: "Not confirmed",
      iconClass: "text-blue-800 dark:text-blue-300",
      secondaryClass: "text-blue-900/90 dark:text-blue-200/90",
    },
    patternLabel: "dashed blue outline",
  },
  to_schedule: {
    surface: {
      backgroundColor: "color-mix(in oklch, var(--muted) 42%, var(--card))",
      border: "1px dashed color-mix(in oklch, var(--foreground) 38%, var(--border))",
      color: "var(--foreground)",
      borderStyle: "dashed",
    },
    signal: {
      icon: "calendar",
      shortLabel: "To schedule",
      iconClass: "text-foreground/70",
      secondaryClass: "text-muted-foreground",
    },
    patternLabel: "dashed border",
  },
  cancelled: {
    surface: {
      backgroundColor: "color-mix(in oklch, var(--muted) 62%, transparent)",
      border: "1px solid color-mix(in oklch, var(--border) 95%, transparent)",
      color: "var(--muted-foreground)",
      borderStyle: "solid",
      opacity: 0.52,
    },
    signal: {
      icon: "x",
      shortLabel: "Cancelled",
      iconClass: "text-muted-foreground",
      secondaryClass: "text-muted-foreground",
    },
    patternLabel: "muted inactive",
  },
}

export function getScheduleStripeSemantics(placement: StripePlacement): ScheduleStripeSemantics {
  const scenario = resolveScheduleStripeScenario(placement)
  const base = SEMANTICS[scenario]
  return { scenario, ...base }
}

export function pickWorstScheduleStripeScenario(
  placements: StripePlacement[],
): ScheduleStripeScenario {
  if (placements.length === 0) return "on_track"

  let worst = resolveScheduleStripeScenario(placements[0])
  let worstRank = SCHEDULE_STRIPE_SCENARIO_RANK[worst]

  for (const placement of placements.slice(1)) {
    const scenario = resolveScheduleStripeScenario(placement)
    const rank = SCHEDULE_STRIPE_SCENARIO_RANK[scenario]
    if (rank > worstRank) {
      worst = scenario
      worstRank = rank
    }
  }

  return worst
}

export function getScheduleClusterStripeSemantics(
  placements: StripePlacement[],
): ScheduleStripeSemantics {
  const scenario = pickWorstScheduleStripeScenario(placements)
  const semantics = { scenario, ...SEMANTICS[scenario] }

  if (
    placements.length > 1 &&
    scenario !== "at_risk" &&
    scenario !== "not_confirmed" &&
    scenario !== "to_schedule" &&
    scenario !== "cancelled"
  ) {
    return {
      ...semantics,
      surface: {
        ...semantics.surface,
        backgroundColor: `color-mix(in oklch, ${ON_TRACK_FILL} 72%, var(--card))`,
        border: `1px solid ${ON_TRACK_BORDER}`,
      },
      signal: {
        ...semantics.signal,
        shortLabel: `${placements.length} schedules`,
      },
    }
  }

  return semantics
}
