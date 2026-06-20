import type { CapacityState } from "./decision-engine/decision-types"
import type { DisciplineRowDecisionSnapshot } from "./decision-engine/decision-types"

export type CapacityTone = "healthy" | "caution" | "pressure" | "critical" | "neutral"

export interface CoordinatorCapacitySummary {
  headline: string
  detail: string | null
  tone: CapacityTone
  badgeLabel: string
}

export function capacityToneFromState(state: CapacityState): CapacityTone {
  switch (state) {
    case "overbooked":
      return "critical"
    case "exhausted":
      return "pressure"
    case "tight":
      return "caution"
    case "open":
      return "healthy"
    default:
      return "neutral"
  }
}

export function formatCoordinatorCapacity(
  decision: DisciplineRowDecisionSnapshot | undefined,
  fallback?: { capacity: number; approvedSlots: number },
): CoordinatorCapacitySummary | null {
  if (!decision && !fallback) return null

  const cap = decision?.cap ?? fallback?.capacity ?? 0
  const peakDemand = decision?.forecastPeakSlots ?? decision?.approvedSlots ?? fallback?.approvedSlots ?? 0
  const state = decision?.capacityState ?? deriveFallbackState(peakDemand, cap)
  const tone = capacityToneFromState(state)
  const headroom = cap > 0 ? cap - peakDemand : null

  switch (state) {
    case "overbooked": {
      const overBy = cap > 0 ? Math.max(1, peakDemand - cap) : null
      return {
        headline: "Over capacity",
        detail: overBy != null ? `${overBy} slot${overBy === 1 ? "" : "s"} above limit` : null,
        tone,
        badgeLabel: "Over capacity",
      }
    }
    case "exhausted":
      return {
        headline: "At capacity",
        detail: "Queue cannot all be approved as requested",
        tone,
        badgeLabel: "At capacity",
      }
    case "tight":
      return {
        headline: "Near capacity",
        detail:
          headroom != null && headroom > 0
            ? `${headroom} slot${headroom === 1 ? "" : "s"} remaining`
            : "Little room left",
        tone,
        badgeLabel: "Near capacity",
      }
    case "open":
      return {
        headline: headroom != null && headroom > 0 ? "Room available" : "Healthy",
        detail:
          headroom != null && headroom > 0
            ? `${headroom} slot${headroom === 1 ? "" : "s"} available`
            : null,
        tone,
        badgeLabel: "Room available",
      }
    default:
      return null
  }
}

function deriveFallbackState(peak: number, cap: number): CapacityState {
  if (cap <= 0) return "open"
  if (peak > cap) return "overbooked"
  if (peak >= cap) return "exhausted"
  if (peak >= cap * 0.8) return "tight"
  return "open"
}

/**
 * Sidebar discipline row — plain slot availability copy for coordinators.
 * Outcome-first (slots open / over limit), not color-coded status labels.
 * Hidden when there is comfortable room — no noise on healthy rows.
 */
export function formatSidebarDisciplineCapacity(
  decision: DisciplineRowDecisionSnapshot | undefined,
  fallback?: { capacity: number; approvedSlots: number },
): string | null {
  if (!decision && !fallback) return null

  const cap = decision?.cap ?? fallback?.capacity ?? 0
  const peak = decision?.forecastPeakSlots ?? decision?.approvedSlots ?? fallback?.approvedSlots ?? 0
  const state = decision?.capacityState ?? deriveFallbackState(peak, cap)

  if (state === "open") return null

  const headroom = cap > 0 ? Math.max(0, cap - peak) : null

  switch (state) {
    case "overbooked": {
      const overBy = cap > 0 ? Math.max(1, peak - cap) : null
      return overBy != null
        ? `${overBy} slot${overBy === 1 ? "" : "s"} over limit`
        : "More requests than slots"
    }
    case "exhausted":
      return "No slots open"
    case "tight":
      return headroom != null && headroom > 0
        ? `${headroom} slot${headroom === 1 ? "" : "s"} open`
        : "Almost full"
    default:
      return null
  }
}

export function capacityBadgeClass(tone: CapacityTone): string {
  switch (tone) {
    case "critical":
      return "bg-red-100 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/50"
    case "pressure":
      return "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-900/50"
    case "caution":
      return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50"
    case "healthy":
      return "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export function capacityHeadlineClass(tone: CapacityTone): string {
  switch (tone) {
    case "critical":
      return "text-red-800 dark:text-red-200"
    case "pressure":
      return "text-orange-800 dark:text-orange-200"
    case "caution":
      return "text-amber-800 dark:text-amber-200"
    case "healthy":
      return "text-emerald-800 dark:text-emerald-200"
    default:
      return "text-muted-foreground"
  }
}
