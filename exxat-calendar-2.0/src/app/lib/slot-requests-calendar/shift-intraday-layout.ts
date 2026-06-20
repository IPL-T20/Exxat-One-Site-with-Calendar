import type { ApprovalObjectCluster } from "./approval-object-cluster"
import {
  focusPeriodCalendarDays,
  placementIntersectsCalendarDay,
} from "../schedules/schedule-focus-view"
import type { FocusPeriodRange } from "./calendar-period-focus"
import type { ShiftBucket } from "./decision-engine/decision-types"
import { normalizeShiftBucket } from "./decision-engine/schedule-footprint"
import type { CalendarZoom } from "./types"

const MINUTES_PER_DAY = 24 * 60
const MIN_INTRA_STRIPE_W = 12

/** Default when shift is null / empty — 12h day (07:00–19:00). */
export const DEFAULT_FOCUS_SHIFT_WINDOW = {
  startMin: 7 * 60,
  endMin: 19 * 60,
} as const

const SHIFT_BUCKET_WINDOW: Record<
  ShiftBucket,
  { startMin: number; endMin: number }
> = {
  day12: { ...DEFAULT_FOCUS_SHIFT_WINDOW },
  day8: { startMin: 7 * 60, endMin: 15 * 60 },
  night12: { startMin: 19 * 60, endMin: MINUTES_PER_DAY },
  evening8: { startMin: 15 * 60, endMin: 23 * 60 },
  custom: { startMin: 8 * 60, endMin: 17 * 60 },
  unknown: { ...DEFAULT_FOCUS_SHIFT_WINDOW },
}

function parseClockToMinutes(value: string): number {
  const [h, m] = value.split(":").map((part) => Number(part))
  return h * 60 + (m || 0)
}

function windowFromBucket(shiftRaw: string): { startMin: number; endMin: number } {
  const bucket = normalizeShiftBucket(shiftRaw)
  return { ...SHIFT_BUCKET_WINDOW[bucket] }
}

function parseSegmentWindow(segment: string): { startMin: number; endMin: number } | null {
  const match = segment.match(/\((\d{1,2}:\d{2})-(\d{1,2}:\d{2})\)/)
  if (!match) return null
  const startMin = parseClockToMinutes(match[1])
  let endMin = parseClockToMinutes(match[2])
  if (endMin <= startMin) endMin = MINUTES_PER_DAY
  return { startMin, endMin }
}

/** Intraday window — empty shift → 07:00–19:00 day 12h. */
export function resolvePlacementShiftWindow(shiftRaw: string | null | undefined): {
  startMin: number
  endMin: number
} {
  const raw = shiftRaw?.trim()
  if (!raw) return { ...DEFAULT_FOCUS_SHIFT_WINDOW }

  const segments = raw.split(",").map((s) => s.trim()).filter(Boolean)
  for (const segment of segments) {
    const parsed = parseSegmentWindow(segment)
    if (parsed) return parsed
  }

  return windowFromBucket(segments[0] ?? raw)
}

export type IntraDayStripeLayout = {
  clusterId: string
  cluster: ApprovalObjectCluster
  left: number
  cardW: number
  stripeRight: number
  top: number
  lane: number
}

type StripeProto = {
  cluster: ApprovalObjectCluster
  clusterId: string
  left: number
  cardW: number
  stripeRight: number
  lane: number
}

function shiftRectInDayColumn(
  dayLeft: number,
  dayW: number,
  startMin: number,
  endMin: number,
): { left: number; cardW: number; stripeRight: number } | null {
  const span = Math.max(30, endMin - startMin)
  const left = dayLeft + (startMin / MINUTES_PER_DAY) * dayW
  const width = Math.max(MIN_INTRA_STRIPE_W, (span / MINUTES_PER_DAY) * dayW)
  const right = left + width
  if (right <= dayLeft || left >= dayLeft + dayW) return null
  const clipLeft = Math.max(left, dayLeft)
  const clipRight = Math.min(right, dayLeft + dayW)
  const cardW = clipRight - clipLeft
  if (cardW < MIN_INTRA_STRIPE_W) return null
  return { left: clipLeft, cardW, stripeRight: clipRight }
}

function buildFocusStripeProtos(
  clusters: ApprovalObjectCluster[],
  focus: FocusPeriodRange,
  zoom: CalendarZoom,
  ppd: number,
): StripeProto[] {
  const protos: StripeProto[] = []
  const days = focusPeriodCalendarDays(focus, zoom, ppd)

  for (const cluster of clusters) {
    const placement = cluster.placements[0]
    const { startMin, endMin } = resolvePlacementShiftWindow(placement.requestedShifts)

    days.forEach((day, dayIndex) => {
      if (!placementIntersectsCalendarDay(placement, day)) return
      const dayLeft = focus.x + dayIndex * ppd
      const rect = shiftRectInDayColumn(dayLeft, ppd, startMin, endMin)
      if (!rect) return
      protos.push({
        cluster,
        clusterId: zoom === "week" ? `${cluster.id}::d${dayIndex}` : cluster.id,
        lane: 0,
        ...rect,
      })
    })
  }

  return protos
}

function dayColumnKey(left: number, ppd: number): number {
  return Math.floor(left / Math.max(1, ppd))
}

function assignVerticalLanesInColumn(protos: StripeProto[]): void {
  const laneEnds: number[] = []
  const sorted = [...protos].sort((a, b) => {
    if (a.left !== b.left) return a.left - b.left
    return a.clusterId.localeCompare(b.clusterId)
  })

  for (const item of sorted) {
    let lane = laneEnds.findIndex((end) => end <= item.left + 1)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.stripeRight)
    } else {
      laneEnds[lane] = item.stripeRight
    }
    item.lane = lane
  }
}

/** Stack overlapping stripes within each day column — not across the whole week row. */
function assignVerticalLanes(protos: StripeProto[], ppd: number): void {
  const byDay = new Map<number, StripeProto[]>()
  for (const proto of protos) {
    const key = dayColumnKey(proto.left, ppd)
    const list = byDay.get(key) ?? []
    list.push(proto)
    byDay.set(key, list)
  }
  for (const columnProtos of byDay.values()) {
    assignVerticalLanesInColumn(columnProtos)
  }
}

export function layoutIntraDayStripes(
  clusters: ApprovalObjectCluster[],
  focus: FocusPeriodRange,
  stripeH: number,
  zoom: CalendarZoom,
  ppd: number,
): { layouts: IntraDayStripeLayout[]; laneCount: number; rowContentH: number } {
  const protos = buildFocusStripeProtos(clusters, focus, zoom, ppd)
  assignVerticalLanes(protos, ppd)

  const laneCount =
    protos.length === 0 ? 0 : Math.max(1, ...protos.map((p) => p.lane + 1))
  const laneGap = laneCount > 10 ? 2 : laneCount > 6 ? 3 : 4
  const edgePad = laneCount > 10 ? 4 : 6

  const layouts: IntraDayStripeLayout[] = protos.map((p) => ({
    clusterId: p.clusterId,
    cluster: p.cluster,
    left: p.left,
    cardW: p.cardW,
    stripeRight: p.stripeRight,
    lane: p.lane,
    top: edgePad + p.lane * (stripeH + laneGap),
  }))

  const rowContentH =
    protos.length === 0
      ? 0
      : edgePad * 2 + laneCount * stripeH + Math.max(0, laneCount - 1) * laneGap

  return { layouts, laneCount, rowContentH }
}
