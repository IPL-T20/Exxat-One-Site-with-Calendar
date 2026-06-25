/** Horizontal inset when pinning stripe labels to the visible timeline edge. */
export const STRIPE_LABEL_PIN_INSET = 6

/**
 * Pin stripe label text to the visible left edge while the bar start is scrolled
 * off-screen. Returns 0 once the bar's natural start is in view (full bar start
 * visible, or entire bar fits in the viewport).
 */
export function stripeLabelPinOffset(
  barLeft: number,
  barWidth: number,
  scrollLeft: number,
  viewportW: number,
  labelReservePx = 120,
): number {
  if (viewportW <= 0 || barWidth <= 0) return 0

  const barRight = barLeft + barWidth
  const visibleLeft = scrollLeft
  const visibleRight = scrollLeft + viewportW

  const overlapsVisible = barLeft < visibleRight && barRight > visibleLeft
  if (!overlapsVisible) return 0

  const barStartVisible = barLeft >= visibleLeft
  const barFullyVisible = barStartVisible && barRight <= visibleRight
  if (barFullyVisible || barStartVisible) return 0

  const pin = scrollLeft - barLeft + STRIPE_LABEL_PIN_INSET
  return Math.max(0, Math.min(pin, barWidth - labelReservePx))
}
