import type { ApprovalObjectCluster } from "../../lib/slot-requests-calendar/approval-object-cluster"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { getClusterStripeLayout } from "./coda-stripe-row-wall-hints"

export const CODA_STRIPE_MIN_CONTENT_W = 132
export const CODA_STRIPE_STACK_EDGE_PAD = 8
export const CODA_STRIPE_EXPLODE_MS = 280
export const CODA_STRIPE_EXPLODE_STAGGER_MS = 48

/** @deprecated playful scatter — no fixed peek */
export const CODA_STRIPE_STACK_PEEK_X = 14
/** @deprecated playful scatter — no fixed gap */
export const CODA_STRIPE_STACK_GAP_Y = 10
/** @deprecated */
export const CODA_STRIPE_STACK_STAGGER_X = CODA_STRIPE_STACK_PEEK_X
/** @deprecated */
export const CODA_STRIPE_STACK_STAGGER_Y = CODA_STRIPE_STACK_GAP_Y
/** @deprecated */
export const CODA_STRIPE_STACK_GAP = CODA_STRIPE_STACK_GAP_Y
/** @deprecated */
export const CODA_STRIPE_STACK_FAN_X = CODA_STRIPE_STACK_PEEK_X

const SCATTER_PAD = 10
/** Minimum clear gap between card edges after layout (px). */
const MIN_CARD_GAP = 10
/** Pull scattered cards toward pile center (0–1, lower = tighter). */
const SCATTER_COMPACT = 0.9

export type ClusterStripeLayout = {
  clusterId: string
  cluster: ApprovalObjectCluster
  left: number
  cardW: number
  stripeRight: number
}

const OVERLAP_PAD = 6

export function clusterStripeLayouts(
  clusters: ApprovalObjectCluster[],
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
  focusClip?: FocusPeriodRange | null,
): ClusterStripeLayout[] {
  return clusters
    .map((cluster) => {
      const layout = getClusterStripeLayout(cluster, zoom, ppd, monthPxW, focusClip)
      if (!layout) return null
      return { clusterId: cluster.id, cluster, ...layout }
    })
    .filter((layout): layout is ClusterStripeLayout => layout !== null)
}

function rectsOverlap(a: ClusterStripeLayout, b: ClusterStripeLayout): boolean {
  return (
    a.left < b.stripeRight - OVERLAP_PAD && b.left < a.stripeRight - OVERLAP_PAD
  )
}

export function computeStripeOverlapGroups(layouts: ClusterStripeLayout[]): {
  groupByCluster: Map<string, string>
  groups: Map<string, string[]>
} {
  const groupByCluster = new Map<string, string>()
  const groups = new Map<string, string[]>()
  if (layouts.length < 2) return { groupByCluster, groups }

  const parent = layouts.map((_, index) => index)

  function find(index: number): number {
    let root = index
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]]
      root = parent[root]
    }
    return root
  }

  function union(a: number, b: number) {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent[rootB] = rootA
  }

  for (let i = 0; i < layouts.length; i++) {
    for (let j = i + 1; j < layouts.length; j++) {
      if (rectsOverlap(layouts[i], layouts[j])) union(i, j)
    }
  }

  const rootToClusterIds = new Map<number, string[]>()
  layouts.forEach((layout, index) => {
    const root = find(index)
    const ids = rootToClusterIds.get(root) ?? []
    ids.push(layout.clusterId)
    rootToClusterIds.set(root, ids)
  })

  for (const clusterIds of rootToClusterIds.values()) {
    if (clusterIds.length < 2) continue
    const groupId = `overlap-${[...clusterIds].sort().join("|")}`
    groups.set(groupId, clusterIds)
    clusterIds.forEach((clusterId) => groupByCluster.set(clusterId, groupId))
  }

  return { groupByCluster, groups }
}

export type ExpandedStripePlacement = {
  clusterId: string
  left: number
  top: number
  width: number
  stackIndex: number
  stackCount: number
  /** Collapsed pile center — explode animation starts here. */
  originLeft: number
  originTop: number
  /** Playful micro-tilt per card (degrees). */
  tiltDeg: number
  /** Stagger delay override for throw order (ms). */
  explodeDelayMs: number
}

type PlacementDraft = ExpandedStripePlacement

