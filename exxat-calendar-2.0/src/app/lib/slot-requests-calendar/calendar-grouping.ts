import type { LocationNode, Placement } from "./types"

export type CalendarGroupByMode = "location" | "discipline" | "availability" | "group" | "unit"

export type CalendarGroupByStatus = "available" | "coming_soon"

export interface CalendarGroupByOption {
  mode: CalendarGroupByMode
  label: string
  description: string
  status: CalendarGroupByStatus
  /** Selectable in UI — false for coming soon or insufficient data. */
  enabled: boolean
}

export interface CalendarTimelineRow {
  id: string
  label: string
  subtitle: string | null
  disciplineDecisionId: string | null
  placements: Placement[]
  pendingCount: number
  reviewCount: number
  placementCount: number
  capacity: number
  approvedSlots: number
}

export interface CalendarViewGroup {
  id: string
  label: string
  subtitle: string | null
  contextTag: string | null
  rows: CalendarTimelineRow[]
  pendingCount: number
  reviewCount: number
  placementCount: number
  flat: boolean
}

/** Coordinator-facing navigation lenses — fixed catalog, gated by data + coming-soon status. */
export const CALENDAR_GROUP_BY_CATALOG: Omit<CalendarGroupByOption, "enabled">[] = [
  {
    mode: "location",
    label: "Location",
    description: "Organize by clinical unit, then discipline",
    status: "available",
  },
  {
    mode: "discipline",
    label: "Discipline",
    description: "Organize by discipline, then clinical unit",
    status: "available",
  },
  {
    mode: "availability",
    label: "Availability",
    description: "Organize by shift, then clinical unit",
    status: "available",
  },
  {
    mode: "group",
    label: "Group",
    description: "Organize by service line — requires dedicated grouping data",
    status: "coming_soon",
  },
  {
    mode: "unit",
    label: "Unit",
    description: "Flat unit list — requires dedicated unit navigation data",
    status: "coming_soon",
  },
]

function queueCounts(placements: Placement[]) {
  let pendingCount = 0
  let reviewCount = 0
  for (const p of placements) {
    if (p.status === "Request Pending") pendingCount++
    else if (p.status === "Review") reviewCount++
  }
  return { pendingCount, reviewCount, placementCount: placements.length }
}

function sumCounts(rows: CalendarTimelineRow[]) {
  return rows.reduce(
    (acc, row) => ({
      pendingCount: acc.pendingCount + row.pendingCount,
      reviewCount: acc.reviewCount + row.reviewCount,
      placementCount: acc.placementCount + row.placementCount,
    }),
    { pendingCount: 0, reviewCount: 0, placementCount: 0 },
  )
}

function rowFromDiscipline(
  loc: LocationNode,
  disc: LocationNode["disciplines"][number],
): CalendarTimelineRow {
  const counts = queueCounts(disc.placements)
  return {
    id: disc.id,
    label: disc.name,
    subtitle: null,
    disciplineDecisionId: disc.id,
    placements: disc.placements,
    ...counts,
    capacity: disc.capacity,
    approvedSlots: disc.approvedSlots,
  }
}

function rowFromLocation(loc: LocationNode, placements: Placement[]): CalendarTimelineRow {
  const counts = queueCounts(placements)
  const worstDisc = loc.disciplines.reduce(
    (best, disc) =>
      disc.approvedSlots / Math.max(1, disc.capacity) > best.ratio
        ? { disc, ratio: disc.approvedSlots / Math.max(1, disc.capacity) }
        : best,
    { disc: loc.disciplines[0], ratio: 0 },
  ).disc

  return {
    id: `${loc.id}::merged`,
    label: loc.name,
    subtitle: loc.disciplines.length > 1 ? `${loc.disciplines.length} disciplines` : null,
    disciplineDecisionId: worstDisc?.id ?? null,
    placements,
    ...counts,
    capacity: loc.capacity,
    approvedSlots: loc.approvedSlots,
  }
}

function buildLocationGroups(locations: LocationNode[]): CalendarViewGroup[] {
  return locations.map((loc) => {
    const rows = loc.disciplines.map((disc) => rowFromDiscipline(loc, disc))
    return {
      id: loc.id,
      label: loc.name,
      subtitle: null,
      contextTag: loc.locationGroup || null,
      rows,
      ...sumCounts(rows),
      flat: false,
    }
  })
}

function buildDisciplineGroups(locations: LocationNode[]): CalendarViewGroup[] {
  const byDisc = new Map<string, CalendarTimelineRow[]>()

  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      const list = byDisc.get(disc.name) ?? []
      list.push({
        ...rowFromDiscipline(loc, disc),
        id: `${disc.name}::${loc.id}`,
        label: loc.name,
        subtitle: disc.name,
        disciplineDecisionId: disc.id,
      })
      byDisc.set(disc.name, list)
    }
  }

  return Array.from(byDisc.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, rows]) => ({
      id: `discipline::${name}`,
      label: name,
      subtitle: null,
      contextTag: null,
      rows: rows.sort((a, b) => a.label.localeCompare(b.label)),
      ...sumCounts(rows),
      flat: false,
    }))
}

function normalizeShift(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === "—") return null
  return trimmed
}

