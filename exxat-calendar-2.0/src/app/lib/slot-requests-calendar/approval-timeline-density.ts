/**
 * Approval timeline density engine — zoom-aware aggregation, labels, and stats.
 * Targets 500+ requests / row with progressive disclosure (Coda / Linear / Jira Timeline).
 */
import { xOfDate, widthOfRange } from "./calendar-timeline"
import { MS_DAY, STATUS_LABEL } from "./constants"
import { formatStripeDecisionSignal } from "./coordinator-copy"
import type { ClusterDecisionMeta } from "./cluster-decision-meta"
import { isGoldPartnerEntity } from "./gold-partner-school"
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
  return isGoldPartnerEntity({
    school: placement.school,
    partnerCategory: placement.partnerCategory,
  })
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
      existing.gold = existing.gold || isGoldPartner(p)
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

/** Merge overlapping timeline stripes into one hover/compare cluster. */
export function mergeOverlapClusters(
  clusters: ApprovalObjectCluster[],
): ApprovalObjectCluster | null {
  const members = clusters.filter((c) =>
    c.placements.every((p) => p.start && p.end),
  )
  if (members.length === 0) return null
  if (members.length === 1) return members[0]!

  const placements = members.flatMap((c) => c.placements)
  const starts = placements.map((p) => p.start!.getTime())
  const ends = placements.map((p) => p.end!.getTime())
  const stats = computeClusterStats(placements)
  const level: AggregationLevel = members.some(
    (c) => c.level === "aggregate" || c.level === "cluster",
  )
    ? "cluster"
    : members.length > 1
      ? "group"
      : members[0]!.level

  return {
    id: `overlap-${members.map((c) => c.id).sort().join("|")}`,
    placements,
    start: new Date(Math.min(...starts)),
    end: new Date(Math.max(...ends)),
    level,
    stats,
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


function goldPartnersLabel(goldSchools: SchoolBreakdownEntry[]): string {
  return goldSchools.map((s) => s.schoolShort).join(", ")
}

function footprintShort(label: string, widthPx: number): string {
  if (widthPx >= 120) return label
  const parts = label.split(" · ")
  if (parts.length === 2) return parts.join(" ")
  return label
}

function awaitingReviewCount(cluster: ApprovalObjectCluster): number {
  const mix = cluster.decisionMeta?.statusMix
  if (mix) return mix.pending + mix.review
  return cluster.placements.filter(
    (p) => p.status === "Request Pending" || p.status === "Review",
  ).length
}

/** Capacity headline only when the cluster is at or over its slot cap. */
function shouldUseCapacityHeadline(
  decisionMeta: ClusterDecisionMeta | undefined,
  requestCount: number,
): boolean {
  if (!decisionMeta || requestCount <= 1) return false
  if (decisionMeta.cap <= 0) return false
  return (
    decisionMeta.capacityState === "overbooked" ||
    decisionMeta.capacityState === "exhausted" ||
    decisionMeta.totalSlotDemand >= decisionMeta.cap
  )
}

function formatCapacityHeadline(decisionMeta: ClusterDecisionMeta, widthPx: number): string {
  const demand = decisionMeta.totalSlotDemand
  const cap = decisionMeta.cap
  if (widthPx < 88) return `${demand}/${cap}`
  return `${demand}/${cap} slots`
}

/** Line 1 — who / scale (width-aware). */
function resolveSingleHeadline(p: Placement, widthPx: number): string {
  const abbrev = abbreviateSchool(p.schoolShort, widthPx >= 120 ? 24 : 12)
  const slots = p.requestedSlots
  const slotsLabel = `${slots} slot${slots === 1 ? "" : "s"}`

  if (widthPx < 52) return String(slots)
  if (widthPx < 88) return abbrev
  if (widthPx < 120) return `${abbrev} · ${slots}`
  return `${abbrev} • ${slotsLabel}`
}

function resolveMultiHeadline(
  stats: ClusterStats,
  widthPx: number,
  capacityHeadline: string | null,
): string {
  if (capacityHeadline) return capacityHeadline

  const n = stats.requestCount
  const sc = stats.schoolCount

  if (widthPx < 52) return String(n)
  if (widthPx < 88) return `${n} req`
  if (widthPx < 120) {
    return sc > 1 ? `${n} req · ${sc} sch` : `${n} requests`
  }
  return sc > 1
    ? `${n} requests · ${sc} schools`
    : `${n} request${n === 1 ? "" : "s"}`
}

/**
 * Line 2 — why care now (one signal only).
 * Priority: urgency → schedule footprint → status (single only).
 */
function resolveBarSignal(
  cluster: ApprovalObjectCluster,
  footprintLine: string,
  widthPx: number,
  isSingle: boolean,
): string | null {
  if (widthPx < 88) return null

  const awaiting = awaitingReviewCount(cluster)
  const queueSignal = formatStripeDecisionSignal(awaiting, cluster.stats.requestCount)
  if (queueSignal) return queueSignal

  const fp = footprintShort(footprintLine, widthPx).trim()
  if (fp) return fp

  if (isSingle) {
    const status = cluster.placements[0]?.status
    if (status) return STATUS_LABEL[status]
  }

  return null
}

function buildBarAriaLabel(
  cluster: ApprovalObjectCluster,
  lines: CardDisplayLine[],
  footprintLine: string,
  goldSchools: SchoolBreakdownEntry[],
): string {
  const parts: string[] = []
  if (goldSchools.length > 0) {
    parts.push(
      `Includes gold partner school${goldSchools.length === 1 ? "" : "s"}: ${goldPartnersLabel(goldSchools)}`,
    )
  }
  const awaiting = awaitingReviewCount(cluster)
  if (awaiting > 0) {
    parts.push(formatStripeDecisionSignal(awaiting, cluster.stats.requestCount) ?? "")
  }
  parts.push(...lines.map((l) => l.text))
  if (footprintLine.trim()) parts.push(footprintLine)
  const statusLine = statusSummaryLine(cluster.stats, 5)
  if (statusLine) parts.push(statusLine)
  return parts.filter(Boolean).join(". ")
}

export function buildCardDisplay(
  cluster: ApprovalObjectCluster,
  zoom: CalendarZoom,
  widthPx: number,
): CardDisplay {
  void zoom
  const { stats, placements, decisionMeta } = cluster
  const n = stats.requestCount
  const p = placements[0]
  const footprintLine =
    decisionMeta?.footprintLabel ?? cluster.footprintLabel ?? placementFootprintLabel(p)
  const competitionClass = decisionMeta?.worstCompetitionClass ?? null
  const goldSchools = stats.schoolBreakdown.filter((s) => s.gold)
  const goldStarCount = clusterHasGoldPartner(cluster) ? 1 : 0

  const slotCapLine =
    decisionMeta && n > 1
      ? `${decisionMeta.totalSlotDemand}/${decisionMeta.cap} slots`
      : undefined

  const capacityHeadline =
    decisionMeta && shouldUseCapacityHeadline(decisionMeta, n)
      ? formatCapacityHeadline(decisionMeta, widthPx)
      : null

  const isSingle = n === 1
  const primaryText = isSingle
    ? resolveSingleHeadline(p, widthPx)
    : resolveMultiHeadline(stats, widthPx, capacityHeadline)

  const lines: CardDisplayLine[] = [{ text: primaryText, tone: "primary" }]

  const signal = resolveBarSignal(cluster, footprintLine, widthPx, isSingle)
  if (signal) {
    lines.push({ text: signal, tone: "secondary" })
  }

  return {
    lines,
    layout: lines.length > 1 ? "dashboard" : "chip",
    height: lines.length > 1 ? 36 : 26,
    goldStarCount,
    competitionClass,
    footprintLine: footprintShort(footprintLine, widthPx),
    slotCapLine,
    ariaLabel: buildBarAriaLabel(cluster, lines, footprintLine, goldSchools),
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