export type StackViewport = {
  scrollLeft: number
  viewportWidth: number
  timelineWidth: number
  rowScreenTop?: number
  rowScreenBottom?: number
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min
  return Math.max(min, Math.min(value, max))
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function seededUnit(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function bbox(placements: PlacementDraft[], stripeH: number) {
  const minLeft = Math.min(...placements.map((p) => p.left))
  const maxRight = Math.max(...placements.map((p) => p.left + p.width))
  const minTop = Math.min(...placements.map((p) => p.top))
  const maxBottom = Math.max(...placements.map((p) => p.top + stripeH))
  return {
    minLeft,
    maxRight,
    minTop,
    maxBottom,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
  }
}

function horizontalBounds(viewport: StackViewport) {
  const pad = CODA_STRIPE_STACK_EDGE_PAD
  const visibleLeft = viewport.scrollLeft + pad
  const visibleRight = viewport.scrollLeft + viewport.viewportWidth - pad
  const timelineRight = viewport.timelineWidth - pad
  return {
    left: Math.max(pad, visibleLeft),
    right: Math.min(timelineRight, visibleRight),
  }
}

function shiftPlacements(
  placements: PlacementDraft[],
  shiftX: number,
  shiftY: number,
): PlacementDraft[] {
  if (shiftX === 0 && shiftY === 0) return placements
  return placements.map((p) => ({
    ...p,
    left: p.left + shiftX,
    top: p.top + shiftY,
  }))
}

function fitHorizontally(
  placements: PlacementDraft[],
  stripeH: number,
  bounds: { left: number; right: number },
): PlacementDraft[] {
  const box = bbox(placements, stripeH)
  let shiftX = 0
  if (box.maxRight > bounds.right) shiftX = bounds.right - box.maxRight
  if (box.minLeft + shiftX < bounds.left) shiftX = bounds.left - box.minLeft
  return shiftPlacements(placements, shiftX, 0)
}

function fitOnScreen(
  placements: PlacementDraft[],
  stripeH: number,
  rowScreenTop: number | undefined,
): PlacementDraft[] {
  if (rowScreenTop == null || typeof window === "undefined") return placements

  const pad = CODA_STRIPE_STACK_EDGE_PAD
  const screenTop = pad
  const screenBottom = window.innerHeight - pad
  const box = bbox(placements, stripeH)

  const absTop = rowScreenTop + box.minTop
  const absBottom = rowScreenTop + box.maxBottom
  let shiftY = 0

  if (absBottom > screenBottom) shiftY = screenBottom - absBottom
  if (absTop + shiftY < screenTop) shiftY = screenTop - absTop

  return shiftPlacements(placements, 0, shiftY)
}

function rectOverlapAmount(
  aLeft: number,
  aTop: number,
  aW: number,
  aH: number,
  bLeft: number,
  bTop: number,
  bW: number,
  bH: number,
  gap: number,
): { x: number; y: number } | null {
  const overlapX = Math.min(aLeft + aW + gap - bLeft, bLeft + bW + gap - aLeft)
  const overlapY = Math.min(aTop + aH + gap - bTop, bTop + bH + gap - aTop)
  if (overlapX > 0 && overlapY > 0) return { x: overlapX, y: overlapY }
  return null
}

function resolveCollisions(
  placements: PlacementDraft[],
  stripeH: number,
): PlacementDraft[] {
  const result = placements.map((p) => ({ ...p }))
  const gap = MIN_CARD_GAP

  for (let pass = 0; pass < 48; pass++) {
    let moved = false
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        const overlap = rectOverlapAmount(
          a.left,
          a.top,
          a.width,
          stripeH,
          b.left,
          b.top,
          b.width,
          stripeH,
          gap,
        )
        if (!overlap) continue

        const cxA = a.left + a.width / 2
        const cyA = a.top + stripeH / 2
        const cxB = b.left + b.width / 2
        const cyB = b.top + stripeH / 2

        if (overlap.x <= overlap.y) {
          const push = overlap.x / 2 + 0.5
          const dir = cxA <= cxB ? -1 : 1
          a.left += dir * push
          b.left -= dir * push
        } else {
          const push = overlap.y / 2 + 0.5
          const dir = cyA <= cyB ? -1 : 1
          a.top += dir * push
          b.top -= dir * push
        }
        moved = true
      }
    }
    if (!moved) break
  }

  return result
}

