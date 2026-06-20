import type { SchedulingFootprint } from "./decision-types"
import {
  dateRangesOverlap,
  footprintCoversDate,
  weekdaysIntersect,
} from "./schedule-footprint"
import { ACTIVE_STATUSES, isDeclinedOrCanceled } from "./gold-partner-policy"

/**
 * TRUE COMPETITION requires all of:
 * 1. Same unit (locationId)
 * 2. Same discipline (capacity pool family)
 * 3. Same shift bucket (day12 ≠ night12)
 * 4. Intersecting weekday patterns (MWF ∩ TTh = ∅ → no competition)
 * 5. Overlapping calendar date ranges
 * 6. Both requests active (not Declined/Canceled)
 *
 * NOT competition (examples):
 * - Same dates, different shifts (ENT-T-05 day vs night)
 * - Same span, MWF vs TTh (ENT-T-06)
 * - Wed-only vs Fri-only (ENT-C-04 vs ENT-T-01)
 * - Same hospital, different units
 * - Same unit, different disciplines (Nursing vs PT on 7E)
 * - Adjacent non-overlapping ranges (back-to-back handoff)
 * - Visual-only date overlap with disjoint weekdays
 *
 * PARTIAL overlap: date ranges intersect; competition applies only on
 * intersection days that both footprints cover (shared weekday ∩ shared shift).
 */
export function requestsTrulyCompete(a: SchedulingFootprint, b: SchedulingFootprint): boolean {
  if (a.requestId === b.requestId) return false
  if (isDeclinedOrCanceled(a.status) || isDeclinedOrCanceled(b.status)) return false
  if (a.locationId !== b.locationId) return false
  if (a.discipline !== b.discipline) return false
  if (a.shiftBucket !== b.shiftBucket) return false
  if (!weekdaysIntersect(a.weekdays, b.weekdays)) return false
  return dateRangesOverlap(a.dateStart, a.dateEnd, b.dateStart, b.dateEnd)
}

/** Calendar dates where two footprints both consume capacity. */
export function sharedCompetitionDates(
  a: SchedulingFootprint,
  b: SchedulingFootprint,
): Date[] {
  if (!requestsTrulyCompete(a, b)) return []
  const start = new Date(Math.max(a.dateStart.getTime(), b.dateStart.getTime()))
  const end = new Date(Math.min(a.dateEnd.getTime(), b.dateEnd.getTime()))
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const out: Date[] = []
  const cur = new Date(start)
  while (cur.getTime() <= end.getTime()) {
    if (footprintCoversDate(a, cur) && footprintCoversDate(b, cur)) out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function findCompetitors(
  target: SchedulingFootprint,
  pool: SchedulingFootprint[],
): SchedulingFootprint[] {
  return pool.filter((other) => requestsTrulyCompete(target, other))
}

/** Transitive groups: same footprintKey + overlapping date ranges among members. */
export function buildCompetitionGroupMembers(
  footprints: SchedulingFootprint[],
): SchedulingFootprint[][] {
  const active = footprints.filter((f) => ACTIVE_STATUSES.includes(f.status))
  const byKey = new Map<string, SchedulingFootprint[]>()
  for (const f of active) {
    const list = byKey.get(f.footprintKey) ?? []
    list.push(f)
    byKey.set(f.footprintKey, list)
  }

  const groups: SchedulingFootprint[][] = []

  for (const members of byKey.values()) {
    const sorted = [...members].sort((a, b) => a.dateStart.getTime() - b.dateStart.getTime())
    let chain: SchedulingFootprint[] = []
    let chainEnd = 0

    const flush = () => {
      if (chain.length > 0) groups.push(chain)
      chain = []
      chainEnd = 0
    }

    for (const m of sorted) {
      const start = m.dateStart.getTime()
      const end = m.dateEnd.getTime()
      if (chain.length === 0) {
        chain = [m]
        chainEnd = end
        continue
      }
      if (start <= chainEnd) {
        chain.push(m)
        chainEnd = Math.max(chainEnd, end)
      } else {
        flush()
        chain = [m]
        chainEnd = end
      }
    }
    flush()
  }

  return groups
}

export function competitionGroupId(
  footprintKey: string,
  windowStart: Date,
  windowEnd: Date,
): string {
  return `${footprintKey}::${windowStart.getTime()}::${windowEnd.getTime()}`
}