/** Availability view — groups by shift (requestedShifts on placements). */
function buildAvailabilityGroups(locations: LocationNode[]): CalendarViewGroup[] {
  const byShift = new Map<string, Map<string, Placement[]>>()

  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      for (const p of disc.placements) {
        const shift = normalizeShift(p.requestedShifts)
        if (!shift) continue
        const shiftMap = byShift.get(shift) ?? new Map<string, Placement[]>()
        const list = shiftMap.get(loc.id) ?? []
        list.push(p)
        shiftMap.set(loc.id, list)
        byShift.set(shift, shiftMap)
      }
    }
  }

  return Array.from(byShift.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([shift, locMap]) => {
      const rows: CalendarTimelineRow[] = []
      for (const loc of locations) {
        const placements = locMap.get(loc.id)
        if (!placements?.length) continue
        const counts = queueCounts(placements)
        rows.push({
          id: `${shift}::${loc.id}`,
          label: loc.name,
          subtitle: null,
          disciplineDecisionId: loc.disciplines[0]?.id ?? null,
          placements,
          ...counts,
          capacity: loc.capacity,
          approvedSlots: loc.approvedSlots,
        })
      }
      return {
        id: `availability::${shift}`,
        label: shift,
        subtitle: null,
        contextTag: null,
        rows,
        ...sumCounts(rows),
        flat: false,
      }
    })
}

export function detectGroupByAvailability(locations: LocationNode[]): Record<
  "location" | "discipline" | "availability",
  boolean
> {
  const shifts = new Set<string>()
  let shiftCoverage = 0
  let totalPlacements = 0

  for (const loc of locations) {
    for (const disc of loc.disciplines) {
      for (const p of disc.placements) {
        totalPlacements++
        const shift = normalizeShift(p.requestedShifts)
        if (shift) {
          shifts.add(shift)
          shiftCoverage++
        }
      }
    }
  }

  const disciplineNames = new Set(locations.flatMap((l) => l.disciplines.map((d) => d.name)))
  const shiftRatio = totalPlacements > 0 ? shiftCoverage / totalPlacements : 0

  return {
    location: locations.length > 0,
    discipline: locations.length > 0 && disciplineNames.size >= 1,
    availability: shifts.size >= 1 && shiftRatio >= 0.25,
  }
}

export function resolveGroupByOptions(locations: LocationNode[]): CalendarGroupByOption[] {
  const dataReady = detectGroupByAvailability(locations)
  return CALENDAR_GROUP_BY_CATALOG.map((opt) => ({
    ...opt,
    enabled:
      opt.status === "available" && Boolean(dataReady[opt.mode as keyof typeof dataReady]),
  }))
}

export function buildCalendarViewGroups(
  locations: LocationNode[],
  mode: CalendarGroupByMode,
): CalendarViewGroup[] {
  switch (mode) {
    case "discipline":
      return buildDisciplineGroups(locations)
    case "availability":
      return buildAvailabilityGroups(locations)
    case "group":
    case "unit":
      return buildLocationGroups(locations)
    case "location":
    default:
      return buildLocationGroups(locations)
  }
}

/** Nested row label for timeline ribbons — never repeat the parent group in the stripe. */
export function viewByRibbonEntityLabel(
  mode: CalendarGroupByMode,
  rowLabel?: string | null,
): string | null {
  const trimmed = rowLabel?.trim()
  if (!trimmed) return null
  switch (mode) {
    case "location":
    case "discipline":
    case "availability":
      return trimmed
    default:
      return null
  }
}

export function sidebarHeaderForGroupBy(mode: CalendarGroupByMode): string {
  return viewByPrimaryColumn(mode)
}

/** Primary row label in the sidebar (parent groups). */
export function viewByPrimaryColumn(mode: CalendarGroupByMode): string {
  switch (mode) {
    case "discipline":
      return "Discipline"
    case "availability":
      return "Shift"
    case "location":
    default:
      return "Location"
  }
}

/** Nested row label shown as muted hint under the view selector. */
export function viewByNestedColumn(mode: CalendarGroupByMode): string | null {
  switch (mode) {
    case "discipline":
    case "availability":
      return "Location"
    case "location":
      return "Discipline"
    default:
      return null
  }
}

/** Short coordinator-facing explanation of the active view. */
export function viewByCoordinatorHint(mode: CalendarGroupByMode): string {
  switch (mode) {
    case "discipline":
      return "Discipline first · units nested below"
    case "availability":
      return "Shift first · units nested below"
    case "location":
    default:
      return "Unit first · disciplines nested below"
  }
}

/** Human-readable count for top-level groups in the active view. */
export function formatViewGroupCount(mode: CalendarGroupByMode, count: number): string {
  if (count <= 0) return "none"
  const noun =
    mode === "discipline"
      ? count === 1
        ? "discipline"
        : "disciplines"
      : mode === "availability"
        ? count === 1
          ? "shift"
          : "shifts"
        : count === 1
          ? "unit"
          : "units"
  return `${count} ${noun}`
}

export function defaultGroupByMode(locations: LocationNode[]): CalendarGroupByMode {
  const dataReady = detectGroupByAvailability(locations)
  if (dataReady.location) return "location"
  if (dataReady.discipline) return "discipline"
  if (dataReady.availability) return "availability"
  return "location"
}

export function expandableGroupIds(groups: CalendarViewGroup[]): string[] {
  return groups.filter((g) => !g.flat && g.rows.length > 0).map((g) => g.id)
}

export const AVAILABLE_GROUP_BY_MODES = CALENDAR_GROUP_BY_CATALOG.filter(
  (o) => o.status === "available",
)
export const COMING_SOON_GROUP_BY_MODES = CALENDAR_GROUP_BY_CATALOG.filter(
  (o) => o.status === "coming_soon",
)