function shuffledIndices(count: number, seed: number): number[] {
  const order = Array.from({ length: count }, (_, index) => index)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(seededUnit(seed, i * 19 + 11) * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

function buildPlayfulScatter(
  layouts: ClusterStripeLayout[],
  stripeW: number,
  stripeH: number,
  groupSeed: string,
  pileLeft: number,
  pileTop: number,
): PlacementDraft[] {
  const count = layouts.length
  const seed = hashString(groupSeed)
  const throwOrder = shuffledIndices(count, seed)
  const pileCenterX = pileLeft + stripeW / 2
  const pileCenterY = pileTop + stripeH / 2

  const spreadX = stripeW * 0.32 + SCATTER_PAD
  const spreadY = stripeH * 0.42 + SCATTER_PAD
  const ring = 0.5 + count * 0.055

  const drafts: PlacementDraft[] = throwOrder.map((layoutIndex, rank) => {
    const layout = layouts[layoutIndex]
    const cardSeed = hashString(`${groupSeed}:${layout.clusterId}`)
    const angle = seededUnit(seed, rank * 37 + 2) * Math.PI * 2
    const radiusScale = 0.52 + seededUnit(cardSeed, 9) * 0.34
    const offsetX = Math.cos(angle) * spreadX * ring * radiusScale
    const offsetY = Math.sin(angle) * spreadY * ring * radiusScale
    const wobbleX = (seededUnit(cardSeed, 13) - 0.5) * stripeW * 0.1
    const wobbleY = (seededUnit(cardSeed, 17) - 0.5) * stripeH * 0.14
    const tiltDeg = (seededUnit(cardSeed, 23) - 0.5) * 6
    const explodeDelayMs = Math.round(
      rank * CODA_STRIPE_EXPLODE_STAGGER_MS + seededUnit(cardSeed, 31) * 36,
    )

    return {
      clusterId: layout.clusterId,
      left: pileCenterX - stripeW / 2 + offsetX + wobbleX,
      top: pileCenterY - stripeH / 2 + offsetY + wobbleY,
      width: stripeW,
      stackIndex: rank,
      stackCount: count,
      originLeft: pileLeft,
      originTop: pileTop,
      tiltDeg,
      explodeDelayMs,
    }
  })

  const separated = resolveCollisions(drafts, stripeH)
  const compacted = compactTowardPile(
    separated,
    pileCenterX,
    pileCenterY,
    stripeH,
    SCATTER_COMPACT,
  )
  return resolveCollisions(compacted, stripeH)
}

function compactTowardPile(
  placements: PlacementDraft[],
  pileCenterX: number,
  pileCenterY: number,
  stripeH: number,
  factor: number,
): PlacementDraft[] {
  return placements.map((p) => ({
    ...p,
    left: pileCenterX - p.width / 2 + (p.left + p.width / 2 - pileCenterX) * factor,
    top: pileCenterY - stripeH / 2 + (p.top + stripeH / 2 - pileCenterY) * factor,
  }))
}

function tightenToBounds(
  placements: PlacementDraft[],
  stripeH: number,
  bounds: { left: number; right: number },
  pileLeft: number,
  pileTop: number,
  stripeW: number,
): PlacementDraft[] {
  let scaled = placements
  const pileCenterX = pileLeft + stripeW / 2
  const pileCenterY = pileTop + stripeH / 2

  for (let attempt = 0; attempt < 6; attempt++) {
    const box = bbox(scaled, stripeH)
    const tooWide = box.width > bounds.right - bounds.left
    if (!tooWide) break
    const factor = (bounds.right - bounds.left) / Math.max(box.width, 1)
    scaled = scaled.map((p) => ({
      ...p,
      left: pileCenterX + (p.left + p.width / 2 - pileCenterX) * factor - p.width / 2,
      top: pileCenterY + (p.top + stripeH / 2 - pileCenterY) * factor - stripeH / 2,
    }))
    scaled = resolveCollisions(scaled, stripeH)
  }

  return scaled
}

export function computeExpandedStackPlacements(
  layouts: ClusterStripeLayout[],
  rowH: number,
  stripeH: number,
  viewport?: StackViewport,
): ExpandedStripePlacement[] {
  if (layouts.length < 2) return []

  const stripeW = Math.max(
    CODA_STRIPE_MIN_CONTENT_W,
    ...layouts.map((layout) => Math.max(layout.cardW, CODA_STRIPE_MIN_CONTENT_W)),
  )

  const collapsedMinLeft = Math.min(...layouts.map((layout) => layout.left))
  const collapsedMaxRight = Math.max(...layouts.map((layout) => layout.stripeRight))
  const collapsedCenterX = (collapsedMinLeft + collapsedMaxRight) / 2
  const pileLeft = collapsedCenterX - stripeW / 2
  const pileTop = (rowH - stripeH) / 2

  const groupSeed = layouts
    .map((layout) => layout.clusterId)
    .sort()
    .join("|")

  let placements = buildPlayfulScatter(
    layouts,
    stripeW,
    stripeH,
    groupSeed,
    pileLeft,
    pileTop,
  )

  if (viewport && viewport.viewportWidth > 0) {
    const hBounds = horizontalBounds(viewport)
    placements = tightenToBounds(placements, stripeH, hBounds, pileLeft, pileTop, stripeW)
    placements = fitHorizontally(placements, stripeH, hBounds)
    placements = fitOnScreen(placements, stripeH, viewport.rowScreenTop)
    placements = resolveCollisions(placements, stripeH)
  }

  return placements
}
