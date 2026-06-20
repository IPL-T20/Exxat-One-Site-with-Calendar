/**
 * Approval timeline density engine — zoom-aware aggregation, labels, and stats.
 * Targets 500+ requests / row with progressive disclosure (Coda / Linear / Jira Timeline).
 */
import { xOfDate, widthOfRange } from "./calendar-timeline"
import { MS_DAY, STATUS_LABEL } from "./constants"
import type { ClusterDecisionMeta } from "./cluster-decision-meta"
import { buildPlacementFootprintMeta } from "./decision-engine/schedule-footprint"
import type { CompetitionClass } from "./decision-engine/decision-types"
import type { CalendarZoom, Placement, SlotStatus } from "./types"

export type AggregationLevel = "individual" | "group" | "cluster" | "aggregate"

export interface ClusterStats {
  requestCount: number
  schoolCount: number
  schoolBreakdown: SchoolBreakdownEntry[]
  statusCounts: Record<SlotStatus, number>
}

export interface SchoolBreakdownEntry {
  schoolShort: string
  abbrev: string
  count: number
  gold: boolean
}

export interface ApprovalObjectCluster {
  id: string
  placements: Placement[]
  start: Date
  end: Date
  level: AggregationLevel
  stats: ClusterStats
  /** Same footprintKey for every member after footprint-aware merge. */
  footprintKey?: string
  footprintLabel?: string
  decisionMeta?: ClusterDecisionMeta
}

export interface CardDisplayLine {
  text: string
  tone: "primary" | "secondary" | "meta"
}

export interface CardDisplay {
  lines: CardDisplayLine[]
  layout: "chip" | "dashboard"
  height: number
  goldStarCount: number
  ariaLabel: string
  footprintLine?: string
  competitionClass?: CompetitionClass | null
  slotCapLine?: string
}

const GOLD_PARTNER_SCHOOL_PREFIXES = ["Towson University", "Duke University"]

const KNOWN_SCHOOL_ABBREVS: [RegExp | string, string][] = [
  [/george washington/i, "GWU"],
  [/university of maryland/i, "UMD"],
  [/community college of baltimore/i, "CCBC"],
  [/chamberlain/i, "Chamberlain"],
  [/trinity washington/i, "Trinity"],
  [/towson/i, "Towson"],
  [/duke/i, "Duke"],
]

const STATUS_ORDER: SlotStatus[] = [
  "Request Pending",
  "Review",
  "Approved",
  "Declined",
  "Canceled",
]

/** Placement or slot-request row — rows omit `schoolShort`; derived from `school`. */
export function isGoldPartner(
  placement: Pick<Placement, "school" | "partnerCategory"> & { schoolShort?: string },
): boolean {
  const cat = placement.partnerCategory?.toLowerCase() ?? ""
  if (cat.includes("gold")) return true
  const short = placement.schoolShort ?? placement.school
  return GOLD_PARTNER_SCHOOL_PREFIXES.some(
    (prefix) => placement.school.startsWith(prefix) || short.startsWith(prefix),
  )
}

/** True when any request in the cluster is from a gold partner school. */
export function clusterHasGoldPartner(cluster: {
  placements: Pick<Placement, "school" | "partnerCategory" | "schoolShort">[]
  stats: { schoolBreakdown: { gold: boolean }[] }
}): boolean {
  if (cluster.stats.schoolBreakdown.some((s) => s.gold)) return true
  return cluster.placements.some((p) => isGoldPartner(p))
}

export function abbreviateSchool(schoolShort: string, maxChars = 12): string {
  for (const [pattern, abbrev] of KNOWN_SCHOOL_ABBREVS) {
    if (typeof pattern === "string" ? schoolShort.includes(pattern) : pattern.test(schoolShort)) {
      return abbrev.length <= maxChars ? abbrev : abbrev.slice(0, maxChars)
    }
  }
  if (schoolShort.length <= maxChars) return schoolShort
  const words = schoolShort.split(/[\s-]+/).filter(Boolean)
  if (words.length >= 2) {
    const acronym = words
      .filter((w) => !/^(of|the|and|at|for)$/i.test(w))
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
    if (acronym.length >= 2 && acronym.length <= maxChars) return acronym
  }
  const first = words[0] ?? schoolShort
  if (first.length <= maxChars) return first
  return `${first.slice(0, Math.max(3, maxChars - 1))}…`
}

