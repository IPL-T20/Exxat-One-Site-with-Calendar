/** Viewport placement for calendar stripe hover cards (above/below anchor, clear of sticky header). */
export function computeCalendarHoverPlacement(
  anchor: DOMRect,
  cardW: number,
  estimatedCardH = 220,
): {
  left: number
  top: number
  transform: "translateY(-100%)" | "none"
  caretLeft: number
} {
  const centerX = anchor.left + anchor.width / 2
  let left = centerX - cardW / 2
  left = Math.min(Math.max(12, left), window.innerWidth - cardW - 12)

  const spaceAbove = anchor.top - 16
  const spaceBelow = window.innerHeight - anchor.bottom - 16
  const showAbove = spaceAbove >= estimatedCardH || spaceAbove >= spaceBelow

  if (showAbove) {
    const top = Math.max(16, anchor.top - 10)
    return {
      left,
      top,
      transform: "translateY(-100%)",
      caretLeft: Math.min(Math.max(16, centerX - left - 6), cardW - 28),
    }
  }

  const top = anchor.bottom + 10
  return {
    left,
    top,
    transform: "none",
    caretLeft: Math.min(Math.max(16, centerX - left - 6), cardW - 28),
  }
}
