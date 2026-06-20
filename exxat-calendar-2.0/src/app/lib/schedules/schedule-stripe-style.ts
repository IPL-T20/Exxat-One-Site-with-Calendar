import type { Placement } from "../slot-requests-calendar/types"
import { STATUS_BAR_STYLE } from "../slot-requests-calendar/constants"

export interface ScheduleStripeSurface {
  backgroundColor: string
  border: string
  color: string
  borderStyle: "solid" | "dashed"
  opacity?: number
}

type StripePlacement = Pick<Placement, "status" | "partnerCategory">

/** Severity order for cluster tint — worst signal wins when stripes overlap. */
const STATUS_RANK: Record<Placement["status"], number> = {
  Canceled: 0,
  "Request Pending": 1,
  Review: 2,
  Approved: 3,
  Declined: 4,
}

function onboardingRank(partnerCategory: string | undefined): number {
  if (partnerCategory === "Not Compliant") return 2
  if (partnerCategory === "Compliant") return 0
  return 1
}

/** Confirmed schedules — strong on-track green; exceptions carry warning / muted signals. */
export function scheduleStripeSurface(placement: StripePlacement): ScheduleStripeSurface {
  if (placement.status === "Canceled") {
    return {
      backgroundColor: "color-mix(in oklch, var(--muted) 55%, transparent)",
      border: "1px solid var(--border)",
      color: "var(--muted-foreground)",
      borderStyle: "solid",
      opacity: 0.55,
    }
  }

  if (placement.status === "Approved") {
    if (placement.partnerCategory === "Not Compliant") {
      return {
        backgroundColor: "color-mix(in oklch, var(--chart-4) 38%, var(--card))",
        border: "1px solid color-mix(in oklch, var(--chart-4) 75%, transparent)",
        color: "var(--foreground)",
        borderStyle: "solid",
      }
    }
    return {
      backgroundColor: STATUS_BAR_STYLE.Approved.fill,
      border: `1px solid ${STATUS_BAR_STYLE.Approved.border}`,
      color: STATUS_BAR_STYLE.Approved.text,
      borderStyle: "solid",
    }
  }

  if (placement.status === "Review") {
    return {
      backgroundColor: "color-mix(in oklch, var(--chart-4) 24%, var(--card))",
      border: "1px dashed color-mix(in oklch, var(--chart-4) 60%, transparent)",
      color: "var(--foreground)",
      borderStyle: "dashed",
    }
  }

  return {
    backgroundColor: "color-mix(in oklch, var(--muted) 35%, var(--card))",
    border: "1px dashed color-mix(in oklch, var(--border) 90%, transparent)",
    color: "var(--muted-foreground)",
    borderStyle: "dashed",
  }
}

export function scheduleClusterStripeSurface(placements: StripePlacement[]): ScheduleStripeSurface {
  if (placements.length === 0) {
    return scheduleStripeSurface({ status: "Approved", partnerCategory: "Compliant" })
  }

  let worst = placements[0]
  for (const p of placements.slice(1)) {
    const rankA = STATUS_RANK[worst.status] ?? 0
    const rankB = STATUS_RANK[p.status] ?? 0
    if (rankB < rankA) {
      worst = p
      continue
    }
    if (rankB === rankA && onboardingRank(p.partnerCategory) > onboardingRank(worst.partnerCategory)) {
      worst = p
    }
  }

  const base = scheduleStripeSurface(worst)
  if (placements.length > 1 && worst.status === "Approved" && worst.partnerCategory !== "Not Compliant") {
    return {
      ...base,
      backgroundColor: "color-mix(in oklch, var(--chart-2) 68%, transparent)",
    }
  }
  return base
}