export function computeClusterStats(placements: Placement[]): ClusterStats {
  const schoolMap = new Map<string, SchoolBreakdownEntry>()
  const statusCounts: Record<SlotStatus, number> = {
    "Request Pending": 0,
    Review: 0,
    Approved: 0,
    Declined: 0,
    Canceled: 0,
  }

  for (const p of placements) {
    statusCounts[p.status] += 1
    const key = p.schoolShort
    const existing = schoolMap.get(key)
    if (existing) {
      existing.count += 1
    } else {
      schoolMap.set(key, {
        schoolShort: p.schoolShort,
        abbrev: abbreviateSchool(p.schoolShort),
        count: 1,
        gold: isGoldPartner(p),
      })
    }
  }

  const schoolBreakdown = [...schoolMap.values()].sort((a, b) => {
    if (a.gold !== b.gold) return a.gold ? -1 : 1
    return b.count - a.count || a.schoolShort.localeCompare(b.schoolShort)
  })

  return {
    requestCount: placements.length,
    schoolCount: schoolMap.size,
    schoolBreakdown,
    statusCounts,
  }
}

function clusterBounds(placements: Placement[]): { start: Date; end: Date } {
  const starts = placements.map((p) => p.start!.getTime())
  const ends = placements.map((p) => p.end!.getTime())
  return {
    start: new Date(Math.min(...starts)),
    end: new Date(Math.max(...ends)),
  }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`
}

export function cardRect(
  placement: Placement,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): { left: number; width: number } | null {
  if (!placement.start || !placement.end) return null
  const left = xOfDate(placement.start, zoom, ppd, monthPxW)
  const width = Math.max(28, widthOfRange(placement.start, placement.end, zoom, ppd, monthPxW))
  return { left, width }
}

function dateRangesOverlap(a: Placement, b: Placement): boolean {
  if (!a.start || !a.end || !b.start || !b.end) return false
  return a.start.getTime() <= b.end.getTime() && b.start.getTime() <= a.end.getTime()
}

function pixelRectsOverlap(
  a: Placement,
  b: Placement,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): boolean {
  const ra = cardRect(a, zoom, ppd, monthPxW)
  const rb = cardRect(b, zoom, ppd, monthPxW)
  if (!ra || !rb) return false
  return ra.left + ra.width > rb.left + 6 && rb.left + rb.width > ra.left + 6
}

function sameMonth(a: Placement, b: Placement): boolean {
  if (!a.start || !b.start) return false
  return monthKey(a.start) === monthKey(b.start)
}

function cardTooNarrow(p: Placement, zoom: CalendarZoom, ppd: number, monthPxW: number): boolean {
  const rect = cardRect(p, zoom, ppd, monthPxW)
  if (!rect) return true
  const minReadable = zoom === "year" ? 48 : 36
  return rect.width < minReadable
}

function placementFootprintKey(p: Placement): string {
  return buildPlacementFootprintMeta(p).footprintKey
}

function placementFootprintLabel(p: Placement): string {
  return buildPlacementFootprintMeta(p).footprintLabel
}

/** Same footprintKey + overlapping dates; month allows ≤3d handoff gap (same footprint only). */
function shouldMergePair(
  a: Placement,
  b: Placement,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): boolean {
  if (!a.start || !a.end || !b.start || !b.end) return false
  if (placementFootprintKey(a) !== placementFootprintKey(b)) return false

  switch (zoom) {
    case "year": {
      if (dateRangesOverlap(a, b)) return true
      if (
        sameMonth(a, b) &&
        (cardTooNarrow(a, zoom, ppd, monthPxW) || cardTooNarrow(b, zoom, ppd, monthPxW))
      ) {
        return true
      }
      const gap = Math.min(
        Math.abs(a.start.getTime() - b.end.getTime()),
        Math.abs(b.start.getTime() - a.end.getTime()),
      )
      return sameMonth(a, b) && gap <= 3 * MS_DAY
    }
    case "month":
    case "week":
    case "day":
      return dateRangesOverlap(a, b) && pixelRectsOverlap(a, b, zoom, ppd, monthPxW)
    default:
      return false
  }
}

function resolveLevel(count: number, zoom: CalendarZoom): AggregationLevel {
  if (count === 1) return zoom === "year" ? "cluster" : "individual"
  if (zoom === "year") return count >= 4 ? "aggregate" : "cluster"
  if (zoom === "week") return count >= 5 ? "cluster" : "group"
  if (count >= 4) return "cluster"
  return "group"
}

function makeCluster(placements: Placement[], zoom: CalendarZoom): ApprovalObjectCluster {
  const bounds = clusterBounds(placements)
  const stats = computeClusterStats(placements)
  const lead = placements[0]!
  return {
    id: placements.map((p) => p.id).join("__"),
    placements,
    ...bounds,
    level: resolveLevel(placements.length, zoom),
    stats,
    footprintKey: placementFootprintKey(lead),
    footprintLabel: placementFootprintLabel(lead),
  }
}

function bucketYearAggregates(placements: Placement[], zoom: CalendarZoom): ApprovalObjectCluster[] {
  const buckets = new Map<string, Placement[]>()
  for (const p of placements) {
    if (!p.start || !p.end) continue
    const key = `${placementFootprintKey(p)}::${monthKey(p.start)}`
    const list = buckets.get(key) ?? []
    list.push(p)
    buckets.set(key, list)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, group]) => makeCluster(group, zoom))
}

function mergeChainClusters(
  placements: Placement[],
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): ApprovalObjectCluster[] {
  const timed = placements
    .filter((p) => p.start && p.end)
    .sort((a, b) => a.start!.getTime() - b.start!.getTime())

  if (timed.length === 0) return []

  const clusters: ApprovalObjectCluster[] = []
  let group: Placement[] = [timed[0]]
  let groupEnd = timed[0].end!.getTime()

  for (let i = 1; i < timed.length; i++) {
    const p = timed[i]
    const merge =
      p.start!.getTime() <= groupEnd + (zoom === "year" ? 3 * MS_DAY : 0) &&
      group.some((g) => shouldMergePair(g, p, zoom, ppd, monthPxW))

    if (merge) {
      group.push(p)
      groupEnd = Math.max(groupEnd, p.end!.getTime())
    } else {
      clusters.push(makeCluster(group, zoom))
      group = [p]
      groupEnd = p.end!.getTime()
    }
  }

  clusters.push(makeCluster(group, zoom))
  return clusters
}

export function clusterApprovalObjects(
  placements: Placement[],
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): ApprovalObjectCluster[] {
  const timed = placements.filter((p) => p.start && p.end)
  if (timed.length === 0) return []

  return mergeChainClusters(timed, zoom, ppd, monthPxW)
}

export function sortPlacementsGoldFirst(placements: Placement[]): Placement[] {
  return [...placements].sort((a, b) => {
    const ag = isGoldPartner(a) ? 0 : 1
    const bg = isGoldPartner(b) ? 0 : 1
    if (ag !== bg) return ag - bg
    return a.schoolShort.localeCompare(b.schoolShort)
  })
}

export function dominantStatus(placements: Placement[]): SlotStatus {
  for (const s of STATUS_ORDER) {
    if (placements.some((p) => p.status === s)) return s
  }
  return placements[0]?.status ?? "Request Pending"
}

function statusSummaryLine(stats: ClusterStats, maxParts = 3): string {
  return STATUS_ORDER.filter((s) => stats.statusCounts[s] > 0)
    .map((s) => `${STATUS_LABEL[s]}: ${stats.statusCounts[s]}`)
    .slice(0, maxParts)
    .join(" · ")
}

function goldPartnerRequestTotal(goldSchools: SchoolBreakdownEntry[]): number {
  return goldSchools.reduce((sum, s) => sum + s.count, 0)
}

function goldPartnersLabel(goldSchools: SchoolBreakdownEntry[]): string {
  return goldSchools.map((s) => s.schoolShort).join(", ")
}

function footprintShort(label: string, widthPx: number): string {
  if (widthPx >= 120) return label
  const parts = label.split(" · ")
  if (parts.length === 2) return parts.join(" ")
  return label
}

export function buildCardDisplay(
  cluster: ApprovalObjectCluster,
  zoom: CalendarZoom,
  widthPx: number,
): CardDisplay {
  const { stats, level, placements, decisionMeta } = cluster
  const n = stats.requestCount
  const p = placements[0]
  const footprintLine =
    decisionMeta?.footprintLabel ?? cluster.footprintLabel ?? placementFootprintLabel(p)
  const competitionClass = decisionMeta?.worstCompetitionClass ?? null
  const slotCapLine =
    decisionMeta && n > 1
      ? `${decisionMeta.totalSlotDemand}/${decisionMeta.cap} slots`
      : undefined

  if (n === 1) {
    const gold = isGoldPartner(p)
    const abbrev = abbreviateSchool(p.schoolShort, widthPx >= 120 ? 24 : 10)
    const slots = `${p.requestedSlots} slot${p.requestedSlots === 1 ? "" : "s"}`
    const status = STATUS_LABEL[p.status]
    const lines: CardDisplayLine[] = []
    let text: string
    if (gold) {
      if (widthPx >= 140) text = slots
      else if (widthPx >= 88) text = `${p.requestedSlots} slot${p.requestedSlots === 1 ? "" : "s"}`
      else if (widthPx >= 52) text = String(p.requestedSlots)
      else text = `${n} req`
    } else if (widthPx >= 140) text = `${abbrev} • ${slots}`
    else if (widthPx >= 88) text = `${abbrev} • ${status}`
    else if (widthPx >= 52) text = abbrev
    else text = `${n} req`
    lines.push({ text, tone: "primary" })
    if (widthPx >= 88) {
      lines.push({ text: footprintShort(footprintLine, widthPx), tone: "secondary" })
    }

    return {
      lines,
      layout: widthPx >= 88 && lines.length > 1 ? "dashboard" : "chip",
      height: widthPx >= 88 && lines.length > 1 ? 36 : 26,
      goldStarCount: gold ? 1 : 0,
      competitionClass,
      footprintLine: widthPx >= 88 ? footprintShort(footprintLine, widthPx) : undefined,
      ariaLabel: gold
        ? `Gold partner: ${p.schoolShort}, ${footprintLine}, ${status}, ${p.requestedDuration}, ${slots}`
        : `${p.schoolShort}, ${footprintLine}, ${status}, ${p.requestedDuration}, ${slots}`,
    }
  }

  const useDashboard =
    level === "aggregate" ||
    (level === "cluster" && n >= 5 && widthPx >= 72) ||
    (zoom === "year" && n >= 3 && widthPx >= 64) ||
    (zoom === "month" && widthPx >= 40)

  const goldSchools = stats.schoolBreakdown.filter((s) => s.gold)
  const goldPartnerCount = goldSchools.length

  if (useDashboard && widthPx >= 56) {
    const lines: CardDisplayLine[] = []

    if (slotCapLine && widthPx >= 64) {
      lines.push({ text: slotCapLine, tone: "primary" })
    } else if (goldPartnerCount > 0 && widthPx >= 72) {
      const remainder = n - goldPartnerRequestTotal(goldSchools)
      if (remainder > 0) {
        lines.push({
          text: widthPx >= 100 ? `${n} · +${remainder}` : `+${remainder}`,
          tone: "primary",
        })
      } else if (n > 1) {
        lines.push({ text: `${n} request${n === 1 ? "" : "s"}`, tone: "secondary" })
      }
    } else if (widthPx >= 72) {
      lines.push({
        text: `${n} Request${n === 1 ? "" : "s"}`,
        tone: "primary",
      })
      lines.push({
        text: `${stats.schoolCount} School${stats.schoolCount === 1 ? "" : "s"}`,
        tone: "secondary",
      })
    } else {
      lines.push({ text: `${n} req`, tone: "primary" })
    }

    if (widthPx >= 72 && footprintLine && lines.length < 3) {
      lines.push({ text: footprintShort(footprintLine, widthPx), tone: "secondary" })
    }

    if (widthPx >= 100) {
      const statusLine = statusSummaryLine(stats)
      if (statusLine && lines.length < 3) lines.push({ text: statusLine, tone: "meta" })
    } else if (widthPx >= 88 && lines.length === 1) {
      lines.push({ text: `${stats.schoolCount} sch`, tone: "meta" })
    }

    const goldAria =
      goldPartnerCount > 0
        ? `${goldPartnerCount} gold partner${goldPartnerCount === 1 ? "" : "s"} (${goldPartnersLabel(goldSchools)})`
        : ""

    return {
      lines: lines.slice(0, 3),
      layout: "dashboard",
      height: lines.length >= 3 ? 44 : lines.length === 2 ? 36 : 28,
      goldStarCount: goldPartnerCount,
      competitionClass,
      footprintLine: footprintShort(footprintLine, widthPx),
      slotCapLine,
      ariaLabel: slotCapLine
        ? `${slotCapLine}, ${footprintLine}, ${goldAria || `${n} requests`}`
        : goldAria
          ? `${n} requests, ${goldAria}, ${statusSummaryLine(stats, 5)}`
          : `${n} requests, ${stats.schoolCount} schools, ${statusSummaryLine(stats, 5)}`,
    }
  }

  if (goldPartnerCount > 0 && widthPx >= 48) {
    const remainder = n - goldPartnerRequestTotal(goldSchools)
    const text =
      remainder > 0
        ? widthPx >= 72
          ? `${n} · +${remainder}`
          : `+${remainder}`
        : n > 1
          ? `${n} req`
          : `${n} request`
    return {
      lines: [{ text, tone: "primary" }],
      layout: "chip",
      height: 26,
      goldStarCount: goldPartnerCount,
      ariaLabel: `${n} requests, ${goldPartnerCount} gold partner${goldPartnerCount === 1 ? "" : "s"} (${goldPartnersLabel(goldSchools)})`,
    }
  }

  if (widthPx < 56 || n >= 4) {
    return {
      lines: [{ text: `${n} Requests`, tone: "primary" }],
      layout: "chip",
      height: 26,
      goldStarCount: 0,
      ariaLabel: `${n} requests across ${stats.schoolCount} schools`,
    }
  }

  const lead = abbreviateSchool(stats.schoolBreakdown[0]?.schoolShort ?? "Requests", 12)
  const text = n > 1 ? `${lead} +${n - 1}` : lead
  return {
    lines: [{ text, tone: "primary" }],
    layout: "chip",
    height: 26,
    goldStarCount: 0,
    ariaLabel: `${n} requests: ${text}`,
  }
}

export function requestIdFromPlacement(placement: Placement): string {
  return placement.slotRequestId ?? placement.id
}

export function rowMaxCardHeight(
  clusters: ApprovalObjectCluster[],
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
): number {
  let max = 26
  for (const c of clusters) {
    const rect = cardRect(
      { ...c.placements[0], start: c.start, end: c.end },
      zoom,
      ppd,
      monthPxW,
    )
    const w = rect?.width ?? 48
    max = Math.max(max, buildCardDisplay(c, zoom, w).height)
  }
  return max
}

/** @deprecated */
export function singleCardLabel(placement: Placement, widthPx: number): string {
  return buildCardDisplay(
    {
      id: placement.id,
      placements: [placement],
      start: placement.start!,
      end: placement.end!,
      level: "individual",
      stats: computeClusterStats([placement]),
    },
    "day",
    widthPx,
  ).lines[0]?.text ?? placement.schoolShort
}

/** @deprecated */
export function clusterCardLabel(
  placements: Placement[],
  widthPx: number,
): { label: string; showGoldStar: boolean; leadSchool: string } {
  const display = buildCardDisplay(makeCluster(placements, "month"), "month", widthPx)
  return {
    label: display.lines.map((l) => l.text).join(" · "),
    showGoldStar: display.goldStarCount > 0,
    leadSchool: placements[0]?.schoolShort ?? "",
  }
}
