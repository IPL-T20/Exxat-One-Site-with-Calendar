/** Coordinator-facing vocabulary — single source of truth for Approval calendar copy. */

export function formatToReviewCount(count: number): string {
  if (count <= 0) return ""
  return count === 1 ? "1 to review" : `${count} to review`
}

export function formatToReviewShort(count: number): string {
  if (count <= 0) return ""
  return String(count)
}

export function formatQueueSummary(pending: number, review: number): string | null {
  const total = pending + review
  if (total <= 0) return null
  if (pending > 0 && review > 0) {
    return `${formatToReviewCount(total)} · ${pending} new · ${review} in review`
  }
  if (review > 0) {
    return review === 1 ? "1 in review" : `${review} in review`
  }
  return formatToReviewCount(total)
}

export function formatStripeDecisionSignal(awaiting: number, requestCount: number): string | null {
  if (awaiting <= 0) return null
  if (awaiting === requestCount) {
    return requestCount === 1 ? "1 to review" : `${requestCount} to review`
  }
  return awaiting === 1 ? "1 to review" : `${awaiting} to review`
}

export function formatSchoolCompetition(count: number): string | null {
  if (count <= 1) return null
  return `${count} schools competing`
}

export function formatStripeSubheader(slotsRequested: number | null, requestCount: number): string | null {
  return formatRibbonStats(requestCount, slotsRequested)
}

/** Stripe/modal stats — queue first, then placement volume (coordinator scan order). */
export function formatRibbonStats(requestCount: number, slotsRequested: number | null): string | null {
  const parts: string[] = []
  if (requestCount > 0) {
    parts.push(`${requestCount} request${requestCount === 1 ? "" : "s"}`)
  }
  if (slotsRequested != null && slotsRequested > 0) {
    parts.push(`${slotsRequested} slot${slotsRequested === 1 ? "" : "s"} requested`)
  }
  return parts.length > 0 ? parts.join(" · ") : null
}

/** Location View By — ribbon header is the queue size (discipline is already in the sidebar row). */
export function formatLocationRibbonHeader(requestCount: number): string | null {
  if (requestCount <= 0) return null
  return `${requestCount} slot request${requestCount === 1 ? "" : "s"}`
}

/** Ribbon help text — placement volume only. */
export function formatSlotsRequestedHelp(slotsRequested: number | null): string | null {
  if (slotsRequested == null || slotsRequested <= 0) return null
  return `${slotsRequested} slot${slotsRequested === 1 ? "" : "s"} requested`
}

/** Ribbon primary line — unit/location inside Discipline or Availability grouping. */
export function formatRibbonWorkHeader(
  mode: "discipline" | "availability",
  entityLabel: string,
): string {
  return entityLabel.trim()
}

export const COORDINATOR_TERMS = {
  toReview: "to review",
  needsDecision: "needs your decision",
  inReview: "in review",
  newRequests: "new",
  schoolsCompeting: "schools competing",
  slotsRequested: "Slots requested",
  slotsApproved: "Slots approved",
  schoolsCompetingLabel: "Schools competing",
  toReviewLabel: "To review",
} as const
