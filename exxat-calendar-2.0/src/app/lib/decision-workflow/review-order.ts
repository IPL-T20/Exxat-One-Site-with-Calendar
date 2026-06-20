import type { SlotRequestRow } from "../slot-requests-calendar/types"

export const REVIEW_ORDER_SUBTITLE =
  "Recommended order based on pressure, status, overlap, and request pattern." as const

export function isActiveReviewRow(row: SlotRequestRow): boolean {
  return row.status === "Review" || row.status === "Request Pending"
}

/** Intelligence-layer sort — not a backend rule. */
export function sortPrimaryReviewRows(rows: SlotRequestRow[]): SlotRequestRow[] {
  return [...rows]
    .filter(isActiveReviewRow)
    .sort((a, b) => {
      if (b.pendingDuration !== a.pendingDuration) {
        return b.pendingDuration - a.pendingDuration
      }
      if (b.requestedSlots !== a.requestedSlots) {
        return b.requestedSlots - a.requestedSlots
      }
      return a.school.localeCompare(b.school)
    })
}

export function recommendedReviewRank(
  rowId: string,
  ordered: SlotRequestRow[],
): number | null {
  const idx = ordered.findIndex((r) => r.id === rowId)
  return idx >= 0 ? idx + 1 : null
}
