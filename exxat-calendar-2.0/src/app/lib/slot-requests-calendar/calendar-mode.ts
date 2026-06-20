import type {
  CalendarLayers,
  CalendarMode,
  DisciplineNode,
  Placement,
  PlacementEmphasis,
  SlotStatus,
} from "./types"
import { isGoldPartner } from "./approval-timeline-density"

const APPROVAL_PRIMARY: SlotStatus[] = ["Request Pending", "Review"]
const OPS_PRIMARY: SlotStatus[] = ["Approved"]

export function placementEmphasis(
  status: SlotStatus,
  mode: CalendarMode,
): PlacementEmphasis {
  if (mode === "approval") {
    if (APPROVAL_PRIMARY.includes(status)) return "primary"
    if (status === "Approved") return "secondary"
    return "muted"
  }
  if (OPS_PRIMARY.includes(status)) return "primary"
  if (APPROVAL_PRIMARY.includes(status)) return "secondary"
  return "muted"
}

export function visiblePlacements(
  placements: Placement[],
  mode: CalendarMode,
  layers: CalendarLayers,
): Placement[] {
  return placements.filter((p) => {
    if (!layers.declined && (p.status === "Declined" || p.status === "Canceled"))
      return false
    const emphasis = placementEmphasis(p.status, mode)
    if (emphasis === "muted" && !layers.declined) return false
    if (layers.goldPartnersOnly && !isGoldPartner(p)) return false
    return true
  })
}

export function isScheduleBar(
  placement: Pick<Placement, "status" | "timelineKind">,
  mode: CalendarMode,
): boolean {
  if (mode !== "operations") return false
  if (placement.timelineKind === "schedule") return true
  if (placement.timelineKind === "slot-request") return false
  return placement.status === "Approved"
}

export function disciplineTimelinePlacements(
  disc: DisciplineNode,
  mode: CalendarMode,
  layers: CalendarLayers,
  scheduleBarsByDiscipline: Map<string, Placement[]>,
): Placement[] {
  if (mode === "approval") {
    return visiblePlacements(disc.placements, mode, layers)
  }

  const schedules = (scheduleBarsByDiscipline.get(disc.id) ?? []).filter((p) => {
    if (!p.start || !p.end) return false
    return true
  })

  const forecasts = disc.placements.filter((p) => {
    if (!layers.declined && (p.status === "Declined" || p.status === "Canceled")) return false
    if (p.status !== "Request Pending" && p.status !== "Review") return false
    if (!p.start || !p.end) return false
    return true
  })

  return [...schedules, ...forecasts]
}
