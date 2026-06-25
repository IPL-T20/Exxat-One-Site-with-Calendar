import type { ApprovalObjectCluster } from "../../lib/slot-requests-calendar/approval-object-cluster"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { getClusterStripeLayout } from "./coda-stripe-row-wall-hints"

export const CODA_STRIPE_MIN_CONTENT_W = 132
export const CODA_STRIPE_STACK_EDGE_PAD = 8

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
